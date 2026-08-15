/**
 * SpeechRecognitionService.js
 *
 * Expo Go-compatible speech recognition.
 *
 * Strategy:
 *  1. On Android/iOS: expo-speech-recognition (if available in dev build).
 *     Falls back to TextInput-based dictation (phone keyboard mic) in Expo Go.
 *  2. On Web: Browser SpeechRecognition API with interimResults.
 *
 * The TextInput autoFocus approach works reliably in Expo Go — when the
 * input is focused, the phone keyboard appears and the user can tap the
 * microphone on the keyboard for live dictation (Google/GBoard, iOS keyboard).
 */
import { Platform } from 'react-native';

let _isListening = false;
let _onTranscriptCallback = null;
let _onFinalCallback = null;

// Web SpeechRecognition state
let _webSR = null;

// expo-speech-recognition (only works in dev builds, not Expo Go)
let ExpoSR = null;
let _srSubscriptions = [];
try {
  ExpoSR = require('expo-speech-recognition');
  // Test if the native module actually loaded (won't in Expo Go)
  if (!ExpoSR?.ExpoSpeechRecognitionModule?.start) {
    ExpoSR = null;
  }
} catch (e) {
  ExpoSR = null;
}

const SR_AVAILABLE = !!ExpoSR;
console.log('[STT] Native SpeechRecognition available:', SR_AVAILABLE);

/**
 * Requests microphone permission.
 */
export const requestHardwareMicPermission = async () => {
  if (Platform.OS === 'web') return true;

  if (SR_AVAILABLE) {
    try {
      const { granted } = await ExpoSR.ExpoSpeechRecognitionModule.requestPermissionsAsync();
      return granted;
    } catch (e) {
      console.warn('[STT] Permission error:', e);
    }
  }

  // expo-audio fallback
  try {
    const ExpoAudio = require('expo-audio');
    if (ExpoAudio?.requestRecordingPermissionsAsync) {
      const { status } = await ExpoAudio.requestRecordingPermissionsAsync();
      return status === 'granted';
    }
  } catch (e) {}

  return true;
};

/**
 * Starts live speech recognition.
 *
 * In a dev build: uses native on-device engine (true live word streaming).
 * In Expo Go: focuses a TextInput so keyboard mic is available for dictation.
 *
 * @param {null} _unused
 * @param {(text: string) => void} onTranscript - live partial results
 * @param {(text: string) => void} onFinalResult - final completed result
 */
export const startHardwareMicrophone = async (_unused, onTranscript, onFinalResult) => {
  _onTranscriptCallback = onTranscript;
  _onFinalCallback = onFinalResult;
  _isListening = true;

  if (Platform.OS === 'web') {
    _startWebSpeech();
    return true;
  }

  if (SR_AVAILABLE) {
    return _startNativeSpeech();
  }

  // Expo Go fallback: rely on TextInput-based dictation
  // The calling component (App.js) will focus the TextInput
  // and update state via onChangeText. We just mark ourselves as active.
  console.log('[STT] Running in Expo Go mode — use keyboard mic for dictation');
  return true;
};

/**
 * Stops recognition and returns the final captured text.
 */
export const stopHardwareMicrophone = async (currentText = '') => {
  _isListening = false;
  _onTranscriptCallback = null;

  if (Platform.OS === 'web') _stopWebSpeech();

  if (SR_AVAILABLE) {
    try {
      await ExpoSR.ExpoSpeechRecognitionModule.stop();
    } catch (e) {}
    _cleanupSRSubscriptions();
  }

  return (currentText || '').trim();
};

export const isListening = () => _isListening;

