import { useEffect, useState } from "react";
import { subscribeToNotificationSettings } from "../services/bossService";
import { canUseNotificationConstructor } from "../utils/notifications";

export function useNotifications() {
  const [notifyLeadMinutes, setNotifyLeadMinutes] = useState(5);
  const [notificationPermission, setNotificationPermission] = useState(
    canUseNotificationConstructor() ? Notification.permission : "unsupported"
  );
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToNotificationSettings(
      (settings) => {
        setNotifyLeadMinutes(settings.leadMinutes);
      },
      (notificationError) => {
        console.error(notificationError);
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    notifyLeadMinutes,
    setNotifyLeadMinutes,
    notificationPermission,
    setNotificationPermission,
    savingNotifications,
    setSavingNotifications,
    notificationMessage,
    setNotificationMessage,
    error,
    setError,
  };
}
