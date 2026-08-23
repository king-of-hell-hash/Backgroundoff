/**
 * PWA Manager: Handles Service Worker registration, File Handlers (launchQueue),
 * Web Share Target, Protocol Handlers, Background Sync, Periodic Sync,
 * Push Notifications, and Window Controls Overlay.
 */

export interface PwaStatus {
  isServiceWorkerRegistered: boolean;
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  hasFileHandlers: boolean;
  hasProtocolHandlers: boolean;
  hasShareTarget: boolean;
  hasWindowControlsOverlay: boolean;
  hasBackgroundSync: boolean;
  hasPeriodicSync: boolean;
  notificationPermission: NotificationPermission;
}

type ImageCallback = (file: File | Blob, name: string) => void;

let deferredInstallPrompt: any = null;
let onInstallableChangeCallback: ((installable: boolean) => void) | null = null;

/**
 * Register Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });
      console.log('[PWA] Service Worker registered with scope:', registration.scope);

      // Check for updates
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New content is available; please refresh.');
            }
          };
        }
      };

      return registration;
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
}

/**
 * Initialize LaunchQueue consumer for File Handlers API
 */
export function initFileHandlers(onImageReceived: ImageCallback) {
  if ('launchQueue' in window && 'files' in (window as any).LaunchParams?.prototype || 'launchQueue' in window) {
    try {
      (window as any).launchQueue.setConsumer(async (launchParams: any) => {
        if (launchParams.files && launchParams.files.length > 0) {
          console.log('[PWA] Handling file from OS launchQueue:', launchParams.files);
          for (const fileHandle of launchParams.files) {
            const file = await fileHandle.getFile();
            if (file.type.startsWith('image/')) {
              onImageReceived(file, file.name);
              break;
            }
          }
        }
      });
      console.log('[PWA] File Handler launchQueue consumer initialized.');
    } catch (e) {
      console.warn('[PWA] Failed to set launchQueue consumer:', e);
    }
  }
}

/**
 * Check for Web Share Target incoming payload
 */
export async function checkShareTargetPayload(onImageReceived: ImageCallback) {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'share-target-loaded') {
    try {
      if ('caches' in window) {
        const cache = await caches.open('backgroundoff-assets-v1.2.0');
        const response = await cache.match('/_shared_target_image');
        if (response) {
          const blob = await response.blob();
          const sharedName = response.headers.get('x-shared-name') || 'shared-photo.jpg';
          console.log('[PWA] Loaded image from Web Share Target cache:', decodeURIComponent(sharedName));
          onImageReceived(blob, decodeURIComponent(sharedName));
          await cache.delete('/_shared_target_image');
          
          // Clean URL without reload
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    } catch (err) {
      console.error('[PWA] Error reading shared image from cache:', err);
    }
  }
}

/**
 * Check for Custom Protocol Handler or Action URL params
 */
export async function checkUrlParameters(onImageReceived: ImageCallback) {
  const urlParams = new URLSearchParams(window.location.search);
  const rawUrl = urlParams.get('url');

  if (rawUrl) {
    try {
      // Decode protocol handler link: web+backgroundoff://https://example.com/image.png
      let targetImageUrl = rawUrl;
      if (targetImageUrl.startsWith('web+backgroundoff://')) {
        targetImageUrl = targetImageUrl.replace('web+backgroundoff://', '');
      } else if (targetImageUrl.startsWith('web+backgroundoff:')) {
        targetImageUrl = targetImageUrl.replace('web+backgroundoff:', '');
      }

      if (targetImageUrl.startsWith('http://') || targetImageUrl.startsWith('https://')) {
        console.log('[PWA] Loading image via protocol handler URL:', targetImageUrl);
        const res = await fetch(targetImageUrl);
        if (res.ok) {
          const blob = await res.blob();
          const filename = targetImageUrl.split('/').pop()?.split('?')[0] || 'remote-image.jpg';
          onImageReceived(blob, filename);
        }
      }
    } catch (err) {
      console.warn('[PWA] Failed to load image from protocol URL:', err);
    }
  }
}

/**
 * Setup beforeinstallprompt listener
 */
export function setupInstallPrompt(onInstallableChange: (installable: boolean) => void) {
  onInstallableChangeCallback = onInstallableChange;

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (onInstallableChangeCallback) {
      onInstallableChangeCallback(true);
    }
    console.log('[PWA] beforeinstallprompt event captured and ready.');
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    if (onInstallableChangeCallback) {
      onInstallableChangeCallback(false);
    }
    console.log('[PWA] Application successfully installed.');
  });
}

/**
 * Trigger PWA installation
 */
export async function triggerInstall(): Promise<boolean> {
  if (!deferredInstallPrompt) {
    return false;
  }
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  if (onInstallableChangeCallback) {
    onInstallableChangeCallback(false);
  }
  return outcome === 'accepted';
}

/**
 * Request Background Sync
 */
export async function requestBackgroundSync(tag: string = 'export-sync'): Promise<boolean> {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(tag);
      console.log(`[PWA] Background sync registered for tag: ${tag}`);
      return true;
    } catch (err) {
      console.warn('[PWA] Background sync registration error:', err);
      return false;
    }
  }
  return false;
}

/**
 * Request Periodic Background Sync
 */
export async function requestPeriodicSync(tag: string = 'update-sample-gallery'): Promise<boolean> {
  if ('serviceWorker' in navigator && 'periodicSync' in (await navigator.serviceWorker.ready)) {
    try {
      const registration: any = await navigator.serviceWorker.ready;
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync' as any,
      });
      if (status.state === 'granted') {
        await registration.periodicSync.register(tag, {
          minInterval: 24 * 60 * 60 * 1000, // 24 hours
        });
        console.log(`[PWA] Periodic sync registered for tag: ${tag}`);
        return true;
      }
    } catch (err) {
      console.warn('[PWA] Periodic background sync registration error:', err);
    }
  }
  return false;
}

/**
 * Request Notification Permission & Send test notification
 */
export async function requestPushNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  const permission = await Notification.requestPermission();
  return permission;
}

export async function sendLocalNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        tag: 'bg-notification',
      });
    } else {
      new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
      });
    }
  }
}

/**
 * Get comprehensive PWA capabilities status
 */
export function getPwaCapabilities(): PwaStatus {
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://');

  return {
    isServiceWorkerRegistered: 'serviceWorker' in navigator,
    isOnline: navigator.onLine,
    isInstallable: !!deferredInstallPrompt,
    isInstalled: isStandalone,
    hasFileHandlers: 'launchQueue' in window,
    hasProtocolHandlers: 'registerProtocolHandler' in navigator,
    hasShareTarget: true,
    hasWindowControlsOverlay: 'windowControlsOverlay' in navigator,
    hasBackgroundSync: 'SyncManager' in window,
    hasPeriodicSync: 'serviceWorker' in navigator && 'periodicSync' in ServiceWorkerRegistration.prototype,
    notificationPermission: 'Notification' in window ? Notification.permission : 'denied',
  };
}
