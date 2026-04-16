import { useState } from "react";

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export function AddScheduledBossForm({
  user,
  name,
  setName,
  map,
  setMap,
  submitting,
  onAddScheduledBoss,
}) {
  const [spawnSchedule, setSpawnSchedule] = useState([
    { day: 1, time: '20:00' },  // Monday 20:00
    { day: 4, time: '20:00' },  // Thursday 20:00
  ]);

  const addSpawnSlot = () => {
    setSpawnSchedule([...spawnSchedule, { day: 0, time: '20:00' }]);
  };

  const removeSpawnSlot = (index) => {
    setSpawnSchedule(spawnSchedule.filter((_, i) => i !== index));
  };

  const updateSpawnSlot = (index, field, value) => {
    const updated = [...spawnSchedule];
    updated[index] = { ...updated[index], [field]: value };
    setSpawnSchedule(updated);
  };

  const handleSubmit = () => {
    if (!name.trim() || !map.trim() || spawnSchedule.length === 0) {
      alert('Please fill in all fields and add at least one spawn time');
      return;
    }

    // Validate all slots have day and time
    if (spawnSchedule.some((slot) => slot.day === undefined || !slot.time)) {
      alert('Please specify day and time for all spawn slots');
      return;
    }

    onAddScheduledBoss({
      name: name.trim(),
      map: map.trim(),
      type: 'scheduled',
      spawnSchedule,
    });

    setName('');
    setMap('');
    setSpawnSchedule([
      { day: 1, time: '20:00' },
      { day: 4, time: '20:00' },
    ]);
  };

  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 p-3 shadow-lg backdrop-blur sm:p-4">
      <div className="mb-2">
        <h2 className="text-base font-semibold sm:text-lg">Add Scheduled Boss</h2>
        <p className="mt-0.5 text-xs text-slate-400 sm:text-sm">Boss with fixed spawn schedule. Can have different times per day.</p>
      </div>

      {!user ? (
        <div className="mb-2 rounded-lg border border-amber-400/20 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-200 sm:text-sm">
          Sign in to add bosses.
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
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-xs text-slate-300 sm:text-sm">Spawn schedule</label>
            <span className="text-xs text-slate-500">{spawnSchedule.length} slot(s)</span>
          </div>

          <div className="space-y-2">
            {spawnSchedule.map((slot, index) => (
              <div key={index} className="flex gap-2">
                <select
                  value={slot.day}
                  onChange={(e) => updateSpawnSlot(index, 'day', Number(e.target.value))}
                  disabled={!user}
                  className="flex-1 rounded-lg border border-white/10 bg-slate-900/80 px-2 py-2 text-xs text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60 sm:py-2.5 sm:text-sm"
                >
                  {DAYS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>

                <input
                  type="time"
                  value={slot.time}
                  onChange={(e) => updateSpawnSlot(index, 'time', e.target.value)}
                  disabled={!user}
                  className="flex-1 rounded-lg border border-white/10 bg-slate-900/80 px-2 py-2 text-xs text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60 sm:py-2.5 sm:text-sm"
                />

                <button
                  onClick={() => removeSpawnSlot(index)}
                  disabled={!user || spawnSchedule.length === 1}
                  className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-2 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60 active:bg-rose-500/30 sm:py-2.5"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addSpawnSlot}
            disabled={!user || spawnSchedule.length >= 7}
            className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 active:bg-white/15 sm:py-2.5 sm:text-sm"
          >
            + Add Another Day
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!user || submitting}
          className="w-full rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60 active:bg-emerald-500 sm:py-2.5 sm:text-sm"
        >
          {submitting ? "Saving..." : "Add Scheduled Boss"}
        </button>
      </div>
    </div>
  );
}
