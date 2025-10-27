/**
 * Whisper Service Configuration
 * Update these values after Azure deployment
 */

const WHISPER_CONFIG = {
  // Development: Local Python backend
  development: {
    baseUrl: 'http://172.25.196.40:5000',
    apiKey: null, // No auth in dev mode
    timeout: 60000, // 60 seconds
  },
  
  // Production: Azure deployment
  production: {
    baseUrl: 'https://your-service-url.azurewebsites.net', // UPDATE AFTER AZURE DEPLOYMENT
    apiKey: 'your-api-key-here', // UPDATE WITH YOUR GENERATED API KEY
    timeout: 120000, // 120 seconds (cloud may be slower)
  },
};

// Automatically select config based on __DEV__
const ENV = __DEV__ ? 'development' : 'production';
const CONFIG = WHISPER_CONFIG[ENV];

export const WHISPER_BASE_URL = CONFIG.baseUrl;
export const WHISPER_API_KEY = CONFIG.apiKey;
export const WHISPER_TIMEOUT = CONFIG.timeout;

export default CONFIG;
