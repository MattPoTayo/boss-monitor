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
  adjustingKillId,
  adjustingKillTime,
  setAdjustingKillTime,
  onStartAdjustKill,
  onCancelAdjustKill,
  onSaveAdjustKill,
}) {
  // Initialize all cards as collapsed by default
  const [collapsedCards, setCollapsedCards] = useState(
    computed.reduce((acc, boss) => ({ ...acc, [boss.id]: true }), {})
  );
  const [activeTab, setActiveTab] = useState("timer"); // "timer" or "scheduled"

  const toggleCardCollapse = (bossId) => {
    setCollapsedCards((prev) => ({
      ...prev,
      [bossId]: !prev[bossId],
    }));
  };

  // Filter bosses by type
  const timerBosses = computed.filter(b => b.type !== 'scheduled');
  const scheduledBosses = computed.filter(b => b.type === 'scheduled');

  // Get bosses based on active tab and search
  const displayBosses = activeTab === "timer" ? timerBosses : scheduledBosses;
  const filteredBosses = displayBosses
    .filter((b) => {
      const term = search.trim().toLowerCase();
      if (!term) return true;
      return b.name.toLowerCase().includes(term) || b.map.toLowerCase().includes(term);
    })
    .sort((a, b) => {
      // Sort by remaining time: bosses that spawn first come first
      // Handle null remaining values (put them at the end)
      if (a.remaining === null) return 1;
      if (b.remaining === null) return -1;
      return a.remaining - b.remaining;
    });

  return (
    <div className="flex flex-col h-full gap-3 min-h-0">
      <div className="rounded-[20px] border border-white/10 bg-white/5 p-3 shadow-lg backdrop-blur flex-shrink-0 space-y-3">
        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("timer")}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
              activeTab === "timer"
                ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
            }`}
          >
            Timer Bosses ({timerBosses.length})
          </button>
          <button
            onClick={() => setActiveTab("scheduled")}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
              activeTab === "scheduled"
                ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
            }`}
          >
            Scheduled Bosses ({scheduledBosses.length})
          </button>
        </div>

        {/* Header and Search */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-3">
          <div>
            <h2 className="text-base font-semibold">
              {activeTab === "timer" ? "Timer Bosses" : "Scheduled Bosses"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {activeTab === "timer"
                ? "Mark boss as dead to start respawn timer."
                : "Fixed spawn times - no timer tracking."}
            </p>
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
      ) : displayBosses.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400 flex-shrink-0">
          {activeTab === "timer"
            ? "No timer-based bosses yet. Add one in the controls."
            : "No scheduled bosses yet. Add one in the controls."}
        </div>
      ) : filteredBosses.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400 flex-shrink-0">
          No {activeTab === "timer" ? "timer" : "scheduled"} bosses match your search.
        </div>
      ) : (
        <div className="rounded-[20px] border border-white/10 bg-white/5 shadow-lg backdrop-blur overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 p-3 scroll-wrapper">
            <div className="space-y-2 h-fit">
              {filteredBosses.map((b) => {
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
                    adjustingKillId={adjustingKillId}
                    adjustingKillTime={adjustingKillTime}
                    setAdjustingKillTime={setAdjustingKillTime}
                    onStartAdjustKill={onStartAdjustKill}
                    onCancelAdjustKill={onCancelAdjustKill}
                    onSaveAdjustKill={onSaveAdjustKill}
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
