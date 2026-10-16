import api from "@/shared/api/axios.instance";

/** True when this browser can receive Web Push at all. */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** VAPID keys are base64url; PushManager wants raw bytes. */
function urlBase64ToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

const SUBSCRIBE_TIMEOUT_MS = 20_000;

/**
 * `pushManager.subscribe` can hang with no push service behind it (headless
 * Chrome, some privacy-hardened browsers), which would leave the toggle busy.
 */
function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), SUBSCRIBE_TIMEOUT_MS);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err instanceof Error ? err : new Error(String(err)));
      },
    );
  });
}

/**
 * The service worker only exists in production builds (`devOptions` is off),
 * so `navigator.serviceWorker.ready` would hang forever in `vite dev`.
 */
async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  return (await navigator.serviceWorker.getRegistration()) ?? null;
}

const pushService = {
  async publicKey(): Promise<string | null> {
    const { data } = await api.get<{ publicKey: string | null }>(
      "notifications/push/public-key",
    );
    return data.publicKey;
  },

  async currentSubscription(): Promise<PushSubscription | null> {
    const registration = await getRegistration();
    return registration ? registration.pushManager.getSubscription() : null;
  },

  /** Asks for permission if needed, subscribes this browser, registers it. */
  async enable(publicKey: string): Promise<void> {
    const registration = await getRegistration();
    if (!registration) {
      throw new Error("Notifications need the installed app or a production build.");
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Notifications are blocked for this site in your browser settings.");
    }
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await withTimeout(
        registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }),
        "This browser's push service didn't respond. Try again, or use Chrome, Edge, Firefox or Safari.",
      ));
    await this.register(subscription);
  },

  /** (Re)binds an existing browser subscription to the signed-in user. */
  async register(subscription: PushSubscription): Promise<void> {
    await api.post("notifications/push/subscriptions", subscription.toJSON());
  },

  /**
   * Server first (needs the session), then the browser; the browser side
   * always runs, so a failed request can't leave this device subscribed.
   * If only the server call failed, the next send gets a 410 and prunes it.
   */
  async disable(): Promise<void> {
    const subscription = await this.currentSubscription();
    if (!subscription) return;
    try {
      await api.delete("notifications/push/subscriptions", {
        data: { endpoint: subscription.endpoint },
      });
    } finally {
      await subscription.unsubscribe();
    }
  },
};

export default pushService;
