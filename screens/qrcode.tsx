import React, { useState, useRef } from 'react'
import { Pressable, SafeAreaView, StyleSheet, Text, View, Platform, ActivityIndicator, Modal } from 'react-native'
import { useRouter } from 'expo-router'
import { auth, db } from '../firebase'; // adjust path as needed
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useAppDispatch } from '../hooks';
import { toyLogs } from '../slices/logs';
import  Toast  from 'react-native-toast-message';
import { Button } from '../components/ui/button'
import { BackButton } from '../components/ui/back-button'
import { theme } from '../lib/theme'

// Helper to check MAC format: XX:XX:XX:XX:XX:XX, only hex and colons
const isValidMac = (input: string) => {
  return /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(input);
};

export const QRCodeScreen = () => {
  const [scannerVisible, setScannerVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasScanned, setHasScanned] = useState(false);
  const router = useRouter();
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const dispatch = useAppDispatch();

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (hasScanned) return; // Prevent multiple triggers
    // Normalise: strip any non-hex chars then add colons every 2 chars
    let macRaw = data.trim();
    const hexOnly = macRaw.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
    let mac = macRaw.toUpperCase();
    if (hexOnly.length === 12) {
      mac = hexOnly.match(/.{1,2}/g)?.join(':') || mac;
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
        // Check if MAC already saved for this user
        const existingDoc = await getDoc(doc(db,'users', user.uid));
        if (existingDoc.exists()) {
          const prevMac = existingDoc.data()?.mac_address;
          if (prevMac === mac) {
            await AsyncStorage.setItem('macAddress', mac);
            await AsyncStorage.setItem('macAddressEntered', 'true');
            setError('');
            setSuccess('This MAC address is already saved to your account.');
            // preload toy logs
            const pre = await dispatch(toyLogs(mac)).unwrap();
            console.log('[QR] Preloaded toy logs for', mac, 'count:', pre.length);
            setIsSubmitting(false);
            return;
          }
        }
        await setDoc(doc(db, 'users', user.uid), { mac_address: mac }, { merge: true });
        // Update the toy document for this user with the new MAC address
        await setDoc(doc(db, 'toy', user.uid), {
          user_uid: user.uid,
          mac_address: mac,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        await AsyncStorage.setItem('macAddress', mac);
        await AsyncStorage.setItem('macAddressEntered', 'true');
        setError('');
        setSuccess('MAC address saved successfully!');
        // preload toy logs
        const pre2 = await dispatch(toyLogs(mac)).unwrap();
        console.log('[QR] Preloaded toy logs for', mac, 'count:', pre2.length);
      } catch (e) {
        setError('Failed to save MAC address. Please check your internet connection and app permissions.');
        setSuccess('');
        console.error(e);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setError('Scanned code is not a valid MAC address.');
      setSuccess('');
    }
  };

  // Reset hasScanned when opening the scanner
  const openScanner = () => {
    setHasScanned(false);
    setScannerVisible(true);
    setSuccess('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <BackButton />
        <Text style={[styles.headerTitle, { fontFamily: 'PlusJakartaSans_700Bold' }]}>Device Pairing</Text>
        {/* Placeholder for centering */}
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Scan your device's MAC Address</Text>
        <Button
          style={styles.scanButton}
          onPress={openScanner}
          disabled={isSubmitting || scannerVisible}
        >
          <Text style={styles.scanButtonText}>{scannerVisible ? 'Scanning...' : 'Start Scan'}</Text>
        </Button>
        {!!error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        {!!success && !error && (
          <Text style={styles.successText}>{success}</Text>
        )}
        {isSubmitting && <ActivityIndicator style={{ marginTop: 12 }} color={theme.colors.primary} />}
      </View>

      {/* Barcode Scanner Overlay */}
      {scannerVisible && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setScannerVisible(false)}>
          {permission?.granted ? (
            <View style={styles.scannerOverlay}>
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing={'back'}
                onBarcodeScanned={handleBarCodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39', 'code93', 'ean13', 'ean8', 'itf14', 'upc_a', 'upc_e'] }}
              />
              <Button size="sm" style={styles.closeScannerBtn} onPress={() => setScannerVisible(false)}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Cancel</Text>
              </Button>
            </View>
          ) : (
            <View style={styles.scannerOverlay}>
              <Text style={{ color: '#fff', fontSize: 18, marginBottom: 20, fontWeight: 'bold' }}>No access to camera</Text>
              <Button size="sm" style={styles.closeScannerBtn} onPress={requestPermission}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Grant Permission</Text>
              </Button>
              <Button size="sm" style={styles.closeScannerBtn} onPress={() => setScannerVisible(false)}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Close</Text>
              </Button>
            </View>
          )}
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.primary + '08',
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
  headerTitle: {
    fontSize: 18,
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
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 2,
    marginTop: 30,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 18,
    textAlign: 'center',
  },
  scanButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    shadowColor: theme.colors.primary,
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
  successText: {
    color: '#12B76A',
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
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
});

export default QRCodeScreen
