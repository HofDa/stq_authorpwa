import { registerSW } from 'virtual:pwa-register';

let reloading = false;

export function registerServiceWorker(): void {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  registerSW({
    immediate: true,
    onNeedRefresh() {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    },
  });
}
