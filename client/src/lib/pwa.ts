// PWA Service Worker Registration for Zebulon Chromebook App
// Enables offline functionality and app-like behavior

export interface PWAInstallPrompt {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: Event & PWAInstallPrompt;
  }
}

class ZebulonPWA {
  private deferredPrompt: PWAInstallPrompt | null = null;
  private isInstalled = false;
  private isStandalone = false;

  constructor() {
    this.checkStandaloneMode();
    this.registerServiceWorker();
    this.setupInstallPrompt();
    this.setupConnectionMonitoring();
  }

  private checkStandaloneMode() {
    // Check if running as installed PWA
    this.isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    
    if (this.isStandalone) {
      console.log('Zebulon: Running as installed PWA');
      document.body.classList.add('pwa-standalone');
    }
  }

  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('Zebulon Service Worker registered successfully:', registration.scope);
        
        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.notifyUpdate();
              }
            });
          }
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
        
      } catch (error) {
        console.error('Zebulon Service Worker registration failed:', error);
      }
    }
  }

  private setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as PWAInstallPrompt;
      this.showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      console.log('Zebulon PWA was installed');
      this.isInstalled = true;
      this.hideInstallButton();
      this.deferredPrompt = null;
    });
  }

  private setupConnectionMonitoring() {
    window.addEventListener('online', () => {
      console.log('Zebulon: Connection restored');
      this.notifyConnectionStatus(true);
    });

    window.addEventListener('offline', () => {
      console.log('Zebulon: Connection lost - switching to offline mode');
      this.notifyConnectionStatus(false);
    });
  }

  private handleServiceWorkerMessage(event: MessageEvent) {
    if (event.data?.type === 'CONNECTION_RESTORED') {
      console.log('Zebulon: Service Worker detected connection restoration');
      this.notifyConnectionStatus(true);
    }
  }

  private notifyUpdate() {
    // Notify user about app update
    const event = new CustomEvent('pwa-update-available', {
      detail: { message: 'A new version of Zebulon is available' }
    });
    window.dispatchEvent(event);
  }

  private notifyConnectionStatus(isOnline: boolean) {
    const event = new CustomEvent('pwa-connection-change', {
      detail: { isOnline, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }

  private showInstallButton() {
    const event = new CustomEvent('pwa-install-available', {
      detail: { canInstall: true }
    });
    window.dispatchEvent(event);
  }

  private hideInstallButton() {
    const event = new CustomEvent('pwa-install-available', {
      detail: { canInstall: false }
    });
    window.dispatchEvent(event);
  }

  // Public methods for app to use
  public async installApp(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choice = await this.deferredPrompt.userChoice;
      
      if (choice.outcome === 'accepted') {
        console.log('Zebulon: User accepted PWA installation');
        return true;
      } else {
        console.log('Zebulon: User dismissed PWA installation');
        return false;
      }
    } catch (error) {
      console.error('Zebulon: PWA installation failed:', error);
      return false;
    }
  }

  public isAppInstallable(): boolean {
    return this.deferredPrompt !== null;
  }

  public isRunningStandalone(): boolean {
    return this.isStandalone;
  }

  public isAppInstalled(): boolean {
    return this.isInstalled;
  }

  public getConnectionStatus(): boolean {
    return navigator.onLine;
  }

  public async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const granted = await navigator.storage.persist();
        console.log('Zebulon: Persistent storage granted:', granted);
        return granted;
      } catch (error) {
        console.error('Zebulon: Failed to request persistent storage:', error);
        return false;
      }
    }
    return false;
  }

  public async getStorageEstimate() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        console.log('Zebulon Storage estimate:', estimate);
        return estimate;
      } catch (error) {
        console.error('Zebulon: Failed to get storage estimate:', error);
        return null;
      }
    }
    return null;
  }
}

// Initialize PWA functionality
export const zebulonPWA = new ZebulonPWA();

// Export for use in components
export default zebulonPWA;