import { Platform, Alert } from 'react-native';

let Contacts = null;
try {
  Contacts = require('expo-contacts');
} catch (e) {
  console.log('expo-contacts not loaded');
}

/**
 * Searches the phone's address book for a contact name
 * and retrieves their actual phone number.
 */
export const findContactByName = async (contactName = '') => {
  const cleanName = (contactName || '').trim().toLowerCase();
  if (!cleanName || cleanName === 'emergency' || cleanName === 'police') {
    return null;
  }

  if (Platform.OS === 'web' || !Contacts) {
    return null;
  }

  try {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Contacts permission not granted');
      return null;
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
    });

    if (!data || data.length === 0) {
      return null;
    }

    // 1. Exact Name Match
    let matched = data.find((c) => (c.name || '').toLowerCase() === cleanName);

    // 2. Partial / First Name Match (e.g. "Rahul" matches "Rahul Sharma")
    if (!matched) {
      matched = data.find((c) => {
        const full = (c.name || '').toLowerCase();
        const first = (c.firstName || '').toLowerCase();
        return full.includes(cleanName) || first === cleanName;
      });
    }

    if (matched && matched.phoneNumbers && matched.phoneNumbers.length > 0) {
      const rawNumber = matched.phoneNumbers[0].number || '';
      const cleanPhone = rawNumber.replace(/[^\d+]/g, '');
      return {
        name: matched.name || contactName,
        phoneNumber: cleanPhone,
      };
    }
  } catch (err) {
    console.warn('Error querying phone contacts:', err);
  }

  return null;
};
