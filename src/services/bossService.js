import { db } from "../firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { cacheUserEmail } from "./userService";

export function subscribeToBosses(callback, onError) {
  const bossesRef = collection(db, "bosses");
  const bossesQuery = query(bossesRef, orderBy("createdAt", "asc"));

  const unsubscribe = onSnapshot(
    bossesQuery,
    (snapshot) => {
      const items = snapshot.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          type: data.type ?? "timer",
          name: data.name ?? "Unknown Boss",
          map: data.map ?? "Unknown Area",
          respawnMinutes: Number(data.respawnMinutes) || 60,
          lastKilledAt: typeof data.lastKilledAt === "number" ? data.lastKilledAt : null,
          spawnSchedule: data.spawnSchedule ?? [],
          createdBy: data.createdBy ?? null,
          createdAt: data.createdAt?.toMillis?.() ?? null,
          updatedBy: data.updatedBy ?? null,
          updatedAt: data.updatedAt?.toMillis?.() ?? null,
          autoSpawnedAt: typeof data.autoSpawnedAt === "number" ? data.autoSpawnedAt : null,
          isAutoRenewed: data.isAutoRenewed ?? false,
        };
      });
      callback(items);
    },
    onError
  );

  return unsubscribe;
}

export async function addBoss(bossData, userId) {
  try {
    await addDoc(collection(db, "bosses"), {
      ...bossData,
      createdAt: serverTimestamp(),
      createdBy: userId,
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function updateBoss(bossId, updates, userId) {
  try {
    await updateDoc(doc(db, "bosses", bossId), {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function markBossDead(bossId, userId) {
  return updateBoss(bossId, { lastKilledAt: Date.now(), autoSpawnedAt: null, isAutoRenewed: false }, userId);
}

export async function markBossDeadAuto(bossId, userId) {
  // Mark dead automatically after 2 minutes of spawn
  return updateBoss(bossId, { lastKilledAt: Date.now(), autoSpawnedAt: null, isAutoRenewed: true }, userId);
}

export async function recordBossSpawn(bossId, userId) {
  // Record when a boss becomes spawned (for auto-marking tracking)
  return updateBoss(bossId, { autoSpawnedAt: Date.now() }, userId);
}

export async function resetBossTimer(bossId, userId) {
  return updateBoss(bossId, { lastKilledAt: null, autoSpawnedAt: null, isAutoRenewed: false }, userId);
}

export async function updateLastKill(bossId, lastKilledAt, userId) {
  return updateBoss(bossId, { lastKilledAt: lastKilledAt ? Number(lastKilledAt) : null }, userId);
}

export async function deleteBoss(bossId) {
  try {
    await deleteDoc(doc(db, "bosses", bossId));
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export function subscribeToNotificationSettings(callback, onError) {
  const notificationRef = doc(db, "settings", "notifications");

  const unsubscribe = onSnapshot(notificationRef, (snapshot) => {
    const data = snapshot.data();
    if (!data) return;
    callback({
      leadMinutes: Number(data.leadMinutes) || 5,
    });
  }, onError);

  return unsubscribe;
}

export async function saveNotificationSettings(leadMinutes, userId) {
  try {
    await setDoc(
      doc(db, "settings", "notifications"),
      {
        leadMinutes: Number(leadMinutes) || 5,
        updatedAt: serverTimestamp(),
        updatedBy: userId ?? null,
      },
      { merge: true }
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
}
