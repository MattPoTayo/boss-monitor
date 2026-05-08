const functions = require('firebase-functions');
const admin = require('firebase-admin');
const https = require('https');

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();
const AUTO_SPAWN_TIMEOUT = 2 * 60 * 1000; // 2 minutes in milliseconds
const SPAWN_WARNING_TIMEOUT = 5 * 60 * 1000; // 5 minutes before spawn

/**
 * Send a message to Discord webhook
 */
async function sendDiscordWebhook(webhookUrl, message) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(message);
    const url = new URL(webhookUrl);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve({ success: true, statusCode: res.statusCode });
      } else {
        reject(new Error(`Discord webhook failed with status ${res.statusCode}`));
      }
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Create a Discord embed message for boss spawn warning
 */
function createBossSpawnEmbed(boss, timeUntilSpawn, spawnAt) {
  const minutes = Math.round(timeUntilSpawn / 60000);
  
  let formattedSpawn = 'N/A';
  if (spawnAt && spawnAt > 0) {
    try {
      const spawnDate = new Date(spawnAt);
      const spawnTime = spawnDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const spawnDateStr = spawnDate.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' });
      formattedSpawn = `${spawnTime} (${spawnDateStr})`;
    } catch (err) {
      console.error(`[createBossSpawnEmbed] Error formatting date for ${boss.name}:`, err);
      formattedSpawn = 'Unable to format time';
    }
  }
  
  return {
    content: `🚨 **${boss.name}** will spawn in **${minutes}** minute(s)!`,
    embeds: [
      {
        title: `${boss.name} Spawn Alert`,
        description: `Location: **${boss.map}**`,
        color: 16776960, // Yellow
        fields: [
          {
            name: 'Exact Spawn Time',
            value: formattedSpawn,
            inline: false,
          },
          {
            name: 'Time Until Spawn',
            value: `${minutes} minute(s)`,
            inline: true,
          },
          {
            name: 'Respawn Time',
            value: `${boss.respawnMinutes} minute(s)`,
            inline: true,
          },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Create a Discord embed for "boss just spawned" notification
 */
function createBossSpawnedEmbed(boss) {
  return {
    content: `✨ **${boss.name}** has SPAWNED! ✨`,
    embeds: [
      {
        title: `${boss.name} is now LIVE`,
        description: `Location: **${boss.map}**`,
        color: 65280, // Green
        fields: [
          {
            name: 'Status',
            value: '🟢 SPAWNED',
            inline: true,
          },
          {
            name: 'Respawn Time',
            value: `${boss.respawnMinutes} minute(s)`,
            inline: true,
          },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Create a Discord status update embed
 */
function createBossStatusEmbed(boss, timeUntilSpawn) {
  const isSpawned = timeUntilSpawn <= 0;
  const status = isSpawned ? '🟢 SPAWNED' : `⏳ ${Math.round(Math.abs(timeUntilSpawn) / 60000)} min remaining`;
  const color = isSpawned ? 65280 : 16776960; // Green if spawned, yellow otherwise
  
  return {
    embeds: [
      {
        title: `${boss.name} Status Update`,
        description: `Location: **${boss.map}**`,
        color: color,
        fields: [
          {
            name: 'Status',
            value: status,
            inline: true,
          },
          {
            name: 'Type',
            value: boss.type === 'scheduled' ? '🔄 Scheduled' : '⏱️ Timer',
            inline: true,
          },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Calculate next spawn time for a scheduled boss
 */
function calculateNextScheduledSpawn(spawnSchedule) {
  if (!spawnSchedule || !Array.isArray(spawnSchedule) || spawnSchedule.length === 0) {
    return null;
  }

  const now = new Date();
  let nextSpawn = null;

  spawnSchedule.forEach((spawn) => {
    const { day, time } = spawn;
    if (!time) return;

    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return;

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    let daysAhead = day - date.getDay();
    if (daysAhead < 0) {
      daysAhead += 7;
    }
    if (daysAhead === 0 && date <= now) {
      daysAhead = 7;
    }

    const spawnTime = new Date(date);
    spawnTime.setDate(spawnTime.getDate() + daysAhead);
    const spawnTimeMs = spawnTime.getTime();

    if (!nextSpawn || spawnTimeMs < nextSpawn) {
      nextSpawn = spawnTimeMs;
    }
  });

  return nextSpawn;
}

/**
 * Cloud Function triggered every minute by Cloud Scheduler
 * Checks all timer-based bosses and auto-marks them dead if they've been spawned for 2+ minutes
 * Also initializes autoSpawnedAt tracking for bosses that need it
 */
exports.autoRenewBosses = functions
  .region('asia-east1')
  .pubsub
  .schedule('every 1 minutes')
  .timeZone('Asia/Hong_Kong')
  .onRun(async (context) => {
    try {
      const now = Date.now();
      const nowDate = new Date(now).toISOString();
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Starting auto-renewal check at ${nowDate}`);
      console.log(`Current time: ${now}`);
      console.log(`${'='.repeat(60)}\n`);

      const bossesRef = db.collection('bosses');

      // Load ALL bosses (no complex queries needed)
      const snapshot = await bossesRef.get();
      console.log(`📊 Found ${snapshot.size} total documents in bosses collection\n`);

      let initialized = 0;
      const initBatch = db.batch();
      let processed = 0;
      const renewBatch = db.batch();
      let discordNotified = 0;
      const discordPromises = [];

      // Get Discord webhook URL from settings
      console.log(`🔍 Loading Discord webhook URL from settings/discord...\n`);
      const settingsDoc = await db.collection('settings').doc('discord').get();
      const discordWebhookUrl = settingsDoc.data()?.webhookUrl;

      console.log(`Discord webhook URL: ${discordWebhookUrl ? '✅ SET' : '❌ NOT SET'}`);
      if (discordWebhookUrl) {
        console.log(`Webhook URL (first 50 chars): ${discordWebhookUrl.substring(0, 50)}...`);
      }
      console.log(`\n`);

      snapshot.forEach((doc) => {
        const boss = doc.data();

        // Filter in code: only timer-based bosses with a kill time
        if (boss.type !== 'timer' || !boss.lastKilledAt) {
          console.log(`⏭️  Skipping "${boss.name || 'Unknown'}": type=${boss.type}, lastKilledAt=${boss.lastKilledAt}`);
          return;
        }

        const respawnMs = (boss.respawnMinutes || 60) * 60000;
        const spawnAt = boss.lastKilledAt + respawnMs;
        const timeUntilSpawn = spawnAt - now;
        const minutesUntilSpawn = Math.round(timeUntilSpawn / 60000);

        console.log(`\n📌 Boss: "${boss.name}"`);
        console.log(`   ID: ${doc.id}`);
        console.log(`   Last killed: ${new Date(boss.lastKilledAt).toISOString()}`);
        console.log(`   Respawn: ${boss.respawnMinutes} min`);
        console.log(`   Will spawn at: ${new Date(spawnAt).toISOString()}`);
        console.log(`   Time until spawn: ${minutesUntilSpawn} min (${timeUntilSpawn}ms)`);
        console.log(`   Already notified: ${boss.discordNotifiedAt ? 'YES' : 'NO'}`);

        // FIRST: Check if we should send Discord notification
        if (
          discordWebhookUrl &&
          timeUntilSpawn > 0 &&
          timeUntilSpawn <= SPAWN_WARNING_TIMEOUT &&
          !boss.discordNotifiedAt
        ) {
          console.log(`   ✅ DISCORD CONDITIONS MET - Sending notification!\n`);
          
          const discordPromise = sendDiscordWebhook(discordWebhookUrl, createBossSpawnEmbed(boss, timeUntilSpawn, spawnAt))
            .then(() => {
              console.log(`[DISCORD] ✅ Sent notification for ${boss.name}`);
              return db.collection('bosses')
                .doc(doc.id)
                .update({
                  discordNotifiedAt: now,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                  updatedBy: 'system',
                })
                .then(() => {
                  discordNotified++;
                  console.log(`[DISCORD] ✅ Marked ${boss.name} as notified`);
                });
            })
            .catch((err) => {
              console.error(`[DISCORD] ❌ Failed for ${boss.name}:`, err.message);
            });
          
          discordPromises.push(discordPromise);
        } else if (discordWebhookUrl && timeUntilSpawn > 0 && timeUntilSpawn <= SPAWN_WARNING_TIMEOUT) {
          console.log(`   ⏭️  Webhook set, within 5 min, but already notified\n`);
        } else if (!discordWebhookUrl) {
          console.log(`   ❌ No Discord webhook URL\n`);
        } else if (timeUntilSpawn <= 0) {
          console.log(`   ⏭️  Already spawned (${Math.round(Math.abs(timeUntilSpawn) / 60000)} min ago)\n`);
        } else if (timeUntilSpawn > SPAWN_WARNING_TIMEOUT) {
          console.log(`   ⏳ Too early: ${minutesUntilSpawn} min (need <= 5 min)\n`);
        }

        // SECOND: Check if boss has spawned and needs auto-renewal
        if (now >= spawnAt) {
          if (!boss.autoSpawnedAt) {
            console.log(`   🎯 Initializing spawn tracking`);
            initBatch.update(doc.ref, {
              autoSpawnedAt: now,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedBy: 'system',
            });
            initialized++;
          } else {
            const autoSpawnedAt = boss.autoSpawnedAt || 0;
            const timeSinceSpawn = now - autoSpawnedAt;
            const secondsSinceSpawn = Math.round(timeSinceSpawn / 1000);

            console.log(`   ⏰ Spawn tracked since: ${new Date(autoSpawnedAt).toISOString()} (${secondsSinceSpawn}s ago)`);

            if (timeSinceSpawn >= AUTO_SPAWN_TIMEOUT) {
              console.log(`   ✅ AUTO-RENEWING (2+ min elapsed)`);
              renewBatch.update(doc.ref, {
                lastKilledAt: now,
                autoSpawnedAt: null,
                discordNotifiedAt: null,
                isAutoRenewed: true,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: 'system',
              });

              processed++;
            } else {
              console.log(`   ⏳ Waiting for auto-renewal (${Math.round((AUTO_SPAWN_TIMEOUT - timeSinceSpawn) / 1000)}s remaining)`);
            }
          }
        }
      });

      console.log(`\n${'='.repeat(60)}`);
      console.log(`Summary:`);
      console.log(`  Initialized: ${initialized}`);
      console.log(`  Auto-renewed: ${processed}`);
      console.log(`  Discord promises pending: ${discordPromises.length}`);
      console.log(`${'='.repeat(60)}\n`);

      snapshot.forEach((doc) => {
        const boss = doc.data();

        // Filter in code: only timer-based bosses with a kill time
        if (boss.type !== 'timer' || !boss.lastKilledAt) {
          return;
        }

        const respawnMs = (boss.respawnMinutes || 60) * 60000;
        const spawnAt = boss.lastKilledAt + respawnMs;
        const timeUntilSpawn = spawnAt - now;

        // FIRST: Check if we should send Discord notification
        // This runs regardless of spawn status
        if (
          discordWebhookUrl &&
          timeUntilSpawn > 0 &&
          timeUntilSpawn <= SPAWN_WARNING_TIMEOUT &&
          !boss.discordNotifiedAt
        ) {
          const minutesUntilSpawn = Math.round(timeUntilSpawn / 60000);
          console.log(`[DISCORD] Boss "${boss.name}" will spawn in ${minutesUntilSpawn}m - sending notification`);
          
          const discordPromise = sendDiscordWebhook(discordWebhookUrl, createBossSpawnEmbed(boss, timeUntilSpawn, spawnAt))
            .then(() => {
              console.log(`[DISCORD] ✅ Sent notification for ${boss.name}`);
              return db.collection('bosses')
                .doc(doc.id)
                .update({
                  discordNotifiedAt: now,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                  updatedBy: 'system',
                })
                .then(() => {
                  discordNotified++;
                  console.log(`[DISCORD] ✅ Marked ${boss.name} as notified`);
                });
            })
            .catch((err) => {
              console.error(`[DISCORD] ❌ Failed for ${boss.name}:`, err.message);
            });
          
          discordPromises.push(discordPromise);
        } else if (discordWebhookUrl && timeUntilSpawn > 0 && timeUntilSpawn <= SPAWN_WARNING_TIMEOUT) {
          // Log why Discord wasn't sent
          console.log(`[DISCORD] ⏭️  Skipping ${boss.name}: already notified at ${boss.discordNotifiedAt}`);
        }

        // SECOND: Check if boss has spawned and needs auto-renewal
        if (now >= spawnAt) {
          if (!boss.autoSpawnedAt) {
            console.log(`Initializing spawn tracking for: ${boss.name} (ID: ${doc.id})`);
            initBatch.update(doc.ref, {
              autoSpawnedAt: now,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedBy: 'system',
            });
            initialized++;
          } else {
            const autoSpawnedAt = boss.autoSpawnedAt || 0;
            const timeSinceSpawn = now - autoSpawnedAt;

            if (timeSinceSpawn >= AUTO_SPAWN_TIMEOUT) {
              console.log(`Auto-renewing boss: ${boss.name} (ID: ${doc.id}, spawned for ${Math.round(timeSinceSpawn / 1000)}s)`);

              renewBatch.update(doc.ref, {
                lastKilledAt: now,
                autoSpawnedAt: null,
                discordNotifiedAt: null,
                isAutoRenewed: true,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: 'system',
              });

              processed++;
            }
          }
        }
      });

      // Wait for all Discord notifications to complete
      if (discordPromises.length > 0) {
        console.log(`Waiting for ${discordPromises.length} Discord notification(s)`);
        await Promise.allSettled(discordPromises);
      }

      if (initialized > 0) {
        await initBatch.commit();
        console.log(`Initialized tracking for ${initialized} boss(es)`);
      }

      if (processed > 0) {
        await renewBatch.commit();
        console.log(`Auto-renewed ${processed} boss(es)`);
      }

      return { initialized, processed, discordNotified };
    } catch (error) {
      console.error('Error in autoRenewBosses function:', error);
      throw error;
    }
  });

/**
 * Cloud Function to process Firestore writes
 * Called when a boss is manually marked dead to reset tracking
 */
exports.onBossUpdate = functions
  .region('asia-east1')
  .firestore
  .document('bosses/{bossId}')
  .onWrite(async (change, context) => {
    const bossId = context.params.bossId;
    const newData = change.after.data();
    const oldData = change.before.data();

    try {
      // Log spawn events for debugging
      if (newData && !oldData?.autoSpawnedAt && newData.autoSpawnedAt) {
        console.log(`Boss spawn tracking started: ${newData.name} (ID: ${bossId}) at ${new Date(newData.autoSpawnedAt).toISOString()}`);
      }

      // Log manual mark dead (resets auto-renewal status)
      if (newData && oldData && oldData.autoSpawnedAt && !newData.autoSpawnedAt) {
        if (newData.lastKilledAt > oldData.autoSpawnedAt) {
          console.log(`Boss manually marked dead: ${newData.name} (ID: ${bossId}), resetting auto-renewal`);
        }
      }
    } catch (error) {
      console.error('Error in onBossUpdate function:', error);
      // Don't rethrow - this is just logging
    }
  });

/**
 * Discord Spawn Warning Function
 * Runs every 1 minute to check for bosses spawning within 5 minutes
 * Sends a Discord warning notification
 */
exports.discordSpawnWarning = functions
  .region('asia-east1')
  .pubsub
  .schedule('every 1 minutes')
  .timeZone('Asia/Hong_Kong')
  .onRun(async (context) => {
    try {
      console.log(`\n[DISCORD_SPAWN_WARNING] Starting at ${new Date().toISOString()}`);
      
      const now = Date.now();
      const bossesRef = db.collection('bosses');
      const snapshot = await bossesRef.get();

      console.log(`[DISCORD_SPAWN_WARNING] Found ${snapshot.size} total boss documents`);

      // Get Discord webhook URL
      const settingsDoc = await db.collection('settings').doc('discord').get();
      const discordWebhookUrl = settingsDoc.data()?.webhookUrl;

      console.log(`[DISCORD_SPAWN_WARNING] Webhook URL: ${discordWebhookUrl ? '✅ SET' : '❌ NOT SET'}`);

      if (!discordWebhookUrl) {
        console.log(`[DISCORD_SPAWN_WARNING] ❌ No webhook URL configured`);
        return { notified: 0 };
      }

      let notified = 0;
      const promises = [];

      snapshot.forEach((doc) => {
        const boss = doc.data();
        
        // Skip bosses that don't have active timing information
        const isTimer = boss.type !== 'scheduled';
        const hasTimerData = isTimer && boss.lastKilledAt;
        const hasScheduleData = boss.type === 'scheduled' && boss.spawnSchedule?.length > 0;
        
        if (!hasTimerData && !hasScheduleData) {
          console.log(`[DISCORD_SPAWN_WARNING] ⏭️  "${boss.name}" - no active timing data`);
          return;
        }

        let spawnAt = null;
        let timeUntilSpawn = null;
        
        if (boss.type === 'scheduled') {
          // For scheduled bosses, calculate next spawn from schedule
          spawnAt = calculateNextScheduledSpawn(boss.spawnSchedule);
          if (spawnAt) {
            timeUntilSpawn = spawnAt - now;
            console.log(`[DISCORD_SPAWN_WARNING] Scheduled boss "${boss.name}" - spawnAt: ${new Date(spawnAt).toISOString()}, timeUntilSpawn: ${timeUntilSpawn}ms`);
          } else {
            console.log(`[DISCORD_SPAWN_WARNING] Scheduled boss "${boss.name}" - could not calculate spawn time`);
            timeUntilSpawn = null;
          }
        } else {
          // For timer bosses, calculate from lastKilledAt
          const respawnMs = (boss.respawnMinutes || 60) * 60000;
          spawnAt = boss.lastKilledAt + respawnMs;
          timeUntilSpawn = spawnAt - now;
          console.log(`[DISCORD_SPAWN_WARNING] Timer boss "${boss.name}" - spawnAt: ${new Date(spawnAt).toISOString()}, timeUntilSpawn: ${timeUntilSpawn}ms`);
        }
        
        if (timeUntilSpawn === null) {
          console.log(`[DISCORD_SPAWN_WARNING] ⏭️  "${boss.name}" - Could not calculate spawn time`);
          return;
        }

        // Send warning if spawning within 5 minutes and not already notified
        if (
          timeUntilSpawn > 0 &&
          timeUntilSpawn <= SPAWN_WARNING_TIMEOUT &&
          !boss.discordNotifiedAt
        ) {
          const minutes = Math.round(timeUntilSpawn / 60000);
          console.log(`[DISCORD_SPAWN_WARNING] 🚨 "${boss.name}" spawning in ${minutes} min`);

          const promise = sendDiscordWebhook(discordWebhookUrl, createBossSpawnEmbed(boss, timeUntilSpawn, spawnAt))
            .then(() => {
              return db.collection('bosses').doc(doc.id).update({
                discordNotifiedAt: now,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: 'system',
              });
            })
            .then(() => {
              notified++;
              console.log(`[DISCORD_SPAWN_WARNING] ✅ Notified for ${boss.name}`);
            })
            .catch((err) => console.error(`[DISCORD_SPAWN_WARNING] ❌ Error: ${err.message}`));

          promises.push(promise);
        } else if (timeUntilSpawn > 0 && timeUntilSpawn <= SPAWN_WARNING_TIMEOUT) {
          console.log(`[DISCORD_SPAWN_WARNING] ⏭️  "${boss.name}" - already notified at ${new Date(boss.discordNotifiedAt).toISOString()}`);
        }
      });

      if (promises.length > 0) {
        await Promise.allSettled(promises);
      }

      console.log(`[DISCORD_SPAWN_WARNING] Completed. Notified: ${notified}\n`);
      return { notified };
    } catch (error) {
      console.error('[DISCORD_SPAWN_WARNING] Error:', error);
      throw error;
    }
  });

/**
 * Discord Spawned Notification Function
 * Triggered when a boss spawns (triggered on Firestore write)
 * Sends a "boss has spawned" notification
 */
exports.discordSpawned = functions
  .region('asia-east1')
  .firestore
  .document('bosses/{bossId}')
  .onWrite(async (change, context) => {
    try {
      const bossId = context.params.bossId;
      const newData = change.after.data();
      const oldData = change.before.data();

      // Only trigger when spawn tracking is initialized (boss just became spawned)
      if (newData && !oldData?.autoSpawnedAt && newData.autoSpawnedAt) {
        console.log(`[DISCORD_SPAWNED] Boss "${newData.name}" just spawned!`);

        // Get Discord webhook
        const settingsDoc = await db.collection('settings').doc('discord').get();
        const discordWebhookUrl = settingsDoc.data()?.webhookUrl;

        if (!discordWebhookUrl) {
          console.log(`[DISCORD_SPAWNED] ❌ No webhook URL configured`);
          return;
        }

        // Send "spawned" notification
        await sendDiscordWebhook(discordWebhookUrl, createBossSpawnedEmbed(newData));
        console.log(`[DISCORD_SPAWNED] ✅ Sent spawned notification for ${newData.name}`);
      }
    } catch (error) {
      console.error('[DISCORD_SPAWNED] Error:', error);
      // Don't rethrow - this is async notification
    }
  });

/**
 * Format time duration with proper units (days, hours, minutes, seconds)
 */
function formatDuration(ms) {
  if (ms <= 0) return '0s';
  
  const totalSeconds = Math.round(ms / 1000);
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  
  return parts.join(' ');
}

/**
 * Create a consolidated 24-hour boss report embed
 */
function create24HourBossReportEmbed(bossesIn24h) {
  if (bossesIn24h.length === 0) {
    return {
      content: '📋 **24-Hour Boss Report**: No bosses spawning in the next 24 hours',
      embeds: [],
    };
  }

  const reportLines = bossesIn24h.map((boss, idx) => {
    const spawnDate = new Date(boss.spawnAt);
    const spawnTime = spawnDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const timeStr = formatDuration(boss.timeUntilSpawn);
    const bossIcon = boss.type === 'scheduled' ? '🔄' : '⏱️';
    return `${idx + 1}. **${boss.name}** @ ${boss.map} - Spawn: ${spawnTime} (${timeStr}) ${bossIcon}`;
  }).join('\n');

  return {
    content: `📋 **24-Hour Boss Report** - ${bossesIn24h.length} boss(es) spawning`,
    embeds: [
      {
        title: '📊 Upcoming Bosses (Next 24 Hours)',
        description: reportLines,
        color: 3447003, // Blue
        fields: [
          {
            name: 'Summary',
            value: `Total: ${bossesIn24h.length} boss spawn(s)`,
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Discord Periodic Update Function
 * Runs every 15 minutes to send status updates on all active bosses
 */
exports.discordPeriodicUpdate = functions
  .region('asia-east1')
  .pubsub
  .schedule('every 15 minutes')
  .timeZone('Asia/Hong_Kong')
  .onRun(async (context) => {
    try {
      console.log(`\n[DISCORD_PERIODIC_UPDATE] Starting at ${new Date().toISOString()}`);
      
      const now = Date.now();
      const in24Hours = now + 24 * 60 * 60 * 1000;
      const bossesRef = db.collection('bosses');
      const snapshot = await bossesRef.get();

      console.log(`[DISCORD_PERIODIC_UPDATE] Found ${snapshot.size} total boss documents`);

      // Get Discord webhook URL
      const settingsDoc = await db.collection('settings').doc('discord').get();
      const discordWebhookUrl = settingsDoc.data()?.webhookUrl;

      console.log(`[DISCORD_PERIODIC_UPDATE] Webhook URL: ${discordWebhookUrl ? '✅ SET' : '❌ NOT SET'}`);

      if (!discordWebhookUrl) {
        console.log(`[DISCORD_PERIODIC_UPDATE] ❌ No webhook URL configured`);
        return { sent: 0 };
      }

      // Collect all bosses spawning within 24 hours
      const bossesIn24h = [];

      snapshot.forEach((doc) => {
        const boss = doc.data();
        
        // Skip bosses that don't have active timing information
        const isTimer = boss.type !== 'scheduled';
        const hasTimerData = isTimer && boss.lastKilledAt;
        const hasScheduleData = boss.type === 'scheduled' && boss.spawnSchedule?.length > 0;
        
        if (!hasTimerData && !hasScheduleData) {
          console.log(`[DISCORD_PERIODIC_UPDATE] ⏭️  "${boss.name}" - no active timing data`);
          return;
        }

        let spawnAt = null;
        let timeUntilSpawn = null;
        
        if (boss.type === 'scheduled') {
          // For scheduled bosses, calculate next spawn from schedule
          spawnAt = calculateNextScheduledSpawn(boss.spawnSchedule);
          timeUntilSpawn = spawnAt ? spawnAt - now : null;
        } else {
          // For timer bosses, calculate from lastKilledAt
          const respawnMs = (boss.respawnMinutes || 60) * 60000;
          spawnAt = boss.lastKilledAt + respawnMs;
          timeUntilSpawn = spawnAt - now;
        }
        
        if (timeUntilSpawn === null) {
          console.log(`[DISCORD_PERIODIC_UPDATE] ⏭️  "${boss.name}" - Could not calculate spawn time`);
          return;
        }
        
        // Only include bosses spawning within 24 hours and in the future (or currently spawned)
        if (spawnAt >= now && spawnAt <= in24Hours) {
          console.log(`[DISCORD_PERIODIC_UPDATE] ✅ Adding "${boss.name}" - ${formatDuration(timeUntilSpawn)} until spawn`);
          bossesIn24h.push({
            name: boss.name,
            map: boss.map,
            type: boss.type,
            spawnAt,
            timeUntilSpawn,
          });
        }
      });

      // Sort by spawn time
      bossesIn24h.sort((a, b) => a.spawnAt - b.spawnAt);

      console.log(`[DISCORD_PERIODIC_UPDATE] Found ${bossesIn24h.length} bosses spawning in next 24 hours`);

      // Send a single consolidated 24-hour report
      if (bossesIn24h.length > 0) {
        const reportEmbed = create24HourBossReportEmbed(bossesIn24h);
        
        await sendDiscordWebhook(discordWebhookUrl, reportEmbed);
        console.log(`[DISCORD_PERIODIC_UPDATE] ✅ Sent 24-hour boss report to Discord`);
      } else {
        console.log(`[DISCORD_PERIODIC_UPDATE] 📋 No bosses to report in next 24 hours`);
      }

      console.log(`[DISCORD_PERIODIC_UPDATE] Completed. Reported: ${bossesIn24h.length}\n`);
      return { sent: 1, bosses: bossesIn24h.length };
    } catch (error) {
      console.error('[DISCORD_PERIODIC_UPDATE] Error:', error);
      throw error;
    }
  });
