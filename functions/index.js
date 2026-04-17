const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();
const AUTO_SPAWN_TIMEOUT = 2 * 60 * 1000; // 2 minutes in milliseconds

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
      console.log('Starting auto-renewal check at', new Date().toISOString());

      const now = Date.now();
      const bossesRef = db.collection('bosses');

      // Load ALL bosses (no complex queries needed)
      const snapshot = await bossesRef.get();

      let initialized = 0;
      const initBatch = db.batch();
      let processed = 0;
      const renewBatch = db.batch();

      snapshot.forEach((doc) => {
        const boss = doc.data();

        // Filter in code: only timer-based bosses with a kill time
        if (boss.type !== 'timer' || !boss.lastKilledAt) {
          return;
        }

        const respawnMs = (boss.respawnMinutes || 60) * 60000;
        const spawnAt = boss.lastKilledAt + respawnMs;

        // Only process if we're past the spawn time (boss should be alive)
        if (now >= spawnAt) {
          // If autoSpawnedAt is not yet set, initialize it
          if (!boss.autoSpawnedAt) {
            console.log(`Initializing spawn tracking for: ${boss.name} (ID: ${doc.id})`);
            initBatch.update(doc.ref, {
              autoSpawnedAt: now,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedBy: 'system',
            });
            initialized++;
          } else {
            // If autoSpawnedAt is set, check if 2+ minutes have passed
            const autoSpawnedAt = boss.autoSpawnedAt || 0;
            const timeSinceSpawn = now - autoSpawnedAt;

            if (timeSinceSpawn >= AUTO_SPAWN_TIMEOUT) {
              console.log(`Auto-renewing boss: ${boss.name} (ID: ${doc.id}, spawned for ${Math.round(timeSinceSpawn / 1000)}s)`);

              renewBatch.update(doc.ref, {
                lastKilledAt: now,
                autoSpawnedAt: null,
                isAutoRenewed: true,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: 'system',
              });

              processed++;
            }
          }
        }
      });

      // Commit batches
      if (initialized > 0) {
        await initBatch.commit();
        console.log(`Initialized tracking for ${initialized} boss(es)`);
      }

      if (processed > 0) {
        await renewBatch.commit();
        console.log(`Auto-renewed ${processed} boss(es)`);
      }

      return { initialized, processed };
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
