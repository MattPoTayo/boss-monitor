/**
 * Generate ICS (iCalendar) file content
 */
export function generateICS(bosses) {
  if (!Array.isArray(bosses) || bosses.length === 0) {
    throw new Error('No bosses provided');
  }

  // Filter bosses within 24 hours
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const upcomingBosses = bosses.filter((boss) => {
    if (!boss.spawnAt) return false;
    const spawnAt = new Date(boss.spawnAt);
    return spawnAt >= now && spawnAt <= in24Hours;
  });

  if (upcomingBosses.length === 0) {
    throw new Error('No bosses spawning within 24 hours');
  }

  // Generate ICS content
  let icsContent = generateICSHeader();

  upcomingBosses.forEach((boss) => {
    icsContent += generateICSEvent(boss);
  });

  icsContent += 'END:VCALENDAR\r\n';

  return {
    content: icsContent,
    filename: `boss-spawns-${now.getTime()}.ics`,
    bosses: upcomingBosses,
    count: upcomingBosses.length,
  };
}

/**
 * Generate ICS file header
 */
function generateICSHeader() {
  const now = formatDatetime(new Date());

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Boss Monitor//boss-monitor//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Boss Spawn Times
X-WR-TIMEZONE:UTC
X-WR-CALDESC:Boss respawn times for the next 24 hours
DTSTAMP:${now}
BEGIN:VTIMEZONE
TZID:UTC
BEGIN:STANDARD
DTSTART:19700101T000000Z
TZOFFSETFROM:+0000
TZOFFSETTO:+0000
TZNAME:UTC
END:STANDARD
END:VTIMEZONE
`;
}

/**
 * Generate ICS event for a single boss
 */
function generateICSEvent(boss) {
  const spawnAt = new Date(boss.spawnAt);
  const spawnEnd = new Date(spawnAt.getTime() + 30 * 60000); // 30 min duration
  const createdAt = new Date();

  const startDt = formatDatetime(spawnAt);
  const endDt = formatDatetime(spawnEnd);
  const createdDt = formatDatetime(createdAt);
  const uid = `${boss.id}-${createdDt}@boss-monitor`;

  const description = `Boss: ${boss.name}
Location: ${boss.map}
Respawn Time: ${formatRespawn(boss.respawnMinutes)}
Remaining: ${formatDuration(boss.remaining)}`;

  const summary = `Boss Spawn: ${boss.name} - ${boss.map}`;

  return `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${createdDt}
DTSTART:${startDt}
DTEND:${endDt}
SUMMARY:${escapeText(summary)}
DESCRIPTION:${escapeText(description)}
LOCATION:${escapeText(boss.map)}
STATUS:CONFIRMED
TRANSP:OPAQUE
BEGIN:VALARM
ACTION:DISPLAY
TRIGGER:-PT15M
DESCRIPTION:Boss spawning in 15 minutes
END:VALARM
BEGIN:VALARM
ACTION:DISPLAY
TRIGGER:-PT5M
DESCRIPTION:Boss spawning in 5 minutes
END:VALARM
END:VEVENT
`;
}

/**
 * Format date for ICS format (YYYYMMDDTHHMMSSZ)
 */
function formatDatetime(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escape special characters for ICS format
 */
function escapeText(text) {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

/**
 * Format respawn time
 */
function formatRespawn(minutes) {
  if (!minutes) return '0m';
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
 * Format duration
 */
function formatDuration(ms) {
  if (!ms || ms <= 0) return 'Spawned';

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.length > 0 ? parts.join(' ') : 'Soon';
}

/**
 * Download ICS file
 */
export function downloadICS(icsData) {
  const element = document.createElement('a');
  const file = new Blob([icsData.content], { type: 'text/calendar;charset=utf-8' });

  element.href = URL.createObjectURL(file);
  element.download = icsData.filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(element.href);

  return true;
}

/**
 * Generate and download ICS file
 */
export function generateAndDownloadICS(bosses) {
  try {
    const icsData = generateICS(bosses);
    downloadICS(icsData);
    return {
      success: true,
      message: `Downloaded ${icsData.count} boss spawn event(s)`,
      count: icsData.count,
      bosses: icsData.bosses,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error,
    };
  }
}
