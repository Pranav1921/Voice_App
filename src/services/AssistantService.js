import { ASSISTANT_SYSTEM_PROMPT } from '../constants/Prompts';
import { processVoiceWithBackend, processVoiceAudioWithBackend } from './BackendApiService';
import { APP_CATEGORIES } from './DeviceControlService';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const MODEL_CANDIDATES = [
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash',
  'gemini-3.7-flash',
];

/**
 * Clean and parse raw JSON text response safely
 */
const parseJsonSafely = (rawText) => {
  if (!rawText) return null;
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  cleaned = cleaned.trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) cleaned = match[0];

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    return null;
  }
};

/**
 * Local offline rule parser for instant offline execution & conversational categories
 */
const processLocally = (text) => {
  const clean = (text || '').trim();
  if (!clean) {
    return {
      type: 'CONVERSATION',
      displayText: "I didn't catch that. Please tap the microphone and speak your query.",
      spokenResponse: "I didn't catch that. Please tap the microphone and speak.",
    };
  }

  const lower = clean.toLowerCase();

  // 0. Categorical App Discovery (Hotels, Social Media, Food, Shopping, Travel, Mobile Tools)
  if (lower.includes('hotel') || lower.includes('hotels') || lower.includes('stay') || lower.includes('room booking')) {
    const cat = APP_CATEGORIES.hotel;
    return {
      type: 'CONVERSATION',
      displayText: '🏨 Hotel Booking Apps Available:\n' + cat.apps.map((a) => `• ${a.name} (${a.tag})`).join('\n') + '\n\nTap any app below or say its name to open it:',
      spokenResponse: cat.spokenIntro,
      options: cat.apps.map((a) => ({ label: a.name, icon: a.icon, action: a.action, target: a.target })),
    };
  }

  if (lower.includes('social media') || lower.includes('social app') || lower.includes('socials') || (lower.includes('what') && lower.includes('social'))) {
    const cat = APP_CATEGORIES.social;
    return {
      type: 'CONVERSATION',
      displayText: '📱 Social Media Apps Available:\n' + cat.apps.map((a) => `• ${a.name} (${a.tag})`).join('\n') + '\n\nWhich one would you like to open?',
      spokenResponse: cat.spokenIntro,
      options: cat.apps.map((a) => ({ label: a.name, icon: a.icon, action: a.action, target: a.target })),
    };
  }

  if (lower.includes('food app') || lower.includes('order food') || lower.includes('grocery app') || lower.includes('groceries')) {
    const cat = APP_CATEGORIES.food;
    return {
      type: 'CONVERSATION',
      displayText: '🍕 Food & Grocery Delivery Apps:\n' + cat.apps.map((a) => `• ${a.name} (${a.tag})`).join('\n') + '\n\nWhich one would you like to use?',
      spokenResponse: cat.spokenIntro,
      options: cat.apps.map((a) => ({ label: a.name, icon: a.icon, action: a.action, target: a.target })),
    };
  }

  if (lower.includes('shopping app') || lower.includes('e-commerce') || (lower.includes('what') && lower.includes('shopping'))) {
    const cat = APP_CATEGORIES.shopping;
    return {
      type: 'CONVERSATION',
      displayText: '🛍️ Shopping Apps Available:\n' + cat.apps.map((a) => `• ${a.name} (${a.tag})`).join('\n') + '\n\nWhich store would you like to open?',
      spokenResponse: cat.spokenIntro,
      options: cat.apps.map((a) => ({ label: a.name, icon: a.icon, action: a.action, target: a.target })),
    };
  }

  if (lower.includes('cab app') || lower.includes('taxi app') || lower.includes('ride app') || (lower.includes('what') && lower.includes('travel'))) {
    const cat = APP_CATEGORIES.travel;
    return {
      type: 'CONVERSATION',
      displayText: '🚗 Cab & Travel Apps:\n' + cat.apps.map((a) => `• ${a.name} (${a.tag})`).join('\n') + '\n\nWhich one shall I launch?',
      spokenResponse: cat.spokenIntro,
      options: cat.apps.map((a) => ({ label: a.name, icon: a.icon, action: a.action, target: a.target })),
    };
  }

  // System & Mobile Hardware shortcuts
  if (lower.includes('setting') || lower.includes('settings')) {
    return {
      type: 'OS_ACTION',
      action: 'OPEN_APP',
      target: 'settings',
      spokenResponse: 'Opening device settings...',
    };
  }

  if (lower.includes('camera') || lower.includes('take photo') || lower.includes('take a picture')) {
    return {
      type: 'OS_ACTION',
      action: 'OPEN_APP',
      target: 'camera',
      spokenResponse: 'Opening Camera...',
    };
  }

  if (lower.includes('contact') || lower.includes('contacts') || lower.includes('phonebook')) {
    return {
      type: 'OS_ACTION',
      action: 'OPEN_APP',
      target: 'contacts',
      spokenResponse: 'Opening Contacts address book...',
    };
  }

  if (lower.includes('notes') || lower.includes('note app') || lower.includes('take a note') || lower.includes('keep')) {
    return {
      type: 'OS_ACTION',
      action: 'OPEN_APP',
      target: 'notes',
      spokenResponse: 'Opening Notes app...',
    };
  }

  // 1. Read / View Active Tasks
  if (
    lower.includes('read my task') ||
    lower.includes('read task') ||
    lower.includes('what are my task') ||
    lower.includes('what are my reminder') ||
    lower.includes('show my task') ||
    lower.includes('list my task') ||
    lower.includes('show task') ||
    lower.includes('my task') ||
    lower.includes('my reminder') ||
    lower === 'tasks' ||
    lower === 'reminders'
  ) {
    return {
      type: 'READ_TASKS',
      spokenResponse: 'Here are your scheduled tasks.',
    };
  }

  // 2. Clear All Tasks
  if (
    lower.includes('clear all task') ||
    lower.includes('delete all task') ||
    lower.includes('clear task') ||
    lower.includes('clear all reminder') ||
    lower.includes('delete all reminder')
  ) {
    return {
      type: 'CLEAR_TASKS',
      spokenResponse: 'Clearing all your tasks.',
    };
  }

  // 3. Indian Emergency Numbers
  if (lower === '112' || lower === 'call 112' || lower.includes('emergency')) {
    return {
      type: 'OS_ACTION',
      action: 'CALL',
      target: '112',
      spokenResponse: 'Connecting to National Emergency 112...',
    };
  }

  if (lower === '100' || lower === 'call 100' || lower.includes('police')) {
    return {
      type: 'OS_ACTION',
      action: 'CALL',
      target: '100',
      spokenResponse: 'Connecting to Police 100...',
    };
  }

  if (lower === '108' || lower === 'call 108' || lower.includes('ambulance')) {
    return {
      type: 'OS_ACTION',
      action: 'CALL',
      target: '108',
      spokenResponse: 'Calling Ambulance 108...',
    };
  }

  if (lower === '101' || lower === 'call 101' || lower.includes('fire')) {
    return {
      type: 'OS_ACTION',
      action: 'CALL',
      target: '101',
      spokenResponse: 'Calling Fire Brigade 101...',
    };
  }

  if (lower === '1930' || lower.includes('cyber crime')) {
    return {
      type: 'OS_ACTION',
      action: 'CALL',
      target: '1930',
      spokenResponse: 'Calling Cyber Crime Helpline 1930...',
    };
  }

  if (lower === '1091' || lower.includes('women safety') || lower.includes('women helpline')) {
    return {
      type: 'OS_ACTION',
      action: 'CALL',
      target: '1091',
      spokenResponse: 'Connecting to Women Helpline 1091...',
    };
  }

  // 4. Direct Phone Call Intent
  const callMatch = lower.match(/^(?:call|dial)\s+([0-9+*#\s]+|[a-zA-Z\s]+)/i);
  if (callMatch) {
    const target = callMatch[1].trim();
    return {
      type: 'OS_ACTION',
      action: 'CALL',
      target,
      spokenResponse: `Calling ${target}...`,
    };
  }

  // 5. YouTube Search & Play Intent (e.g. "open YouTube and search Triggered Insaan", "search Triggered Insaan on youtube")
  if (
    (lower.includes('youtube') || lower.includes('you tube')) &&
    (lower.includes('search') || lower.includes('play') || lower.includes('find') || lower.includes('watch') || lower.includes('video') || lower.includes('song'))
  ) {
    let ytQuery = clean
      .replace(/^(?:hey\s+|hi\s+|please\s+)?(?:open\s+youtube\s+(?:and\s+)?(?:search\s+(?:for\s+)?|play\s+|find\s+|watch\s+)?|search\s+(?:for\s+)?|play\s+|watch\s+)/i, '')
      .replace(/(?:on\s+youtube|in\s+youtube)/ig, '')
      .replace(/^youtube\s+/i, '')
      .trim();

    if (!ytQuery || ytQuery.toLowerCase() === 'youtube') {
      ytQuery = 'Trending';
    }

    return {
      type: 'OS_ACTION',
      action: 'YOUTUBE_SEARCH',
      target: ytQuery,
      payload: ytQuery,
      spokenResponse: `Searching YouTube for "${ytQuery}"...`,
    };
  }

  // 6. WhatsApp Intent (e.g. "Open WhatsApp and text Shrutha hi", "text mom on whatsapp hello")
  if (
    lower.includes('whatsapp') ||
    lower.includes('whtaaspp') ||
    lower.includes('whatsap') ||
    lower.includes('whats app')
  ) {
    let target = '';
    let msg = clean;

    const contactMatch = clean.match(/(?:text|message|to)\s+([a-zA-Z0-9+]+)/i);
    if (contactMatch && !['whatsapp', 'whtaaspp', 'whatsap', 'a', 'the', 'my', 'and'].includes(contactMatch[1].toLowerCase())) {
      target = contactMatch[1].trim();
    }

    msg = msg
      .replace(/^(?:hey\s+|hi\s+|please\s+)?(?:open\s+whatsapp\s+(?:and\s+)?|send\s+whatsapp\s+(?:message\s+)?|message\s+on\s+whatsapp\s+|text\s+on\s+whatsapp\s+|whatsapp\s+)/i, '')
      .replace(/^(?:to\s+|text\s+|message\s+)?([a-zA-Z0-9+]+\s+)?(?:saying\s+|that\s+|like\s+|:\s*)?/i, '')
      .replace(/(?:on\s+whatsapp|in\s+whatsapp|via\s+whatsapp)/ig, '')
      .trim();

    if (!msg || msg.toLowerCase() === 'whatsapp') {
      msg = 'Hi!';
    }

    const spokenResponse = target
      ? `Opening WhatsApp to text ${target}...`
      : `Opening WhatsApp with your message...`;

    return {
      type: 'OS_ACTION',
      action: 'WHATSAPP',
      target,
      payload: msg,
      spokenResponse,
    };
  }

  // 7. SMS Intent (e.g. "send text hello how are you")
  if (lower.startsWith('sms') || lower.startsWith('text') || lower.includes('send sms') || lower.startsWith('send text')) {
    const msg = clean
      .replace(/^(?:hey\s+|hi\s+|please\s+)?(?:send\s+)?(?:sms|text|message)\s+(?:to\s+[a-zA-Z0-9+]+\s+)?(?:saying\s+|that\s+|:\s*)?/i, '')
      .trim();
    return {
      type: 'OS_ACTION',
      action: 'SMS',
      target: '',
      payload: msg || 'Hello!',
      spokenResponse: 'Opening SMS...',
    };
  }

  // 8. Notes & To-Do List in Notes App (e.g. "Add to notes buy groceries", "Save this to my notes: milk and eggs", "note down meeting at 5")
  if (
    lower.includes('note') ||
    lower.includes('notes') ||
    lower.includes('keep') ||
    lower.includes('google keep')
  ) {
    let noteContent = clean
      .replace(/^(?:hey\s+|hi\s+|please\s+)?(?:add\s+(?:this\s+)?to\s+(?:my\s+)?(?:notes|note|keep)\s*(?:app)?\s*(?:saying|like|that|:)?|save\s+(?:this\s+)?to\s+(?:my\s+)?(?:notes|note|keep)\s*(?:app)?\s*(?:saying|like|that|:)?|create\s+(?:a\s+)?(?:note|to-do)\s*(?:saying|that|:)?|note\s+down\s+|take\s+a\s+note\s*(?:saying|that|:)?)/i, '')
      .replace(/(?:in\s+my\s+notes|to\s+my\s+notes|in\s+notes\s+app|in\s+google\s+keep)/ig, '')
      .trim();

    if (!noteContent || noteContent.toLowerCase() === 'notes' || noteContent.toLowerCase() === 'note') {
      noteContent = 'New Note';
    }

    return {
      type: 'OS_ACTION',
      action: 'CREATE_NOTE',
      target: noteContent,
      payload: noteContent,
      task: noteContent,
      spokenResponse: `Opening your Notes app to save "${noteContent}".`,
    };
  }

  // 7. Navigation / Google Maps Intent
  if (
    lower.startsWith('navigate to') ||
    lower.startsWith('directions to') ||
    lower.startsWith('find nearest') ||
    lower.startsWith('where is')
  ) {
    const destination = lower
      .replace(/^navigate\s+to\s+/i, '')
      .replace(/^directions\s+to\s+/i, '')
      .replace(/^find\s+nearest\s+/i, 'nearest ')
      .replace(/^where\s+is\s+/i, '')
      .trim();
    return {
      type: 'OS_ACTION',
      action: 'MAPS',
      target: destination || 'current location',
      spokenResponse: `Finding ${destination || 'location'} on Google Maps...`,
    };
  }

  // 8. Direct App Launchers
  const knownApps = [
    'youtube', 'spotify', 'netflix', 'hotstar', 'jiocinema', 'primevideo',
    'gpay', 'googlepay', 'phonepe', 'paytm', 'bhim',
    'zomato', 'swiggy', 'blinkit', 'zepto',
    'amazon', 'flipkart', 'myntra',
    'uber', 'ola', 'rapido', 'irctc',
    'instagram', 'telegram', 'twitter', 'x', 'linkedin', 'gmail', 'chrome',
    'camera', 'calculator', 'calendar', 'photos', 'settings'
  ];

  for (const app of knownApps) {
    if (lower === app || lower === `open ${app}` || lower === `launch ${app}` || lower === `open the ${app}`) {
      if (app === 'settings') {
        return {
          type: 'OS_ACTION',
          action: 'SETTINGS',
          spokenResponse: 'Opening device settings...',
        };
      }
      return {
        type: 'OS_ACTION',
        action: 'OPEN_APP',
        target: app,
        spokenResponse: `Opening ${app.toUpperCase()}...`,
      };
    }
  }

  // 9. Settings Intent
  if (lower.includes('settings') || lower.includes('open bluetooth') || lower.includes('open wifi')) {
    return {
      type: 'OS_ACTION',
      action: 'SETTINGS',
      spokenResponse: 'Opening device settings...',
    };
  }

  // 10. Google Web Search
  if (lower.startsWith('search google for') || lower.startsWith('google ') || lower.startsWith('search for') || lower.startsWith('look up ')) {
    const query = lower
      .replace(/^search\s+google\s+for\s+/i, '')
      .replace(/^google\s+/i, '')
      .replace(/^search\s+for\s+/i, '')
      .replace(/^look\s+up\s+/i, '')
      .trim();
    return {
      type: 'OS_ACTION',
      action: 'WEB_SEARCH',
      target: query,
      spokenResponse: `Searching Google for ${query}...`,
    };
  }

  // 11. Task, Alarm & Reminder Intent
  const isReminder =
    lower.includes('remind') ||
    lower.includes('schedule') ||
    lower.includes('appointment') ||
    lower.includes('alarm') ||
    lower.includes('alaram') ||
    lower.includes('timer') ||
    lower.startsWith('add task') ||
    lower.startsWith('set ');

  if (isReminder) {
    let task = clean;
    let date = 'Today';
    let time = 'Anytime';

    const dateMatch = clean.match(/\b(today|tomorrow|yesterday|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|this\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|on\s+[A-Za-z]+\s+\d{1,2})\b/i);
    if (dateMatch) {
      date = dateMatch[0].charAt(0).toUpperCase() + dateMatch[0].slice(1);
      task = task.replace(dateMatch[0], '');
    }

    const timeMatch = clean.match(/\b(?:at\s+|to\s+|for\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)|tonight|morning|afternoon|evening|in\s+\d+\s*(?:min|minute|hour|hr))\b/i);
    if (timeMatch) {
      time = timeMatch[0].replace(/^(?:at|to|for)\s+/i, '').trim();
      task = task.replace(timeMatch[0], '');
    }

    const isAlarmRequest = lower.includes('alarm') || lower.includes('alaram');

    task = task
      .replace(/^(?:hey\s+|hi\s+|please\s+)?(?:set\s+(?:an?\s+)?(?:alarm|alaram|reminder|timer)\s+(?:to|for|at)?\s*)/i, '')
      .replace(/^remind\s+me\s+(?:to\s+)?/i, '')
      .replace(/^add\s+task\s+/i, '')
      .replace(/^i\s+need\s+to\s+/i, '')
      .replace(/^please\s+/i, '')
      .trim();

    if (!task || task.length <= 2) {
      task = isAlarmRequest ? 'Alarm' : 'Reminder';
    } else {
      task = task.charAt(0).toUpperCase() + task.slice(1);
    }

    if (isAlarmRequest) {
      return {
        type: 'OS_ACTION',
        action: 'SET_ALARM',
        task: task || 'Voice Alarm',
        time: time || '7:00 AM',
        date: date || 'Today',
        spokenResponse: `Setting your alarm for ${time || '7:00 AM'} on your phone.`,
      };
    }

    const spokenResponse = `Added reminder: ${task} for ${date} at ${time}.`;

    return {
      type: 'TASK',
      task,
      date,
      time,
      spokenResponse,
    };
  }

  // 12. Greetings & General Conversational
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('namaste') || lower.includes('hey')) {
    return {
      type: 'CONVERSATION',
      displayText: "Namaste! I am your AI Voice Assistant. I can answer questions, launch apps, make phone calls, navigate with maps, or manage your tasks.",
      spokenResponse: "Namaste! How can I help you today?",
    };
  }

  if (lower.includes('who are you') || lower.includes('what can you do')) {
    return {
      type: 'CONVERSATION',
      displayText: "I am your voice assistant. You can speak commands to open apps, make calls, search Google, manage tasks, or ask any question!",
      spokenResponse: "I am your voice assistant. You can speak commands to open apps, make calls, navigate, or ask questions.",
    };
  }

  // Graceful conversational response
  return {
    type: 'CONVERSATION',
    displayText: `I heard: "${clean}". Here to help! You can ask questions, set reminders, or say commands like "Open YouTube".`,
    spokenResponse: `I heard: ${clean}. You can ask questions, set reminders, or open apps.`,
  };
};

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';

/**
 * Calls OpenRouter AI API with ultra-fast models
 */
export const queryOpenRouter = async (promptText, apiKey = OPENROUTER_API_KEY) => {
  if (!apiKey) return null;

  const openRouterModels = [
    'meta-llama/llama-3.3-70b-instruct',
    'openai/gpt-4o-mini',
    'deepseek/deepseek-chat',
  ];

  for (const model of openRouterModels) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://voicetaskapp.local',
          'X-Title': 'Voice Matrix Assistant',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: ASSISTANT_SYSTEM_PROMPT },
            { role: 'user', content: `User Spoke: "${promptText}"` },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        const parsed = parseJsonSafely(content);
        if (parsed) return parsed;
      }
    } catch (e) {
      console.warn(`OpenRouter model ${model} error:`, e.message);
    }
  }
  return null;
};

