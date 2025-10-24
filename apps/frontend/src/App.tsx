import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QueryProvider } from './providers/QueryProvider';
import { ToastProvider } from './providers/ToastProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { QueryErrorBoundary } from './components/QueryErrorBoundary';
import { NetworkStatus } from './components/NetworkStatus';
import { PWAUpdateNotification } from './components/PWAUpdateNotification';
import { setupNetworkMonitoring } from './lib/api';
import { syncManager } from './lib/syncManager';
import { pwaManager } from './lib/pwaManager';
import { indexedDBManager } from './lib/indexedDB';
import { useAppStore, useSyncStore } from './stores';

// Placeholder components for initial setup
const HomePage = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800"
  >
    <div className="container mx-auto px-4 py-16">
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
        >
          Welcome to MemoApp
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-gray-600 dark:text-gray-300 mb-8"
        >
          Your personal knowledge management and learning companion
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-x-4"
        >
          <button className="btn btn-primary">
            Get Started
          </button>
          <button className="btn btn-outline">
            Learn More
          </button>
        </motion.div>
      </div>
    </div>
  </motion.div>
);

const LoginPage = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"
  >
    <div className="card p-8 w-full max-w-md">
      <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>
      <p className="text-center text-gray-600 dark:text-gray-400">
        Login functionality will be implemented in the next tasks
      </p>
    </div>
  </motion.div>
);

const DashboardPage = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="min-h-screen bg-gray-50 dark:bg-gray-900"
  >
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Dashboard functionality will be implemented in the next tasks
      </p>
    </div>
  </motion.div>
);

const App = () => {
  const { setOnlineStatus } = useAppStore();
  const { setOnlineStatus: setSyncOnlineStatus } = useSyncStore();

  useEffect(() => {
    // Initialize PWA
    pwaManager.init();
    
    // Initialize IndexedDB
    indexedDBManager.init().catch(console.error);
    
    // Request persistent storage for better offline experience
    pwaManager.requestPersistentStorage().then(granted => {
      console.log('Persistent storage granted:', granted);
    });
    
    // Set up network monitoring
    const cleanup = setupNetworkMonitoring();
    
    // Initialize sync manager
    syncManager.initialize();
    
    // Sync online status between stores
    const handleOnlineStatusChange = () => {
      const isOnline = navigator.onLine;
      setOnlineStatus(isOnline);
      setSyncOnlineStatus(isOnline);
    };

    // Initial status
    handleOnlineStatusChange();

    // Listen for online/offline events
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);
    
    // Listen for back online event to trigger sync
    const handleBackOnline = () => {
      console.log('App is back online, triggering sync...');
      syncManager.syncData().catch(console.error);
    };
    
    window.addEventListener('app:back-online', handleBackOnline);
    
    return () => {
      cleanup();
      syncManager.destroy();
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
      window.removeEventListener('app:back-online', handleBackOnline);
    };
  }, [setOnlineStatus, setSyncOnlineStatus]);

  return (
    <ErrorBoundary>
      <QueryProvider>
        <ToastProvider>
          <QueryErrorBoundary>
            <Router>
              <div className="App">
                <NetworkStatus />
                <PWAUpdateNotification />
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                </Routes>
              </div>
            </Router>
          </QueryErrorBoundary>
        </ToastProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
};

export default App;
