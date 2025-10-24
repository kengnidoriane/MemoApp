import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SyncConflict {
  id: string;
  type: 'memo' | 'category';
  localVersion: any;
  serverVersion: any;
  timestamp: Date;
}

interface OfflineChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'memo' | 'category';
  data: any;
  timestamp: Date;
  retryCount: number;
}

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  syncProgress: number; // 0-100
  conflicts: SyncConflict[];
  offlineChanges: OfflineChange[];
  syncErrors: string[];
  autoSyncEnabled: boolean;
  syncInterval: number; // in milliseconds
}

interface SyncActions {
  setOnlineStatus: (isOnline: boolean) => void;
  setSyncing: (isSyncing: boolean) => void;
  setSyncProgress: (progress: number) => void;
  setLastSyncAt: (date: Date) => void;
  addConflict: (conflict: SyncConflict) => void;
  removeConflict: (conflictId: string) => void;
  clearConflicts: () => void;
  addOfflineChange: (change: Omit<OfflineChange, 'id' | 'timestamp' | 'retryCount'>) => void;
  removeOfflineChange: (changeId: string) => void;
  clearOfflineChanges: () => void;
  incrementRetryCount: (changeId: string) => void;
  addSyncError: (error: string) => void;
  clearSyncErrors: () => void;
  setAutoSyncEnabled: (enabled: boolean) => void;
  setSyncInterval: (interval: number) => void;
}

type SyncStore = SyncState & SyncActions;

const initialState: SyncState = {
  isOnline: navigator.onLine,
  isSyncing: false,
  lastSyncAt: null,
  syncProgress: 0,
  conflicts: [],
  offlineChanges: [],
  syncErrors: [],
  autoSyncEnabled: true,
  syncInterval: 30000, // 30 seconds
};

export const useSyncStore = create<SyncStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setOnlineStatus: (isOnline) => {
        set({ isOnline });
      },
      
      setSyncing: (isSyncing) => {
        set({ isSyncing, syncProgress: isSyncing ? 0 : 100 });
      },
      
      setSyncProgress: (progress) => {
        set({ syncProgress: Math.max(0, Math.min(100, progress)) });
      },
      
      setLastSyncAt: (date) => {
        set({ lastSyncAt: date });
      },
      
      addConflict: (conflict) => {
        const { conflicts } = get();
        set({ conflicts: [...conflicts, conflict] });
      },
      
      removeConflict: (conflictId) => {
        const { conflicts } = get();
        set({ conflicts: conflicts.filter(c => c.id !== conflictId) });
      },
      
      clearConflicts: () => {
        set({ conflicts: [] });
      },
      
      addOfflineChange: (changeData) => {
        const { offlineChanges } = get();
        const change: OfflineChange = {
          ...changeData,
          id: `${changeData.type}-${changeData.entity}-${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
          retryCount: 0,
        };
        set({ offlineChanges: [...offlineChanges, change] });
      },
      
      removeOfflineChange: (changeId) => {
        const { offlineChanges } = get();
        set({ offlineChanges: offlineChanges.filter(c => c.id !== changeId) });
      },
      
      clearOfflineChanges: () => {
        set({ offlineChanges: [] });
      },
      
      incrementRetryCount: (changeId) => {
        const { offlineChanges } = get();
        set({
          offlineChanges: offlineChanges.map(change =>
            change.id === changeId
              ? { ...change, retryCount: change.retryCount + 1 }
              : change
          ),
        });
      },
      
      addSyncError: (error) => {
        const { syncErrors } = get();
        set({ syncErrors: [...syncErrors, error].slice(-10) }); // Keep last 10 errors
      },
      
      clearSyncErrors: () => {
        set({ syncErrors: [] });
      },
      
      setAutoSyncEnabled: (enabled) => {
        set({ autoSyncEnabled: enabled });
      },
      
      setSyncInterval: (interval) => {
        set({ syncInterval: Math.max(5000, interval) }); // Minimum 5 seconds
      },
    }),
    {
      name: 'sync-storage',
      partialize: (state) => ({
        lastSyncAt: state.lastSyncAt,
        offlineChanges: state.offlineChanges,
        autoSyncEnabled: state.autoSyncEnabled,
        syncInterval: state.syncInterval,
      }),
    }
  )
);