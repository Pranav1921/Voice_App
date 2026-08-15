import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  Platform,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  FlatList,
  Alert,
  BackHandler,
} from 'react-native';

import {
  startHardwareMicrophone,
  stopHardwareMicrophone,
  requestHardwareMicPermission,
} from './src/services/SpeechRecognitionService';

import {
  startAudioRecording,
  stopAudioRecording,
  requestAudioPermission,
} from './src/services/AudioRecorderService';

import { processAssistantQuery, processAssistantAudio } from './src/services/AssistantService';
import {
  executeOsAction,
  makePhoneCall,
  sendWhatsAppMessage,
  sendSms,
  openNavigation,
  launchApp,
  setSystemAlarm,
  searchYouTube,
  createCalendarEvent,
} from './src/services/DeviceControlService';

import {
  getStoredTasks,
  saveNewTask,
  toggleTaskCompleted,
  deleteStoredTask,
  clearAllTasks,
  getVoiceHistory,
  saveVoiceHistoryItem,
  clearVoiceHistory,
} from './src/services/StorageService';

import {
  scheduleTaskNotification,
  setupPersistentAssistantNotification,
  addNotificationResponseListener,
} from './src/services/NotificationService';

import { speakResponse, speakConfirmation, speakTasks, stopSpeech } from './src/services/TtsService';
import { MinimalOrb } from './src/components/MinimalOrb';
import { EqualizerBars } from './src/components/EqualizerBars';

let CameraView = null;
let CameraModule = null;
try {
  const expoCam = require('expo-camera');
  CameraView = expoCam.CameraView;
  CameraModule = expoCam.Camera;
} catch (e) {
  console.log('expo-camera not loaded');
}

const POPULAR_IDEAS = [
  { id: '1', icon: 'UX', title: 'Mobile app\ndesign', query: 'Help me design a mobile app UI/UX concept', color: '#F1F5F9', textColor: '#0F172A' },
  { id: '2', icon: 'Fi', title: 'Mobile app\ndesign', query: 'Create a finance mobile app design strategy', color: '#EDFDFD', textColor: '#0284C7' },
  { id: '3', icon: '⏰', title: 'Set Clock\nAlarm', query: 'Set an alarm for 7:00 AM tomorrow', color: '#FEF3C7', textColor: '#D97706' },
  { id: '4', icon: '💬', title: 'Send WhatsApp\nMessage', query: 'Open WhatsApp and message hi', color: '#D1FAE5', textColor: '#059669' },
  { id: '5', icon: '📅', title: 'Google Calendar\nSync', query: 'Remind me to submit project tomorrow at 4 PM', color: '#E0E7FF', textColor: '#4F46E5' },
  { id: '6', icon: '📍', title: 'Navigation\nDirections', query: 'Navigate to Airport', color: '#CFFAFE', textColor: '#0891B2' },
];

