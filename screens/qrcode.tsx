import React, { useState, useRef } from 'react'
import { Pressable, SafeAreaView, StyleSheet, Text, View, Platform, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import ChevronLeftIcon from '../assets/icons/chevron-left.svg'
import { auth, db } from '../firebase'; // adjust path as needed
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc } from 'firebase/firestore';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

// Helper to check MAC format: XX:XX:XX:XX:XX:XX, only hex and colons
const isValidMac = (input: string) => {
  return /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(input);
};

export const QRCodeScreen = () => {
  const [scannerVisible, setScannerVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hasScanned, setHasScanned] = useState(false);
  const router = useRouter();
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (hasScanned) return; // Prevent multiple triggers
    let mac = data.trim().toUpperCase();
    if (/^[0-9A-F]{12}$/.test(mac)) {
      mac = mac.match(/.{1,2}/g)?.join(':') || mac;
    }
    if (isValidMac(mac)) {
      setHasScanned(true); // Set flag to prevent further scans
      setScannerVisible(false);
      setError('');
      setIsSubmitting(true);
      try {
        const user = auth.currentUser;
        if (!user) {
          setError('You must be logged in to save your MAC address.');
          setIsSubmitting(false);
          return;
        }
        await setDoc(doc(db, 'users', user.uid), { mac_address: mac }, { merge: true });
        await AsyncStorage.setItem('macAddress', mac);
        await AsyncStorage.setItem('macAddressEntered', 'true');
        router.replace('/(private)/');
      } catch (e) {
        setError('Failed to save MAC address. Please check your internet connection and app permissions.');
        console.error(e);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setError('Scanned code is not a valid MAC address.');
    }
  };

  // Reset hasScanned when opening the scanner
  const openScanner = () => {
    setHasScanned(false);
    setScannerVisible(true);
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
        <Text style={styles.cardTitle}>Scan your device's MAC Address</Text>
        <Pressable
          style={styles.scanButton}
          onPress={openScanner}
          disabled={isSubmitting || scannerVisible}
        >
          <Text style={styles.scanButtonText}>{scannerVisible ? 'Scanning...' : 'Start Scan'}</Text>
        </Pressable>
        {!!error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        {isSubmitting && <ActivityIndicator style={{ marginTop: 12 }} color="#7F67FF" />}
      </View>

      {/* Barcode Scanner Overlay */}
      {scannerVisible && permission?.granted && (
        <View style={styles.scannerOverlay}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={'back'}
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39', 'code93', 'ean13', 'ean8', 'itf14', 'upc_a', 'upc_e'] }}
          />
          <Pressable style={styles.closeScannerBtn} onPress={() => setScannerVisible(false)}>
            <Text style={{ color: '#fff', fontSize: 18 }}>Cancel</Text>
          </Pressable>
        </View>
      )}
      {scannerVisible && permission && !permission.granted && (
        <View style={styles.scannerOverlay}>
          <Text style={{ color: '#fff', fontSize: 18, marginBottom: 20 }}>No access to camera</Text>
          <Pressable style={styles.closeScannerBtn} onPress={requestPermission}>
            <Text style={{ color: '#fff', fontSize: 18 }}>Grant Permission</Text>
          </Pressable>
          <Pressable style={styles.closeScannerBtn} onPress={() => setScannerVisible(false)}>
            <Text style={{ color: '#fff', fontSize: 18 }}>Close</Text>
          </Pressable>
        </View>
      )}
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
  scanButton: {
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
    marginBottom: 10,
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  errorText: {
    color: '#FF3B3B',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  camera: {
    width: '90%',
    height: '60%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  closeScannerBtn: {
    marginTop: 20,
    backgroundColor: '#7F67FF',
    padding: 12,
    borderRadius: 8,
  },
});

export default QRCodeScreen
