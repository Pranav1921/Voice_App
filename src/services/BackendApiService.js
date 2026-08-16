import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBackendUrl = () => {
  // 🚀 Production backend on Render
  return 'https://voice-app-2pv0.onrender.com';
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
