const NOTIFIED_KEY = "boss_spawn_notified";

export function canUseNotificationConstructor() {
  try {
    return typeof window !== "undefined" && "Notification" in window && typeof Notification === "function";
  } catch {
    return false;
  }
}

export function safeShowNotification(title, body) {
  try {
    if (!canUseNotificationConstructor()) return false;
    if (Notification.permission !== "granted") return false;
    new Notification(title, { body });
    return true;
  } catch (error) {
    console.error("Notification display failed:", error);
    return false;
  }
}

export function getNotificationCache() {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function setNotificationCache(value) {
  try {
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(value));
  } catch {
    // ignore localStorage failures
  }
}

export function statusMeta(boss) {
  if (!boss.lastKilledAt) {
    return {
      label: "No Timer",
      badge: "bg-slate-200 text-slate-700 border-slate-300",
      accent: "from-slate-500/10 to-slate-400/5",
    };
  }

  if (boss.spawned) {
    return {
      label: "Spawned",
      badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
      accent: "from-emerald-500/15 to-emerald-400/5",
    };
  }

  if (boss.remaining !== null && boss.remaining <= 15 * 60 * 1000) {
    return {
      label: "Soon",
      badge: "bg-amber-100 text-amber-700 border-amber-200",
      accent: "from-amber-500/15 to-amber-400/5",
    };
  }

  return {
    label: "Waiting",
    badge: "bg-sky-100 text-sky-700 border-sky-200",
    accent: "from-sky-500/15 to-sky-400/5",
  };
}
