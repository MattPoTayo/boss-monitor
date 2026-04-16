import { useEffect, useState, useMemo } from "react";
import { subscribeToBosses } from "../services/bossService";
import { calculateNextScheduledSpawn } from "../utils/scheduleUtils";

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
        let spawnAt = null;
        let remaining = null;
        let spawned = false;

        if (b.type === 'scheduled') {
          // For scheduled bosses, calculate next spawn from schedule
          spawnAt = calculateNextScheduledSpawn(b.spawnSchedule);
          remaining = spawnAt ? Math.max(spawnAt - now, 0) : null;
          spawned = false;
        } else {
          // For timer-based bosses
          const respawnMs = b.respawnMinutes * 60000;
          spawnAt = b.lastKilledAt ? b.lastKilledAt + respawnMs : null;
          remaining = spawnAt ? Math.max(spawnAt - now, 0) : null;
          spawned = spawnAt ? now >= spawnAt : false;
        }

        return { ...b, spawnAt, remaining, spawned };
      });
  }, [bosses, now]);

  const stats = useMemo(() => {
    const total = bosses.length;
    const spawned = bosses.filter((b) => {
      if (b.type === 'scheduled') {
        return false;
      }
      if (!b.lastKilledAt) return false;
      return now >= b.lastKilledAt + b.respawnMinutes * 60000;
    }).length;
    const active = bosses.filter((b) => {
      if (b.type === 'scheduled') {
        return true;
      }
      return b.lastKilledAt;
    }).length;
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
