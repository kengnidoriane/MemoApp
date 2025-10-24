import { registerSW } from 'virtual:pwa-register';

export interface PWAUpdateInfo {
  needRefresh: boolean;
  offlineReady: boolean;
  updateSW: () => Promise<void>;
}

class PWAManager {
  private updateSW: (() => Promise<void>) | null = null;
  private listeners: ((info: PWAUpdateInfo) => void)[] = [];
  private currentInfo: PWAUpdateInfo = {
    needRefresh: false,
    offlineReady: false,
    updateSW: async () => {},
  };

  init() {
    if ('serviceWorker' in navigator) {
      this.updateSW = registerSW({
        onNeedRefresh: () => {
          this.currentInfo.needRefresh = true;
          this.notifyListeners();
        },
        onOfflineReady: () => {
          this.currentInfo.offlineReady = true;
          this.notifyListeners();
        },
        onRegistered: (registration: ServiceWorkerRegistration | undefined) => {
          console.log('SW Registered: ', registration);
        },
        onRegisterError: (error: any) => {
          console.log('SW registration error', error);
        },
      });

      this.currentInfo.updateSW = async () => {
        if (this.updateSW) {
          await this.updateSW();
        }
      };
    }
  }

  subscribe(callback: (info: PWAUpdateInfo) => void) {
    this.listeners.push(callback);
    // Immediately call with current state
    callback(this.currentInfo);
    
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentInfo));
  }

  async updateApp() {
    await this.currentInfo.updateSW();
  }

  getInfo(): PWAUpdateInfo {
    return this.currentInfo;
  }

  // Request persistent storage
  async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const granted = await navigator.storage.persist();
        console.log('Persistent storage granted:', granted);
        return granted;
      } catch (error) {
        console.error('Error requesting persistent storage:', error);
        return false;
      }
    }
    return false;
  }

  // Get storage estimate
  async getStorageEstimate(): Promise<StorageEstimate | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        return await navigator.storage.estimate();
      } catch (error) {
        console.error('Error getting storage estimate:', error);
        return null;
      }
    }
    return null;
  }
}

export const pwaManager = new PWAManager();