const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const DB_FILE = path.join(__dirname, 'database.json');

// Initialize local JSON database file
const initDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    const defaultData = { tasks: [], history: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
  }
};
initDB();

const readDB = () => {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return { tasks: [], history: [] };
  }
};

const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to write database:', e);
  }
};

const getDynamicSystemPrompt = () => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const isoDate = now.toISOString().split('T')[0];

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().split('T')[0];

  return `
You are the high-speed cognitive processor of an intelligent Voice Assistant.
Analyze user voice queries (including phonetically misheard STT words) and output strict JSON with no markdown wrapping.

REAL-TIME CURRENT DATE & TIME CONTEXT:
- Current Date Today: ${dateStr} (ISO: ${isoDate})
- Current Time: ${timeStr}
- Tomorrow's Date: ${tomorrow.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} (ISO: ${tomorrowIso})

Critical Rules:
1. Real-Time Date & Time Queries:
   - "What is the date today?" / "what date is it" -> CONVERSATION, displayText: "Today is ${dateStr}.", spokenResponse: "Today is ${dateStr}."
   - "What time is it?" / "current time" -> CONVERSATION, displayText: "The current time is ${timeStr}.", spokenResponse: "The current time is ${timeStr}."
   - "What day is it?" -> CONVERSATION, displayText: "Today is ${now.toLocaleDateString('en-US', { weekday: 'long' })}.", spokenResponse: "Today is ${now.toLocaleDateString('en-US', { weekday: 'long' })}."
2. Reminders & Tasks Date Calculation ("remind me to [task] at [time]"):
   - Always map "today" -> "${isoDate}" or "Today".
   - Always map "tomorrow" -> "${tomorrowIso}" or "Tomorrow".
   - Set fields: type: "TASK", task, date, time, spokenResponse.
3. Alarms ("set alarm for [time]", "alarm at 7am"):
   - Classify as "OS_ACTION", action: "SET_ALARM", time: "[time]", task: "Voice Alarm", spokenResponse: "Setting alarm for [time]".
4. System Settings & Mobile Hardware Controls:
   - "wifi" / "turn on wifi" / "wifi settings" -> OS_ACTION, action: "open_app", target: "wifi"
   - "mobile data" / "data" / "turn on data" -> OS_ACTION, action: "open_app", target: "mobile_data"
   - "screenshot" / "take screenshot" / "capture screen" -> OS_ACTION, action: "open_app", target: "screenshot"
   - "bluetooth" / "turn on bluetooth" -> OS_ACTION, action: "open_app", target: "bluetooth"
   - "battery" / "battery saver" -> OS_ACTION, action: "open_app", target: "battery"
   - "location" / "gps" / "turn on gps" -> OS_ACTION, action: "open_app", target: "location"
   - "display" / "brightness" -> OS_ACTION, action: "open_app", target: "display"
   - "sound" / "volume" -> OS_ACTION, action: "open_app", target: "sound"
   - "storage" -> OS_ACTION, action: "open_app", target: "storage"
   - "hotspot" -> OS_ACTION, action: "open_app", target: "hotspot"
5. Any query starting with "open" or requesting an app (e.g. "open WhatsApp", "open settings", "open camera", "open youtube", "open instagram", "open makemytrip", "open notes") MUST be classified as "OS_ACTION" with action: "open_app" and target: "[app_name]".
6. Flashlight / Torch commands ("turn on flash", "flashlight", "torch on") -> OS_ACTION, action: "toggle_flash", spokenResponse: "Turning on flashlight".
7. Phonetic corrections: "what's happening" / "whats app" / "whatsap" -> target: "whatsapp".
8. Output JSON structure:
   - "TASK": { type: "TASK", task: string, date: string, time: string, spokenResponse: string }
   - "OS_ACTION": { type: "OS_ACTION", action: string, target: string, time: string, task: string, message: string, phoneNumber: string, spokenResponse: string, displayText: string }
   - "READ_TASKS": { type: "READ_TASKS", spokenResponse: string }
   - "CLEAR_TASKS": { type: "CLEAR_TASKS", spokenResponse: string }
   - "CONVERSATION": { type: "CONVERSATION", displayText: string, spokenResponse: string, options: Array }
`;
};

let OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

/**
 * Calls Groq Llama 3.3 70B, OpenRouter AI, or Gemini Flash to extract structured intent
 */
