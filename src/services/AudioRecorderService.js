/**
 * AudioRecorderService.js
 * 
 * Cross-platform Audio Recording Engine for Expo Go, Android, iOS, and Web.
 * Captures clean audio and converts it to Base64 for direct Gemini Multimodal AI processing.
 */
import { Platform } from 'react-native';

// Web MediaRecorder state
let _webMediaRecorder = null;
let _webAudioChunks = [];
let _webStream = null;

// Native expo-audio / expo-file-system state
let _nativeRecorder = null;

/**
 * Request audio recording permissions
 */
export const requestAudioPermission = async () => {
  if (Platform.OS === 'web') {
    try {
      if (navigator?.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop stream right away after confirming permission
        stream.getTracks().forEach((track) => track.stop());
        return true;
      }
    } catch (e) {
      console.warn('[AudioRecorder Web] Mic permission denied:', e);
      return false;
    }
    return true;
  }

  // Native permission check via expo-audio
  try {
    const { requestRecordingPermissionsAsync } = require('expo-audio');
    const { granted } = await requestRecordingPermissionsAsync();
    return granted;
  } catch (e) {
    console.warn('[AudioRecorder Native] Permission error:', e);
    return true;
  }
};

/**
 * Start recording audio
 */
export const startAudioRecording = async () => {
  if (Platform.OS === 'web') {
    return _startWebRecording();
  } else {
    return _startNativeRecording();
  }
};

/**
 * Stop recording and return Base64 audio + mimeType
 * @returns {Promise<{base64: string, mimeType: string}|null>}
 */
export const stopAudioRecording = async () => {
  if (Platform.OS === 'web') {
    return _stopWebRecording();
  } else {
    return _stopNativeRecording();
  }
};

// ─── Web Implementation ───────────────────────────────────────────────────────
const _startWebRecording = async () => {
  try {
    if (!navigator?.mediaDevices?.getUserMedia) {
      throw new Error('Web Audio Recording not supported in this browser.');
    }

    _webStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    _webAudioChunks = [];

    const options = { mimeType: 'audio/webm' };
    try {
      _webMediaRecorder = new MediaRecorder(_webStream, options);
    } catch (e) {
      _webMediaRecorder = new MediaRecorder(_webStream);
    }

    _webMediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        _webAudioChunks.push(event.data);
      }
    };

    _webMediaRecorder.start(100);
    console.log('[AudioRecorder Web] Recording started successfully');
    return true;
  } catch (e) {
    console.error('[AudioRecorder Web] Failed to start:', e);
    return false;
  }
};

const _stopWebRecording = () => {
  return new Promise((resolve) => {
    if (!_webMediaRecorder) {
      resolve(null);
      return;
    }

    _webMediaRecorder.onstop = async () => {
      try {
        const mimeType = _webMediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(_webAudioChunks, { type: mimeType });
        
        // Stop all mic tracks
        if (_webStream) {
          _webStream.getTracks().forEach((track) => track.stop());
          _webStream = null;
        }

        // Convert Blob to Base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          // Format: "data:audio/webm;base64,AAAA..."
          const base64 = typeof result === 'string' ? result.split(',')[1] : '';
          _webAudioChunks = [];
          _webMediaRecorder = null;
          resolve({ base64, mimeType: 'audio/webm' });
        };
        reader.readAsDataURL(audioBlob);
      } catch (err) {
        console.error('[AudioRecorder Web] Error reading blob:', err);
        resolve(null);
      }
    };

    try {
      _webMediaRecorder.stop();
    } catch (e) {
      resolve(null);
    }
  });
};

// ─── Native (Expo Go / Android / iOS) Implementation ──────────────────────────
const _startNativeRecording = async () => {
  // 1. Try expo-audio (SDK 52+ new architecture)
  try {
    const { AudioModule, RecordingPresets } = require('expo-audio');
    if (AudioModule?.AudioRecorder) {
      const options = RecordingPresets?.HIGH_QUALITY || {};
      _nativeRecorder = new AudioModule.AudioRecorder(options);
      await _nativeRecorder.prepareToRecordAsync();
      _nativeRecorder.record();
      console.log('[AudioRecorder Native] expo-audio recording active');
      return true;
    }
  } catch (e) {
    console.warn('[AudioRecorder Native] expo-audio start error:', e.message);
  }

  // 2. Fallback to expo-av (standard inside Expo Go)
  try {
    const { Audio } = require('expo-av');
    if (Audio?.Recording) {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      _nativeRecorder = { _isExpoAv: true, recording };
      console.log('[AudioRecorder Native] expo-av recording active');
      return true;
    }
  } catch (e) {
    console.warn('[AudioRecorder Native] expo-av fallback error:', e.message);
  }

  return false;
};

const _stopNativeRecording = async () => {
  try {
    if (!_nativeRecorder) return null;

    let uri = null;
    if (_nativeRecorder._isExpoAv) {
      const rec = _nativeRecorder.recording;
      _nativeRecorder = null;
      await rec.stopAndUnloadAsync();
      uri = rec.getURI();
    } else {
      const recorder = _nativeRecorder;
      _nativeRecorder = null;
      await recorder.stop();
      uri = recorder.uri;
    }

    if (!uri) return null;

    // Read recorded file as Base64 (Expo SDK 54/57 legacy and new API compatible)
    let base64 = null;

    // 1. Try expo-file-system/legacy (Recommended in Expo SDK 54+)
    try {
      const LegacyFS = require('expo-file-system/legacy');
      if (LegacyFS && typeof LegacyFS.readAsStringAsync === 'function') {
        const encoding = LegacyFS.EncodingType?.Base64 || 'base64';
        base64 = await LegacyFS.readAsStringAsync(uri, { encoding });
      }
    } catch (e) {}

    // 2. Try new SDK 54 File class API
    if (!base64) {
      try {
        const { File } = require('expo-file-system');
        if (File) {
          const file = new File(uri);
          if (typeof file.base64 === 'function') {
            base64 = await file.base64();
          }
        }
      } catch (e) {}
    }

    // 3. Standard fallback
    if (!base64) {
      try {
        const FileSystem = require('expo-file-system');
        const encoding = FileSystem.EncodingType?.Base64 || 'base64';
        base64 = await FileSystem.readAsStringAsync(uri, { encoding });
      } catch (e) {}
    }

    console.log('[AudioRecorder Native] Audio captured, size:', (base64 ? base64.length : 0));

    return {
      base64,
      mimeType: 'audio/m4a',
    };
  } catch (e) {
    console.error('[AudioRecorder Native] Error reading recorded file:', e);
    return null;
  }
};