/**
 * Sends speech input to Gemini AI, OpenRouter, or local engine
 */
export const processAssistantQuery = async (speechInput) => {
  const cleanInput = (speechInput || '').trim();
  if (!cleanInput) {
    return {
      type: 'CONVERSATION',
      displayText: "I didn't hear anything. Please tap the microphone and speak clearly.",
      spokenResponse: "I didn't hear anything. Please speak your command.",
    };
  }

  // 1. FAST PATH (0ms): High-confidence instant local matching for apps, YouTube search, calls, agenda, alarms
  const localMatch = processLocally(cleanInput);
  if (localMatch && localMatch.type !== 'CONVERSATION') {
    return localMatch;
  }

  // 2. OpenRouter API (if API Key provided)
  if (OPENROUTER_API_KEY) {
    try {
      const openRouterResult = await queryOpenRouter(cleanInput, OPENROUTER_API_KEY);
      if (openRouterResult) return openRouterResult;
    } catch (e) {}
  }

  // 3. Gemini AI Flash Cognitive Brain
  for (const model of MODEL_CANDIDATES) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${ASSISTANT_SYSTEM_PROMPT}\n\nUser Spoke: "${cleanInput}"` }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = parseJsonSafely(rawText);

      if (parsed) {
        return parsed;
      }
    } catch (e) {
      console.warn(`Fast query with ${model} error:`, e.message);
    }
  }

  return localMatch || processLocally(cleanInput);
};

/**
 * Direct Audio Speech-to-Intent Pipeline via Gemini Multimodal Audio
 * @param {string} audioBase64 
 * @param {string} mimeType 
 */
export const processAssistantAudio = async (audioBase64, mimeType = 'audio/webm') => {
  if (!audioBase64) {
    return {
      type: 'CONVERSATION',
      displayText: 'No audio captured. Please tap the microphone and speak again.',
      spokenResponse: 'No audio captured. Please tap the mic and try again.',
      transcribedText: '',
    };
  }

  // 1. Try dedicated Backend Server
  try {
    const backendData = await processVoiceAudioWithBackend(audioBase64, mimeType);
    if (backendData?.success && backendData?.result) {
      return backendData.result;
    }
  } catch (e) {
    console.log('[Assistant Audio] Backend audio failed, falling back to direct client Gemini:', e.message);
  }

  // 2. Direct Client-side Gemini Multimodal Audio Call
  for (const model of MODEL_CANDIDATES) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${ASSISTANT_SYSTEM_PROMPT}\nTranscribe what the user said into "transcribedText", and extract the structured intent in strict JSON.`,
                },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: audioBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = parseJsonSafely(rawText);
        if (parsed) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn(`[Assistant Audio] Direct ${model} error:`, e.message);
    }
  }

  return {
    type: 'CONVERSATION',
    displayText: 'Sorry, I had trouble processing your voice audio. Please try again.',
    spokenResponse: 'I had trouble understanding that audio. Please try speaking again.',
    transcribedText: '',
  };
};