async function processWithAI(query) {
  const currentPrompt = getDynamicSystemPrompt();

  // 1. Try Groq Llama 3.3 70B (30ms ultra-fast intent engine)
  if (GROQ_API_KEY) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: currentPrompt },
            { role: 'user', content: query },
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed) return parsed;
        }
      }
    } catch (e) {
      console.warn('Groq Llama AI error:', e.message);
    }
  }
  // 1. Try OpenRouter if API Key is available
  if (OPENROUTER_API_KEY) {
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
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://voicetaskapp.local',
            'X-Title': 'Voice Matrix Assistant',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: `User Voice Query: "${query}"` },
            ],
            response_format: { type: 'json_object' },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data?.choices?.[0]?.message?.content;
          return { parsed: JSON.parse(content.trim()), model: `OpenRouter (${model})` };
        }
      } catch (e) {
        console.warn(`OpenRouter ${model} error:`, e.message);
      }
    }
  }

  // 2. Gemini Flash Multi-Model Engine
  const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-2.5-flash'];
  let data = null;
  let activeModel = '';

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${SYSTEM_PROMPT}\n\nUser Voice Query: "${query}"\nRespond in JSON:` }],
            },
          ],
        }),
      });

      if (response.ok) {
        data = await response.json();
        activeModel = model;
        break;
      }
    } catch (e) {}
  }

  if (!data) {
    throw new Error('Could not connect to AI models.');
  }

  let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (rawText.startsWith('```json')) rawText = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  if (rawText.startsWith('```')) rawText = rawText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  
  return { parsed: JSON.parse(rawText.trim()), model: activeModel };
}

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

/**
 * Audio System Prompt for Multimodal Speech Transcription & Understanding
 */
const AUDIO_SYSTEM_PROMPT = `
You are the high-speed backend cognitive processor of an intelligent Voice Assistant.
Listen to the user's spoken audio, transcribe it accurately, and output strict JSON with no markdown wrapping.

Categories & Format:
1. "TASK" - Setting alarms, reminders, to-do items. (Fields: transcribedText, type, task, date, time, spokenResponse, displayText)
2. "OS_ACTION" - Launching apps, sending WhatsApp messages, making phone calls, navigation, YouTube search. (Fields: transcribedText, type, action, target, payload, message, phoneNumber, spokenResponse, displayText)
3. "READ_TASKS" - Asking to read or check tasks/agenda. (Fields: transcribedText, type, spokenResponse, displayText)
4. "CLEAR_TASKS" - Clearing/deleting all tasks. (Fields: transcribedText, type, spokenResponse, displayText)
5. "CONVERSATION" - General knowledge, questions, chatting. (Fields: transcribedText, type, displayText, spokenResponse)

