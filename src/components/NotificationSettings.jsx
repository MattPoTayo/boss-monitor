import { canUseNotificationConstructor, safeShowNotification } from "../utils/notifications";

export function NotificationSettings({
  user,
  notifyLeadMinutes,
  setNotifyLeadMinutes,
  notificationPermission,
  savingNotifications,
  notificationMessage,
  onEnableBrowserNotifications,
  onSaveNotificationLeadTime,
}) {
  return (
    <div className="border-t border-white/10 pt-3 sm:pt-4">
      <div className="mb-2">
        <h2 className="text-base font-semibold sm:text-lg">Browser Alerts</h2>
        <p className="mt-0.5 text-xs text-slate-400 sm:text-sm">Enable notifications and set alert timing.</p>
      </div>

      <div className="space-y-2 sm:space-y-3">
        <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs sm:text-sm">
          <span className="text-slate-400">Status:</span>{" "}
          <span className="font-semibold text-white">{notificationPermission}</span>
        </div>

        <div>
          <label className="mb-0.5 block text-xs text-slate-300 sm:text-sm">Minutes before spawn</label>
          <input
            type="number"
            min="1"
            value={notifyLeadMinutes}
            onChange={(e) => setNotifyLeadMinutes(e.target.value)}
            placeholder="5"
            className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 sm:py-2.5 sm:text-sm"
          />
        </div>

        <button
          onClick={onEnableBrowserNotifications}
          disabled={savingNotifications}
          className="w-full rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 active:bg-cyan-500 sm:py-2.5 sm:text-sm"
        >
          {savingNotifications ? "Requesting..." : "Enable Alerts"}
        </button>

        <button
          onClick={onSaveNotificationLeadTime}
          disabled={savingNotifications}
          className="w-full rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60 active:bg-cyan-500/30 sm:py-2.5 sm:text-sm"
        >
          {savingNotifications ? "Saving..." : "Save Timing"}
        </button>

        {notificationMessage ? (
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 sm:text-sm">
            {notificationMessage}
          </div>
        ) : null}

        <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs leading-5 text-slate-400 sm:text-sm">
          Browser alerts are device-specific. Enable them on each phone or browser where you want spawn notifications. Sign-in is only required for boss edits, not for receiving alerts.
        </div>
      </div>
    </div>
  );
}
