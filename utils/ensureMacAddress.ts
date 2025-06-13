import { Alert } from 'react-native';

/**
 * Normalise + validate a MAC-address string.
 * – trims whitespace
 * – upper-cases the hex pairs
 * – returns the clean MAC when valid, otherwise `null`
 *
 * Pass `showAlert = true` if you want a single alert the FIRST time
 * the check fails (e.g. in a submit handler).  
 * In render loops keep it `false` so the UI doesn’t flash alerts.
 */
export const ensureMacAddress = (
  raw?: string | null,
  showAlert = false,
): string | null => {
  if (!raw) {
    if (showAlert) {
      Alert.alert('Device not paired', 'Please pair your device and enter a MAC address.');
    }
    return null;
  }

  const mac = raw.trim().toUpperCase();
  const ok = /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(mac);

  if (!ok && showAlert) {
    Alert.alert('Invalid MAC', 'MAC address must look like “AA:BB:CC:DD:EE:FF”.');
  }
  return ok ? mac : null;
};
