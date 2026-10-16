import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { extractErrorMessage } from "@/shared/api/api.errors";
import pushService, { isPushSupported } from "../services/push.service";
import { pushPublicKeyKey } from "./notification.keys";

export type PushStatus =
  /** Browser lacks Web Push (e.g. iOS Safari outside an installed app). */
  | "unsupported"
  /** Server has no VAPID keys: the feature is off, render nothing. */
  | "unavailable"
  | "loading"
  | "denied"
  | "off"
  | "on";

/**
 * After a failed toggle the browser may still hold a subscription (e.g. a
 * slow `subscribe` resolving after our timeout): register it so the switch,
 * the browser and the server agree, or report "off" if that fails too.
 */
async function reconcile(): Promise<boolean> {
  try {
    const subscription = await pushService.currentSubscription();
    if (!subscription) return false;
    await pushService.register(subscription);
    return true;
  } catch (err) {
    console.error("[Push] could not reconcile the browser subscription:", err);
    return false;
  }
}

/** Device-level OS notification opt-in for Settings. */
export function usePushNotifications() {
  const supported = isPushSupported();
  const { data: publicKey, isLoading } = useQuery({
    queryKey: pushPublicKeyKey,
    queryFn: () => pushService.publicKey(),
    enabled: supported,
    staleTime: Infinity,
  });
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supported) return;
    pushService
      .currentSubscription()
      .then((s) => setSubscribed(s !== null))
      .catch((err: unknown) => {
        console.error("[Push] could not read the browser subscription:", err);
        setSubscribed(false);
      });
  }, [supported]);

  let status: PushStatus;
  if (!supported) status = "unsupported";
  else if (isLoading || subscribed === null) status = "loading";
  else if (!publicKey) status = "unavailable";
  else if (Notification.permission === "denied") status = "denied";
  else status = subscribed ? "on" : "off";

  const setEnabled = useCallback(
    async (enable: boolean) => {
      if (!publicKey) return;
      setBusy(true);
      try {
        if (enable) {
          await pushService.enable(publicKey);
          toast.success("Notifications are on for this device");
        } else {
          await pushService.disable();
        }
        setSubscribed(enable);
      } catch (err) {
        console.error("[Push] toggle failed:", err);
        setSubscribed(await reconcile());
        toast.error(extractErrorMessage(err));
      } finally {
        setBusy(false);
      }
    },
    [publicKey],
  );

  return { status, busy, setEnabled };
}
