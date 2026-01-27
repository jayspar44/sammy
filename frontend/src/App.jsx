import { useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Home from './pages/Home';
import Companion from './pages/Companion';
import Insights from './pages/Insights';
import Login from './pages/Login';
import Settings from './pages/Settings';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';
import { ConnectionProvider, useConnection } from './contexts/ConnectionContext';
import { setConnectionStatusCallback } from './api/client';
import { getEnvironment } from './utils/appConfig';
import { setupKeyboardListeners } from './utils/keyboard';
import { setupBackButtonHandler, removeBackButtonHandler } from './utils/backButton';
import { setupNotificationHandlers, restoreNotifications, getSavedNotificationSettings } from './services/notificationService';
import { useUserPreferences } from './contexts/UserPreferencesContext';

function AppContent() {
  const { setApiConnectionStatus } = useConnection();
  const { setNotificationSettings } = useUserPreferences();
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location.pathname);

  // Keep ref updated with current path
  useEffect(() => {
    locationRef.current = location.pathname;
  }, [location.pathname]);

  // Set up back button handler for Android
  useEffect(() => {
    setupBackButtonHandler(() => locationRef.current);
    return () => removeBackButtonHandler();
  }, []);

  // Set dynamic page title based on environment
  useEffect(() => {
    const env = getEnvironment();
    const envSuffix = env === 'prod' ? '' : ` (${env})`;
    document.title = `Sammy${envSuffix}`;
  }, []);

  // Set up API connection status callback
  useEffect(() => {
    setConnectionStatusCallback(setApiConnectionStatus);
  }, [setApiConnectionStatus]);

  // Set up notification handlers and restore any scheduled notifications
  useEffect(() => {
    setupNotificationHandlers((context) => {
      // When notification is tapped, navigate to companion with context
      if (context === 'morning_checkin') {
        navigate('/companion', { state: { context: 'morning_checkin' } });
      }
    });

    // Restore notifications that may have been lost (app killed, device rebooted, etc.)
    restoreNotifications();

    // Sync notification settings from Capacitor Preferences to UI state
    // This ensures the UI reflects the persisted settings after app restart
    const syncNotificationStateToUI = async () => {
      const settings = await getSavedNotificationSettings();
      if (settings) {
        setNotificationSettings({
          morningReminder: {
            enabled: settings.enabled ?? false,
            time: settings.time || '08:00'
          }
        });
      }
    };
    syncNotificationStateToUI();
  }, [navigate, setNotificationSettings]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Home />} />
        <Route path="companion" element={<Companion />} />
        <Route path="insights" element={<Insights />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

function App() {
  // Setup keyboard listeners for native platforms
  useEffect(() => {
    const cleanup = setupKeyboardListeners();
    return cleanup;
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <UserPreferencesProvider>
          <ConnectionProvider>
            <AppContent />
          </ConnectionProvider>
        </UserPreferencesProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
