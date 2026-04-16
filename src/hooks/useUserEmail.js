import { useEffect, useState } from "react";
import { getUserEmail, getUserEmailSync } from "../services/userService";

export function useUserEmail(userId) {
  const [email, setEmail] = useState(getUserEmailSync(userId));

  useEffect(() => {
    if (!userId) return;

    // Try sync first
    const cached = getUserEmailSync(userId);
    if (cached) {
      setEmail(cached);
      return;
    }

    // Otherwise fetch
    let isMounted = true;
    getUserEmail(userId).then((result) => {
      if (isMounted) {
        setEmail(result);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return email;
}
