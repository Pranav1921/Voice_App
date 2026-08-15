import { Linking, Alert, Vibration, Platform } from 'react-native';
import { findContactByName } from './ContactService';

/**
 * Universal app schemes & web fallbacks for popular mobile, system & Indian apps
 */
const APP_SCHEMES = {
  // --- System & Device Hardware ---
  settings: {
    native: Platform.OS === 'android' ? 'intent:#Intent;action=android.settings.SETTINGS;end' : 'app-settings:',
    web: 'https://www.google.com/search?q=device+settings',
  },
  wifi: {
    native: Platform.OS === 'android' ? 'intent:#Intent;action=android.settings.WIFI_SETTINGS;end' : 'app-settings:',
    web: null,
  },
  data: {
    native: Platform.OS === 'android' ? 'intent:#Intent;action=android.settings.DATA_ROAMING_SETTINGS;end' : 'app-settings:',
    web: null,
  },
  mobile_data: {
    native: Platform.OS === 'android' ? 'intent:#Intent;action=android.settings.DATA_ROAMING_SETTINGS;end' : 'app-settings:',
    web: null,
  },
  bluetooth: {
    native: Platform.OS === 'android' ? 'intent:#Intent;action=android.settings.BLUETOOTH_SETTINGS;end' : 'app-settings:',
    web: null,
  },
  display: {
    native: Platform.OS === 'android' ? 'intent:#Intent;action=android.settings.DISPLAY_SETTINGS;end' : 'app-settings:',
    web: null,
  },
  sound: {
    native: Platform.OS === 'android' ? 'intent:#Intent;action=android.settings.SOUND_SETTINGS;end' : 'app-settings:',
    web: null,
  },
  battery: {
    native: Platform.OS === 'android' ? 'intent:#Intent;action=android.settings.BATTERY_SAVER_SETTINGS;end' : 'app-settings:',
    web: null,
  },
  location: {
    native: Platform.OS === 'android' ? 'intent:#Intent;action=android.settings.LOCATION_SOURCE_SETTINGS;end' : 'app-settings:',
    web: null,
  },
  gps: {
    native: Platform.OS === 'android' ? 'intent:#Intent;action=android.settings.LOCATION_SOURCE_SETTINGS;end' : 'app-settings:',
    web: null,
  },
  hotspot: {
    native: Platform.OS === 'android' ? 'intent:#Intent;action=android.settings.TETHER_SETTINGS;end' : 'app-settings:',
    web: null,
  },
  storage: {
    native: Platform.OS === 'android' ? 'intent:#Intent;action=android.settings.INTERNAL_STORAGE_SETTINGS;end' : 'app-settings:',
    web: null,
  },
  screenshot: {
    native: Platform.OS === 'android' ? 'intent:#Intent;action=android.intent.action.SCREENSHOT;end' : 'app-settings:',
    web: null,
  },
  camera: {
    native: Platform.OS === 'android' ? 'intent:#Intent;action=android.media.action.STILL_IMAGE_CAMERA;end' : 'camera://',
    web: null,
  },
  contacts: {
    native: Platform.OS === 'android' ? 'intent:#Intent;action=android.intent.action.VIEW;type=vnd.android.cursor.dir/contact;end' : 'contacts://',
    web: 'https://contacts.google.com',
  },
  notes: {
    native: Platform.OS === 'android' ? 'intent:#Intent;action=android.intent.action.CREATE_NOTE;end' : 'mobilenotes://',
    web: 'https://keep.google.com',
  },
  keep: {
    native: 'intent:#Intent;package=com.google.android.keep;end',
    web: 'https://keep.google.com',
  },
  calculator: {
    native: Platform.OS === 'android' ? 'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.APP_CALCULATOR;end' : 'calc://',
    web: 'https://www.google.com/search?q=calculator',
  },
  calendar: {
    native: Platform.OS === 'android' ? 'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.APP_CALENDAR;end' : 'calshow://',
    web: 'https://calendar.google.com',
  },
  photos: {
    native: Platform.OS === 'android' ? 'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.APP_GALLERY;end' : 'photos-redirect://',
    web: 'https://photos.google.com',
  },
  gallery: {
    native: Platform.OS === 'android' ? 'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.APP_GALLERY;end' : 'photos-redirect://',
    web: 'https://photos.google.com',
  },
  clock: {
    native: 'intent:#Intent;action=android.intent.action.SHOW_ALARMS;end',
    web: null,
  },
  alarm: {
    native: 'intent:#Intent;action=android.intent.action.SHOW_ALARMS;end',
    web: null,
  },
  timer: {
    native: 'intent:#Intent;action=android.intent.action.SET_TIMER;end',
    web: null,
  },
  playstore: {
    native: 'market://',
    web: 'https://play.google.com/store',
  },

  // --- Hotel Booking & Stays ---
  makemytrip: {
    native: Platform.OS === 'android' ? 'intent:#Intent;package=com.makemytrip;end' : 'makemytrip://',
    web: 'https://www.makemytrip.com/hotels',
  },
  booking: {
    native: Platform.OS === 'android' ? 'intent:#Intent;package=com.booking;end' : 'booking://',
    web: 'https://www.booking.com',
  },
  airbnb: {
    native: Platform.OS === 'android' ? 'intent:#Intent;package=com.airbnb.android;end' : 'airbnb://',
    web: 'https://www.airbnb.com',
  },
  agoda: {
    native: Platform.OS === 'android' ? 'intent:#Intent;package=com.agoda.mobile.consumer;end' : 'agoda://',
    web: 'https://www.agoda.com',
  },
  oyo: {
    native: Platform.OS === 'android' ? 'intent:#Intent;package=com.oyo.consumer;end' : 'oyorooms://',
    web: 'https://www.oyorooms.com',
  },
  goibibo: {
    native: Platform.OS === 'android' ? 'intent:#Intent;package=com.goibibo;end' : 'goibibo://',
    web: 'https://www.goibibo.com/hotels',
  },
  trivago: { native: 'trivago://', web: 'https://www.trivago.com' },
  expedia: { native: 'expedia://', web: 'https://www.expedia.com' },

  // --- Video & Entertainment ---
  youtube: {
    native: Platform.OS === 'android' ? 'intent:#Intent;package=com.google.android.youtube;end' : 'vnd.youtube://',
    web: 'https://www.youtube.com',
  },
  spotify: {
    native: Platform.OS === 'android' ? 'intent:#Intent;package=com.spotify.music;end' : 'spotify://',
    web: 'https://open.spotify.com',
  },
  netflix: { native: 'netflix://', web: 'https://www.netflix.com' },
  hotstar: { native: 'hotstar://', web: 'https://www.hotstar.com' },
  jiocinema: { native: 'jiocinema://', web: 'https://www.jiocinema.com' },
  primevideo: { native: 'primevideo://', web: 'https://www.primevideo.com' },

  // --- Payments & UPI (India) ---
  gpay: {
    native: Platform.OS === 'android' ? 'intent:#Intent;package=com.google.android.apps.nfc.pay;end' : 'gpay://',
    web: 'https://pay.google.com',
  },
  googlepay: {
    native: Platform.OS === 'android' ? 'intent:#Intent;package=com.google.android.apps.nfc.pay;end' : 'gpay://',
    web: 'https://pay.google.com',
  },
  phonepe: {
    native: Platform.OS === 'android' ? 'intent:#Intent;package=com.phonepe.app;end' : 'phonepe://',
    web: 'https://www.phonepe.com',
  },
  paytm: {
    native: Platform.OS === 'android' ? 'intent:#Intent;package=net.one97.paytm;end' : 'paytmmp://',
    web: 'https://paytm.com',
  },
  bhim: { native: 'bhim://', web: 'https://www.bhimupi.org.in' },
  upi: { native: 'upi://pay', web: 'https://pay.google.com' },

  // --- Food & Quick Commerce ---
  zomato: {
    native: Platform.OS === 'android' ? 'intent:#Intent;package=com.application.zomato;end' : 'zomato://',
    web: 'https://www.zomato.com',
  },
  swiggy: {
    native: Platform.OS === 'android' ? 'intent:#Intent;package=in.swiggy.android;end' : 'swiggy://',
    web: 'https://www.swiggy.com',
  },
  blinkit: {
    native: Platform.OS === 'android' ? 'intent:#Intent;package=com.grofers.customerapp;end' : 'blinkit://',
    web: 'https://www.blinkit.com',
  },
  zepto: {
    native: Platform.OS === 'android' ? 'intent:#Intent;package=com.zepto.customer;end' : 'zepto://',
    web: 'https://www.zeptonow.com',
  },

  // --- Shopping ---
  amazon: {
    native: Platform.OS === 'android' ? 'intent:#Intent;package=com.amazon.mShop.android.shopping;end' : 'amazon://',
    web: 'https://www.amazon.in',
  },
  flipkart: {
    native: Platform.OS === 'android' ? 'intent:#Intent;package=com.flipkart.android;end' : 'flipkart://',
    web: 'https://www.flipkart.com',
  },
  myntra: {
    native: Platform.OS === 'android' ? 'intent:#Intent;package=com.myntra.android;end' : 'myntra://',
    web: 'https://www.myntra.com',
  },
  meesho: {
    native: Platform.OS === 'android' ? 'intent:#Intent;package=com.meesho.supply;end' : 'meesho://',
    web: 'https://www.meesho.com',
  },

  // --- Cabs & Travel ---
  uber: {
    native: Platform.OS === 'android' ? 'intent:#Intent;package=com.ubercab;end' : 'uber://',
    web: 'https://m.uber.com',
  },
  ola: {
    native: Platform.OS === 'android' ? 'intent:#Intent;package=com.olacabs.customer;end' : 'olacabs://',
    web: 'https://www.olacabs.com',
  },
  rapido: {
    native: Platform.OS === 'android' ? 'intent:#Intent;package=com.rapido.passenger;end' : 'rapido://',
    web: 'https://www.rapido.bike',
  },
  irctc: {
    native: Platform.OS === 'android' ? 'intent:#Intent;package=cris.org.in.prs.ima;end' : 'irctc://',
    web: 'https://www.irctc.co.in',
  },

  // --- Social & Messaging ---
  whatsapp: {
    native: 'whatsapp://send?text=',
    web: 'https://api.whatsapp.com/send',
  },
  telegram: { native: 'tg://', web: 'https://web.telegram.org' },
  instagram: {
    native: Platform.OS === 'android' ? 'intent:#Intent;package=com.instagram.android;end' : 'instagram://',
    web: 'https://www.instagram.com',
  },
  twitter: { native: 'twitter://', web: 'https://x.com' },
  x: { native: 'twitter://', web: 'https://x.com' },
  linkedin: { native: 'linkedin://', web: 'https://www.linkedin.com' },
  reddit: { native: 'reddit://', web: 'https://www.reddit.com' },
  facebook: { native: 'fb://', web: 'https://www.facebook.com' },
  gmail: { native: 'googlegmail://', web: 'https://mail.google.com' },
  chrome: {
    native: Platform.OS === 'android' ? 'googlechrome://' : 'googlechromes://',
    web: 'https://www.google.com',
  },

  // --- Navigation ---
  maps: {
    native: Platform.OS === 'ios' ? 'maps://' : 'geo:0,0?q=',
    web: 'https://www.google.com/maps',
  },
};

