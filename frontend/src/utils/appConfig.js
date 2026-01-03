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
 * Get formatted version string with environment
 * @returns {string} Formatted version string (e.g., "v0.1.1 (dev)")
 */
export const getVersionString = () => {
  const version = getAppVersion();
  const env = getEnvironment();
  return `v${version} (${env})`;
};
