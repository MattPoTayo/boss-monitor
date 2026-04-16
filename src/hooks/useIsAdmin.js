import { useEffect, useState } from "react";
import { isUserAdmin, cacheUserAdminStatus } from "../services/userService";

export function useIsAdmin(userId) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(!!userId);

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    let isMounted = true;

    isUserAdmin(userId).then((result) => {
      if (isMounted) {
        setIsAdmin(result);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { isAdmin, loading };
}
