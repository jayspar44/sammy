/* global __BUILD_TIMESTAMP__ */

/**
 * Get the app version
 * @returns {string} App version from package.json
 */
export const getAppVersion = () => {
  return typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';
};

/**
 * Detect the current environment
 * @returns {'prod' | 'dev' | 'local'} Current environment
 */
export const getEnvironment = () => {
  // Check if running in dev mode (local development)
  if (import.meta.env.DEV) {
    return 'local';
  }

  // Check API URL to determine if we're in dev or prod
  const apiUrl = import.meta.env.VITE_API_URL || '';

  // Check for local backend (localhost or Android emulator loopback)
  if (apiUrl.includes('localhost') || apiUrl.includes('10.0.2.2')) {
    return 'local';
  }

  if (apiUrl.includes('-dev')) {
    return 'dev';
  }

  if (apiUrl.includes('-prod') || apiUrl.includes('sammy-658.ue.r.appspot.com')) {
    return 'prod';
  }

  // Default to prod for production builds
  return import.meta.env.PROD ? 'prod' : 'local';
};

/**
 * Format build timestamp as yyyy-mm-dd hh:mm (24hr)
 * @returns {string} Formatted build time
 */
const formatBuildTime = () => {
  if (typeof __BUILD_TIMESTAMP__ === 'undefined') return '';
  const d = new Date(__BUILD_TIMESTAMP__);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

/**
 * Get formatted version string with environment and build time
 * @returns {string} Formatted version string (e.g., "v0.1.1 (dev) 2026-01-11 15:45")
 */
export const getVersionString = () => {
  const version = getAppVersion();
  const env = getEnvironment();
  const buildTime = formatBuildTime();
  return `v${version} (${env}) ${buildTime}`;
};
