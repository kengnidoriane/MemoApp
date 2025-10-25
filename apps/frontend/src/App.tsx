import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QueryProvider } from './providers/QueryProvider';
import { ToastProvider } from './providers/ToastProvider';
import { SyncProvider } from './providers/SyncProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { QueryErrorBoundary } from './components/QueryErrorBoundary';
import { NetworkStatus } from './components/NetworkStatus';
import { PWAUpdateNotification } from './components/PWAUpdateNotification';
import { NotificationHandler } from './components/reminders';
import { AuthLayout, ProtectedRoute } from './components/auth';
import { SettingsPage } from './components/profile';
import { MemoPage } from './components/memos';
import { QuizPage } from './components/quiz';
import { RemindersPage } from './components/reminders';
import { AnalyticsPage } from './components/analytics';
import { Layout, Container } from './components/layout';
import { SkipLinks, LiveRegion, useKeyboardShortcuts } from './components/accessibility';
import { useAccessibility, useSkipLinks } from './hooks/useAccessibility';
import { setupNetworkMonitoring } from './lib/api';
import { syncManager } from './lib/syncManager';
import { pwaManager } from './lib/pwaManager';
import { indexedDBManager } from './lib/indexedDB';
import { useAppStore, useSyncStore, useAuthStore } from './stores';

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

const LoginPage = () => {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <AuthLayout 
      onSuccess={() => {
        // Navigation will be handled by the auth state change
      }}
    />
  );
};

const DashboardPage = () => (
  <ProtectedRoute>
    <Layout>
      <Container className="py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <MemoPage />
        </motion.div>
      </Container>
    </Layout>
  </ProtectedRoute>
);

const MemosPage = () => (
  <ProtectedRoute>
    <Layout>
      <Container className="py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <MemoPage />
        </motion.div>
      </Container>
    </Layout>
  </ProtectedRoute>
);

const QuizPageRoute = () => (
  <ProtectedRoute>
    <Layout>
      <QuizPage />
    </Layout>
  </ProtectedRoute>
);

const App = () => {
  const { setOnlineStatus } = useAppStore();
  const { setOnlineStatus: setSyncOnlineStatus } = useSyncStore();
  
  // Initialize accessibility features
  const { announceToScreenReader } = useAccessibility();
  const { KeyboardShortcutsModal, showShortcuts } = useKeyboardShortcuts();
  useSkipLinks();

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
      announceToScreenReader('Connection restored. Syncing data...');
      syncManager.syncData().catch(console.error);
    };
    
    window.addEventListener('app:back-online', handleBackOnline);
    
    // Global keyboard shortcuts
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        showShortcuts();
      }
    };
    
    document.addEventListener('keydown', handleGlobalKeyDown);
    
    return () => {
      cleanup();
      syncManager.destroy();
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
      window.removeEventListener('app:back-online', handleBackOnline);
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [setOnlineStatus, setSyncOnlineStatus]);

  return (
    <ErrorBoundary>
      <QueryProvider>
        <ToastProvider>
          <SyncProvider>
            <QueryErrorBoundary>
              <Router>
                <div className="App">
                  <SkipLinks />
                  <LiveRegion />
                  <NetworkStatus />
                  <PWAUpdateNotification />
                  <NotificationHandler />
                  <KeyboardShortcutsModal />
                  <main id="main-content" tabIndex={-1}>
                    <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<LoginPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/memos" element={<MemosPage />} />
                  <Route path="/quiz" element={<QuizPageRoute />} />
                  <Route 
                    path="/settings" 
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <SettingsPage />
                        </Layout>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/reminders" 
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Container className="py-6 sm:py-8">
                            <RemindersPage />
                          </Container>
                        </Layout>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/analytics" 
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Container className="py-6 sm:py-8">
                            <AnalyticsPage />
                          </Container>
                        </Layout>
                      </ProtectedRoute>
                    } 
                  />
                    </Routes>
                  </main>
                </div>
              </Router>
            </QueryErrorBoundary>
          </SyncProvider>
        </ToastProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
};

export default App;