Output JSON structure:
{
  "transcribedText": "exact words spoken in audio",
  "type": "TASK" | "OS_ACTION" | "READ_TASKS" | "CLEAR_TASKS" | "CONVERSATION",
  "task": "task description",
  "date": "Today / Tomorrow",
  "time": "7:00 AM",
  "action": "make_call | send_message | open_app | search_youtube | navigate | SET_ALARM",
  "target": "target app, contact, place, or search",
  "phoneNumber": "contact name or number",
  "message": "message content",
  "payload": "search query or detail",
  "spokenResponse": "concise friendly response to speak back",
  "displayText": "response to display"
}
`;

/**
 * Direct Multimodal Audio Intent Extraction via Gemini with Multi-Model Fallbacks
 */
async function processAudioWithGemini(audioBase64, mimeType = 'audio/m4a') {
  const models = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-2.5-flash',
  ];
  let data = null;
  let activeModel = '';

  const testMime = (mimeType && mimeType.includes('m4a')) ? 'audio/aac' : (mimeType || 'audio/webm');

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    // Up to 3 retries with backoff if rate limited (429)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`📡 [Attempt ${attempt}/3] Sending to ${model} (${testMime})...`);
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: AUDIO_SYSTEM_PROMPT },
                  {
                    inlineData: {
                      mimeType: testMime,
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

        if (response.ok) {
          data = await response.json();
          activeModel = model;
          console.log(`✅ Success with ${model} on attempt ${attempt}`);
          break;
        }

        const errText = await response.text();

        // If 429 Rate Limit / Quota exceeded, wait 1.5 seconds and retry
        if (response.status === 429) {
          console.warn(`⏳ Rate limit 429 on ${model} (Attempt ${attempt}/3). Waiting 1.5s before retry...`);
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }

        console.warn(`⚠️ ${model} returned status ${response.status}: ${errText.slice(0, 180)}`);
        break;
      } catch (e) {
        console.warn(`Audio error with ${model}:`, e.message);
        break;
      }
    }

    if (data) break;
  }

  if (!data) {
    throw new Error('Gemini Audio rate limit or quota reached. Please wait a few seconds and try again.');
  }

  let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (rawText.startsWith('```json')) rawText = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  if (rawText.startsWith('```')) rawText = rawText.replace(/^```\s*/, '').replace(/\s*```$/, '');

  return { parsed: JSON.parse(rawText.trim()), model: activeModel };
}

/**
 * Fast Speech-to-Text via Groq Whisper API (0.15s ultra-fast STT)
 */
async function transcribeWithGroqWhisper(audioBase64, mimeType = 'audio/m4a') {
  if (!GROQ_API_KEY || !audioBase64) return null;

  const tempFilePath = path.join(__dirname, `temp_voice_${Date.now()}.m4a`);

  try {
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    fs.writeFileSync(tempFilePath, audioBuffer);

    const formData = new FormData();
    const fileBlob = new Blob([fs.readFileSync(tempFilePath)], { type: mimeType || 'audio/m4a' });
    formData.append('file', fileBlob, 'voice.m4a');
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('response_format', 'json');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: formData,
    });

    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

    if (response.ok) {
      const data = await response.json();
      if (data && data.text && data.text.trim()) {
        console.log(`🎙️ [GROQ WHISPER STT SUCCESS]: "${data.text.trim()}"`);
        return data.text.trim();
      }
    } else {
      const errText = await response.text();
      console.warn(`⚠️ Groq Whisper returned status ${response.status}: ${errText.slice(0, 150)}`);
    }
  } catch (e) {
    console.warn(`Groq Whisper STT error:`, e.message);
    if (fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch (err) {}
    }
  }

  return null;
}

/**
 * Multimodal Audio Voice Processing Endpoint
 */
app.post('/api/process-voice-audio', async (req, res) => {
  const { audioBase64, mimeType } = req.body;
  const startTime = Date.now();

  console.log('\n===============================================================');
  console.log(`🎙️ [INCOMING AUDIO BUFFER]: ${(audioBase64 ? audioBase64.length : 0)} chars, mime: ${mimeType}`);
  console.log(`⏰ [TIMESTAMP]: ${new Date().toLocaleTimeString()}`);
  console.log('---------------------------------------------------------------');

  if (!audioBase64) {
    return res.status(400).json({ error: 'Audio data is required' });
  }

  try {
    let parsed = null;
    let model = 'groq-whisper-llama';

    // 1. Try Groq Whisper STT first (Lightning Fast 0.15s Speech Recognition)
    const whisperText = await transcribeWithGroqWhisper(audioBase64, mimeType);
    if (whisperText) {
      const aiResult = await processWithAI(whisperText);
      if (aiResult) {
        parsed = aiResult;
        parsed.transcribedText = whisperText;
      }
    }

    // 2. Fallback to Gemini Multimodal Audio
    if (!parsed) {
      console.log('📡 Falling back to direct Gemini Multimodal Audio pipeline...');
      const geminiRes = await processAudioWithGemini(audioBase64, mimeType);
      parsed = geminiRes.parsed;
      model = geminiRes.model;
    }

    const elapsed = Date.now() - startTime;
    const transcribedText = parsed.transcribedText || 'Voice Query';

    console.log(`⚡ [AUDIO AI ENGINE]: ${model} (${elapsed}ms)`);
    console.log(`🗣️ [TRANSCRIBED TEXT]: "${transcribedText}"`);
    console.log(`🧠 [INTENT CLASSIFIED]: ${parsed.type}`);
    console.log(`📦 [JSON PAYLOAD]:\n`, JSON.stringify(parsed, null, 2));

    const db = readDB();

    // Database task creation
    if (parsed.type === 'TASK') {
      const newTask = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        task: parsed.task || transcribedText,
        date: parsed.date || 'Today',
        time: parsed.time || 'Anytime',
        completed: false,
        createdAt: new Date().toISOString(),
      };
      db.tasks.unshift(newTask);
      writeDB(db);
    } else if (parsed.type === 'CLEAR_TASKS') {
      db.tasks = [];
      writeDB(db);
    }

    // Save history
    const historyItem = {
      id: `${Date.now()}`,
      query: transcribedText,
      responseText: parsed.displayText || parsed.spokenResponse,
      spokenResponse: parsed.spokenResponse || parsed.displayText,
      type: parsed.type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    db.history.unshift(historyItem);
    if (db.history.length > 50) db.history = db.history.slice(0, 50);
    writeDB(db);

    console.log(`🔊 [AUDIO READOUT]: "${parsed.spokenResponse || parsed.displayText}"`);
    console.log('===============================================================\n');

    return res.json({
      success: true,
      result: parsed,
      tasks: db.tasks,
      history: db.history,
    });
  } catch (err) {
    console.error(`❌ [AUDIO BACKEND ERROR]:`, err.message);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Main Voice Processing Endpoint
 */
app.post('/api/process-voice', async (req, res) => {
  const { query } = req.body;
  const startTime = Date.now();

  console.log('\n===============================================================');
  console.log(`📥 [INCOMING VOICE REQUEST]: "${query}"`);
  console.log(`⏰ [TIMESTAMP]: ${new Date().toLocaleTimeString()}`);
  console.log('---------------------------------------------------------------');

  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const { parsed, model } = await processWithAI(query.trim());
    const elapsed = Date.now() - startTime;

    console.log(`⚡ [AI ENGINE]: ${model} (${elapsed}ms)`);
    console.log(`🧠 [INTENT CLASSIFIED]: ${parsed.type}`);
    console.log(`📦 [JSON PAYLOAD]:\n`, JSON.stringify(parsed, null, 2));

    const db = readDB();

    // Handle Database Updates based on Intent
    if (parsed.type === 'TASK') {
      const newTask = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        task: parsed.task || query,
        date: parsed.date || 'Today',
        time: parsed.time || 'Anytime',
        completed: false,
        createdAt: new Date().toISOString(),
      };
      db.tasks.unshift(newTask);
      writeDB(db);
      console.log(`💾 [DATABASE WRITE]: Added new task to database. Total tasks: ${db.tasks.length}`);
    } else if (parsed.type === 'CLEAR_TASKS') {
      db.tasks = [];
      writeDB(db);
      console.log(`🗑️ [DATABASE WRITE]: All tasks cleared from database.`);
    }

    // Save to History Log
    const historyItem = {
      id: `${Date.now()}`,
      query: query.trim(),
      responseText: parsed.displayText || parsed.spokenResponse,
      spokenResponse: parsed.spokenResponse || parsed.displayText,
      type: parsed.type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    db.history.unshift(historyItem);
    if (db.history.length > 50) db.history = db.history.slice(0, 50);
    writeDB(db);

    console.log(`🔊 [AUDIO READOUT]: "${parsed.spokenResponse || parsed.displayText}"`);
    console.log('===============================================================\n');

    return res.json({
      success: true,
      result: parsed,
      tasks: db.tasks,
      history: db.history,
    });
  } catch (err) {
    console.error(`❌ [BACKEND ERROR]:`, err.message);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Get All Tasks
 */
app.get('/api/tasks', (req, res) => {
  const db = readDB();
  console.log(`📋 [GET /api/tasks]: Returning ${db.tasks.length} tasks.`);
  res.json(db.tasks);
});

/**
 * Create Task Manually
 */
app.post('/api/tasks', (req, res) => {
  const { task, date, time } = req.body;
  const db = readDB();
  const newTask = {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    task: task || 'New Task',
    date: date || 'Today',
    time: time || 'Anytime',
    completed: false,
    createdAt: new Date().toISOString(),
  };
  db.tasks.unshift(newTask);
  writeDB(db);
  console.log(`💾 [POST /api/tasks]: Created manual task "${newTask.task}".`);
  res.json(db.tasks);
});

/**
 * Toggle Task
 */
app.post('/api/tasks/toggle', (req, res) => {
  const { id } = req.body;
  const db = readDB();
  db.tasks = db.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
  writeDB(db);
  console.log(`🔄 [POST /api/tasks/toggle]: Toggled task id ${id}.`);
  res.json(db.tasks);
});

/**
 * Delete Task
 */
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.tasks = db.tasks.filter((t) => t.id !== id);
  writeDB(db);
  console.log(`🗑️ [DELETE /api/tasks/:id]: Deleted task id ${id}.`);
  res.json(db.tasks);
});

/**
 * Get History
 */
app.get('/api/history', (req, res) => {
  const db = readDB();
  res.json(db.history);
});

/**
 * Clear History
 */
app.delete('/api/history', (req, res) => {
  const db = readDB();
  db.history = [];
  writeDB(db);
  console.log(`🧹 [DELETE /api/history]: Cleared conversation history.`);
  res.json([]);
});

/**
 * Set OpenRouter API Key
 */
app.post('/api/config/openrouter', (req, res) => {
  const { apiKey } = req.body;
  if (apiKey) {
    OPENROUTER_API_KEY = apiKey.trim();
    console.log(`🔑 [CONFIG]: OpenRouter API Key configured successfully!`);
    return res.json({ success: true, message: 'OpenRouter API Key activated' });
  }
  return res.status(400).json({ error: 'API key is required' });
});

/**
 * Health Check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Voice Assistant Backend',
    openRouterActive: !!OPENROUTER_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n╔══════════════════════════════════════════════════════════════════╗`);
  console.log(`║ 🚀 VOICE ASSISTANT BACKEND SERVER RUNNING                       ║`);
  console.log(`║ 🌐 Port: ${PORT}                                                    ║`);
  console.log(`║ 📡 API Endpoint: http://localhost:${PORT}/api/process-voice        ║`);
  console.log(`║ 📋 Database: ${DB_FILE}                       ║`);
  console.log(`╚══════════════════════════════════════════════════════════════════╝\n`);
});
