import { useState } from "react";
import { BossCard } from "./BossCard";

export function BossList({
  computed,
  user,
  loading,
  search,
  setSearch,
  editingId,
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
  const [collapsedCards, setCollapsedCards] = useState({});

  const toggleCardCollapse = (bossId) => {
    setCollapsedCards((prev) => ({
      ...prev,
      [bossId]: !prev[bossId],
    }));
  };

  return (
    <div className="flex flex-col h-full gap-3 min-h-0">
      <div className="rounded-[20px] border border-white/10 bg-white/5 p-3 shadow-lg backdrop-blur flex-shrink-0">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-3">
          <div>
            <h2 className="text-base font-semibold">Boss List</h2>
            <p className="mt-0.5 text-xs text-slate-400">Search and track respawn timers.</p>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search boss or map"
            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 md:max-w-xs sm:text-sm sm:py-2.5"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400 flex-shrink-0">
          Loading bosses...
        </div>
      ) : computed.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400 flex-shrink-0">
          No bosses found.
        </div>
      ) : (
        <div className="rounded-[20px] border border-white/10 bg-white/5 shadow-lg backdrop-blur overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 p-3 scroll-wrapper">
            <div className="space-y-2 h-fit">
              {computed.map((b) => {
                const isEditing = editingId === b.id;
                const isCollapsed = collapsedCards[b.id];

                return (
                  <BossCard
                    key={b.id}
                    boss={b}
                    user={user}
                    isEditing={isEditing}
                    isCollapsed={isCollapsed}
                    onToggleCollapse={toggleCardCollapse}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    savingEditId={savingEditId}
                    onStartEdit={onStartEdit}
                    onCancelEdit={onCancelEdit}
                    onSaveEdit={onSaveEdit}
                    onMarkDead={onMarkDead}
                    onReset={onReset}
                    onDelete={onDelete}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
