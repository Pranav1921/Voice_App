import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBackendUrl = () => {
  if (Platform.OS === 'web') return 'http://localhost:5000';

  try {
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:5000`;
      }
    }
  } catch (e) {}

  // Fallback to PC Wi-Fi LAN IP
  return 'http://192.168.31.51:5000';
};

const BACKEND_URL = getBackendUrl();

/**
 * Sends audio recording (Base64) to backend Gemini Multimodal Audio processor
 * @param {string} audioBase64 
 * @param {string} mimeType 
 * @returns {Promise<{success: boolean, result: any, tasks?: any[], history?: any[]}|null>}
 */
export const processVoiceAudioWithBackend = async (audioBase64, mimeType = 'audio/webm') => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/process-voice-audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBase64, mimeType }),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (e) {
    console.log('Backend audio endpoint failed:', e.message);
  }
  return null;
};

/**
 * Sends a voice query to the dedicated Node.js backend server
 * @param {string} query 
 * @returns {Promise<{success: boolean, result: any, tasks?: any[], history?: any[]}|null>}
 */
export const processVoiceWithBackend = async (query) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/process-voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.trim() }),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (e) {
    console.log('Backend server not connected or offline. Falling back to direct client execution.');
  }
  return null;
};

/**
 * Checks if the dedicated backend server is running and online
 */
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`, { method: 'GET' });
    if (response.ok) {
      return true;
    }
  } catch (e) {}
  return false;
};