// ─── Native (Dev Build) Engine ────────────────────────────────────────────────
const _startNativeSpeech = async () => {
  _cleanupSRSubscriptions();

  try {
    const sub1 = ExpoSR.ExpoSpeechRecognitionModule.addListener('result', (event) => {
      const segments = event?.results ?? [];
      const text = segments
        .map((r) => (typeof r === 'string' ? r : (r?.transcript ?? '')))
        .join(' ')
        .trim();
      const isFinal = event?.isFinal ?? false;

      if (text && _onTranscriptCallback) {
        _onTranscriptCallback(text, isFinal);
      }
      if (isFinal && text && _onFinalCallback) {
        _onFinalCallback(text);
      }
    });

    const sub2 = ExpoSR.ExpoSpeechRecognitionModule.addListener('error', (event) => {
      if (event?.error !== 'no-speech') {
        console.warn('[STT] Error:', event?.error);
      }
    });

    _srSubscriptions = [sub1, sub2];

    await ExpoSR.ExpoSpeechRecognitionModule.start({
      lang: 'en-IN',
      interimResults: true,
      continuous: false,
      maxAlternatives: 1,
    });

    console.log('[STT] ✅ Native recognition started');
    return true;
  } catch (e) {
    console.warn('[STT] Native start failed:', e);
    return false;
  }
};

const _cleanupSRSubscriptions = () => {
  _srSubscriptions.forEach((s) => { try { s.remove(); } catch (e) {} });
  _srSubscriptions = [];
};

// ─── Web SpeechRecognition ────────────────────────────────────────────────────
let _lastCapturedText = '';
let _silenceTimer = null;
let _hasSubmitted = false;

const _startWebSpeech = () => {
  const SpeechRecognition =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!SpeechRecognition) return;

  _stopWebSpeech();
  _lastCapturedText = '';
  _hasSubmitted = false;

  try {
    _webSR = new SpeechRecognition();
    const userLang = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'en-US';
    _webSR.lang = userLang;
    _webSR.interimResults = true;
    _webSR.continuous = true;
    _webSR.maxAlternatives = 1;

    const finalizeAndSubmit = () => {
      if (_silenceTimer) {
        clearTimeout(_silenceTimer);
        _silenceTimer = null;
      }
      const textToSubmit = _lastCapturedText.trim();
      if (textToSubmit && !_hasSubmitted) {
        _hasSubmitted = true;
        console.log('[STT Web] Auto-submitting speech text:', textToSubmit);
        if (_onFinalCallback) {
          _onFinalCallback(textToSubmit);
        }
        _stopWebSpeech();
      }
    };

    _webSR.onresult = (event) => {
      let interim = '', final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t;
        } else {
          interim += t;
        }
      }
      const combined = (final || interim || '').trim();
      if (combined) {
        _lastCapturedText = combined;
        if (_onTranscriptCallback) {
          _onTranscriptCallback(combined, !!final);
        }

        // Reset silence timer: automatically submit 1.2s after user stops talking
        if (_silenceTimer) clearTimeout(_silenceTimer);
        _silenceTimer = setTimeout(() => {
          console.log('[STT Web] Silence detected after speech, auto-submitting...');
          finalizeAndSubmit();
        }, 1200);
      }

      if (final && final.trim()) {
        if (_silenceTimer) clearTimeout(_silenceTimer);
        _silenceTimer = setTimeout(() => {
          finalizeAndSubmit();
        }, 600);
      }
    };

    _webSR.onspeechend = () => {
      console.log('[STT Web] Speech ended');
      if (_silenceTimer) clearTimeout(_silenceTimer);
      _silenceTimer = setTimeout(() => {
        finalizeAndSubmit();
      }, 500);
    };

    _webSR.onend = () => {
      console.log('[STT Web] Recognition service ended');
      finalizeAndSubmit();
    };

    _webSR.onerror = (e) => {
      if (e.error === 'not-allowed') {
        console.warn('[STT Web] Microphone permission denied');
      } else if (e.error !== 'no-speech') {
        console.warn('[STT Web] Recognition error:', e.error);
      }
    };

    _webSR.start();
    console.log('[STT Web] Recognition listening active with language:', userLang);
  } catch (e) {
    console.warn('[STT Web] Failed to start Web Speech:', e);
  }
};

const _stopWebSpeech = () => {
  if (_silenceTimer) {
    clearTimeout(_silenceTimer);
    _silenceTimer = null;
  }
  if (_webSR) {
    try {
      _webSR.onend = null;
      _webSR.onspeechend = null;
      _webSR.onresult = null;
      _webSR.onerror = null;
      _webSR.stop();
    } catch (e) {}
    _webSR = null;
  }
};
