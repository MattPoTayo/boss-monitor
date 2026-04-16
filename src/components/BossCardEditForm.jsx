import { partsFromMinutes } from "../utils/formatting";

export function BossCardEditForm({ editForm, setEditForm, savingEditId, bossId, onSave, onCancel }) {
  return (
    <div className="space-y-2 sm:space-y-3 rounded-lg border border-white/10 bg-black/40 p-2 sm:p-3">
      <div>
        <label className="mb-0.5 block text-xs uppercase tracking-wide text-slate-400 sm:text-sm">Boss name</label>
        <input
          value={editForm.name}
          onChange={(e) => setEditForm((current) => ({ ...current, name: e.target.value }))}
          className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-2 py-2 text-xs text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 sm:py-2.5 sm:text-sm"
        />
      </div>

      <div>
        <label className="mb-0.5 block text-xs uppercase tracking-wide text-slate-400 sm:text-sm">Map</label>
        <input
          value={editForm.map}
          onChange={(e) => setEditForm((current) => ({ ...current, map: e.target.value }))}
          className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-2 py-2 text-xs text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 sm:py-2.5 sm:text-sm"
        />
      </div>

      <div>
        <label className="mb-0.5 block text-xs uppercase tracking-wide text-slate-400 sm:text-sm">Respawn time</label>
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          <input
            type="number"
            min="0"
            value={editForm.days}
            onChange={(e) => setEditForm((current) => ({ ...current, days: e.target.value }))}
            className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-2 py-2 text-xs text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 sm:py-2.5 sm:text-sm"
            placeholder="d"
          />
          <input
            type="number"
            min="0"
            value={editForm.hours}
            onChange={(e) => setEditForm((current) => ({ ...current, hours: e.target.value }))}
            className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-2 py-2 text-xs text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 sm:py-2.5 sm:text-sm"
            placeholder="h"
          />
          <input
            type="number"
            min="0"
            value={editForm.minutes}
            onChange={(e) => setEditForm((current) => ({ ...current, minutes: e.target.value }))}
            className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-2 py-2 text-xs text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 sm:py-2.5 sm:text-sm"
            placeholder="m"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
        <button
          onClick={() => onSave(bossId)}
          disabled={savingEditId === bossId}
          className="flex-1 rounded-lg bg-cyan-400 px-2 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 active:bg-cyan-500 sm:py-2.5 sm:text-sm"
        >
          {savingEditId === bossId ? "Saving..." : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-white/10 bg-white/10 px-2 py-2 text-xs font-semibold text-white transition hover:bg-white/15 active:bg-white/20 sm:py-2.5 sm:text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
