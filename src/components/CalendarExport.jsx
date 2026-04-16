import { useState } from "react";
import { generateAndDownloadICS } from "../services/icsService";

export function CalendarExport({ computed }) {
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastDownload, setLastDownload] = useState(null);

  const handleDownloadICS = async () => {
    try {
      setDownloading(true);
      setError("");
      setMessage("");

      const result = generateAndDownloadICS(computed);

      if (result.success) {
        setMessage(result.message);
        setLastDownload({
          count: result.count,
          bosses: result.bosses,
          timestamp: new Date(),
        });
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error("Failed to download ICS:", err);
      setError(`Failed to download: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const bosses24h = computed.filter((boss) => {
    if (!boss.spawnAt) return false;
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const spawnAt = new Date(boss.spawnAt);
    return spawnAt >= now && spawnAt <= in24Hours;
  });

  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 p-3 shadow-lg backdrop-blur sm:p-4">
      <div className="mb-2">
        <h2 className="text-base font-semibold sm:text-lg">Calendar Export</h2>
        <p className="mt-0.5 text-xs text-slate-400 sm:text-sm">Download boss spawns for next 24 hours.</p>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-center sm:px-3 sm:py-2.5">
            <p className="text-xs text-slate-400">Available</p>
            <p className="mt-1 text-lg font-semibold sm:text-xl">{bosses24h.length}</p>
          </div>
          <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-2 py-2 text-center sm:px-3 sm:py-2.5">
            <p className="text-xs text-cyan-200">Calendar Format</p>
            <p className="mt-1 text-lg font-semibold text-cyan-300 sm:text-xl">.ICS</p>
          </div>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownloadICS}
          disabled={downloading || bosses24h.length === 0}
          className="w-full rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 active:bg-cyan-500 sm:py-2.5 sm:text-sm"
        >
          {downloading ? "Downloading..." : `Download ${bosses24h.length} Event(s)`}
        </button>

        {/* Messages */}
        {message && (
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 sm:text-sm">
            ✓ {message}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 sm:text-sm">
            ✕ {error}
          </div>
        )}

        {/* Last Download Info */}
        {lastDownload && (
          <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs sm:text-sm">
            <div className="font-semibold text-cyan-300 mb-2">Last Download:</div>
            <div className="space-y-1 text-slate-300">
              <div>Events: {lastDownload.count} bosses</div>
              <div className="text-xs text-slate-500">
                {lastDownload.timestamp.toLocaleTimeString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              {lastDownload.bosses.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="font-semibold text-cyan-300">Included:</div>
                  {lastDownload.bosses.slice(0, 5).map((boss, idx) => (
                    <div key={idx} className="ml-2 text-xs">
                      • {boss.name}
                    </div>
                  ))}
                  {lastDownload.bosses.length > 5 && (
                    <div className="ml-2 text-xs text-slate-500">+{lastDownload.bosses.length - 5} more</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs leading-5 text-slate-400 sm:text-sm">
          Download an .ICS file with all boss spawns in the next 24 hours. Import into any calendar app (Google Calendar,
          Outlook, Apple Calendar, etc). Includes reminders at 15 and 5 minutes before spawn.
        </div>
      </div>
    </div>
  );
}
