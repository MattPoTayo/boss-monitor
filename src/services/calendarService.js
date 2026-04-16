// Google Calendar API Service
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID;

let tokenClient;
let gapiInited = false;
let gisInited = false;

/**
 * Initialize Google API
 */
export async function initializeGoogleAPI() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = async () => {
      try {
        gapi.load('client', async () => {
          await gapi.client.init({
            apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
            discoveryDocs: DISCOVERY_DOCS,
          });
          gapiInited = true;
          resolve();
        });
      } catch (error) {
        console.error('Failed to initialize Google API:', error);
        reject(error);
      }
    };
    script.onerror = () => reject(new Error('Failed to load Google API'));
    document.head.appendChild(script);
  });
}

/**
 * Initialize Google Identity Services
 */
export async function initializeGIS() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      try {
        tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES.join(' '),
          callback: (response) => {
            if (response.error) {
              reject(new Error(response.error));
            }
          },
        });
        gisInited = true;
        resolve();
      } catch (error) {
        console.error('Failed to initialize GIS:', error);
        reject(error);
      }
    };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

/**
 * Request Google Calendar access
 */
export async function requestCalendarAccess() {
  if (!gisInited) {
    throw new Error('Google Identity Services not initialized');
  }

  return new Promise((resolve, reject) => {
    const originalCallback = tokenClient.callback;
    tokenClient.callback = (response) => {
      if (response.error) {
        reject(new Error(response.error));
      } else {
        tokenClient.callback = originalCallback;
        resolve(response.access_token);
      }
    };
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

/**
 * Add boss spawn event to Google Calendar
 */
export async function addBossToCalendar(boss, userId) {
  if (!gapiInited) {
    throw new Error('Google API not initialized');
  }

  try {
    const now = new Date();
    const spawnAt = new Date(boss.spawnAt);

    // Create event with alarm 15 minutes before spawn
    const event = {
      summary: `Boss Spawn: ${boss.name}`,
      description: `Boss: ${boss.name}\nLocation: ${boss.map}\nRespawn Time: ${formatRespawn(boss.respawnMinutes)}`,
      location: boss.map,
      start: {
        dateTime: spawnAt.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: new Date(spawnAt.getTime() + 30 * 60000).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'notification', minutes: 15 },
          { method: 'popup', minutes: 5 },
        ],
      },
    };

    const request = gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    const response = await request.then(
      (response) => response,
      (reason) => {
        throw new Error(`Error: ${reason.result.error.message}`);
      }
    );

    return response.result;
  } catch (error) {
    console.error('Failed to add event to calendar:', error);
    throw error;
  }
}

/**
 * Get all bosses within 24 hours and add them to calendar
 */
export async function syncBossesWithin24HoursToCalendar(bosses, userId) {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const upcomingBosses = bosses.filter((boss) => {
    if (!boss.spawnAt) return false;
    const spawnAt = new Date(boss.spawnAt);
    return spawnAt >= now && spawnAt <= in24Hours;
  });

  if (upcomingBosses.length === 0) {
    return {
      success: true,
      message: 'No bosses spawning within 24 hours',
      added: 0,
      bosses: [],
    };
  }

  const results = [];
  const errors = [];

  for (const boss of upcomingBosses) {
    try {
      const event = await addBossToCalendar(boss, userId);
      results.push({
        boss: boss.name,
        calendarEventId: event.id,
        success: true,
      });
    } catch (error) {
      errors.push({
        boss: boss.name,
        error: error.message,
      });
    }
  }

  return {
    success: errors.length === 0,
    message: `Synced ${results.length} bosses to calendar${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
    added: results.length,
    failed: errors.length,
    bosses: upcomingBosses,
    results,
    errors,
  };
}

/**
 * Format respawn time
 */
function formatRespawn(minutes) {
  const days = Math.floor(minutes / (24 * 60));
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  const mins = minutes % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);

  return parts.length > 0 ? parts.join(' ') : '0m';
}

/**
 * Revoke calendar access
 */
export async function revokeCalendarAccess() {
  if (gapi.client.getToken()) {
    const token = gapi.client.getToken();
    google.accounts.oauth2.revoke(token.access_token, () => {
      gapi.client.setToken(null);
    });
  }
}
