import { SYSTEM_PROMPT } from '../constants/Prompts';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

// Candidate models to attempt in order of preference
const MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-2.0-flash-exp',
  'gemini-pro',
];

/**
 * Clean and parse raw JSON text response from Gemini
 * @param {string} rawText 
 * @returns {object} parsed JSON object
 */
const parseGeminiJson = (rawText) => {
  if (!rawText) throw new Error('Empty response received from Gemini');

  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  cleaned = cleaned.trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  return JSON.parse(cleaned);
};

/**
 * Intelligent local fallback parser for dates, times, and task descriptions
 */
const parseLocally = (text) => {
  let task = text;
  let date = 'Today';
  let time = 'Anytime';

  // Extract common relative dates
  const dateMatch = text.match(/\b(today|tomorrow|yesterday|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|this\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|on\s+[A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?)\b/i);
  if (dateMatch) {
    date = dateMatch[0].charAt(0).toUpperCase() + dateMatch[0].slice(1);
    task = task.replace(dateMatch[0], '');
  }

  // Extract common times (e.g., 5 PM, 10:30 am, at 8:00, tonight, morning, evening)
  const timeMatch = text.match(/\b(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)|tonight|morning|afternoon|evening|noon|midnight)\b/i);
  if (timeMatch) {
    time = timeMatch[0].replace(/^at\s+/i, '').trim();
    task = task.replace(timeMatch[0], '');
  }

  // Clean task prefix (e.g. "remind me to", "please", "i need to")
  task = task
    .replace(/^remind\s+me\s+to\s+/i, '')
    .replace(/^i\s+need\s+to\s+/i, '')
    .replace(/^remember\s+to\s+/i, '')
    .replace(/^please\s+/i, '')
    .replace(/\s+at\s*$/i, '')
    .replace(/\s+for\s*$/i, '')
    .replace(/\s+on\s*$/i, '')
    .trim();

  if (!task) task = text;
  // Capitalize first letter
  task = task.charAt(0).toUpperCase() + task.slice(1);

  return { task, date, time };
};

/**
 * Extracts structured task details (task, date, time) from spoken transcript text using Gemini.
 * @param {string} transcriptText Spoken input string
 * @returns {Promise<{task: string, date: string, time: string}>}
 */
export const extractTaskDetails = async (transcriptText) => {
  if (!transcriptText || !transcriptText.trim()) {
    throw new Error('No transcript text provided.');
  }

  const cleanText = transcriptText.trim();

  // Try candidate models in order
  for (const model of MODEL_CANDIDATES) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${SYSTEM_PROMPT}\n\nSpoken Input: "${cleanText}"`,
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

      if (!response.ok) {
        // If 404 model not found, try the next model candidate
        if (response.status === 404) {
          console.warn(`Model ${model} returned 404, trying next available model...`);
          continue;
        }
        const errorBody = await response.text();
        console.warn(`Gemini API error with model ${model} (${response.status}):`, errorBody);
        continue;
      }

      const data = await response.json();
      const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (candidateText) {
        const parsed = parseGeminiJson(candidateText);
        return {
          task: parsed.task || cleanText,
          date: parsed.date || 'Today',
          time: parsed.time || 'Anytime',
        };
      }
    } catch (err) {
      console.warn(`Attempt with ${model} failed:`, err.message);
    }
  }

  // Graceful intelligent fallback
  console.log('Using local intelligent parser fallback.');
  return parseLocally(cleanText);
};
