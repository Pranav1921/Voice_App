import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

let currentSpeechCallback = null;

/**
 * Cleans text for smoother, natural TTS reading (removes markdown formatting, emojis, asterisks)
 * @param {string} text 
 * @returns {string} Clean readable text
 */
export const sanitizeForSpeech = (text) => {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold markdown
    .replace(/\*(.*?)\*/g, '$1')     // Italic markdown
    .replace(/`([^`]+)`/g, '$1')     // Inline code
    .replace(/#{1,6}\s+/g, '')       // Headers
    .replace(/[•●▪-]\s+/g, '')       // Bullet points
    .replace(/[\u{1F600}-\u{1F6FF}|[\u{2600}-\u{26FF}]/gu, '') // Emojis
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Speaks any voice response aloud with full lifecycle callbacks
 * @param {string} text The text to speak
 * @param {object} options Options including callbacks: { onStart, onDone, onStopped, rate, pitch, language }
 */
export const speakResponse = (text, options = {}) => {
  const {
    onStart,
    onDone,
    onStopped,
    rate = 1.0,
    pitch = 1.0,
    language = 'en-IN',
  } = options;

  const cleanText = sanitizeForSpeech(text);
  if (!cleanText) {
    if (onDone) onDone();
    return;
  }

  try {
    // Stop any ongoing speech first
    stopSpeech();

    currentSpeechCallback = { onDone, onStopped };

    // Web fallback safety if expo-speech is unsupported
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.lang = language;

      utterance.onstart = () => {
        if (onStart) onStart();
      };
      utterance.onend = () => {
        if (onDone) onDone();
        currentSpeechCallback = null;
      };
      utterance.onerror = (e) => {
        console.warn('Web speech synthesis error:', e);
        if (onDone) onDone();
        currentSpeechCallback = null;
      };

      window.speechSynthesis.speak(utterance);
      return;
    }

    // Native expo-speech
    if (onStart) onStart();

    Speech.speak(cleanText, {
      language,
      pitch,
      rate,
      onStart: () => {
        if (onStart) onStart();
      },
      onDone: () => {
        if (onDone) onDone();
        currentSpeechCallback = null;
      },
      onStopped: () => {
        if (onStopped) onStopped();
        currentSpeechCallback = null;
      },
      onError: (err) => {
        console.warn('TTS Speech error:', err);
        if (onDone) onDone();
        currentSpeechCallback = null;
      },
    });
  } catch (error) {
    console.error('Error during TTS speech playback:', error);
    if (onDone) onDone();
    currentSpeechCallback = null;
  }
};

/**
 * Speaks a confirmation for a newly added task
 * @param {string} text The task description or response
 * @param {string} date Optional date
 * @param {string} time Optional time
 * @param {object} callbacks Optional { onStart, onDone, onStopped }
 */
export const speakConfirmation = (text, date, time, callbacks = {}) => {
  let message = text || '';
  if (date && time && !message.toLowerCase().includes('scheduled') && !message.toLowerCase().includes('reminder')) {
    message = `Added reminder: ${text} for ${date} at ${time}.`;
  }
  speakResponse(message, callbacks);
};

/**
 * Reads out the user's active tasks and reminders in a natural spoken dialogue
 * @param {Array} tasks Array of task objects
 * @param {object} callbacks Optional { onStart, onDone, onStopped }
 */
export const speakTasks = (tasks = [], callbacks = {}) => {
  if (!tasks || tasks.length === 0) {
    speakResponse("You have no tasks or reminders scheduled right now. You are all caught up!", callbacks);
    return;
  }

  const pending = tasks.filter(t => !t.completed);
  if (pending.length === 0) {
    speakResponse("All your tasks are completed! Great job!", callbacks);
    return;
  }

  const ordinals = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
  
  let speech = `You have ${pending.length} ${pending.length === 1 ? 'task' : 'tasks'} scheduled: `;
  
  pending.slice(0, 5).forEach((item, index) => {
    const ord = ordinals[index] || `Task ${index + 1}`;
    const dateStr = item.date ? ` on ${item.date}` : '';
    const timeStr = item.time && item.time !== 'Anytime' ? ` at ${item.time}` : '';
    speech += `${ord}: ${item.task}${dateStr}${timeStr}. `;
  });

  if (pending.length > 5) {
    speech += `And ${pending.length - 5} more tasks.`;
  }

  speakResponse(speech, callbacks);
};

/**
 * Stops any active speech playback immediately.
 */
export const stopSpeech = () => {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    Speech.stop();
  } catch (error) {
    console.error('Error stopping speech:', error);
  } finally {
    if (currentSpeechCallback?.onStopped) {
      currentSpeechCallback.onStopped();
    }
    currentSpeechCallback = null;
  }
};

/**
 * Checks if speech synthesis is currently active
 * @returns {Promise<boolean>}
 */
export const isSpeakingAsync = async () => {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
      return window.speechSynthesis.speaking;
    }
    return await Speech.isSpeakingAsync();
  } catch (e) {
    return false;
  }
};