/**
 * Categorical App Directories for Interactive Selection Dialogues
 */
export const APP_CATEGORIES = {
  hotel: {
    title: 'Hotel & Stay Booking Apps',
    spokenIntro: 'Here are the hotel booking apps I can open for you: MakeMyTrip, Booking.com, Airbnb, OYO Rooms, and Agoda. Which one would you like?',
    apps: [
      { id: 'makemytrip', name: 'MakeMyTrip', tag: '🏨 Hotels & Flights', icon: '🏨', action: 'open_app', target: 'makemytrip' },
      { id: 'booking', name: 'Booking.com', tag: '🏨 Global Hotels', icon: '🏨', action: 'open_app', target: 'booking' },
      { id: 'airbnb', name: 'Airbnb', tag: '🏡 Homestays & Villas', icon: '🏡', action: 'open_app', target: 'airbnb' },
      { id: 'oyo', name: 'OYO Rooms', tag: '🛌 Budget Stays', icon: '🛌', action: 'open_app', target: 'oyo' },
      { id: 'agoda', name: 'Agoda', tag: '🌴 Resorts & Deals', icon: '🌴', action: 'open_app', target: 'agoda' },
      { id: 'goibibo', name: 'Goibibo', tag: '✈️ Travel & Hotels', icon: '✈️', action: 'open_app', target: 'goibibo' },
    ],
  },
  social: {
    title: 'Social Media & Messaging Apps',
    spokenIntro: 'Here are the social and messaging apps available: WhatsApp, Instagram, X Twitter, Telegram, and LinkedIn. Which one shall I open?',
    apps: [
      { id: 'whatsapp', name: 'WhatsApp', tag: '💬 Chat & Calls', icon: '💬', action: 'open_app', target: 'whatsapp' },
      { id: 'instagram', name: 'Instagram', tag: '📸 Reels & Photos', icon: '📸', action: 'open_app', target: 'instagram' },
      { id: 'twitter', name: 'X (Twitter)', tag: '🐦 Posts & News', icon: '🐦', action: 'open_app', target: 'twitter' },
      { id: 'telegram', name: 'Telegram', tag: '✈️ Channels & Chat', icon: '✈️', action: 'open_app', target: 'telegram' },
      { id: 'linkedin', name: 'LinkedIn', tag: '💼 Professional Network', icon: '💼', action: 'open_app', target: 'linkedin' },
      { id: 'reddit', name: 'Reddit', tag: '🌐 Communities', icon: '🌐', action: 'open_app', target: 'reddit' },
    ],
  },
  food: {
    title: 'Food & Grocery Delivery Apps',
    spokenIntro: 'Here are the food and grocery apps: Zomato, Swiggy, Blinkit, and Zepto. Which one would you like to use?',
    apps: [
      { id: 'zomato', name: 'Zomato', tag: '🍕 Food Delivery', icon: '🍕', action: 'open_app', target: 'zomato' },
      { id: 'swiggy', name: 'Swiggy', tag: '🍔 Food & Instamart', icon: '🍔', action: 'open_app', target: 'swiggy' },
      { id: 'blinkit', name: 'Blinkit', tag: '⚡ 10-Min Groceries', icon: '⚡', action: 'open_app', target: 'blinkit' },
      { id: 'zepto', name: 'Zepto', tag: '🥦 Quick Delivery', icon: '🥦', action: 'open_app', target: 'zepto' },
    ],
  },
  shopping: {
    title: 'Shopping & E-Commerce Apps',
    spokenIntro: 'Here are the shopping apps: Amazon, Flipkart, Myntra, and Meesho. Which one would you like to shop on?',
    apps: [
      { id: 'amazon', name: 'Amazon', tag: '📦 Everything Store', icon: '📦', action: 'open_app', target: 'amazon' },
      { id: 'flipkart', name: 'Flipkart', tag: '🛍️ Big Deals', icon: '🛍️', action: 'open_app', target: 'flipkart' },
      { id: 'myntra', name: 'Myntra', tag: '👗 Fashion Trends', icon: '👗', action: 'open_app', target: 'myntra' },
      { id: 'meesho', name: 'Meesho', tag: '🏷️ Lowest Prices', icon: '🏷️', action: 'open_app', target: 'meesho' },
    ],
  },
  travel: {
    title: 'Cabs, Rides & Transit Apps',
    spokenIntro: 'Here are the ride and travel apps: Uber, Ola, Rapido, and IRCTC. Which one shall I launch?',
    apps: [
      { id: 'uber', name: 'Uber', tag: '🚗 Cabs & Auto', icon: '🚗', action: 'open_app', target: 'uber' },
      { id: 'ola', name: 'Ola', tag: '🚖 Rides & Cabs', icon: '🚖', action: 'open_app', target: 'ola' },
      { id: 'rapido', name: 'Rapido', tag: '🛵 Bike Taxi', icon: '🛵', action: 'open_app', target: 'rapido' },
      { id: 'irctc', name: 'IRCTC', tag: '🚆 Train Tickets', icon: '🚆', action: 'open_app', target: 'irctc' },
    ],
  },
  system: {
    title: 'Mobile Tools & Device Settings',
    spokenIntro: 'Here are your device tools: Settings, Camera, Contacts, Notes, Clock, and Calculator. Which one do you need?',
    apps: [
      { id: 'settings', name: 'Settings', tag: '⚙️ System Config', icon: '⚙️', action: 'open_app', target: 'settings' },
      { id: 'camera', name: 'Camera', tag: '📷 Take Photo', icon: '📷', action: 'open_app', target: 'camera' },
      { id: 'contacts', name: 'Contacts', tag: '👥 Address Book', icon: '👥', action: 'open_app', target: 'contacts' },
      { id: 'notes', name: 'Notes', tag: '📝 Notes App', icon: '📝', action: 'open_app', target: 'notes' },
      { id: 'clock', name: 'Clock / Alarm', tag: '⏰ Alarms & Timers', icon: '⏰', action: 'open_app', target: 'clock' },
      { id: 'calculator', name: 'Calculator', tag: '🔢 Math Tool', icon: '🔢', action: 'open_app', target: 'calculator' },
      { id: 'calendar', name: 'Calendar', tag: '📅 Schedule', icon: '📅', action: 'open_app', target: 'calendar' },
    ],
  },
};

