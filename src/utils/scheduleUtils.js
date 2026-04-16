/**
 * Calculate next spawn time for scheduled boss with multiple spawn times per week
 */
export function calculateNextScheduledSpawn(spawnSchedule) {
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

    if (!nextSpawn || spawnTime < nextSpawn) {
      nextSpawn = spawnTime;
    }
  });

  return nextSpawn ? nextSpawn.getTime() : null;
}

/**
 * Format spawn schedule for display
 */
export function formatSchedule(spawnSchedule) {
  if (!spawnSchedule || !Array.isArray(spawnSchedule) || spawnSchedule.length === 0) {
    return 'No schedule set';
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const schedules = spawnSchedule
    .map((spawn) => `${dayNames[spawn.day]} ${spawn.time}`)
    .join(', ');

  return schedules;
}

/**
 * Get day name from number
 */
export function getDayName(dayNumber) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNumber % 7];
}

/**
 * Get all scheduled spawn times for the week
 */
export function getScheduledSpawnTimes(spawnSchedule) {
  if (!spawnSchedule || !Array.isArray(spawnSchedule) || spawnSchedule.length === 0) {
    return [];
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();

  return spawnSchedule
    .map((spawn) => {
      const { day, time } = spawn;
      const [hours, minutes] = time.split(':').map(Number);

      const spawnDate = new Date(currentYear, currentMonth, currentDate);
      const daysUntil = day - spawnDate.getDay();
      spawnDate.setDate(spawnDate.getDate() + daysUntil);
      spawnDate.setHours(hours, minutes, 0, 0);

      return spawnDate.getTime();
    })
    .filter((time) => time > now.getTime())
    .sort((a, b) => a - b);
}
