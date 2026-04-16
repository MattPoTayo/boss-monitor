import { useState, useEffect } from "react";
import {
  initializeGoogleAPI,
  initializeGIS,
  requestCalendarAccess,
  syncBossesWithin24HoursToCalendar,
  revokeCalendarAccess,
} from "../services/calendarService";

export function GoogleCalendarSync({ computed, user }) {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [syncResult, setSyncResult] = useState(null);

  // Initialize Google APIs on mount
  useEffect(() => {
    const initializeAPIs = async () => {
      try {
        await initializeGoogleAPI();
        await initializeGIS();
      } catch (err) {
        console.error("Failed to initialize Google APIs:", err);
        setError("Failed to initialize Google Calendar integration");
      }
    };

    if (import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID) {
      initializeAPIs();
    }
  }, []);

  const handleConnectCalendar = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      await requestCalendarAccess();
      setIsConnected(true);
      setMessage("Successfully connected to Google Calendar!");
    } catch (err) {
      console.error("Failed to connect calendar:", err);
      setError(`Failed to connect calendar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToCalendar = async () => {
    if (!isConnected) {
      setError("Please connect to Google Calendar first");
      return;
    }

    try {
      setSyncing(true);
      setError("");
      setMessage("");
      setSyncResult(null);

      const result = await syncBossesWithin24HoursToCalendar(computed, user?.uid ?? null);
      setSyncResult(result);

      if (result.success) {
        setMessage(result.message);
      } else {
        setError(`${result.message}`);
      }
    } catch (err) {
      console.error("Failed to sync bosses:", err);
      setError(`Failed to sync bosses: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = () => {
    try {
      revokeCalendarAccess();
      setIsConnected(false);
      setMessage("Disconnected from Google Calendar");
      setSyncResult(null);
    } catch (err) {
      console.error("Failed to disconnect:", err);
      setError(`Failed to disconnect: ${err.message}`);
    }
  };

  if (!import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID) {
    return (
      <div className="rounded-[20px] border border-white/10 bg-white/5 p-3 shadow-lg backdrop-blur sm:p-4">
        <div className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 sm:text-sm">
          Google Calendar integration is not configured. Add VITE_GOOGLE_API_KEY and VITE_GOOGLE_CALENDAR_CLIENT_ID to
          .env.local
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 p-3 shadow-lg backdrop-blur sm:p-4">
      <div className="mb-2">
        <h2 className="text-base font-semibold sm:text-lg">Google Calendar Sync</h2>
        <p className="mt-0.5 text-xs text-slate-400 sm:text-sm">Add upcoming bosses to your calendar with alarms.</p>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {/* Connection Status */}
        <div
          className={`rounded-lg border px-3 py-2 text-xs sm:text-sm ${
            isConnected
              ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
              : "border-slate-400/20 bg-slate-500/10 text-slate-200"
          }`}
        >
          Status: <span className="font-semibold">{isConnected ? "Connected" : "Not Connected"}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
          {!isConnected ? (
            <button
              onClick={handleConnectCalendar}
              disabled={loading}
              className="flex-1 rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 active:bg-cyan-500 sm:py-2.5 sm:text-sm"
            >
              {loading ? "Connecting..." : "Connect Calendar"}
            </button>
          ) : (
            <>
              <button
                onClick={handleSyncToCalendar}
                disabled={syncing || computed.length === 0}
                className="flex-1 rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60 active:bg-emerald-500 sm:py-2.5 sm:text-sm"
              >
                {syncing ? "Syncing..." : "Sync Next 24h"}
              </button>
              <button
                onClick={handleDisconnect}
                className="flex-1 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15 active:bg-white/20 sm:py-2.5 sm:text-sm"
              >
                Disconnect
              </button>
            </>
          )}
        </div>

        {/* Messages */}
        {message && (
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 sm:text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 sm:text-sm">
            {error}
          </div>
        )}

        {/* Sync Results */}
        {syncResult && (
          <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs sm:text-sm">
            <div className="font-semibold text-cyan-300 mb-2">Sync Results:</div>
            <div className="space-y-1 text-slate-300">
              <div>Added: {syncResult.added} bosses</div>
              {syncResult.failed > 0 && <div className="text-rose-300">Failed: {syncResult.failed} bosses</div>}
              {syncResult.bosses.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="font-semibold text-cyan-300">Bosses synced:</div>
                  {syncResult.bosses.map((boss, idx) => (
                    <div key={idx} className="ml-2">
                      • {boss.name} at {boss.map}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs leading-5 text-slate-400 sm:text-sm">
          Adds events for bosses spawning within 24 hours with reminders at 15 and 5 minutes before spawn.
        </div>
      </div>
    </div>
  );
}
