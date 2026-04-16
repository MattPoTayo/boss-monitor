export function formatDuration(ms) {
  if (ms <= 0) return "Spawned";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m ${sec}s`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  return `${m}m ${sec}s`;
}

export function formatTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatRespawnMinutes(totalMinutes) {
  const { days, hours, minutes } = partsFromMinutes(totalMinutes);
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes || parts.length === 0) parts.push(`${minutes}m`);
  return parts.join(" ");
}

export function partsFromMinutes(totalMinutes) {
  const safe = Math.max(1, Number(totalMinutes) || 1);
  const days = Math.floor(safe / 1440);
  const hours = Math.floor((safe % 1440) / 60);
  const minutes = safe % 60;
  return { days, hours, minutes };
}

export function minutesFromParts(days, hours, minutes) {
  return Math.max(1, Number(days || 0) * 1440 + Number(hours || 0) * 60 + Number(minutes || 0));
}
