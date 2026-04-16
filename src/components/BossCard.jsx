import { formatDuration, formatTime, formatRespawnMinutes } from "../utils/formatting";
import { statusMeta } from "../utils/notifications";
import { BossCardEditForm } from "./BossCardEditForm";

export function BossCard({
  boss,
  user,
  isEditing,
  isCollapsed,
  onToggleCollapse,
  editForm,
  setEditForm,
  savingEditId,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onMarkDead,
  onReset,
  onDelete,
}) {
  const status = statusMeta(boss);
  const isActive = boss.remaining !== null && boss.remaining > 0;

  return (
    <div
      className={`rounded-[16px] border border-white/10 bg-gradient-to-br ${status.accent} bg-white/5 shadow-md backdrop-blur transition-all duration-200`}
    >
      {/* Header - Always visible and clickable to collapse */}
      <button
        onClick={() => onToggleCollapse(boss.id)}
        className="w-full text-left p-3 sm:p-4 hover:bg-white/5 transition-colors rounded-t-[16px] focus:outline-none active:bg-white/10"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className={`flex-shrink-0 transform transition-transform duration-200 ${
                  isCollapsed ? "rotate-0" : "rotate-90"
                } text-cyan-400 text-sm sm:text-base`}
              >
                ▶
              </div>
              <h3 className="text-sm font-semibold tracking-tight truncate sm:text-base">{boss.name}</h3>
            </div>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <p className="text-xs text-slate-400 truncate sm:text-sm">{boss.map}</p>
              {isActive && isCollapsed && (
                <span className="text-xs font-semibold text-cyan-300 flex-shrink-0 sm:text-sm">
                  {formatDuration(boss.remaining)}
                </span>
              )}
            </div>
          </div>
          <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap flex-shrink-0 sm:px-3 sm:py-1 sm:text-sm ${status.badge}`}>
            {status.label}
          </span>
        </div>
      </button>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <>
          {isEditing ? (
            <div className="px-3 pb-3">
              <BossCardEditForm
                editForm={editForm}
                setEditForm={setEditForm}
                savingEditId={savingEditId}
                bossId={boss.id}
                onSave={onSaveEdit}
                onCancel={onCancelEdit}
              />
            </div>
          ) : null}

          <div className="px-3 pb-3 border-t border-white/10">
            <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <div className="rounded-lg border border-white/10 bg-black/30 p-2 sm:p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400 sm:text-sm">Respawn</p>
                <p className="mt-0.5 text-xs font-semibold sm:text-sm">{formatRespawnMinutes(boss.respawnMinutes)}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/30 p-2 sm:p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400 sm:text-sm">Remaining</p>
                <p className="mt-0.5 text-xs font-semibold sm:text-sm">{boss.remaining === null ? "Not started" : formatDuration(boss.remaining)}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/30 p-2 sm:p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400 sm:text-sm">Spawn At</p>
                <p className="mt-0.5 text-xs font-semibold sm:text-sm">{formatTime(boss.spawnAt)}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/30 p-2 sm:p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400 sm:text-sm">Last Kill</p>
                <p className="mt-0.5 text-xs font-semibold sm:text-sm">{formatTime(boss.lastKilledAt)}</p>
              </div>
            </div>

            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                onClick={() => onMarkDead(boss.id)}
                disabled={!user}
                className="flex-1 rounded-lg bg-cyan-400 px-2 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 active:bg-cyan-500 sm:py-2 sm:text-sm"
              >
                Mark Dead
              </button>
              <button
                onClick={() => onStartEdit(boss)}
                disabled={!user}
                className="flex-1 rounded-lg border border-white/10 bg-white/10 px-2 py-2 text-xs font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60 active:bg-white/20 sm:py-2 sm:text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => onReset(boss.id)}
                disabled={!user}
                className="flex-1 rounded-lg border border-white/10 bg-white/10 px-2 py-2 text-xs font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60 active:bg-white/20 sm:py-2 sm:text-sm"
              >
                Reset
              </button>
              <button
                onClick={() => onDelete(boss.id)}
                disabled={!user}
                className="flex-1 rounded-lg border border-rose-400/20 bg-rose-500/10 px-2 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60 active:bg-rose-500/30 sm:py-2 sm:text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