export default function App() {
  // Screen Mode: 'VOICE' (Mockup Screen 2) | 'CHAT' (Mockup Screen 1) | 'TASKS'
  const [screenMode, setScreenMode] = useState('VOICE');

  // Flashlight Hardware State
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);

  // Assistant States
  const [orbState, setOrbState] = useState('IDLE'); // 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING'
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [voiceHeadline, setVoiceHeadline] = useState('Hey, what can I do for you today?');
  const [inputText, setInputText] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');

  // Conversation History Messages for Chat View
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'init_1',
      sender: 'assistant',
      text: 'Hi there! I am your AI Voice Assistant. You can speak commands to set alarms, message on WhatsApp, search YouTube, or ask any question.',
      timestamp: 'Just now',
    },
  ]);

  // Tasks & Alarms
  const [tasks, setTasks] = useState([]);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [currentOptions, setCurrentOptions] = useState([]);

  const inputRef = useRef(null);
  const voiceInputRef = useRef(null);
  const timerRef = useRef(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    loadData();
    setupPersistentAssistantNotification();
    requestHardwareMicPermission();

    const subscription = addNotificationResponseListener(() => {
      setScreenMode('VOICE');
      setVoiceHeadline('Ready! Speak or type your command.');
    });

    return () => {
      stopSpeech();
      if (timerRef.current) clearInterval(timerRef.current);
      if (subscription && subscription.remove) subscription.remove();
    };
  }, []);

  // Recording Timer
  useEffect(() => {
    if (isRecording) {
      setRecordingTimer(0);
      timerRef.current = setInterval(() => {
        setRecordingTimer((prev) => {
          if (prev >= 11) {
            handleMicToggle();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingTimer(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording]);

  const loadData = async () => {
    try {
      const storedTasks = await getStoredTasks();
      setTasks(Array.isArray(storedTasks) ? storedTasks : []);
      const storedHistory = await getVoiceHistory();
      if (Array.isArray(storedHistory) && storedHistory.length > 0) {
        // Hydrate conversation messages from history
        const hydrated = [];
        storedHistory.slice(0, 20).reverse().forEach((item) => {
          hydrated.push({
            id: `user_${item.id}`,
            sender: 'user',
            text: item.query,
            timestamp: item.timestamp,
          });
          hydrated.push({
            id: `bot_${item.id}`,
            sender: 'assistant',
            text: item.responseText || item.spokenResponse,
            timestamp: item.timestamp,
          });
        });
        if (hydrated.length > 0) {
          setChatMessages(hydrated);
        }
      }
    } catch (e) {
      console.warn('Error loading data:', e);
    }
  };

  /**
   * Universal Mic Toggle (Audio Recording + Gemini AI Audio Engine)
   */
  const handleMicToggle = async () => {
    if (isRecording) {
      // User tapped Orb to finish speaking -> stop and process audio
      setIsRecording(false);
      setOrbState('THINKING');
      setVoiceHeadline('Processing your voice with Gemini...');
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

      // 1. Stop audio recorder and get Base64
      const capturedAudio = await stopAudioRecording();
      const liveText = (liveTranscript || inputText || '').trim();
      await stopHardwareMicrophone();

      if (capturedAudio?.base64) {
        console.log('[App] Audio recorded successfully, sending to Gemini Multimodal Audio...');
        try {
          const aiResult = await processAssistantAudio(capturedAudio.base64, capturedAudio.mimeType);
          console.log('[App] Gemini Audio Result:', aiResult);
          const queryText = aiResult?.transcribedText || liveText || 'Voice Command';
          await handleAssistantResponse(aiResult, queryText);
        } catch (e) {
          console.error('[App] Error processing audio with Gemini:', e);
          if (liveText) {
            processQuery(liveText);
          } else {
            setOrbState('IDLE');
            setVoiceHeadline('Could not understand voice. Please try again.');
          }
        }
      } else if (liveText) {
        processQuery(liveText);
      } else {
        setOrbState('IDLE');
        setVoiceHeadline('Hey, what can I do for you today?');
      }
      setLiveTranscript('');
      setInputText('');
    } else {
      // User tapped Orb to start speaking
      stopSpeech();
      const existing = (liveTranscript || inputText || '').trim();
      if (existing) {
        processQuery(existing);
        return;
      }

      await requestAudioPermission();
      await requestHardwareMicPermission();

      setIsRecording(true);
      setOrbState('LISTENING');
      setLiveTranscript('');
      setInputText('');
      setRecordingTimer(0);
      setVoiceHeadline('Listening... Tap Orb when done speaking');

      // Start audio recording
      await startAudioRecording();

      // Parallel live transcription for Web Speech API (if supported)
      startHardwareMicrophone(
        null,
        (text) => {
          setLiveTranscript(text);
          setInputText(text);
          setVoiceHeadline(`"${text}"`);
        },
        async (finalText) => {
          // If browser finalized speech automatically
          if (finalText && finalText.trim()) {
            setIsRecording(false);
            setOrbState('THINKING');
            setVoiceHeadline('Processing with Gemini...');
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
            const capturedAudio = await stopAudioRecording();
            if (capturedAudio?.base64) {
              const aiResult = await processAssistantAudio(capturedAudio.base64, capturedAudio.mimeType);
              await handleAssistantResponse(aiResult, aiResult?.transcribedText || finalText.trim());
            } else {
              processQuery(finalText.trim());
            }
          }
        }
      );
    }
  };

  /**
   * Replays voice aloud
   */
  const handleSpeakText = (textToSpeak) => {
    if (!textToSpeak) return;
    setOrbState('SPEAKING');
    speakResponse(textToSpeak, {
      onStart: () => setOrbState('SPEAKING'),
      onDone: () => setOrbState('IDLE'),
      onStopped: () => setOrbState('IDLE'),
    });
  };

  /**
   * Universal Assistant Response Handler (executes tasks, actions, TTS, and updates UI)
   */
  const handleAssistantResponse = async (response, queryText) => {
    const clean = (queryText || '').trim();
    if (!response) return;

    // Append user message to chat view
    const userMsgId = `${Date.now()}_u`;
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: clean || 'Voice Command',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setVoiceHeadline(`"${clean || response.spokenResponse}"`);

    try {
      let botDisplayText = '';
      let botSpokenText = '';

      // 1. READ TASKS INTENT
      if (response.type === 'READ_TASKS') {
        const currentTasks = await getStoredTasks();
        setTasks(currentTasks);
        const pending = Array.isArray(currentTasks) ? currentTasks.filter((t) => !t?.completed) : [];

        if (pending.length === 0) {
          botDisplayText = "You have no pending tasks or alarms right now. You are all caught up!";
        } else {
          botDisplayText = `You have ${pending.length} pending ${pending.length === 1 ? 'task' : 'tasks'}:\n` +
            pending.map((t) => `• ${t.task} (${t.date || 'Today'} at ${t.time || 'Anytime'})`).join('\n');
        }
        botSpokenText = botDisplayText;

        setVoiceHeadline(botDisplayText);
        handleSpeakText(botSpokenText);
      }
      // 2. CLEAR ALL TASKS
      else if (response.type === 'CLEAR_TASKS') {
        await clearAllTasks();
        setTasks([]);
        botDisplayText = "All your scheduled tasks and alarms have been cleared.";
        botSpokenText = botDisplayText;
        setVoiceHeadline(botDisplayText);
        handleSpeakText(botSpokenText);
      }
      // 3. MOBILE OS ACTIONS (Alarms, WhatsApp, YouTube, Calls, Maps, Flashlight)
      else if (response.type === 'OS_ACTION') {
        const actionStr = (response.action || '').toLowerCase();
        const targetStr = (response.target || '').toLowerCase();

        // Flashlight Hardware Toggle
        if (['toggle_flash', 'flash', 'flashlight', 'torch'].includes(actionStr) || ['flash', 'flashlight', 'torch'].includes(targetStr)) {
          try {
            if (CameraModule && typeof CameraModule.requestCameraPermissionsAsync === 'function') {
              const { status } = await CameraModule.requestCameraPermissionsAsync();
              if (status === 'granted') {
                setHasCameraPermission(true);
                setIsFlashlightOn((prev) => !prev);
                botDisplayText = !isFlashlightOn ? "Flashlight turned on." : "Flashlight turned off.";
              } else {
                botDisplayText = "Camera permission is required for hardware flashlight access.";
              }
            } else {
              setHasCameraPermission(true);
              setIsFlashlightOn((prev) => !prev);
              botDisplayText = !isFlashlightOn ? "Flashlight turned on." : "Flashlight turned off.";
            }
          } catch (e) {
            setHasCameraPermission(true);
            setIsFlashlightOn((prev) => !prev);
            botDisplayText = "Toggling flashlight.";
          }
        } else {
          botDisplayText = response.spokenResponse || `Executing ${response.action}...`;
        }

        botSpokenText = botDisplayText;
        setVoiceHeadline(botDisplayText);
        handleSpeakText(botSpokenText);

        // If alarm, also save to tasks list
        if (response.action === 'SET_ALARM' || response.action === 'alarm') {
          await saveNewTask({
            task: response.task || 'Voice Alarm',
            date: response.date || 'Today',
            time: response.time || '7:30 AM',
          });
          loadData();
        }

        setTimeout(async () => {
          await executeOsAction(response);
          setOrbState('IDLE');
        }, 300);
      }
      // 4. TASK / REMINDER CREATION
      else if (response.type === 'TASK') {
        const notificationId = await scheduleTaskNotification(
          response.task || clean,
          response.date || 'Today',
          response.time || 'Anytime'
        );

        const updatedTasks = await saveNewTask({
          task: response.task || clean,
          date: response.date || 'Today',
          time: response.time || 'Anytime',
          notificationId,
        });
        setTasks(updatedTasks);

        botDisplayText = response.spokenResponse || `Added reminder: ${response.task || clean} for ${response.date || 'Today'} at ${response.time || 'Anytime'}.`;
        botSpokenText = botDisplayText;
        setVoiceHeadline(botDisplayText);
        handleSpeakText(botSpokenText);

        const isAlarmQuery =
          clean.toLowerCase().includes('alarm') ||
          (response.task || '').toLowerCase().includes('alarm') ||
          (response.action || '').toLowerCase().includes('alarm');

        if (isAlarmQuery) {
          setTimeout(async () => {
            await setSystemAlarm(response.time || response.task || clean, response.task || 'Voice Alarm');
          }, 600);
        } else {
          setTimeout(async () => {
            await createCalendarEvent(response.task || clean, response.date || 'Today', response.time || 'Anytime');
          }, 1200);
        }
      }
      // 5. CONVERSATIONAL Q&A
      else {
        botDisplayText = response.displayText || response.spokenResponse || "Here's what I found.";
        botSpokenText = response.spokenResponse || botDisplayText;
        setVoiceHeadline(botDisplayText);
        handleSpeakText(botSpokenText);
      }

      let structuredData = null;
      if (response.type === 'TASK') {
        structuredData = {
          type: 'TASK',
          task: response.task || clean,
          date: response.date || 'Today',
          time: response.time || 'Anytime',
          status: 'Saved to Local Storage',
        };
      } else if (response.type === 'OS_ACTION') {
        structuredData = {
          type: 'OS_ACTION',
          action: response.action,
          target: response.target || response.phoneNumber || 'System',
          payload: response.payload || response.message || '',
          status: 'Device Intent Triggered',
        };
      }

      // Update active conversational options for quick selection
      if (response.options && Array.isArray(response.options)) {
        setCurrentOptions(response.options);
      } else {
        setCurrentOptions([]);
      }

      // Append bot response to chat
      const botMsgId = `${Date.now()}_b`;
      setChatMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          sender: 'assistant',
          text: botDisplayText,
          structuredData,
          options: response.options || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      await saveVoiceHistoryItem({
        query: clean,
        responseText: botDisplayText,
        spokenResponse: botSpokenText,
        type: response.type,
      });

      loadData();
    } catch (err) {
      console.error('Error handling assistant response:', err);
      const errMsg = "I couldn't process that. Please try saying it again.";
      setVoiceHeadline(errMsg);
      handleSpeakText(errMsg);
    }
  };

  /**
   * Main Query Processor for Text Input
   */
  const processQuery = async (queryText) => {
    const clean = (queryText || '').trim();
    if (!clean) return;

    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    try { await stopHardwareMicrophone(); } catch (e) {}
    try { await stopAudioRecording(); } catch (e) {}
    setLiveTranscript('');
    setInputText('');
    setRecordingTimer(0);

    setOrbState('THINKING');
    setVoiceHeadline(`"${clean}"`);

    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🎙️ [TEXT/VOICE COMMAND]: "${clean}"`);
      const response = await processAssistantQuery(clean);
      console.log(`🤖 [AI RESULT]:`, response);
      await handleAssistantResponse(response, clean);
    } catch (err) {
      console.error('Error processing query:', err);
      const errMsg = "I couldn't process that. Please try saying it again.";
      setVoiceHeadline(errMsg);
      handleSpeakText(errMsg);
    }
  };

  // Task Actions
  const handleToggleTask = async (taskId) => {
    const updated = await toggleTaskCompleted(taskId);
    setTasks(updated);
  };

  const handleDeleteTask = async (taskId) => {
    const updated = await deleteStoredTask(taskId);
    setTasks(updated);
  };

  const handleAddNewTask = async () => {
    const text = newTaskInput.trim();
    if (!text) return;
    const updated = await saveNewTask({
      task: text,
      date: 'Today',
      time: 'Anytime',
    });
    setTasks(updated);
    setNewTaskInput('');
    speakResponse(`Added task: ${text}`);
  };

  const safeTasks = Array.isArray(tasks) ? tasks : [];

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header with Back Button and Tasks Agenda Option */}
        <View style={styles.headerMockupBar}>
          {screenMode !== 'VOICE' ? (
            <TouchableOpacity
              style={styles.headerMockupBtn}
              onPress={() => setScreenMode('VOICE')}
              activeOpacity={0.8}
            >
              <Text style={styles.headerMockupBtnText}>←</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerMockupBtnPlaceholder} />
          )}

          <Text style={styles.headerMockupTitle}>
            {screenMode === 'VOICE' ? 'Voice' : screenMode === 'CHAT' ? 'Chat' : 'Agenda'}
          </Text>

          {screenMode !== 'TASKS' ? (
            <TouchableOpacity
              style={styles.headerMockupBtn}
              onPress={() => setScreenMode('TASKS')}
              activeOpacity={0.8}
            >
              <Text style={styles.headerMockupBtnText}>📋</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerMockupBtnPlaceholder} />
          )}
        </View>

        {/* ========================================================== */}
        {/* SCREEN MODE 1: CHAT INTERFACE (Left Mockup Reference) */}
        {/* ========================================================== */}
        {screenMode === 'CHAT' && (
          <View style={styles.chatScreen}>

            {/* Main Chat Scroll Container */}
            <ScrollView
              ref={flatListRef}
              style={styles.chatScroll}
              contentContainerStyle={styles.chatScrollContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            >
              {/* Welcoming Hero Header */}
              <View style={styles.greetingHeader}>
                <Text style={styles.greetingTitle}>Hi, Alex!</Text>
                <Text style={styles.greetingQuestion}>How can I help you?</Text>
                <Text style={styles.greetingSubtitle}>Your smart assistant is ready</Text>
              </View>

              {/* Chat Message Stream */}
              <View style={styles.messageListContainer}>
                {chatMessages.map((msg) => (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageRow,
                      msg.sender === 'user' ? styles.messageRowUser : styles.messageRowAssistant,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        msg.sender === 'user' ? styles.bubbleUser : styles.bubbleAssistant,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          msg.sender === 'user' ? styles.messageTextUser : styles.messageTextAssistant,
                        ]}
                      >
                        {msg.text}
                      </Text>

                      {/* Structured AI Extraction Card */}
                      {msg.structuredData && (
                        <View style={styles.structuredExtractionCard}>
                          <View style={styles.structuredHeaderRow}>
                            <Text style={styles.structuredBadge}>
                              {msg.structuredData.type === 'TASK' ? '📋 EXTRACTED TASK' : '⚡ EXTRACTED ACTION'}
                            </Text>
                            <Text style={styles.structuredStatusBadge}>
                              {msg.structuredData.status}
                            </Text>
                          </View>

                          {msg.structuredData.task && (
                            <Text style={styles.extractedTaskTitle}>
                              📌 {msg.structuredData.task}
                            </Text>
                          )}

                          <View style={styles.extractedPillsRow}>
                            {msg.structuredData.date && (
                              <View style={styles.extractedPill}>
                                <Text style={styles.extractedPillText}>📅 {msg.structuredData.date}</Text>
                              </View>
                            )}
                            {msg.structuredData.time && (
                              <View style={styles.extractedPill}>
                                <Text style={styles.extractedPillText}>⏰ {msg.structuredData.time}</Text>
                              </View>
                            )}
                            {msg.structuredData.target && (
                              <View style={styles.extractedPill}>
                                <Text style={styles.extractedPillText}>🎯 {msg.structuredData.target}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}

                      {/* Interactive Selection Options for Conversational Choices */}
                      {msg.options && msg.options.length > 0 && (
                        <View style={styles.msgOptionsContainer}>
                          <Text style={styles.msgOptionsTitle}>Select an option to open:</Text>
                          <View style={styles.msgOptionsGrid}>
                            {msg.options.map((opt, idx) => (
                              <TouchableOpacity
                                key={idx}
                                style={styles.msgOptionChip}
                                onPress={() => {
                                  if (opt.action === 'open_app' || opt.action === 'OPEN_APP') {
                                    speakResponse(`Opening ${opt.label}`);
                                    executeOsAction({ action: 'OPEN_APP', target: opt.target });
                                  } else {
                                    processQuery(opt.label);
                                  }
                                }}
                                activeOpacity={0.8}
                              >
                                <Text style={styles.msgOptionChipText}>
                                  {opt.icon || '🚀'} {opt.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      )}

                      {msg.sender === 'assistant' && (
                        <TouchableOpacity
                          style={styles.inlineSpeakButton}
                          onPress={() => handleSpeakText(msg.text)}
                        >
                          <Text style={styles.inlineSpeakText}>🔊 Listen</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>

            </ScrollView>

            {/* Bottom Minimal Input Bar (Matching Mockup) */}
            <View style={styles.bottomChatInputBar}>
              <TouchableOpacity
                style={styles.plusButton}
                onPress={() => setScreenMode('VOICE')}
                activeOpacity={0.8}
              >
                <Text style={styles.plusButtonText}>+</Text>
              </TouchableOpacity>

              <TextInput
                ref={inputRef}
                style={styles.chatTextInput}
                placeholder="Write here ..."
                placeholderTextColor="#94A3B8"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => processQuery(inputText)}
                returnKeyType="send"
              />

              <TouchableOpacity
                style={styles.sendBlackButton}
                onPress={() => {
                  if (inputText.trim()) {
                    processQuery(inputText);
                  } else {
                    handleMicToggle();
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.sendBlackButtonText}>
                  {inputText.trim() ? '➔' : '✈'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ========================================================== */}
        {/* SCREEN MODE 2: VOICE ORB INTERFACE (Right Mockup Reference) */}
        {/* ========================================================== */}
        {screenMode === 'VOICE' && (
          <View style={styles.voiceScreenMockup}>
            {/* Center Luminous 3D Holographic Orb & Speech Headline */}
            <View style={styles.voiceCenterContainerMockup}>
              <MinimalOrb
                state={orbState}
                onPress={() => {
                  if (orbState === 'SPEAKING') {
                    stopSpeech();
                    setOrbState('IDLE');
                  } else {
                    handleMicToggle();
                  }
                }}
              />

              {/* Status Pill Badge */}
              <View style={styles.assistantBadgeMockup}>
                <Text style={styles.assistantBadgeTextMockup}>✨ Your Assistant</Text>
              </View>

              {/* Large Clean Dynamic Headline Display */}
              <View style={styles.headlineContainerMockup}>
                <Text style={styles.voiceHeadlineMockup}>
                  {isRecording
                    ? (inputText || liveTranscript)
                      ? `"${inputText || liveTranscript}"`
                      : 'Listening...'
                    : voiceHeadline}
                </Text>
              </View>
            </View>

            {/* Bottom Floating Voice Bar with Chat, Tasks, Mic, and Exit */}
            <View style={styles.voiceBottomBarMockup}>
              {/* Left Chat Button */}
              <TouchableOpacity
                style={styles.voiceSecondaryButtonMockup}
                onPress={() => setScreenMode('CHAT')}
                activeOpacity={0.8}
              >
                <Text style={styles.voiceSecondaryIconMockup}>💬</Text>
              </TouchableOpacity>

              {/* Tasks Agenda Button */}
              <TouchableOpacity
                style={styles.voiceSecondaryButtonMockup}
                onPress={() => setScreenMode('TASKS')}
                activeOpacity={0.8}
              >
                <Text style={styles.voiceSecondaryIconMockup}>📋</Text>
              </TouchableOpacity>

              {/* Center Large Black Microphone Button */}
              <TouchableOpacity
                style={[
                  styles.voiceMainMicButtonMockup,
                  isRecording && styles.voiceMainMicButtonRecordingMockup,
                ]}
                onPress={handleMicToggle}
                activeOpacity={0.85}
              >
                <Text style={styles.voiceMainMicIconMockup}>
                  {isRecording ? '⏹' : '🎙️'}
                </Text>
              </TouchableOpacity>

              {/* Right Exit / Close App Button */}
              <TouchableOpacity
                style={styles.voiceSecondaryButtonMockup}
                onPress={() => {
                  stopSpeech();
                  if (Platform.OS === 'android') {
                    BackHandler.exitApp();
                  } else {
                    setOrbState('IDLE');
                    setVoiceHeadline('Hey, what can I do for you today?');
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.voiceSecondaryIconMockup}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ========================================================== */}
        {/* SCREEN MODE 3: ALARMS & TASKS AGENDA VIEW */}
        {/* ========================================================== */}
        {screenMode === 'TASKS' && (
          <View style={styles.tasksScreen}>

            <View style={styles.tasksTopActionRow}>
              <TouchableOpacity
                style={styles.readAgendaButton}
                onPress={() => speakTasks(tasks)}
                activeOpacity={0.85}
              >
                <Text style={styles.readAgendaText}>🔊 Read Agenda Aloud</Text>
              </TouchableOpacity>

              {safeTasks.length > 0 && (
                <TouchableOpacity
                  style={styles.clearAllBtn}
                  onPress={() => {
                    Alert.alert('Clear All', 'Delete all tasks and alarms?', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Clear All',
                        style: 'destructive',
                        onPress: async () => {
                          await clearAllTasks();
                          setTasks([]);
                          speakResponse('All alarms and tasks cleared.');
                        },
                      },
                    ]);
                  }}
                >
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Quick Add Bar */}
            <View style={styles.taskInputBar}>
              <TextInput
                style={styles.taskTextInput}
                placeholder="Type new alarm or task..."
                placeholderTextColor="#94A3B8"
                value={newTaskInput}
                onChangeText={setNewTaskInput}
                onSubmitEditing={handleAddNewTask}
              />
              <TouchableOpacity style={styles.taskAddBtn} onPress={handleAddNewTask}>
                <Text style={styles.taskAddBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Tasks List */}
            {safeTasks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>⏰</Text>
                <Text style={styles.emptyTitle}>No alarms or tasks</Text>
                <Text style={styles.emptySubtitle}>
                  Say "Set alarm for 7:30 AM" or "Remind me to drink water"
                </Text>
              </View>
            ) : (
              <FlatList
                data={safeTasks}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 16 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={[styles.taskItemCard, item.completed && styles.taskItemCardDone]}>
                    <TouchableOpacity
                      style={[styles.taskCheckCircle, item.completed && styles.taskCheckCircleDone]}
                      onPress={() => handleToggleTask(item.id)}
                    >
                      {item.completed && <Text style={styles.checkMark}>✓</Text>}
                    </TouchableOpacity>

                    <View style={styles.taskItemDetails}>
                      <Text style={[styles.taskItemTitle, item.completed && styles.taskItemTitleDone]}>
                        {item.task}
                      </Text>
                      <Text style={styles.taskItemMeta}>
                        ⏰ {item.time || 'Anytime'} • 📅 {item.date || 'Today'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.calSyncBtn}
                      onPress={() => createCalendarEvent(item.task, item.date, item.time)}
                    >
                      <Text style={styles.calSyncText}>📅 Sync</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.taskDeleteBtn}
                      onPress={() => handleDeleteTask(item.id)}
                    >
                      <Text style={styles.taskDeleteText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        )}

        {hasCameraPermission && CameraView && (
          <CameraView
            style={{ width: 1, height: 1, opacity: 0.01, position: 'absolute', bottom: 0, right: 0 }}
            enableTorch={isFlashlightOn}
            facing="back"
          />
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Top Header Matching Mockup Reference
  headerMockupBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  headerMockupBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerMockupBtnText: {
    fontSize: 18,
    color: '#0F172A',
    fontWeight: '700',
  },
  headerMockupBtnPlaceholder: {
    width: 40,
    height: 40,
  },
  headerMockupTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },

  // Top Nav Bar
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  circularNavButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  navIconText: {
    fontSize: 18,
    color: '#0F172A',
    fontWeight: '700',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.2,
  },

  // Floating Top Segmented Tab Bar
  topTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#0F172A',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // -------------------------------------------------------------
  // CHAT SCREEN STYLES (Screen 1 Mockup)
  // -------------------------------------------------------------
  chatScreen: {
    flex: 1,
    justifyContent: 'space-between',
  },
  chatScroll: {
    flex: 1,
  },
  chatScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  greetingHeader: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  greetingQuestion: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },

  // Message Bubbles
  messageListContainer: {
    marginBottom: 20,
  },
  messageRow: {
    marginVertical: 6,
    flexDirection: 'row',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  bubbleUser: {
    backgroundColor: '#0F172A',
    borderBottomRightRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  bubbleAssistant: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextUser: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  messageTextAssistant: {
    color: '#1E293B',
    fontWeight: '500',
  },
  inlineSpeakButton: {
    marginTop: 8,
    paddingVertical: 3,
  },
  inlineSpeakText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },

  // Popular Ideas Cards
  popularSection: {
    marginTop: 10,
  },
  popularHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  popularTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  popularCardsRow: {
    gap: 12,
    paddingRight: 20,
  },
  popularCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    justifyContent: 'space-between',
    height: 125,
  },
  ideaTagBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ideaTagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  ideaCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 18,
  },

  // Bottom Input Bar
  bottomChatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    paddingTop: 8,
    backgroundColor: '#F8FAFC',
  },
  plusButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  plusButtonText: {
    fontSize: 18,
    color: '#0F172A',
    fontWeight: '700',
  },
  chatTextInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 18,
    fontSize: 14,
    color: '#0F172A',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sendBlackButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  sendBlackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  // -------------------------------------------------------------
  // VOICE SCREEN STYLES (Screen 2 Mockup 1:1)
  // -------------------------------------------------------------
  voiceScreenMockup: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 36 : 28,
  },
  voiceCenterContainerMockup: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    flex: 1,
  },
  assistantBadgeMockup: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  assistantBadgeTextMockup: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  headlineContainerMockup: {
    width: '100%',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceHeadlineMockup: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.4,
  },
  voiceBottomBarMockup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 28,
    paddingBottom: 10,
  },
  voiceSecondaryButtonMockup: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceSecondaryIconMockup: {
    fontSize: 20,
    color: '#0F172A',
  },
  voiceMainMicButtonMockup: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  voiceMainMicButtonRecordingMockup: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  voiceMainMicIconMockup: {
    fontSize: 28,
    color: '#FFFFFF',
  },

  // -------------------------------------------------------------
  // TASKS SCREEN STYLES
  // -------------------------------------------------------------
  tasksScreen: {
    flex: 1,
  },
  tasksTopActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  readAgendaButton: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  readAgendaText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  clearAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  clearAllText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  taskInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  taskTextInput: {
    flex: 1,
    height: 46,
    fontSize: 13,
    color: '#0F172A',
  },
  taskAddBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskAddBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  taskItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  taskItemCardDone: {
    opacity: 0.6,
  },
  taskCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskCheckCircleDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  taskItemDetails: {
    flex: 1,
  },
  taskItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  taskItemTitleDone: {
    textDecorationLine: 'line-through',
    color: '#64748B',
  },
  taskItemMeta: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  taskDeleteBtn: {
    padding: 6,
  },
  taskDeleteText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Active Voice Dictation Bar
  voiceActiveDictationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    width: '100%',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  voiceActiveInput: {
    flex: 1,
    height: 46,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  voiceSendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceSendBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  // Structured AI Extraction Card Styles
  structuredExtractionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  structuredHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  structuredBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  structuredStatusBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  extractedTaskTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  extractedPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  extractedPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  extractedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },

  // Live Speech Stream HUD Styles
  liveStreamHUD: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginTop: 14,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  liveStreamHUDActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#F8FAFC',
    shadowColor: '#38BDF8',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  liveStreamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#94A3B8',
    marginRight: 6,
  },
  liveRedDotActive: {
    backgroundColor: '#EF4444',
  },
  liveStreamLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0284C7',
    letterSpacing: 0.8,
    flex: 1,
  },
  liveTimerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  liveStreamingSpeechText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 26,
    minHeight: 52,
    textAlign: 'center',
  },
  blinkingCursor: {
    color: '#0284C7',
    fontWeight: '900',
    fontSize: 18,
  },
  equalizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
    height: 18,
  },
  eqBar: {
    width: 4,
    backgroundColor: '#38BDF8',
    borderRadius: 2,
  },
  eqBar1: { height: 14 },
  eqBar2: { height: 18 },
  eqBar3: { height: 10 },
  eqBar4: { height: 16 },
  eqBar5: { height: 12 },
  hudSendButton: {
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudSendButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  hiddenVoiceInput: {
    position: 'absolute',
    opacity: 0.01,
    width: 1,
    height: 1,
  },

  // Conversational Option Selection Chips
  msgOptionsContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  msgOptionsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 6,
  },
  msgOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  msgOptionChip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  msgOptionChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  voiceOptionsContainer: {
    width: '100%',
    marginTop: 12,
  },
  voiceOptionsLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 6,
    textAlign: 'center',
  },
  voiceOptionsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  voiceOptionPill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  voiceOptionPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  calSyncBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 6,
  },
  calSyncText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '700',
  },
  popularCardMockup: {
    width: 135,
    height: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(241, 245, 249, 0.8)',
  },
  popularCardIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  popularCardIconText: {
    fontSize: 18,
    fontWeight: '800',
  },
  popularCardTitleMockup: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 18,
  },
});