/**
 * Complete Indian Emergency & Public Helplines
 */
export const INDIAN_EMERGENCY_NUMBERS = {
  emergency: '112',
  police: '100',
  ambulance: '108',
  fire: '101',
  women_helpline: '1091',
  child_helpline: '1098',
  cyber_crime: '1930',
  railway_enquiry: '139',
  health_helpline: '1075',
  senior_citizen: '14567',
};

/**
 * Triggers a light tactile vibration
 */
export const triggerVibration = (duration = 100) => {
  try {
    Vibration.vibrate(duration);
  } catch (e) {
    console.warn('Vibration not supported:', e);
  }
};

/**
 * Opens phone dialer with number or contact name
 */
export const makePhoneCall = async (phoneNumberOrName) => {
  let target = (phoneNumberOrName || '').trim();

  // Check if a contact name was provided instead of numbers (e.g. "Rahul", "Mom", "Shrutha")
  if (target && !/^[0-9+*#\s\-()]+$/.test(target)) {
    try {
      const contact = await findContactByName(target);
      if (contact && contact.phoneNumber) {
        target = contact.phoneNumber;
      }
    } catch (e) {}
  }

  let targetNumber = target.toLowerCase();

  // Keyword to Indian emergency number mapping
  if (targetNumber.includes('emergency') || targetNumber === '911' || targetNumber === '112') {
    targetNumber = '112';
  } else if (targetNumber.includes('police') || targetNumber === '100') {
    targetNumber = '100';
  } else if (targetNumber.includes('ambulance') || targetNumber.includes('hospital') || targetNumber === '108') {
    targetNumber = '108';
  } else if (targetNumber.includes('fire') || targetNumber === '101') {
    targetNumber = '101';
  } else if (targetNumber.includes('cyber') || targetNumber === '1930') {
    targetNumber = '1930';
  } else if (targetNumber.includes('women') || targetNumber === '1091') {
    targetNumber = '1091';
  } else if (targetNumber.includes('child') || targetNumber === '1098') {
    targetNumber = '1098';
  } else if (targetNumber.includes('railway') || targetNumber === '139') {
    targetNumber = '139';
  }

  const cleanNumber = targetNumber.replace(/[^0-9+*#]/g, '');
  if (!cleanNumber) {
    Alert.alert('Phone Call', `Could not find phone number for "${phoneNumberOrName}".`);
    return false;
  }

  const url = `tel:${cleanNumber}`;
  try {
    triggerVibration();
    await Linking.openURL(url);
    return true;
  } catch (e) {
    Alert.alert('Error', `Could not initiate call to ${cleanNumber}`);
    return false;
  }
};

/**
 * Opens SMS app with number or contact name
 */
export const sendSms = async (phoneNumberOrName, message = '') => {
  let target = (phoneNumberOrName || '').trim();
  if (target && !/^[0-9+*#\s\-()]+$/.test(target)) {
    try {
      const contact = await findContactByName(target);
      if (contact && contact.phoneNumber) {
        target = contact.phoneNumber;
      }
    } catch (e) {}
  }

  const cleanNumber = target.replace(/[^0-9+*#]/g, '');
  const url = `sms:${cleanNumber}${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(message)}`;
  try {
    triggerVibration();
    await Linking.openURL(url);
    return true;
  } catch (e) {
    Alert.alert('Error', 'Could not open SMS application.');
    return false;
  }
};

/**
 * Opens WhatsApp with message and contact name or phone number
 */
export const sendWhatsAppMessage = async (message = '', phoneNumberOrName = '') => {
  let target = (phoneNumberOrName || '').trim();
  let contactName = target;

  if (target && !/^[0-9+]+$/.test(target)) {
    try {
      const contact = await findContactByName(target);
      if (contact && contact.phoneNumber) {
        target = contact.phoneNumber;
        contactName = contact.name || target;
      }
    } catch (e) {}
  }

  let cleanNumber = target.replace(/[^0-9]/g, '');
  if (cleanNumber.length === 10) {
    cleanNumber = `91${cleanNumber}`;
  }

  const encodedMsg = encodeURIComponent(message || 'Hi!');

  triggerVibration(150);

  // Multi-Scheme WhatsApp Link Candidates
  const whatsappCandidates = cleanNumber
    ? [
        `whatsapp://send?phone=+${cleanNumber}&text=${encodedMsg}`,
        `whatsapp://send?phone=${cleanNumber}&text=${encodedMsg}`,
        `https://wa.me/${cleanNumber}?text=${encodedMsg}`,
        `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodedMsg}`,
      ]
    : [
        `whatsapp://send?text=${encodedMsg}`,
        `https://api.whatsapp.com/send?text=${encodedMsg}`,
      ];

  for (const urlCandidate of whatsappCandidates) {
    try {
      await Linking.openURL(urlCandidate);
      console.log(`💬 [WhatsApp Launcher] Launched via ${urlCandidate}`);
      return true;
    } catch (e) {}
  }

  // Fallback: Android Native Send Intent
  if (Platform.OS === 'android') {
    const androidSendIntent = `intent:#Intent;action=android.intent.action.SEND;type=text/plain;S.android.intent.extra.TEXT=${encodedMsg};package=com.whatsapp;end`;
    try {
      await Linking.openURL(androidSendIntent);
      return true;
    } catch (e) {}
  }

  Alert.alert('WhatsApp Error', `Could not send message to "${contactName || 'recipient'}". Make sure WhatsApp is installed.`);
  return false;
};

/**
 * Opens Google Maps Navigation or Point of Interest
 */
export const openNavigation = async (destination) => {
  if (!destination) return false;
  const encodedQuery = encodeURIComponent(destination);
  const nativeUrl = Platform.OS === 'ios' ? `maps://?q=${encodedQuery}` : `geo:0,0?q=${encodedQuery}`;
  try {
    triggerVibration();
    await Linking.openURL(nativeUrl);
    return true;
  } catch (e) {
    try {
      await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedQuery}`);
      return true;
    } catch (err) {
      Alert.alert('Maps Error', `Could not open navigation for "${destination}"`);
      return false;
    }
  }
};

/**
 * Universal System Settings Launcher with Multi-Intent and Linking.openSettings Fallback
 */
export const openSystemSetting = async (settingType = 'settings') => {
  triggerVibration(100);

  const rawKey = (settingType || '').toLowerCase().replace(/[^a-z0-9_]/g, '');

  if (rawKey === 'screenshot') {
    triggerVibration(150);
    if (Platform.OS === 'android') {
      const screenshotIntents = [
        'intent:#Intent;action=com.android.systemui.screenrecord.TakeScreenshot;end',
        'intent:#Intent;action=android.intent.action.SCREENSHOT;end',
        'intent:#Intent;action=com.samsung.android.capture.Screenshot;end',
      ];
      for (const intentUrl of screenshotIntents) {
        try {
          await Linking.openURL(intentUrl);
          return true;
        } catch (e) {}
      }
    }
    Alert.alert(
      '📸 Capture Screenshot',
      'To capture a screenshot on your phone:\n\n• Press Power + Volume Down buttons together\n• Or swipe down 3 fingers on screen'
    );
    return true;
  }

  if (Platform.OS === 'android') {
    const androidIntents = {
      wifi: [
        'intent:#Intent;action=android.settings.WIFI_SETTINGS;end',
        'intent:#Intent;action=android.settings.WIRELESS_SETTINGS;end',
      ],
      data: [
        'intent:#Intent;action=android.settings.DATA_ROAMING_SETTINGS;end',
        'intent:#Intent;action=android.settings.NETWORK_OPERATOR_SETTINGS;end',
        'intent:#Intent;action=android.settings.WIRELESS_SETTINGS;end',
      ],
      mobile_data: [
        'intent:#Intent;action=android.settings.DATA_ROAMING_SETTINGS;end',
        'intent:#Intent;action=android.settings.NETWORK_OPERATOR_SETTINGS;end',
      ],
      bluetooth: [
        'intent:#Intent;action=android.settings.BLUETOOTH_SETTINGS;end',
      ],
      display: [
        'intent:#Intent;action=android.settings.DISPLAY_SETTINGS;end',
      ],
      sound: [
        'intent:#Intent;action=android.settings.SOUND_SETTINGS;end',
      ],
      battery: [
        'intent:#Intent;action=android.settings.BATTERY_SAVER_SETTINGS;end',
      ],
      location: [
        'intent:#Intent;action=android.settings.LOCATION_SOURCE_SETTINGS;end',
      ],
      gps: [
        'intent:#Intent;action=android.settings.LOCATION_SOURCE_SETTINGS;end',
      ],
      hotspot: [
        'intent:#Intent;action=android.settings.TETHER_SETTINGS;end',
      ],
      storage: [
        'intent:#Intent;action=android.settings.INTERNAL_STORAGE_SETTINGS;end',
      ],
      screenshot: [
        'intent:#Intent;action=android.intent.action.SCREENSHOT;end',
      ],
      settings: [
        'intent:#Intent;action=android.settings.SETTINGS;end',
      ],
    };

    const candidateIntents = androidIntents[rawKey] || androidIntents.settings;

    for (const intentUrl of candidateIntents) {
      try {
        await Linking.openURL(intentUrl);
        console.log(`🚀 [System Setting] Successfully launched ${rawKey} via ${intentUrl}`);
        return true;
      } catch (e) {}
    }

    try {
      await Linking.openSettings();
      console.log(`⚙️ [System Setting] Fallback: Opened device Settings page for ${rawKey}`);
      return true;
    } catch (e) {}
  } else {
    try {
      await Linking.openSettings();
      return true;
    } catch (e) {}
  }
  return false;
};

/**
 * Universal App Launcher supporting 40+ popular apps and System Controls
 */
export const launchApp = async (appName) => {
  if (!appName) return false;

  const raw = appName.trim().toLowerCase();
  const key = raw.replace(/[^a-z0-9]/g, '');

  // 0. Intercept System Settings & Hardware Commands (Wi-Fi, Data, Bluetooth, Battery, Location, Settings)
  const systemToolMap = {
    settings: 'settings',
    wifi: 'wifi',
    internet: 'wifi',
    data: 'data',
    mobiledata: 'data',
    mobile_data: 'data',
    cellular: 'data',
    bluetooth: 'bluetooth',
    camera: 'camera',
    flashlight: 'flashlight',
    torch: 'flashlight',
    flash: 'flashlight',
    display: 'display',
    brightness: 'display',
    sound: 'sound',
    volume: 'sound',
    battery: 'battery',
    location: 'location',
    gps: 'location',
    hotspot: 'hotspot',
    storage: 'storage',
    screenshot: 'screenshot',
  };

  if (systemToolMap[key]) {
    const tool = systemToolMap[key];
    if (tool === 'camera') return await openCamera();
    if (tool === 'flashlight') return await toggleFlashlight(true);
    return await openSystemSetting(tool);
  }

  // 1. Exact or Fuzzy Key lookup in APP_SCHEMES
  let target = APP_SCHEMES[key] || APP_SCHEMES[raw];

  if (!target) {
    const matchedKey = Object.keys(APP_SCHEMES).find(
      (k) => raw.includes(k) || k.includes(raw) || key.includes(k) || k.includes(key)
    );
    if (matchedKey) {
      target = APP_SCHEMES[matchedKey];
    }
  }

  triggerVibration();

  // 2. Try Native Scheme / Package Intent (opens in-app on device)
  if (target?.native) {
    try {
      await Linking.openURL(target.native);
      console.log(`🚀 [App Launcher] Successfully launched native app for "${appName}"`);
      return true;
    } catch (e) {
      console.log(`Native scheme for "${appName}" failed/not installed, trying web fallback`);
    }
  }

  // 3. Try Generic Android Package Intent (e.g. intent:#Intent;package=com.target;end)
  if (Platform.OS === 'android' && key) {
    const genericPackageIntent = `intent:#Intent;package=com.${key};end`;
    try {
      await Linking.openURL(genericPackageIntent);
      console.log(`🚀 [App Launcher] Successfully launched generic package intent for "${key}"`);
      return true;
    } catch (e) {}
  }

  // 4. Try Web Fallback URL (opens app web interface directly)
  if (target?.web) {
    try {
      await Linking.openURL(target.web);
      console.log(`🌐 [App Launcher] Launched web interface for "${appName}"`);
      return true;
    } catch (e) {
      console.warn('Could not open web URL:', e);
    }
  }

  // 5. Fallback: Prevent Google Search for system tools
  const isSystemTool = ['camera', 'settings', 'flashlight', 'torch', 'flash', 'contacts', 'calculator', 'clock', 'alarm', 'wifi', 'data', 'mobile_data', 'bluetooth', 'battery', 'location', 'gps'].includes(key);
  if (isSystemTool) {
    console.log(`System tool "${appName}" intent handled without web search fallback.`);
    return await openSystemSetting(key);
  }

  // Google Search fallback ONLY for unknown web queries
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(appName)}`;
  await Linking.openURL(searchUrl);
  return true;
};

/**
 * Flashlight / Torch Control
 */
export const toggleFlashlight = async (enable = true) => {
  triggerVibration(150);
  if (Platform.OS === 'android') {
    const flashIntents = [
      `intent:#Intent;action=android.master.flashlight.TOGGLE;end`,
      `intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=com.android.camera;end`,
      `intent:#Intent;action=android.media.action.STILL_IMAGE_CAMERA;end`,
    ];
    for (const intentUrl of flashIntents) {
      try {
        await Linking.openURL(intentUrl);
        return true;
      } catch (e) {}
    }
  }
  return false;
};

/**
 * Directly & Silently Creates and Auto-Saves Event to Google Calendar on Device
 */
export const createCalendarEvent = async (title = 'Voice Reminder', dateStr = 'Today', timeStr = 'Anytime') => {
  const cleanTitle = (title || 'Voice Reminder').trim();
  triggerVibration(150);

  // 1. Try Native Direct Calendar Insertion via expo-calendar
  try {
    const Calendar = require('expo-calendar');
    if (Calendar) {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status === 'granted') {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

        // 1. Strict Google Account Search (e.g. com.google / @gmail.com account)
        let targetCal = calendars.find(
          (c) =>
            c.allowsModifications &&
            ((c.source && c.source.type === 'com.google') ||
             (c.source && c.source.name && c.source.name.includes('@')) ||
             (c.ownerAccount && c.ownerAccount.includes('@')) ||
             (c.name && c.name.includes('@')))
        );

        // 2. Secondary Primary Modifiable Calendar
        if (!targetCal) {
          targetCal = calendars.find((c) => c.allowsModifications && c.isPrimary) ||
                      calendars.find((c) => c.allowsModifications) ||
                      calendars[0];
        }

        if (targetCal && targetCal.id) {
          const startDate = new Date();
          const lowerDate = (dateStr || '').toLowerCase();
          if (lowerDate.includes('tomorrow')) {
            startDate.setDate(startDate.getDate() + 1);
          }

          startDate.setHours(9, 0, 0, 0);
          const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

          const eventPayload = {
            title: cleanTitle,
            startDate,
            endDate,
            notes: 'Created automatically by Voice Assistant App',
          };

          const newEventId = await Calendar.createEventAsync(targetCal.id, eventPayload);

          console.log(`✅ [Google Calendar Sync] Saved to Google Account (${targetCal.ownerAccount || targetCal.name}) ID:`, newEventId);
          Alert.alert('Google Calendar Synced 📅', `"${cleanTitle}" saved directly to your Google Account Calendar!`);
          return true;
        }
      }
    }
  } catch (e) {
    console.log('[Google Calendar Direct Sync] Native insert note:', e.message);
  }

  // 2. Guaranteed Fallback: Launch Google Calendar Intent / Template URL
  const encodedTitle = encodeURIComponent(cleanTitle);
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const startIso = `${year}${month}${day}T090000Z`;
  const endIso = `${year}${month}${day}T100000Z`;

  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&dates=${startIso}/${endIso}&details=Created+by+VoiceTaskApp`;

  try {
    if (Platform.OS === 'android') {
      const nativeCalIntents = [
        `intent:#Intent;action=android.intent.action.INSERT;type=vnd.android.cursor.dir/event;S.title=${encodedTitle};end`,
        `content://com.android.calendar/time/`,
        googleCalUrl,
      ];

      for (const intentUrl of nativeCalIntents) {
        try {
          await Linking.openURL(intentUrl);
          return true;
        } catch (e) {}
      }
    } else {
      await Linking.openURL(googleCalUrl);
      return true;
    }
  } catch (e) {}
  return false;
};

