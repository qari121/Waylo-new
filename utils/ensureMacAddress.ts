import { Alert } from 'react-native';

export function ensureMacAddress(macAddress: string | null | undefined): macAddress is string {
  if (!macAddress) {
    Alert.alert('Device Not Paired', 'Please pair your device and enter a MAC address first.');
    return false;
  }
  return true;
} 