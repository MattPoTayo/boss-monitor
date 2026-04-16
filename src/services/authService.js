import { auth } from "../firebase";
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { cacheUserEmail, saveUserInfo, isUserAdmin, cacheUserAdminStatus } from "./userService";

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
  const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
    if (nextUser) {
      try {
        // Cache the user's email for display purposes
        cacheUserEmail(nextUser.uid, nextUser.email);
        // Save user info to Firestore
        await saveUserInfo(nextUser.uid, nextUser.email, nextUser.displayName);
        // Check and cache admin status
        const isAdmin = await isUserAdmin(nextUser.uid);
        cacheUserAdminStatus(nextUser.uid, isAdmin);
        console.log("User authenticated:", nextUser.email, "Admin:", isAdmin);
      } catch (error) {
        console.error("Error during auth listener setup:", error);
      }
    } else {
      console.log("User logged out");
    }
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
