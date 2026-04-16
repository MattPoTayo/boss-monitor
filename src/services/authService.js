import { auth } from "../firebase";
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
} from "firebase/auth";

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});

export async function initializeAuth() {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (authError) {
    console.error(authError);
    throw authError;
  }
}

export function setupAuthListener(callback) {
  const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
    callback(nextUser || auth.currentUser || null);
  });
  return unsubscribe;
}

export async function loginWithGoogle() {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (authError) {
    console.error(authError);
    throw authError;
  }
}

export async function logout() {
  try {
    await signOut(auth);
  } catch (authError) {
    console.error(authError);
    throw authError;
  }
}
