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
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';
import { getEnvironment } from './utils/appConfig';

function App() {
  // Set dynamic page title based on environment
  useEffect(() => {
    const env = getEnvironment();
    const envSuffix = env === 'prod' ? '' : ` (${env})`;
    document.title = `Sammy${envSuffix}`;
  }, []);

  return (
    <AuthProvider>
      <UserPreferencesProvider>
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
      </UserPreferencesProvider>
    </AuthProvider>
  );
}

export default App;
