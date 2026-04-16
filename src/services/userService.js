import { db, auth } from "../firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

// Cache for user info to avoid repeated Firestore calls
const userEmailCache = {};
const userAdminCache = {};

export async function saveUserInfo(userId, email, displayName) {
  try {
    if (!userId || !email) {
      console.error("Missing required fields - userId:", userId, "email:", email);
      return;
    }

    console.log("Attempting to save user info for:", userId, email);
    
    // Check if user document already exists
    const userDocRef = doc(db, "users", userId);
    console.log("User doc reference created:", userDocRef.path);
    
    const userDocSnap = await getDoc(userDocRef);
    console.log("User doc exists:", userDocSnap.exists());
    
    const dataToUpdate = {
      email,
      displayName: displayName || null,
      lastSeen: serverTimestamp(),
    };

    // Only set createdAt on first creation
    if (!userDocSnap.exists()) {
      dataToUpdate.createdAt = serverTimestamp();
      dataToUpdate.isAdmin = false; // Default new users to non-admin
      console.log("First time user - setting createdAt and isAdmin to false");
    }

    console.log("Saving user data:", dataToUpdate);
    await setDoc(userDocRef, dataToUpdate, { merge: true });
    userEmailCache[userId] = email;
    console.log("✓ User info saved successfully for:", userId);
  } catch (error) {
    console.error("✗ Failed to save user info:", {
      userId,
      email,
      errorCode: error.code,
      errorMessage: error.message,
      fullError: error,
    });
    throw error;
  }
}

export async function setUserAsAdmin(userId, isAdmin = true) {
  try {
    await setDoc(
      doc(db, "users", userId),
      { isAdmin },
      { merge: true }
    );
    userAdminCache[userId] = isAdmin;
  } catch (error) {
    console.error("Failed to set user admin status:", error);
    throw error;
  }
}

export async function isUserAdmin(userId) {
  if (!userId) return false;

  // Check cache first
  if (userAdminCache.hasOwnProperty(userId)) {
    return userAdminCache[userId];
  }

  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const isAdmin = userDoc.data().isAdmin === true;
      userAdminCache[userId] = isAdmin;
      return isAdmin;
    }
  } catch (error) {
    console.error("Failed to check user admin status:", error);
  }

  userAdminCache[userId] = false;
  return false;
}

export function isUserAdminSync(userId) {
  return userAdminCache[userId] === true;
}

export function cacheUserAdminStatus(userId, isAdmin) {
  userAdminCache[userId] = isAdmin;
}

export async function getUserEmail(userId) {
  // Check cache first
  if (userEmailCache[userId]) {
    return userEmailCache[userId];
  }

  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const email = userDoc.data().email;
      userEmailCache[userId] = email;
      return email;
    }
  } catch (error) {
    console.error("Failed to get user email:", error);
  }

  // Try to get from current auth if it's the current user
  if (auth.currentUser && auth.currentUser.uid === userId) {
    const email = auth.currentUser.email;
    userEmailCache[userId] = email;
    return email;
  }

  // Return a truncated UID as fallback if email not found
  console.warn("User email not found for UID:", userId, "- using UID as fallback");
  return userId.substring(0, 8);
}

export function getUserEmailSync(userId) {
  return userEmailCache[userId] || null;
}

export function cacheUserEmail(userId, email) {
  userEmailCache[userId] = email;
}
