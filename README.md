# Voice-to-Task-Mobile-Application

Intelligent, multimodal AI Voice Assistant mobile application built with **React Native (Expo SDK 54)** and powered by a hybrid cognitive engine combining **Groq Whisper Large v3 Turbo**, **Groq Llama 3.3 70B Versatile**, and **Google Gemini Multimodal Audio**.

## Download & Install

<div align="center">

| Android | iOS |
|:---:|:---:|
| [![Android QR](https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=https://expo.dev/accounts/pranavku2119/projects/VoiceAssistant/builds/1566176d-205f-4fdf-9854-82095059e9b9)](https://expo.dev/accounts/pranavku2119/projects/VoiceAssistant/builds/1566176d-205f-4fdf-9854-82095059e9b9) | [![iOS QR](https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=https://expo.dev/@pranavku2119/VoiceAssistant)](https://expo.dev/@pranavku2119/VoiceAssistant) |
| **Direct APK Install** | **Open in Expo Go** |
| [Download APK](https://expo.dev/accounts/pranavku2119/projects/VoiceAssistant/builds/1566176d-205f-4fdf-9854-82095059e9b9) | [Open Project](https://expo.dev/@pranavku2119/VoiceAssistant) |

</div>

**Live Backend:** [https://voice-app-2pv0.onrender.com](https://voice-app-2pv0.onrender.com/api/health)

**Android install steps:**
1. Scan QR or tap Download APK on your Android phone
2. Tap **"Install"** → allow **"Unknown sources"** if prompted
3. Launch app and tap the mic orb to start

**iOS install steps:**
1. Install **Expo Go** from the App Store
2. Scan the iOS QR code with your iPhone camera
3. App opens directly in Expo Go

---

## Key Features

### 1. Ultra-Low Latency Voice Engine (< 250ms)
- **Groq Whisper Large v3 Turbo**: High-speed speech-to-text with support for phonetic correction and natural accents (~150ms).
- **Groq Llama 3.3 70B Versatile**: Intelligent cognitive intent classification and entity extraction (~30ms).
- **Gemini Multimodal Audio**: High-fidelity multimodal audio processing fallback.
- **Dynamic Real-Time Clock**: Injects live system date, day of the week, time, and timezone context dynamically on every request so the assistant always knows the exact date today, tomorrow, or upcoming weekdays.

### 2. Direct Google Calendar Cloud Auto-Sync
- **Silent Native Event Creation**: Integrated with `expo-calendar` to query your primary `@gmail.com` / `com.google` account and directly insert events into Google Calendar without interrupting user flow.
- **In-App Agenda & Push Notifications**: Simultaneously persists tasks in local storage and schedules local push notification alarms with sound and vibration.
- **One-Tap Sync Button**: Allows syncing any saved task from the Agenda view straight to Google Calendar.

### 3. Deep Mobile OS Hardware & Settings Control
Directly control phone hardware and access native Android settings via voice commands:
- **Flashlight / Torch**: Hardware LED activation via `expo-camera`.
- **Camera Viewfinder**: Instant camera launch via `expo-image-picker`.
- **Wi-Fi Settings**: Jump to system Wi-Fi management.
- **Mobile Data Settings**: Jump to cellular data & roaming configurations.
- **Bluetooth Settings**: Open Bluetooth device pairing screen.
- **Screenshot Capture**: Native screenshot capture intents.
- **Location / GPS**: Quick toggle to GPS location services.
- **Battery Saver**: Access power management settings.
- **Display & Brightness**: Screen timeout and display preferences.
- **Sound & Volume**: Audio profile & volume sliders.
- **Hotspot & Storage**: Tethering and device storage views.

### 4. WhatsApp, Calls, SMS & Address Book Lookup
- **WhatsApp Deep-Linking (`wa.me`)**: Generates universal click-to-chat links (`https://wa.me/91XXXXXXXXXX?text=...`) and native WhatsApp URI schemes to open directly in the recipient's chat window with pre-filled message text.
- **Contact Book Resolution**: Automatic contact name search using `expo-contacts` to fetch phone numbers on the fly (e.g., *"Send WhatsApp to Rahul saying I am on my way"*).
- **Generic WhatsApp Contact Picker**: Opens WhatsApp with pre-filled text when no specific contact is mentioned.
- **Direct Phone Calls & SMS**: Opens native dialer and SMS client pre-populated with numbers and messages.

### 5. Intelligent Alarms Engine
- **OEM Clock App Pre-Fill**: Universal Android intent dispatch (`android.intent.action.SET_ALARM`) with target hour and minute parameters for Google Clock, Samsung Clock, Xiaomi MIUI Clock, and OnePlus Clock.
- **Local Alarm Notifications**: Exact timed push alarm notifications with ringtones and vibrations via `expo-notifications`.

### 6. Universal 40+ App Launcher & In-App Search
- **YouTube In-App Search**: Directly searches videos inside the official YouTube mobile app (`vnd.youtube://results?search_query=...`).
- **Social Media**: Launch Instagram, Facebook, X (Twitter), LinkedIn, Snapchat, and Reddit.
- **Travel & Food**: Deep-link to MakeMyTrip, Goibibo, Uber, Ola, Zomato, and Swiggy.
- **Productivity**: Google Keep, Samsung Notes, Calculator, and Google Maps Navigation.

---

## Voice Commands & Cheat Sheet

| Category | Voice Commands to Speak |
| :--- | :--- |
| **Device Hardware** | *"Turn on flashlight"* • *"Flash off"* • *"Open camera"* • *"Take photo"* |
| **System Settings** | *"Turn off Wi-Fi"* • *"Mobile data"* • *"Bluetooth settings"* • *"Turn on GPS"* • *"Take screenshot"* • *"Battery saver"* • *"Display settings"* • *"Sound settings"* |
| **WhatsApp** | *"Send WhatsApp to Rahul saying I will reach in 10 minutes"* • *"Send WhatsApp message hi"* |
| **Calls & SMS** | *"Call Rahul"* • *"Call 9876543210"* • *"Send SMS to Mom saying call me back"* |
| **Reminders & Calendar** | *"Remind me to submit project tomorrow at 4 PM"* • *"Remind me to pay bills on Friday"* |
| **Alarms** | *"Set an alarm for 7:30 AM"* • *"Set alarm for 6:00 AM tomorrow"* |
| **Agenda Management** | *"Read my tasks"* • *"What are my reminders for today?"* • *"Clear all tasks"* |
| **App Launchers** | *"Search YouTube for lofi music"* • *"Open Instagram"* • *"Open MakeMyTrip"* • *"Navigate to Airport"* |
| **Real-Time Clock & AI** | *"What is the date today?"* • *"What day is it today?"* • *"What time is it?"* • *"Explain quantum computing in simple terms"* |

---

## Architecture & Technology Stack

```
VoiceTaskApp/
├── App.js                         # Main application entry & UI state router
├── server/
│   ├── server.js                  # Express backend cognitive pipeline (Groq + Gemini)
│   └── database.json              # Local JSON database for persistent records
├── src/
│   ├── components/
│   │   ├── MinimalOrb.js          # 3D Iridescent Liquid Glass Orb component
│   │   └── EqualizerBars.js       # Dynamic soundwave audio equalizer
│   └── services/
│       ├── DeviceControlService.js# OS settings, hardware torch, camera, WhatsApp, alarms & Google Calendar sync
│       ├── AssistantService.js    # Local offline rule-based intent parsing fallback
│       ├── AudioService.js        # Multi-engine audio recording (expo-audio / Groq / Gemini)
│       ├── ContactService.js      # Address book lookup via expo-contacts
│       ├── NotificationService.js # Local push alarms & scheduled notifications via expo-notifications
│       ├── StorageService.js      # AsyncStorage persistent local storage
│       └── TtsService.js          # Text-to-speech audio readout via expo-speech
└── package.json
```

### Core Technologies:
- **Mobile Framework**: React Native 0.76+, Expo SDK 54 / 57
- **AI Backend Engine**: Node.js, Express, Groq SDK (`llama-3.3-70b-versatile`, `whisper-large-v3-turbo`), Google Generative AI (`gemini-2.0-flash-exp`)
- **Native Modules**:
  - `expo-calendar` (Google Calendar direct sync)
  - `expo-camera` (Hardware LED flashlight control)
  - `expo-image-picker` (Camera viewfinder)
  - `expo-contacts` (Device address book resolution)
  - `expo-notifications` (Local timed push notifications & alarms)
  - `expo-speech` (Local offline text-to-speech engine)
  - `expo-audio` / `expo-av` (Native audio recording)
  - `@react-native-async-storage/async-storage` (Persistent state)

---

## Quick Start: Installation & How to Run

Follow these simple steps to run the complete Voice Assistant stack on your local machine and physical device.

---

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher installed on your computer ([Download Node.js](https://nodejs.org/)).
- **Mobile Device**: An Android (or iOS) smartphone with the **Expo Go** app installed from Google Play Store or Apple App Store.
- **Wi-Fi Connection**: Make sure your computer and mobile phone are connected to the **same Wi-Fi network**.

---

### 2. Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Pranav1921/Voice_App.git
   cd Voice_App
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root folder (or copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Add your API keys to `.env`:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   PORT=5000
   ```
   > Get free API keys from [Groq Console](https://console.groq.com/) and [Google AI Studio](https://aistudio.google.com/).

---

### 3. Running the Application

You will run **two terminal windows**:

#### Terminal 1: Start the AI Cognitive Backend Server
```bash
npm run server
```

#### Terminal 2: Start the Expo Development Server
```bash
npx expo start --clear
```

---

### 4. Open & Run on Your Mobile Phone

1. Open the **Expo Go** app on your phone.
2. Tap **"Scan QR Code"** and scan the QR code displayed in Terminal 2.
3. The JavaScript bundle will load and the app will start immediately on your device.
4. Tap the microphone button or the 3D Holographic Orb and start speaking.

---

## Connecting Phone to Local Backend (Wi-Fi Setup)

When running locally, ensure your mobile device can reach your PC's backend server:

1. Find your computer's local Wi-Fi IP address:
   - **Windows**: Run `ipconfig` in Command Prompt (look for `IPv4 Address`, e.g., `192.168.31.51`).
   - **Mac / Linux**: Run `ifconfig` or `ip a` (e.g., `192.168.1.100`).
2. Open [`src/services/BackendApiService.js`](src/services/BackendApiService.js) and verify the IP matches:
   ```javascript
   const BACKEND_BASE_URL = 'http://YOUR_LOCAL_IP:5000';
   ```

---

## Cloud Deployment Guide

### Live Deployments:
| Service | URL | Status |
|---|---|---|
| **Backend API** | [https://voice-app-2pv0.onrender.com](https://voice-app-2pv0.onrender.com/api/health) | Live |
| **Android APK** | [EAS Build v1.0.0](https://expo.dev/accounts/pranavku2119/projects/VoiceAssistant/builds/1566176d-205f-4fdf-9854-82095059e9b9) | Ready |

### Deploying the Backend (Free on Render):
1. Sign up on [Render.com](https://render.com) and click **New Web Service**.
2. Connect your GitHub repository `Pranav1921/Voice_App`.
3. Set **Start Command**: `node server/server.js`.
4. Add environment variables `GROQ_API_KEY`, `GEMINI_API_KEY`, and `PORT=5000`.
5. Update `src/services/BackendApiService.js` with your live Render URL.

### Building a Standalone Android APK (EAS Build):
```bash
# 1. Install EAS CLI and login
npm install -g eas-cli
npx eas login

# 2. Build direct installable Android APK
npx eas build -p android --profile preview
```
*Expo will generate a direct download link and QR code to install the APK directly on any Android phone.*

---

## Permissions Handled
The app gracefully requests permissions on first use:
- **Microphone**: Audio recording for voice commands.
- **Calendar**: Direct auto-save to Google Calendar.
- **Camera**: Hardware flashlight torch and viewfinder.
- **Contacts**: Contact lookup for direct WhatsApp messaging and phone calls.
- **Notifications**: Exact local alarm notifications.
