import { Platform } from 'react-native';

/**
 * Circle Proof Mobile Configuration
 *
 * For Android Emulator: Use "http://10.0.2.2:8000/api"
 * For iOS Simulator: Use "http://localhost:8000/api"
 * For Physical Device: Use "http://<YOUR_COMPUTER_IP>:8000/api" (e.g. "http://192.168.1.100:8000/api")
 * For Production: Use "https://your-api-domain.com/api"
 */

const LOCAL_IP = '10.0.2.2'; // Default Android emulator host loopback

const DEV_API_URL = Platform.select({
  android: `http://${LOCAL_IP}:8000/api`,
  ios: 'http://localhost:8000/api',
  default: 'http://localhost:8000/api',
});

export const APP_CONFIG = {
  // Toggle between __DEV__ or your custom remote server
  API_BASE_URL: __DEV__ ? DEV_API_URL : 'https://api.yourdomain.com/api',
};