/**
 * Opens Google web search
 */
export const searchWeb = async (query) => {
  if (!query) return false;
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  try {
    triggerVibration();
    await Linking.openURL(url);
    return true;
  } catch (e) {
    Alert.alert('Search Error', 'Could not open web browser.');
    return false;
  }
};

/**
 * Opens device settings
 */
export const openDeviceSettings = async () => {
  try {
    triggerVibration();
    await Linking.openSettings();
    return true;
  } catch (e) {
    Alert.alert('Settings Error', 'Could not open device settings.');
    return false;
  }
};

/**
 * Sets an actual alarm on the phone's native Clock application
 */
export const setSystemAlarm = async (timeString = '', label = 'Voice Alarm') => {
  let hour = 7;
  let minute = 0;

  const timeLower = (timeString || '').toLowerCase();
  const match = timeLower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (match) {
    hour = parseInt(match[1], 10);
    minute = match[2] ? parseInt(match[2], 10) : 0;
    const meridiem = match[3] ? match[3].toLowerCase() : (timeLower.includes('pm') ? 'pm' : timeLower.includes('am') ? 'am' : '');
    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
  }

  triggerVibration(150);

  if (Platform.OS === 'android') {
    // Multi-intent OEM Alarm candidate list (Silent + Pre-filled OEM Clock intents)
    const intentCandidates = [
      // 1. Universal Silent Background Intent (skip_ui=true)
      `intent:#Intent;action=android.intent.action.SET_ALARM;i.android.intent.extra.hour=${hour};i.android.intent.extra.minutes=${minute};S.android.intent.extra.message=${encodeURIComponent(label)};B.android.intent.extra.skip_ui=true;end`,
      // 2. Universal Pre-filled Action Intent (opens Clock app pre-set for hour/minute)
      `intent:#Intent;action=android.intent.action.SET_ALARM;i.android.intent.extra.hour=${hour};i.android.intent.extra.minutes=${minute};S.android.intent.extra.message=${encodeURIComponent(label)};end`,
      // 3. Google DeskClock Intent (Pixel, Motorola, OnePlus, Nothing, Nokia)
      `intent:#Intent;action=android.intent.action.SET_ALARM;package=com.google.android.deskclock;i.android.intent.extra.hour=${hour};i.android.intent.extra.minutes=${minute};S.android.intent.extra.message=${encodeURIComponent(label)};end`,
      // 4. Xiaomi / MIUI / HyperOS DeskClock
      `intent:#Intent;action=android.intent.action.SET_ALARM;package=com.android.deskclock;i.android.intent.extra.hour=${hour};i.android.intent.extra.minutes=${minute};S.android.intent.extra.message=${encodeURIComponent(label)};end`,
      // 5. Samsung Clock Package
      `intent:#Intent;action=android.intent.action.SET_ALARM;package=com.sec.android.app.clockpackage;i.android.intent.extra.hour=${hour};i.android.intent.extra.minutes=${minute};S.android.intent.extra.message=${encodeURIComponent(label)};end`,
      // 6. OnePlus DeskClock
      `intent:#Intent;action=android.intent.action.SET_ALARM;package=com.oneplus.deskclock;i.android.intent.extra.hour=${hour};i.android.intent.extra.minutes=${minute};end`,
      // 7. ColorOS / Realme / Oppo Alarm
      `intent:#Intent;action=android.intent.action.SET_ALARM;package=com.coloros.alarm;i.android.intent.extra.hour=${hour};i.android.intent.extra.minutes=${minute};end`,
      // 8. Universal SHOW_ALARMS intent
      `intent:#Intent;action=android.intent.action.SHOW_ALARMS;end`,
    ];

    for (const intentUrl of intentCandidates) {
      try {
        await Linking.openURL(intentUrl);
        console.log(`⏰ [Alarm Engine] Alarm intent launched for ${hour}:${minute}`);
        return true;
      } catch (e) {}
    }
  } else if (Platform.OS === 'ios') {
    try {
      await Linking.openURL('clock-alarm://');
      return true;
    } catch (e) {}
  }

  return false;
};

