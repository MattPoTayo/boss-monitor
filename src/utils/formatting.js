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

export function maskEmail(email) {
  if (!email) return "User";
  // If it's a short UID (not an email), return as is
  if (!email.includes("@")) {
    return email;
  }
  // Mask email: user@gm... or similar
  const [localPart, domain] = email.split("@");
  const maskedLocal = localPart.length > 1 ? localPart[0] + "***" : "***";
  const domainParts = domain.split(".");
  const maskedDomain = domainParts[0].substring(0, 2) + "...";
  return `${maskedLocal}@${maskedDomain}`;
}

export function formatUpdateInfo(updatedAt, username) {
  if (!updatedAt) return null;
  const date = new Date(updatedAt);
  const ago = formatTimeAgo(updatedAt);
  const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric", year: date.getFullYear() !== new Date().getFullYear() ? "2-digit" : undefined });
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  // Display masked email for privacy
  const displayName = maskEmail(username);
  return {
    ago,
    display: `${displayName} • ${ago}`,
    full: `${dateStr} at ${timeStr}`,
  };
}

export function formatTimeAgo(timestamp) {
  const now = Date.now();
  const seconds = Math.floor((now - timestamp) / 1000);
  
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}
