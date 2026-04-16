import { useState } from "react";
import { formatTime, formatDuration } from "../utils/formatting";

export function UpcomingBossesReport({ computed, now }) {
  const [copied, setCopied] = useState(false);

  // Filter bosses spawning within 24 hours
  const upcoming24h = computed
    .filter((boss) => {
      if (!boss.spawnAt) return false;
      const in24Hours = now + 24 * 60 * 60 * 1000;
      return boss.spawnAt >= now && boss.spawnAt <= in24Hours;
    })
    .sort((a, b) => a.spawnAt - b.spawnAt);

  // Generate report text
  const generateReport = () => {
    if (upcoming24h.length === 0) {
      return "No bosses spawning in the next 24 hours.";
    }

    const now_date = new Date(now);
    const lines = [
      `📋 BOSS SPAWN REPORT - ${now_date.toLocaleString()}`,
      `Upcoming bosses in next 24 hours: ${upcoming24h.length}`,
      "",
    ];

    upcoming24h.forEach((boss, idx) => {
      const spawnTime = new Date(boss.spawnAt);
      const timeStr = spawnTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const dateStr = spawnTime.toLocaleDateString([], { month: "short", day: "numeric" });
      const durationStr = formatDuration(boss.remaining);
      const bossType = boss.type === 'scheduled' ? '🔄' : '⏱️';

      lines.push(`${idx + 1}. [${timeStr}] ${boss.name} @ ${boss.map} (${durationStr}) ${bossType}`);
    });

    lines.push("");
    lines.push(`Total: ${upcoming24h.length} boss spawn(s) in next 24 hours`);

    return lines.join("\n");
  };

  const reportText = generateReport();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 p-3 shadow-lg backdrop-blur sm:p-4">
      <div className="mb-2">
        <h2 className="text-base font-semibold sm:text-lg">Upcoming Report</h2>
        <p className="mt-0.5 text-xs text-slate-400 sm:text-sm">Next 24 hours - copy to chat.</p>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-center sm:px-3 sm:py-2.5">
            <p className="text-xs text-slate-400">Upcoming</p>
            <p className="mt-1 text-lg font-semibold sm:text-xl">{upcoming24h.length}</p>
          </div>
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2 py-2 text-center sm:px-3 sm:py-2.5">
            <p className="text-xs text-emerald-200">24 Hours</p>
            <p className="mt-1 text-lg font-semibold text-emerald-300 sm:text-xl">⏰</p>
          </div>
        </div>

        {/* Report Preview */}
        <div className="rounded-lg border border-white/10 bg-black/30 p-2 sm:p-3">
          <p className="text-xs leading-5 text-slate-300 font-mono whitespace-pre-wrap break-words">
            {reportText}
          </p>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className={`w-full rounded-lg px-3 py-2 text-xs font-semibold transition active:scale-95 sm:py-2.5 sm:text-sm ${
            copied
              ? "bg-emerald-500 text-white"
              : "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
          }`}
        >
          {copied ? "✓ Copied to Clipboard" : "📋 Copy Report"}
        </button>

        {/* Info */}
        <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs leading-5 text-slate-400 sm:text-sm">
          Generate a formatted list of boss spawns in the next 24 hours. Easily copy and paste into team chat, Discord, or
          notes.
        </div>
      </div>
    </div>
  );
}