/**
 * Opens YouTube search directly in YouTube mobile app
 */
export const searchYouTube = async (query = '') => {
  const cleanQuery = (query || '').trim();
  const encoded = encodeURIComponent(cleanQuery);
  const nativeUrl = `vnd.youtube://www.youtube.com/results?search_query=${encoded}`;
  const webUrl = `https://www.youtube.com/results?search_query=${encoded}`;
  try {
    triggerVibration();
    await Linking.openURL(nativeUrl);
    return true;
  } catch (e) {
    try {
      await Linking.openURL(webUrl);
      return true;
    } catch (err) {
      Alert.alert('YouTube Error', `Could not search YouTube for "${cleanQuery}"`);
      return false;
    }
  }
};

/**
 * Opens native Notes / Google Keep app with note content pre-filled
 */
export const createNoteInNotesApp = async (noteContent = '', title = 'To-Do List') => {
  const cleanContent = (noteContent || '').trim();
  triggerVibration(100);

  if (Platform.OS === 'android') {
    // Universal Android intent to share/create note in Keep, Samsung Notes, or default Notes app
    const noteIntent = `intent:#Intent;action=android.intent.action.SEND;type=text/plain;S.android.intent.extra.SUBJECT=${encodeURIComponent(title)};S.android.intent.extra.TEXT=${encodeURIComponent(cleanContent)};end`;
    try {
      await Linking.openURL(noteIntent);
      return true;
    } catch (e) {
      try {
        await Linking.openURL('keep://');
        return true;
      } catch (err) {
        try {
          await Linking.openURL(`https://keep.google.com/#create/${encodeURIComponent(cleanContent)}`);
          return true;
        } catch (error) {
          Alert.alert('Notes Error', 'Could not open notes app on this device.');
          return false;
        }
      }
    }
  } else if (Platform.OS === 'ios') {
    try {
      await Linking.openURL('mobilenotes://');
      return true;
    } catch (e) {
      await Linking.openURL(`https://keep.google.com/`);
      return true;
    }
  }
  return false;
};

