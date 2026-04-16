import { useEffect, useState, useMemo } from "react";
import { subscribeToBosses } from "../services/bossService";

export function useBosses() {
  const [bosses, setBosses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToBosses(
      (items) => {
        setBosses(items);
        setLoading(false);
        setError("");
      },
      (snapshotError) => {
        console.error(snapshotError);
        setError("Failed to load shared boss data.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const computed = useMemo(() => {
    return bosses
      .map((b) => {
        const respawnMs = b.respawnMinutes * 60000;
        const spawnAt = b.lastKilledAt ? b.lastKilledAt + respawnMs : null;
        const remaining = spawnAt ? Math.max(spawnAt - now, 0) : null;
        const spawned = spawnAt ? now >= spawnAt : false;
        return { ...b, spawnAt, remaining, spawned };
      });
  }, [bosses, now]);

  const stats = useMemo(() => {
    const total = bosses.length;
    const spawned = bosses.filter((b) => {
      if (!b.lastKilledAt) return false;
      return now >= b.lastKilledAt + b.respawnMinutes * 60000;
    }).length;
    const active = bosses.filter((b) => b.lastKilledAt).length;
    return { total, spawned, active };
  }, [bosses, now]);

  return {
    bosses,
    computed,
    stats,
    loading,
    error,
    setError,
    now,
  };
}
