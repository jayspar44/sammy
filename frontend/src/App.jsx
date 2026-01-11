import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
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

function AppContent() {
  const { setApiConnectionStatus } = useConnection();

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
