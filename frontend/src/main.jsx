import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SafeArea } from '@capacitor-community/safe-area'
import './index.css'
import App from './App.jsx'
import { logger } from './utils/logger'

// Global error handlers (silent in production)
window.onerror = function (msg, url, line, col, error) {
  logger.error('Uncaught error:', { msg, url, line, col, error });
  return false;
};
window.addEventListener('unhandledrejection', function (event) {
  logger.error('Unhandled rejection:', event.reason);
});

// Configure status bar for native platforms
if (Capacitor.isNativePlatform()) {
  // Initialize safe area plugin (handles older Android WebView < 140)
  SafeArea.enable();

  // Configure status bar with overlay
  StatusBar.setOverlaysWebView({ overlay: true });
  StatusBar.setStyle({ style: Style.Dark });
  StatusBar.setBackgroundColor({ color: '#f8fafc' });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
