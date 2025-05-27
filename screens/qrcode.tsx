import React, { useState } from 'react'
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import ChevronLeftIcon from '../assets/icons/chevron-left.svg'
import { auth, db } from '../firebase'; // adjust path as needed
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc } from 'firebase/firestore';

// Helper to check MAC format: XX:XX:XX:XX:XX:XX, only hex and colons
const isValidMac = (input: string) => {
  return /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(input);
};

export const QRCodeScreen = () => {
  const [macAddress, setMacAddress] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  // Format MAC as user types: force uppercase, add colons, max 17 chars
  const handleInput = (val: string) => {
    let cleaned = val.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
    let formatted = '';
    for (let i = 0; i < cleaned.length && i < 12; i += 2) {
      if (i > 0) formatted += ':';
      formatted += cleaned.substr(i, 2);
    }
    setMacAddress(formatted);
    setError('');
  };

  const handleSave = async () => {
    if (!isValidMac(macAddress)) {
      setError('Invalid MAC address. Format: XX:XX:XX:XX:XX:XX');
      return;
    }
    try {
      // Save MAC address to the authenticated user's profile
      const user = auth.currentUser;
      if (!user) {
        setError('You must be logged in to save your MAC address.');
        return;
      }
      await setDoc(doc(db, 'users', user.uid), { mac_address: macAddress }, { merge: true });
      await AsyncStorage.setItem('macAddress', macAddress);
      Alert.alert('Saved', 'MAC address saved!');
      setMacAddress('');
      setError('');
    } catch (e) {
      setError('Failed to save MAC address. Please check your internet connection and app permissions.');
      // Optionally log error for debugging
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <ChevronLeftIcon width={28} height={28} />
        </Pressable>
        <Text style={styles.headerTitle}>Device Pairing</Text>
        {/* Placeholder for centering */}
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Enter your MAC Address</Text>
        <TextInput
          style={styles.input}
          value={macAddress}
          onChangeText={handleInput}
          placeholder="e.g. A1:B2:C3:D4:E5:F6"
          autoCapitalize="characters"
          autoCorrect={false}
          keyboardType="default"
          maxLength={17}
        />
        {!!error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F6FF',
  },
  headerRow: {
    width: '100%',
    paddingTop: Platform.OS === 'android' ? 32 : 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'black',
    textAlign: 'center',
    flex: 1,
  },
  card: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#AE9FFF',
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 2,
    marginTop: 30,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7F67FF',
    marginBottom: 18,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F7F6FF',
    borderWidth: 1,
    borderColor: '#E5E1FF',
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 10,
    letterSpacing: 2,
    textAlign: 'center',
    color: '#222',
  },
  errorText: {
    color: '#FF3B3B',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#7F67FF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#AE9FFF',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 2,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default QRCodeScreen
