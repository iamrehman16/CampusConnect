import { useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * `beforeinstallprompt` fires once per page load, usually before a given
 * component mounts. State therefore lives at module level so every consumer
 * (landing page, settings, account drawer, top bar) sees the same event.
 */
interface InstallState {
  prompt: BeforeInstallPromptEvent | null;
  installed: boolean;
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  // iOS Safari reports home-screen launches here instead.
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

let state: InstallState = { prompt: null, installed: isStandalone() };
const listeners = new Set<() => void>();

const setState = (next: InstallState) => {
  state = next;
  listeners.forEach((l) => l());
};

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // stop browser's default mini-infobar
  setState({ ...state, prompt: e as BeforeInstallPromptEvent });
});
window.addEventListener('appinstalled', () => setState({ prompt: null, installed: true }));

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => state;

// iPadOS 13+ reports itself as a Mac, hence the touch-points check.
const isIos =
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function usePwaInstall() {
  const { prompt, installed } = useSyncExternalStore(subscribe, getSnapshot);

  const triggerInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    // A used prompt can't be reused; 'appinstalled' flips `installed`.
    setState({ ...state, prompt: null, installed: outcome === 'accepted' || state.installed });
  };

  return {
    isInstallable: !installed && prompt !== null,
    // iOS has no install prompt: show "Share, then Add to Home Screen" instead.
    needsIosGuidance: !installed && prompt === null && isIos,
    isInstalled: installed,
    triggerInstall,
  };
}
