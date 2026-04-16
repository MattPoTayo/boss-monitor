import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "bosses_v1";

const defaultBosses = [
  { id: 1, name: "Crimson Wyrm", map: "Ashen Ridge", respawnMinutes: 120, lastKilledAt: null },
  { id: 2, name: "Frost Colossus", map: "Glacier Vault", respawnMinutes: 180, lastKilledAt: null },
  { id: 3, name: "Void Reaper", map: "Ruined Chapel", respawnMinutes: 90, lastKilledAt: null },
];

function formatDuration(ms) {
  if (ms <= 0) return "Spawned";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}h ${m}m ${sec}s` : `${m}m ${sec}s`;
}

function formatTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function App() {
  const [bosses, setBosses] = useState(defaultBosses);
  const [now, setNow] = useState(Date.now());
  const [name, setName] = useState("");
  const [map, setMap] = useState("");
  const [respawn, setRespawn] = useState(60);

  // load
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setBosses(JSON.parse(saved));
  }, []);

  // save
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bosses));
  }, [bosses]);

  // timer
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const computed = useMemo(() => {
    return bosses.map((b) => {
      const respawnMs = b.respawnMinutes * 60000;
      const spawnAt = b.lastKilledAt ? b.lastKilledAt + respawnMs : null;
      const remaining = spawnAt ? Math.max(spawnAt - now, 0) : null;
      const spawned = spawnAt ? now >= spawnAt : false;
      return { ...b, spawnAt, remaining, spawned };
    });
  }, [bosses, now]);

  const addBoss = () => {
    if (!name) return;
    setBosses([
      ...bosses,
      {
        id: Date.now(),
        name,
        map,
        respawnMinutes: Number(respawn),
        lastKilledAt: null,
      },
    ]);
    setName("");
    setMap("");
  };

  const markDead = (id) => {
    setBosses(bosses.map((b) => (b.id === id ? { ...b, lastKilledAt: Date.now() } : b)));
  };

  const reset = (id) => {
    setBosses(bosses.map((b) => (b.id === id ? { ...b, lastKilledAt: null } : b)));
  };

  const remove = (id) => {
    setBosses(bosses.filter((b) => b.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <h1 className="text-xl font-bold mb-4">Field Boss Timer</h1>

      {/* Add Boss */}
      <div className="bg-white p-4 rounded-xl mb-4 shadow">
        <h2 className="font-semibold mb-2">Add Boss</h2>
        <div className="flex flex-col gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Boss name" className="border p-2 rounded" />
          <input value={map} onChange={(e) => setMap(e.target.value)} placeholder="Map" className="border p-2 rounded" />
          <input type="number" value={respawn} onChange={(e) => setRespawn(e.target.value)} placeholder="Respawn (min)" className="border p-2 rounded" />
          <button onClick={addBoss} className="bg-black text-white p-2 rounded">Add</button>
        </div>
      </div>

      {/* Boss List */}
      {computed.map((b) => (
        <div key={b.id} className="bg-white p-4 mb-3 rounded-xl shadow">
          <div className="flex justify-between">
            <div>
              <h2 className="font-bold">{b.name}</h2>
              <p className="text-sm text-gray-500">{b.map}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${b.spawned ? "bg-green-200" : "bg-gray-200"}`}>
              {b.spawned ? "Spawned" : "Waiting"}
            </span>
          </div>

          <div className="mt-2 text-sm">
            <p>Respawn: {b.respawnMinutes} min</p>
            <p>Remaining: {b.remaining === null ? "Not started" : formatDuration(b.remaining)}</p>
            <p>Spawn At: {formatTime(b.spawnAt)}</p>
          </div>

          <div className="flex gap-2 mt-2">
            <button onClick={() => markDead(b.id)} className="bg-black text-white px-2 py-1 rounded">Dead</button>
            <button onClick={() => reset(b.id)} className="bg-gray-200 px-2 py-1 rounded">Reset</button>
            <button onClick={() => remove(b.id)} className="bg-red-200 px-2 py-1 rounded">Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
