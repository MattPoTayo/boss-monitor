import { useEffect, useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { useBosses } from "./hooks/useBosses";
import { useNotifications } from "./hooks/useNotifications";
import {
  addBoss,
  updateBoss,
  markBossDead,
  markBossDeadAuto,
  resetBossTimer,
  recordBossSpawn,
  updateLastKill,
  deleteBoss,
  saveNotificationSettings,
} from "./services/bossService";
import { minutesFromParts, partsFromMinutes } from "./utils/formatting";
import { cacheUserEmail } from "./services/userService";
import {
  getNotificationCache,
  setNotificationCache,
  safeShowNotification,
  canUseNotificationConstructor,
} from "./utils/notifications";
import { defaultBosses } from "./utils/constants";
import { Header } from "./components/Header";
import { ErrorAlert } from "./components/ErrorAlert";
import { ControlsSidebar } from "./components/ControlsSidebar";
import { BossList } from "./components/BossList";

export default function App() {
  // Auth hooks
  const {
    user,
    authLoading,
    loggingIn,
    loggingOut,
    error: authError,
    setError: setAuthError,
    handleLogin,
    handleLogout,
  } = useAuth();

  // Boss data hooks
  const {
    bosses,
    computed,
    stats,
    loading: bossesLoading,
    error: bossesError,
    setError: setBossesError,
    now,
  } = useBosses();

  // Notification hooks
  const {
    notifyLeadMinutes,
    setNotifyLeadMinutes,
    notificationPermission,
    setNotificationPermission,
    savingNotifications,
    setSavingNotifications,
    notificationMessage,
    setNotificationMessage,
    error: notificationError,
    setError: setNotificationError,
  } = useNotifications();

  // Local form state
  const [name, setName] = useState("");
  const [map, setMap] = useState("");
  const [respawnDays, setRespawnDays] = useState(0);
  const [respawnHours, setRespawnHours] = useState(1);
  const [respawnMinutesPart, setRespawnMinutesPart] = useState(0);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState({ name: "", map: "", days: 0, hours: 0, minutes: 0 });
  const [savingEditId, setSavingEditId] = useState("");

  // Scheduled boss form state
  const [scheduledName, setScheduledName] = useState("");
  const [scheduledMap, setScheduledMap] = useState("");

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Last kill adjustment state
  const [adjustingKillId, setAdjustingKillId] = useState("");
  const [adjustingKillTime, setAdjustingKillTime] = useState("");

  // Track which bosses we've recorded as spawned for auto-marking
  const [recordedSpawns, setRecordedSpawns] = useState(new Set());

  // Cache current user's email for display
  useEffect(() => {
    if (user?.email) {
      cacheUserEmail(user.uid, user.email);
    }
  }, [user?.uid, user?.email]);

  // Notification effect
  useEffect(() => {
    if (!canUseNotificationConstructor()) return;

    const cache = getNotificationCache();
    let changed = false;

    computed.forEach((boss) => {
      try {
        if (!boss.lastKilledAt || boss.spawnAt === null) return;

        const notifyAt = boss.spawnAt - notifyLeadMinutes * 60 * 1000;
        const cacheKey = `${boss.id}:${boss.lastKilledAt}:${notifyLeadMinutes}`;

        if (boss.spawned) {
          if (cache[cacheKey] !== "spawned") {
            safeShowNotification(`${boss.name} is up`, `${boss.name} at ${boss.map} is now spawned.`);
            cache[cacheKey] = "spawned";
            changed = true;
          }
          return;
        }

        if (now >= notifyAt && now < boss.spawnAt && !cache[cacheKey]) {
          safeShowNotification(
            `${boss.name} spawning soon`,
            `${boss.name} at ${boss.map} will spawn in ${notifyLeadMinutes} minute(s).`
          );
          cache[cacheKey] = "soon";
          changed = true;
        }
      } catch (effectError) {
        console.error("Boss notification effect failed:", effectError);
      }
    });

    if (changed) {
      setNotificationCache(cache);
    }
  }, [computed, now, notifyLeadMinutes]);

  // Auto-mark boss as dead after 2 minutes of spawning
  useEffect(() => {
    const AUTO_SPAWN_TIMEOUT = 2 * 60 * 1000; // 2 minutes in milliseconds

    computed.forEach((boss) => {
      try {
        // Only process timer-based bosses that are spawned
        if (boss.type === 'scheduled' || !boss.spawned) return;

        const spawnId = boss.id;

        // If this boss just spawned (spawned but not yet recorded), record it
        if (!recordedSpawns.has(spawnId) && !boss.autoSpawnedAt) {
          setRecordedSpawns((prev) => new Set([...prev, spawnId]));
          recordBossSpawn(spawnId, user?.uid).catch((err) => {
            console.error("Failed to record boss spawn:", err);
          });
          return;
        }

        // If boss has been spawned for >= 2 minutes and still alive, auto-mark it dead
        if (boss.autoSpawnedAt && now - boss.autoSpawnedAt >= AUTO_SPAWN_TIMEOUT) {
          markBossDeadAuto(spawnId, user?.uid).catch((err) => {
            console.error("Failed to auto-mark boss as dead:", err);
          });
          // Remove from tracked set so we don't try again
          setRecordedSpawns((prev) => {
            const newSet = new Set(prev);
            newSet.delete(spawnId);
            return newSet;
          });
        }
      } catch (effectError) {
        console.error("Auto-mark boss effect failed:", effectError);
      }
    });
  }, [computed, now, user?.uid, recordedSpawns]);

  // Helper functions
  const requireAuth = () => {
    if (user) return true;
    setAuthError("Sign in with Google to add or edit bosses.");
    return false;
  };

  // Boss operations
  const handleAddBoss = async () => {
    if (!requireAuth()) return;
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      setAuthError("");

      await addBoss(
        {
          name: name.trim(),
          map: map.trim() || "Unknown Area",
          respawnMinutes: minutesFromParts(respawnDays, respawnHours, respawnMinutesPart),
          lastKilledAt: null,
        },
        user.uid
      );

      setName("");
      setMap("");
      setRespawnDays(0);
      setRespawnHours(1);
      setRespawnMinutesPart(0);
    } catch (addError) {
      console.error(addError);
      setAuthError("Failed to add boss.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddScheduledBoss = async (scheduledBossData) => {
    if (!requireAuth()) return;

    try {
      setSubmitting(true);
      setAuthError("");

      await addBoss(scheduledBossData, user.uid);

      setScheduledName("");
      setScheduledMap("");
    } catch (addError) {
      console.error(addError);
      setAuthError("Failed to add scheduled boss.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (boss) => {
    if (!requireAuth()) return;
    const parts = partsFromMinutes(boss.respawnMinutes || 60);
    setEditingId(boss.id);
    setEditForm({
      name: boss.name,
      map: boss.map,
      days: parts.days,
      hours: parts.hours,
      minutes: parts.minutes,
    });
  };

  const handleCancelEdit = () => {
    setEditingId("");
    setEditForm({ name: "", map: "", days: 0, hours: 0, minutes: 0 });
  };

  const handleSaveEdit = async (id) => {
    if (!requireAuth()) return;
    if (!editForm.name.trim()) return;

    try {
      setSavingEditId(id);
      setAuthError("");
      await updateBoss(
        id,
        {
          name: editForm.name.trim(),
          map: editForm.map.trim() || "Unknown Area",
          respawnMinutes: minutesFromParts(editForm.days, editForm.hours, editForm.minutes),
        },
        user.uid
      );
      handleCancelEdit();
    } catch (updateError) {
      console.error(updateError);
      setAuthError("Failed to save boss changes.");
    } finally {
      setSavingEditId("");
    }
  };

  const handleMarkDead = async (id) => {
    if (!requireAuth()) return;
    try {
      setAuthError("");
      await markBossDead(id, user.uid);
    } catch (updateError) {
      console.error(updateError);
      setAuthError("Failed to update boss timer.");
    }
  };

  const handleReset = async (id) => {
    if (!requireAuth()) return;
    try {
      setAuthError("");
      await resetBossTimer(id, user.uid);
    } catch (updateError) {
      console.error(updateError);
      setAuthError("Failed to reset boss timer.");
    }
  };

  const handleDelete = async (id) => {
    if (!requireAuth()) return;
    try {
      setAuthError("");
      await deleteBoss(id);
    } catch (deleteError) {
      console.error(deleteError);
      setAuthError("Failed to delete boss.");
    }
  };

  const handleStartAdjustKill = (boss) => {
    setAdjustingKillId(boss.id);
    setAdjustingKillTime(boss.lastKilledAt ? new Date(boss.lastKilledAt).toISOString().slice(0, 16) : "");
  };

  const handleCancelAdjustKill = () => {
    setAdjustingKillId("");
    setAdjustingKillTime("");
  };

  const handleSaveAdjustKill = async (id) => {
    if (!requireAuth()) return;
    try {
      setAuthError("");
      const newTime = adjustingKillTime ? new Date(adjustingKillTime).getTime() : null;
      await updateLastKill(id, newTime, user.uid);
      handleCancelAdjustKill();
    } catch (adjustError) {
      console.error(adjustError);
      setAuthError("Failed to adjust kill time.");
    }
  };

  const handleEnableBrowserNotifications = async () => {
    if (!canUseNotificationConstructor()) {
      setAuthError("This device or browser does not support notifications.");
      return;
    }

    try {
      setSavingNotifications(true);
      setNotificationMessage("");
      setAuthError("");

      const result = await Notification.requestPermission();
      setNotificationPermission(result);

      if (result !== "granted") {
        setAuthError("Notification permission was not granted.");
        return;
      }

      await saveNotificationSettings(notifyLeadMinutes, user?.uid ?? null);
      setNotificationMessage("Browser notifications enabled for this device.");
    } catch (notificationSaveError) {
      console.error(notificationSaveError);
      setAuthError("Failed to enable browser notifications.");
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleSaveNotificationLeadTime = async () => {
    try {
      setSavingNotifications(true);
      setNotificationMessage("");
      setAuthError("");

      await saveNotificationSettings(notifyLeadMinutes, user?.uid ?? null);
      setNotificationMessage("Notification timing saved.");
    } catch (notificationSaveError) {
      console.error(notificationSaveError);
      setAuthError("Failed to save notification timing.");
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleSeedDefaults = async () => {
    if (!requireAuth()) return;
    if (bosses.length > 0) return;

    try {
      setSubmitting(true);
      setAuthError("");

      for (const boss of defaultBosses) {
        await addBoss(boss, user.uid);
      }
    } catch (seedError) {
      console.error(seedError);
      setAuthError("Failed to seed default bosses.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter computed bosses by search
  const filteredBosses = computed.filter((b) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return b.name.toLowerCase().includes(term) || b.map.toLowerCase().includes(term);
  });

  const error = authError || bossesError || notificationError;

  return (
    <div className="h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden flex flex-col">
      <div className="mx-auto max-w-6xl p-4 md:p-6 flex flex-col flex-1 w-full min-h-0">
        <Header
          stats={stats}
          user={user}
          authLoading={authLoading}
          loggingIn={loggingIn}
          loggingOut={loggingOut}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />

        <ErrorAlert error={error} />

        {/* Mobile Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden mt-4 mb-4 w-full rounded-lg bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 active:bg-cyan-500"
        >
          {sidebarOpen ? "Close Controls" : "Open Controls ☰"}
        </button>

        {/* Main Content: Sidebar + Boss List */}
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Sidebar */}
          <ControlsSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            user={user}
            bosses={bosses}
            computed={computed}
            now={now}
            name={name}
            setName={setName}
            map={map}
            setMap={setMap}
            respawnDays={respawnDays}
            setRespawnDays={setRespawnDays}
            respawnHours={respawnHours}
            setRespawnHours={setRespawnHours}
            respawnMinutesPart={respawnMinutesPart}
            setRespawnMinutesPart={setRespawnMinutesPart}
            submitting={submitting}
            onAddBoss={handleAddBoss}
            onSeedDefaults={handleSeedDefaults}
            scheduledName={scheduledName}
            setScheduledName={setScheduledName}
            scheduledMap={scheduledMap}
            setScheduledMap={setScheduledMap}
            onAddScheduledBoss={handleAddScheduledBoss}
            notifyLeadMinutes={notifyLeadMinutes}
            setNotifyLeadMinutes={setNotifyLeadMinutes}
            notificationPermission={notificationPermission}
            savingNotifications={savingNotifications}
            notificationMessage={notificationMessage}
            onEnableBrowserNotifications={handleEnableBrowserNotifications}
            onSaveNotificationLeadTime={handleSaveNotificationLeadTime}
          />

          {/* Boss List */}
          <div className="flex-1 min-h-0">
            <BossList
              computed={filteredBosses}
              user={user}
              loading={bossesLoading}
              search={search}
              setSearch={setSearch}
              editingId={editingId}
              editForm={editForm}
              setEditForm={setEditForm}
              savingEditId={savingEditId}
              onStartEdit={handleStartEdit}
              onCancelEdit={handleCancelEdit}
              onSaveEdit={handleSaveEdit}
              onMarkDead={handleMarkDead}
              onReset={handleReset}
              onDelete={handleDelete}
              adjustingKillId={adjustingKillId}
              adjustingKillTime={adjustingKillTime}
              setAdjustingKillTime={setAdjustingKillTime}
              onStartAdjustKill={handleStartAdjustKill}
              onCancelAdjustKill={handleCancelAdjustKill}
              onSaveAdjustKill={handleSaveAdjustKill}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
