/**
 * Centralized API Configuration
 * 
 * This file contains the single source of truth for the API base URL.
 * All API calls throughout the application should import and use this configuration.
 * 
 * To change the backend URL, update the VITE_API_BASE_URL in your .env file:
 * VITE_API_BASE_URL=https://your-backend-url.com/api/v1
 */

/**
 * Get the API base URL from environment variables
 * Falls back to localhost development server if not set
 */
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  
  // Return environment URL if set, otherwise use localhost default
  return envUrl || 'http://localhost:5000/api/v1';
};

/**
 * The main API base URL - use this for all API calls
 * Example: `${API_BASE_URL}/students`
 */
export const API_BASE_URL = getApiBaseUrl();

/**
 * Get the base URL without the /api/v1 suffix
 * Useful for file uploads and other non-API endpoints
 */
export const getServerBaseUrl = (): string => {
  return API_BASE_URL.replace('/api/v1', '');
};

/**
 * API Configuration object for services
 */
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  SERVER_URL: getServerBaseUrl(),
} as const;

export default API_BASE_URL;