/**
 * Opens native Camera on physical device (Expo Go compatible)
 */
export const openCamera = async () => {
  triggerVibration(100);

  // 1. Try Expo ImagePicker (Official Expo Go Native Camera Launcher)
  try {
    const ImagePicker = require('expo-image-picker');
    if (ImagePicker && typeof ImagePicker.launchCameraAsync === 'function') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status === 'granted' || status === 'undetermined') {
        await ImagePicker.launchCameraAsync({
          allowsEditing: false,
          quality: 0.8,
        });
        console.log('[Camera] ImagePicker native camera launched successfully');
        return true;
      }
    }
  } catch (e) {
    console.log('[Camera] ImagePicker launch note:', e.message);
  }

  // 2. Try URI schemes
  if (Platform.OS === 'android') {
    const cameraIntents = [
      'intent:#Intent;action=android.media.action.STILL_IMAGE_CAMERA;end',
      'intent:#Intent;action=android.media.action.IMAGE_CAPTURE;end',
    ];
    for (const camIntent of cameraIntents) {
      try {
        await Linking.openURL(camIntent);
        return true;
      } catch (e) {}
    }
  } else if (Platform.OS === 'ios') {
    try {
      await Linking.openURL('camera://');
      return true;
    } catch (e) {}
  }

  return false;
};

