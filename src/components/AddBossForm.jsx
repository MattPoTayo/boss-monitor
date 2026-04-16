import { minutesFromParts } from "../utils/formatting";

export function AddBossForm({
  user,
  name,
  setName,
  map,
  setMap,
  respawnDays,
  setRespawnDays,
  respawnHours,
  setRespawnHours,
  respawnMinutesPart,
  setRespawnMinutesPart,
  bosses,
  submitting,
  onAddBoss,
  onSeedDefaults,
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 p-3 shadow-lg backdrop-blur sm:p-4">
      <div className="mb-2">
        <h2 className="text-base font-semibold sm:text-lg">Add Boss</h2>
        <p className="mt-0.5 text-xs text-slate-400 sm:text-sm">Add boss with respawn time.</p>
      </div>

      {!user ? (
        <div className="mb-2 rounded-lg border border-amber-400/20 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-200 sm:text-sm">
          Sign in to add or modify bosses.
        </div>
      ) : null}

      <div className="space-y-2 sm:space-y-3">
        <div>
          <label className="mb-0.5 block text-xs text-slate-300 sm:text-sm">Boss name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter boss name"
            disabled={!user}
            className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60 sm:py-2.5 sm:text-sm"
          />
        </div>

        <div>
          <label className="mb-0.5 block text-xs text-slate-300 sm:text-sm">Map</label>
          <input
            value={map}
            onChange={(e) => setMap(e.target.value)}
            placeholder="Enter map or area"
            disabled={!user}
            className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60 sm:py-2.5 sm:text-sm"
          />
        </div>

        <div>
          <label className="mb-0.5 block text-xs text-slate-300 sm:text-sm">Respawn time</label>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            <input
              type="number"
              min="0"
              value={respawnDays}
              onChange={(e) => setRespawnDays(e.target.value)}
              placeholder="d"
              disabled={!user}
              className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-2 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60 sm:py-2.5 sm:text-sm"
            />
            <input
              type="number"
              min="0"
              value={respawnHours}
              onChange={(e) => setRespawnHours(e.target.value)}
              placeholder="h"
              disabled={!user}
              className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-2 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60 sm:py-2.5 sm:text-sm"
            />
            <input
              type="number"
              min="0"
              value={respawnMinutesPart}
              onChange={(e) => setRespawnMinutesPart(e.target.value)}
              placeholder="m"
              disabled={!user}
              className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-2 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60 sm:py-2.5 sm:text-sm"
            />
          </div>
        </div>

        <button
          onClick={onAddBoss}
          disabled={!user || submitting}
          className="w-full rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 active:bg-cyan-500 sm:py-2.5 sm:text-sm"
        >
          {submitting ? "Saving..." : "Add Boss"}
        </button>

        {bosses.length === 0 ? (
          <button
            onClick={onSeedDefaults}
            disabled={!user || submitting}
            className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60 active:bg-white/20 sm:py-2.5 sm:text-sm"
          >
            Add Defaults
          </button>
        ) : null}
      </div>
    </div>
  );
}
