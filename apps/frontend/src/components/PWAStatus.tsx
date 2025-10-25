import { useState, useEffect } from 'react';
import { useOffline, usePWA } from '../hooks';
import { indexedDBManager } from '../lib/indexedDB';
import { Card, CardContent } from './ui/Card';
import { Typography } from './ui/Typography';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

export const PWAStatus = () => {
  const { isOnline } = useOffline();
  const { needRefresh, offlineReady, updateApp, requestPersistentStorage, getStorageEstimate } = usePWA();
  const [storageInfo, setStorageInfo] = useState<{ quota?: number; usage?: number; persistent?: boolean }>({});
  const [dbStatus, setDbStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    // Test IndexedDB
    indexedDBManager.init()
      .then(() => setDbStatus('ready'))
      .catch(() => setDbStatus('error'));

    // Get storage info
    getStorageEstimate().then(estimate => {
      if (estimate) {
        setStorageInfo({
          quota: estimate.quota,
          usage: estimate.usage,
          persistent: false // Will be updated by persistent storage check
        });
      }
    });

    // Check if persistent storage is already granted
    if ('storage' in navigator && 'persisted' in navigator.storage) {
      navigator.storage.persisted().then(persistent => {
        setStorageInfo(prev => ({ ...prev, persistent }));
      });
    }
  }, [getStorageEstimate]);

  const handleRequestPersistentStorage = async () => {
    const granted = await requestPersistentStorage();
    setStorageInfo(prev => ({ ...prev, persistent: granted }));
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card className="max-w-md">
      <CardContent>
        <Typography variant="h4" className="mb-4">PWA Status</Typography>
        
        <div className="space-y-3">
          {/* Network Status */}
          <div className="flex items-center justify-between">
            <Typography variant="body-small">Network Status:</Typography>
            <Badge variant={isOnline ? 'success' : 'warning'}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>

          {/* Service Worker Status */}
          <div className="flex items-center justify-between">
            <Typography variant="body-small">Service Worker:</Typography>
            <Badge variant={offlineReady ? 'success' : 'info'}>
              {offlineReady ? 'Ready' : 'Loading'}
            </Badge>
          </div>

          {/* Update Status */}
          {needRefresh && (
            <div className="flex items-center justify-between">
              <Typography variant="body-small">Update Available:</Typography>
              <Button size="sm" onClick={updateApp}>
                Update Now
              </Button>
            </div>
          )}

          {/* IndexedDB Status */}
          <div className="flex items-center justify-between">
            <Typography variant="body-small">Offline Storage:</Typography>
            <Badge variant={dbStatus === 'ready' ? 'success' : dbStatus === 'error' ? 'error' : 'info'}>
              {dbStatus === 'ready' ? 'Ready' : dbStatus === 'error' ? 'Error' : 'Loading'}
            </Badge>
          </div>

          {/* Storage Info */}
          {storageInfo.usage !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Typography variant="body-small">Storage Used:</Typography>
                <Typography variant="body-small" color="secondary">
                  {formatBytes(storageInfo.usage)}
                </Typography>
              </div>
              
              {storageInfo.quota && (
                <div className="flex items-center justify-between">
                  <Typography variant="body-small">Storage Quota:</Typography>
                  <Typography variant="body-small" color="secondary">
                    {formatBytes(storageInfo.quota)}
                  </Typography>
                </div>
              )}
            </div>
          )}

          {/* Persistent Storage */}
          <div className="flex items-center justify-between">
            <Typography variant="body-small">Persistent Storage:</Typography>
            {storageInfo.persistent ? (
              <Badge variant="success">Granted</Badge>
            ) : (
              <Button size="sm" variant="outline" onClick={handleRequestPersistentStorage}>
                Request
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};