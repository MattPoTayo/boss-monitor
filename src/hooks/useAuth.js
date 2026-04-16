import { useEffect, useState } from "react";
import { initializeAuth, setupAuthListener, loginWithGoogle, logout } from "../services/authService";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let unsubscribe = () => {};
    let isMounted = true;

    const initAuth = async () => {
      try {
        await initializeAuth();
      } catch (authError) {
        if (isMounted) {
          setError(authError?.message || "Failed to initialize sign-in persistence.");
        }
      }

      unsubscribe = setupAuthListener((nextUser) => {
        if (!isMounted) return;
        setUser(nextUser);
        setAuthLoading(false);
        setLoggingIn(false);
      });
    };

    initAuth();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    try {
      setLoggingIn(true);
      setError("");
      await loginWithGoogle();
    } catch (authError) {
      console.error(authError);
      setError(authError?.message || "Failed to sign in with Google.");
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      setError("");
      await logout();
    } catch (authError) {
      console.error(authError);
      setError("Failed to sign out.");
    } finally {
      setLoggingOut(false);
    }
  };

  return {
    user,
    authLoading,
    loggingIn,
    loggingOut,
    error,
    setError,
    handleLogin,
    handleLogout,
  };
}
