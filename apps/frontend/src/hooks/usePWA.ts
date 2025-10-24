import { useState, useEffect } from 'react';
import { pwaManager, type PWAUpdateInfo } from '../lib/pwaManager';

export const usePWA = () => {
  const [pwaInfo, setPwaInfo] = useState<PWAUpdateInfo>({
    needRefresh: false,
    offlineReady: false,
    updateSW: async () => {},
  });

  useEffect(() => {
    const unsubscribe = pwaManager.subscribe(setPwaInfo);
    return unsubscribe;
  }, []);

  const updateApp = async () => {
    await pwaManager.updateApp();
  };

  const requestPersistentStorage = async () => {
    return await pwaManager.requestPersistentStorage();
  };

  const getStorageEstimate = async () => {
    return await pwaManager.getStorageEstimate();
  };

  return {
    ...pwaInfo,
    updateApp,
    requestPersistentStorage,
    getStorageEstimate,
  };
};