/**
 * Master dispatcher for executing all Mobile OS actions
 */
export const executeOsAction = async (actionData) => {
  if (!actionData) return false;
  const { action, target, payload } = actionData;

  switch (action?.toLowerCase()) {
    case 'call':
      return await makePhoneCall(target || actionData.phoneNumber);
    case 'sms':
    case 'send_sms':
      return await sendSms(target || actionData.phoneNumber, payload || actionData.message);
    case 'whatsapp':
    case 'send_whatsapp_message':
      return await sendWhatsAppMessage(payload || actionData.message || 'Hi!', target || actionData.phoneNumber);
    case 'youtube_search':
    case 'search_youtube':
      return await searchYouTube(target || payload);
    case 'set_alarm':
    case 'alarm':
      return await setSystemAlarm(actionData.time || target || payload, actionData.task || 'Voice Alarm');
    case 'create_note':
    case 'note':
    case 'notes':
      return await createNoteInNotesApp(payload || target || actionData.task, actionData.task || 'Voice Note');
    case 'maps':
    case 'navigate':
      return await openNavigation(target);
    case 'toggle_flash':
    case 'flash':
    case 'flashlight':
    case 'torch':
      return await toggleFlashlight(true);
    case 'toggle_wifi':
    case 'wifi':
    case 'internet':
      return await launchApp('wifi');
    case 'toggle_mobile_data':
    case 'mobile_data':
    case 'data':
      return await launchApp('mobile_data');
    case 'toggle_bluetooth':
    case 'bluetooth':
      return await launchApp('bluetooth');
    case 'screenshot':
    case 'take_screenshot':
      return await launchApp('screenshot');
    case 'toggle_bedtime_mode':
    case 'bedtime_mode':
    case 'bed_mode':
      return await launchApp('display');
    case 'calendar':
    case 'create_calendar_event':
      return await createCalendarEvent(actionData.task || target || 'Voice Reminder', actionData.date || 'Tomorrow', actionData.time || '5:00 PM');
    case 'open_app':
      if ((target || '').toLowerCase() === 'whatsapp' || (target || '').toLowerCase().includes('whatsapp')) {
        return await sendWhatsAppMessage(payload || actionData.message || 'Hi!', actionData.phoneNumber || actionData.contact || actionData.recipient);
      }
      if ((target || '').toLowerCase() === 'camera') {
        return await openCamera();
      }
      if ((target || '').toLowerCase() === 'youtube' && payload) {
        return await searchYouTube(payload);
      }
      if (['flash', 'flashlight', 'torch'].includes((target || '').toLowerCase())) {
        return await toggleFlashlight(true);
      }
      return await launchApp(target);
    case 'web_search':
      return await searchWeb(target || payload);
    case 'settings':
      return await openDeviceSettings();
    default:
      if (target) {
        return await launchApp(target);
      }
      console.warn('Unknown OS action:', action);
      return false;
  }
};
