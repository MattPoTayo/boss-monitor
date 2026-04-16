import { useEffect, useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { useBosses } from "./hooks/useBosses";
import { useNotifications } from "./hooks/useNotifications";
import {
  addBoss,
  updateBoss,
  markBossDead,
  resetBossTimer,
  deleteBoss,
  saveNotificationSettings,
} from "./services/bossService";
import { minutesFromParts, partsFromMinutes } from "./utils/formatting";
import {
  getNotificationCache,
  setNotificationCache,
  safeShowNotification,
  canUseNotificationConstructor,
} from "./utils/notifications";
import { defaultBosses } from "./utils/constants";
import { Header } from "./components/Header";
import { ErrorAlert } from "./components/ErrorAlert";
import { AddBossForm } from "./components/AddBossForm";
import { NotificationSettings } from "./components/NotificationSettings";
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

  const handleStartEdit = (boss) => {
    if (!requireAuth()) return;
    const parts = partsFromMinutes(boss.respawnMinutes);
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

        <div className="mt-4 grid gap-4 lg:grid-cols-[340px_1fr] flex-1 min-h-0 grid-cols-1 overflow-hidden">
          <div className="flex flex-col gap-4 overflow-y-auto pr-2 min-h-0 scroll-wrapper hidden lg:flex">
            <AddBossForm
              user={user}
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
              bosses={bosses}
              submitting={submitting}
              onAddBoss={handleAddBoss}
              onSeedDefaults={handleSeedDefaults}
            />

            <NotificationSettings
              user={user}
              notifyLeadMinutes={notifyLeadMinutes}
              setNotifyLeadMinutes={setNotifyLeadMinutes}
              notificationPermission={notificationPermission}
              savingNotifications={savingNotifications}
              notificationMessage={notificationMessage}
              onEnableBrowserNotifications={handleEnableBrowserNotifications}
              onSaveNotificationLeadTime={handleSaveNotificationLeadTime}
            />
          </div>

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
          />
        </div>
      </div>
    </div>
  );
}
