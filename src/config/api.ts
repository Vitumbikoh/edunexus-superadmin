/**
 * Centralized API Configuration
 * 
 * All API calls should use this single source of truth.
 * Set VITE_API_BASE_URL in your .env file.
 * Example:
 * VITE_API_BASE_URL=https://api.educnexus.tech/api/v1
 */

/**
 * Get API base URL from environment variables
 */
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

  if (!envUrl) {
    // ❗ In production, we should NEVER silently fall back to localhost
    if (import.meta.env.PROD) {
      throw new Error(
        'VITE_API_BASE_URL is not defined in production environment'
      );
    }

    // Dev fallback only
    return 'http://localhost:5000/api/v1';
  }

  return envUrl;
};

/**
 * Main API base URL
 */
export const API_BASE_URL = getApiBaseUrl();

/**
 * Server base URL (without /api/v1)
 */
export const getServerBaseUrl = (): string => {
  return API_BASE_URL.replace('/api/v1', '');
};

/**
 * API Configuration object
 */
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  SERVER_URL: getServerBaseUrl(),
} as const;

export default API_BASE_URL;