import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import pushService, { isPushSupported } from "../services/push.service";

interface PushNavigateMessage {
  type: "push-navigate";
  link: string;
}

function isPushNavigateMessage(data: unknown): data is PushNavigateMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { type?: unknown }).type === "push-navigate" &&
    typeof (data as { link?: unknown }).link === "string"
  );
}

/**
 * Mounted once under the authenticated layout:
 * - re-registers this browser's push subscription for the signed-in user, so
 *   a subscription the server pruned or that belonged to the previous
 *   account on a shared browser points at whoever is signed in now;
 * - routes OS notification clicks (relayed by public/push-sw.js) in-app.
 */
export function usePushSync(): void {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPushSupported() || Notification.permission !== "granted") return;
    pushService
      .currentSubscription()
      .then((subscription) => subscription && pushService.register(subscription))
      .catch((err: unknown) => {
        console.error("[Push] could not re-register this device:", err);
      });
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      // Only same-origin, in-app paths: never navigate off-site.
      if (isPushNavigateMessage(event.data) && event.data.link.startsWith("/")) {
        navigate(event.data.link);
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [navigate]);
}
