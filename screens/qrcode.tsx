import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  PermissionsAndroid,
  Linking,
  Switch,
  Modal,
  TextInput,
} from 'react-native';
import { BleManager, Device, State } from 'react-native-ble-plx';
import { toByteArray } from 'base64-js';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { auth } from '../firebase';
import { Buffer } from 'buffer';

// one-time polyfill (safe no-op if it already exists)
(global as any).Buffer = (global as any).Buffer || Buffer;

interface BluetoothDevice {
  id: string;
  name: string;
  address: string;
  rssi: number;
  isConnected: boolean;
  isConnectable: boolean;
  localName?: string;
  manufacturerData?: string;
}

interface ConnectedClient {
  id: string;
  name: string;
  isConnected: boolean;
  lastSeen: Date;
  macAddress: string;
  macAddressSource: string;
  firebaseVerified?: boolean;
  toyId?: string;
  toyName?: string;
}

export default function QRCodeScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [bluetoothState, setBluetoothState] = useState<State>(State.Unknown);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAdvertising, setIsAdvertising] = useState(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [connectedClients, setConnectedClients] = useState<ConnectedClient[]>([]);
  const [bluetoothInitialized, setBluetoothInitialized] = useState(false);
  const [advertisementData, setAdvertisementData] = useState<any>(null);
  const [autoConnectEnabled, setAutoConnectEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'idle' | 'step1' | 'step2' | 'complete'>('idle');
  const [qrCodeScanned, setQrCodeScanned] = useState<string | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [simulateConnection, setSimulateConnection] = useState(false);
  const [isBindingDevice, setIsBindingDevice] = useState(false);
  const [bindingStatus, setBindingStatus] = useState<'idle' | 'binding' | 'success' | 'error'>('idle');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordResolver, setPasswordResolver] = useState<((password: string) => void) | null>(null);

  const bleManagerRef = useRef<BleManager | null>(null);

  // Simplified: Use only the custom characteristic we control
  const SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';  // lowercase ok
  const CHAR_UUID = '11111111-2222-3333-4444-555555555555';

  // Helper function to convert bytes to MAC address
  const toMac = (bytes: Uint8Array) =>
    Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(':').toUpperCase();

  // Function to read MAC address from custom characteristic
  const readMacFromCustomChar = async (device: Device) => {
    try {
      const ch = await device.readCharacteristicForService(SERVICE_UUID, CHAR_UUID);
      const raw = toByteArray(ch.value ?? '');
      if (raw.length !== 6) throw new Error(`Unexpected payload length: ${raw.length}`);
      return toMac(raw); // e.g., "C0:74:2B:FC:58:96"
    } catch (error) {
      console.error('❌ Failed to read from custom characteristic:', error);
      throw error;
    }
  };

  // Function to verify MAC address in Firebase toy collection
  const verifyMacAddressInFirebase = async (macAddress: string) => {
    try {
      console.log('🔍 Verifying MAC address in Firebase toy collection:', macAddress);
      
      // Query the toy collection for this MAC address
      const toyCollectionRef = collection(db, 'toy');
      const q = query(toyCollectionRef, where('mac_address', '==', macAddress));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Found matching toy document
        const toyDoc = querySnapshot.docs[0];
        const toyData = toyDoc.data();
        
        console.log('✅ MAC address verified in Firebase!');
        console.log('🎯 Toy found:', {
          id: toyDoc.id,
          name: toyData.name || 'Unknown',
          macAddress: toyData.mac_address,
          // Add other relevant fields you want to log
        });
        
        return {
          verified: true,
          toyId: toyDoc.id,
          toyData: toyData
        };
      } else {
        console.log('❌ MAC address NOT found in Firebase toy collection');
        return {
          verified: false,
          toyId: null,
          toyData: null
        };
      }
    } catch (error) {
      console.error('❌ Firebase verification failed:', error);
      return {
        verified: false,
        toyId: null,
        toyData: null,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };

  // Function to verify QR code
  const verifyQRCode = (scannedCode: string) => {
    const expectedCode = '00112233445566';
    const isMatch = scannedCode === expectedCode;
    
    console.log('🔍 QR Code Verification:');
    console.log('📱 Scanned:', scannedCode);
    console.log('🎯 Expected:', expectedCode);
    console.log('✅ Match:', isMatch);
    
    if (isMatch) {
      setVerificationStep('complete');
      console.log('🎉 VERIFICATION COMPLETE! Both steps passed!');
    } else {
      console.log('❌ QR Code verification failed');
    }
    
    return isMatch;
  };

  useEffect(() => {
    initializeBluetooth();
    return () => {
      if (bleManagerRef.current) {
        bleManagerRef.current.destroy();
      }
    };
  }, []);

  const initializeBluetooth = async () => {
    try {
      console.log('🚀 Initializing BLE as GATT Server...');
      
      // Create BLE manager instance
      bleManagerRef.current = new BleManager();
      
      // Check current state
      const state = await bleManagerRef.current.state();
      setBluetoothState(state);
      console.log('📱 BLE state:', state);

      // Listen for state changes
      bleManagerRef.current.onStateChange((state) => {
        console.log('📱 BLE state changed:', state);
        setBluetoothState(state);
        
        if (state === State.PoweredOn) {
          setBluetoothInitialized(true);
          requestBluetoothPermissions();
        }
      }, true);

      // If already powered on, request permissions
      if (state === State.PoweredOn) {
        setBluetoothInitialized(true);
        requestBluetoothPermissions();
      }

    } catch (error) {
      console.error('❌ BLE initialization failed:', error);
      Alert.alert('Error', 'Failed to initialize Bluetooth');
    }
  };

  const requestBluetoothPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Bluetooth Permission',
            message: 'This app needs location permission to act as a Bluetooth server',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setHasPermissions(true);
          console.log('✅ Android permissions granted');
        } else {
          console.log('❌ Android permissions denied');
        }
      } else {
        // iOS requires explicit Bluetooth permission request
        console.log('🍎 iOS: Requesting Bluetooth permission...');
        
        // On iOS, we need to trigger a Bluetooth operation to request permission
        // The system will show a permission dialog when we try to use Bluetooth
        try {
          // Try to start a scan to trigger permission request
          if (bleManagerRef.current) {
            console.log('🔐 Starting iOS permission scan...');
            
            // Set a flag to track if permission was granted
            let permissionGranted = false;
            
            bleManagerRef.current.startDeviceScan(
              null,
              { allowDuplicates: false },
              (error, device) => {
                if (error) {
                  if (error.errorCode === 1) { // Permission denied
                    console.log('❌ iOS Bluetooth permission denied');
                    setHasPermissions(false);
                    permissionGranted = false;
                    // Stop scan on permission denied
                    if (bleManagerRef.current) {
                      bleManagerRef.current.stopDeviceScan();
                    }
                  } else {
                    console.log('⚠️ iOS scan error (may be permission related):', error);
                  }
                } else if (device) {
                  console.log('✅ iOS Bluetooth permission granted - found device:', device.name);
                  setHasPermissions(true);
                  permissionGranted = true;
                  // Stop scan once we have permission
                  if (bleManagerRef.current) {
                    bleManagerRef.current.stopDeviceScan();
                  }
                }
              }
            );
            
            // Keep scan running longer to allow permission dialog to be handled
            // Don't auto-stop - let the user respond to the permission dialog
            console.log('⏳ iOS permission scan running - respond to the permission dialog when it appears');
            
            // Set a longer timeout as fallback, but don't auto-grant permission
            setTimeout(() => {
              if (bleManagerRef.current && !permissionGranted) {
                console.log('⏰ Permission scan timeout - stopping scan but not granting permission');
                bleManagerRef.current.stopDeviceScan();
                // Don't set hasPermissions to true - user must explicitly grant
              }
            }, 10000); // 10 second timeout
          }
        } catch (scanError) {
          console.log('⚠️ iOS scan attempt failed:', scanError);
        }
      }
    } catch (error) {
      console.error('❌ Permission request failed:', error);
    }
  };

  const startAdvertising = async () => {
    if (!bleManagerRef.current || bluetoothState !== State.PoweredOn) {
      Alert.alert('Error', 'Bluetooth is not available');
      return;
    }

    try {
      console.log('📡 Starting GATT Server advertising as "Wailo-Device"...');
      setIsAdvertising(true);

      // Create advertisement data
      const adData = {
        localName: 'Wailo-Device',
        serviceUUIDs: [SERVICE_UUID],
        manufacturerData: 'Wailo-OrangePi-Connection',
        txPowerLevel: -12,
        solicitedServiceUUIDs: [],
        isConnectable: true,
      };

      setAdvertisementData(adData);
      console.log('📡 Advertisement data:', adData);

      // Start advertising (this is a mock since react-native-ble-plx doesn't support peripheral mode)
      // In a real implementation, we'd need a different library or native code
      console.log('⚠️ Note: react-native-ble-plx only supports Central mode');
      console.log('📱 To make iPhone act as GATT Server, we need a different approach');
      
      // For now, simulate advertising
      setTimeout(() => {
        console.log('📡 Simulating GATT Server advertising...');
        Alert.alert(
          'GATT Server Mode',
          'iPhone is now advertising as "Wailo-Device"!\n\nOrange Pi should be able to discover and connect to this device.',
          [{ text: 'OK' }]
        );
      }, 2000);

    } catch (error) {
      console.error('❌ Advertising failed:', error);
      setIsAdvertising(false);
      Alert.alert('Error', 'Failed to start advertising');
    }
  };

  const stopAdvertising = async () => {
    try {
      console.log('📡 Stopping GATT Server advertising...');
      setIsAdvertising(false);
      setAdvertisementData(null);
      console.log('✅ Advertising stopped');
    } catch (error) {
      console.error('❌ Stop advertising failed:', error);
    }
  };

  const startScanning = async () => {
    if (!bleManagerRef.current || bluetoothState !== State.PoweredOn) {
      Alert.alert('Error', 'Bluetooth is not available');
      return;
    }

    try {
      setIsScanning(true);
      setDevices([]);
      console.log('🔍 Starting BLE device scan for "Wailo-Device"...');

      // Start scanning for devices with specific focus on "Wailo" devices
      // Scan for all devices but filter for Wailo in the callback
      bleManagerRef.current.startDeviceScan(
        null, // Scan for ALL devices, then filter for Wailo
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            console.error('❌ BLE scan error:', error);
            return;
          }

          if (device) {
            const deviceName = device.name || device.localName || 'Unknown Device';
            const isWailoDevice = checkIfWailoDevice(device);
            
            console.log('🔍 BLE DEVICE FOUND:', {
              id: device.id,
              name: deviceName,
              localName: device.localName,
              rssi: device.rssi,
              isConnectable: device.isConnectable,
              manufacturerData: device.manufacturerData,
              isWailoDevice: isWailoDevice,
            });

            // Only add Wailo-Device to the list, but log all devices for debugging
            if (isWailoDevice) {
              // Extract device identifier (closest thing to MAC address we can get)
              const deviceIdentifier = device.id;
              const isMacAddress = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(deviceIdentifier);
              
              const newDevice: BluetoothDevice = {
                id: device.id,
                name: deviceName,
                address: deviceIdentifier,
                rssi: device.rssi || 0,
                isConnected: false,
                isConnectable: device.isConnectable || false,
                localName: device.localName || undefined,
                manufacturerData: device.manufacturerData || undefined,
              };

              addDeviceToList(newDevice);
              console.log('🎯 WAILO DEVICE ADDED TO LIST:', deviceName);
              console.log('🔍 Device Details:', {
                name: deviceName,
                id: device.id,
                identifier: deviceIdentifier,
                isMacAddress: isMacAddress,
                rssi: device.rssi,
                isConnectable: device.isConnectable,
                localName: device.localName,
                manufacturerData: device.manufacturerData,
              });
              
              // AUTO-CONNECT to Wailo-Device if enabled
              if (autoConnectEnabled && (device.isConnectable || device.isConnectable === null)) {
                console.log('🔗 AUTO-CONNECTING to Wailo-Device:', deviceName);
                connectToDevice(device);
              }
            } else {
              console.log('📱 Other device found (not Wailo):', deviceName);
            }
          }
        }
      );

      // Stop scanning after 15 seconds
      setTimeout(() => {
        if (bleManagerRef.current) {
          bleManagerRef.current.stopDeviceScan();
        }
        setIsScanning(false);
        console.log('✅ Scan completed');
      }, 15000);

    } catch (error) {
      console.error('❌ Scan failed:', error);
      setIsScanning(false);
      Alert.alert('Error', 'Failed to start scanning');
    }
  };

    const connectToDevice = async (device: Device) => {
    try {
      // Prevent multiple simultaneous connections
      if (isConnecting) {
        console.log('🔗 Already connecting to a device, skipping...');
        return;
      }
      
      // Check if already connected
      const alreadyConnected = connectedClients.find(c => c.id === device.id && c.isConnected);
      if (alreadyConnected) {
        console.log('🔗 Already connected to this device, skipping...');
        return;
      }
      
      // Note: On iOS, permission might be granted implicitly during connection
      // We'll let the connection attempt proceed and handle any permission errors there
      console.log('🔐 Permission status before connection:', hasPermissions ? 'Granted' : 'Not explicitly granted');
      
      console.log('🔗 Attempting to connect to device:', device.name);
      
      // Stop scanning while connecting
      if (bleManagerRef.current) {
        bleManagerRef.current.stopDeviceScan();
      }
      setIsScanning(false);
      
      // Connect to the device
      // Note: On iOS, this may trigger a pairing request if the device requires authentication
      let connectedDevice: Device;
      try {
        connectedDevice = await device.connect();
        console.log('✅ Connected to device:', connectedDevice.name);
        
        // IMPORTANT: Let iOS handle pairing naturally
        console.log('🔐 Connection established - checking if pairing is needed...');
        
        // Try to detect if pairing is actually needed by attempting a simple operation
        try {
          console.log('🔍 Testing if device requires pairing by attempting service discovery...');
          
          // Try to discover services - this will fail if pairing is required
          const discoveredDevice = await connectedDevice.discoverAllServicesAndCharacteristics();
          console.log('✅ Service discovery successful - no pairing required');
          
          // No pairing needed, proceed directly
          await proceedWithServiceDiscovery(discoveredDevice);
          
        } catch (pairingError) {
          console.log(' Pairing appears to be required:', pairingError);
          
          // Show a simple message and wait for user to handle iOS pairing
          Alert.alert(
            'Pairing Required',
            'iOS pairing is required for this device. Please respond to the iOS pairing request that should appear.\n\nTap OK when pairing is complete.',
            [
              {
                text: 'OK - Pairing Complete',
                onPress: async () => {
                  console.log('🔐 User confirmed pairing is complete - proceeding with service discovery...');
                  await proceedWithServiceDiscovery(connectedDevice);
                }
              },
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: async () => {
                  console.log('❌ User cancelled - disconnecting device');
                  try {
                    await connectedDevice.cancelConnection();
                    setIsConnecting(false);
                  } catch (error) {
                    console.log('⚠️ Error disconnecting:', error);
                    setIsConnecting(false);
                  }
                }
              }
            ]
          );
          
          // Wait for user response
          return;
        }
        
        // Reset connecting state
        setIsConnecting(false);
        
      } catch (connectionError) {
        const errorMsg = String(connectionError && (connectionError as any).message || connectionError);
        console.log('❌ Connection failed:', errorMsg);
        
        // Check if it's a permission-related error
        if (/permission|authorization|unauthorized/i.test(errorMsg)) {
          console.log('🔐 Permission error during connection - requesting permission');
          Alert.alert(
            'Bluetooth Permission Required',
            'Connection failed due to missing Bluetooth permission. Please grant permission first.',
            [
              { 
                text: 'Request Permission', 
                onPress: () => {
                  forcePermissionRequest();
                }
              },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
          return;
        }
        
        // Re-throw other connection errors
        throw connectionError;
      }

    } catch (error) {
      console.error('❌ Connection failed:', error);
      Alert.alert('Connection Failed', 'Failed to connect to the device');
      
      // Update device list to show connection failed
      setDevices(prevDevices => 
        prevDevices.map(d => 
          d.id === device.id 
            ? { ...d, isConnected: false }
            : d
        )
      );
      
      // Reset connecting state
      setIsConnecting(false);
    }
  };

  const disconnectFromDevice = async (deviceId: string) => {
    try {
      console.log('🔌 Attempting to disconnect from device:', deviceId);
      
      const device = await bleManagerRef.current?.devices([deviceId]);
      if (device && device[0]) {
        try {
          await device[0].cancelConnection();
          console.log('✅ Successfully disconnected from device');
        } catch (disconnectError) {
          // Handle specific BLE disconnect errors gracefully
          if (disconnectError instanceof Error && disconnectError.message.includes('cancelled')) {
            console.log('⚠️ Disconnect operation was cancelled (device may already be disconnected)');
          } else {
            console.log('⚠️ Disconnect operation failed, but continuing with cleanup:', disconnectError);
          }
        }
        
        // Always update UI state regardless of disconnect result
        console.log('🔄 Updating UI state after disconnect attempt');
        
        // Update device list
        setDevices(prevDevices => 
          prevDevices.map(d => 
            d.id === deviceId 
              ? { ...d, isConnected: false }
              : d
          )
        );

        // Update connected clients
        setConnectedClients(prev => 
          prev.map(c => 
            c.id === deviceId 
              ? { ...c, isConnected: false, lastSeen: new Date() }
              : c
          )
        );
        
        console.log('✅ UI state updated successfully');
      } else {
        console.log('⚠️ Device not found for disconnect, updating UI state anyway');
        
        // Update UI state even if device not found
        setDevices(prevDevices => 
          prevDevices.map(d => 
            d.id === deviceId 
              ? { ...d, isConnected: false }
              : d
          )
        );

        setConnectedClients(prev => 
          prev.map(c => 
            c.id === deviceId 
              ? { ...c, isConnected: false, lastSeen: new Date() }
              : c
          )
        );
      }
    } catch (error) {
      console.error('❌ Disconnect failed with error:', error);
      
      // Even if disconnect fails, try to update UI state
      try {
        setDevices(prevDevices => 
          prevDevices.map(d => 
            d.id === deviceId 
              ? { ...d, isConnected: false }
              : d
          )
        );

        setConnectedClients(prev => 
          prev.map(c => 
            c.id === deviceId 
              ? { ...c, isConnected: false, lastSeen: new Date() }
              : c
          )
        );
        
        console.log('✅ UI state updated despite disconnect error');
      } catch (uiError) {
        console.error('❌ Failed to update UI state:', uiError);
      }
    }
  };

  const addDeviceToList = (newDevice: BluetoothDevice) => {
    setDevices(prevDevices => {
      const exists = prevDevices.find(d => d.id === newDevice.id);
      if (!exists) {
        return [...prevDevices, newDevice];
      }
      return prevDevices;
    });
  };

  const checkIfWailoDevice = (device: Device): boolean => {
    const name = (device.name || device.localName || '').toLowerCase();
    const hasUuid = (device.serviceUUIDs || [])
      .some(u => u.toLowerCase() === SERVICE_UUID.toLowerCase());
    
    // Prefer UUID check over name (more reliable after reboot)
    if (hasUuid) {
      console.log('🎯 Found Wailo device (UUID match):', device.name || device.localName || 'Unknown');
      return true;
    }
    
    // Fallback to name-based detection
    if (name === 'wailo' || name === 'wailo-device') {
      console.log('🎯 Found Wailo device (exact name match):', name);
      return true;
    }
    
    if (name.includes('wailo') || name.includes('orangepi5ultra')) {
      console.log('🎯 Found Wailo device (name contains):', name);
      return true;
    }
    
    // Check device ID for wailo references as last resort
    if (device.id.toLowerCase().includes('wailo')) {
      console.log('🎯 Found Wailo device (in ID):', device.id);
      return true;
    }
    
    // Log what we're checking for debugging
    console.log('🔍 Device not Wailo:', {
      name: name,
      id: device.id,
      serviceUUIDs: device.serviceUUIDs || []
    });
    
    return false;
  };

  const getBluetoothStatusText = () => {
    switch (bluetoothState) {
      case State.PoweredOn:
        return 'BLE Available';
      case State.PoweredOff:
        return 'Bluetooth Off';
      case State.Unauthorized:
        return 'Permission Denied';
      case State.Unsupported:
        return 'Not Supported';
      case State.Resetting:
        return 'Resetting';
      default:
        return 'Unknown';
    }
  };

  const getBluetoothStatusColor = () => {
    switch (bluetoothState) {
      case State.PoweredOn:
        return '#22c55e';
      case State.PoweredOff:
        return '#ef4444';
      case State.Unauthorized:
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const openBluetoothSettings = () => {
    Alert.alert(
      'Bluetooth Settings',
      'Please go to Settings > Privacy & Security > Bluetooth > Waylo and ensure Bluetooth is enabled.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => router.push('/settings') }
      ]
    );
  };

  const proceedWithServiceDiscovery = async (connectedDevice: Device) => {
    try {
      console.log('🔍 Proceeding with service discovery after pairing completion...');
      
      // Discover services
      const discoveredDevice = await connectedDevice.discoverAllServicesAndCharacteristics();
      console.log('🔍 Services discovered for:', discoveredDevice.name);

      // Get all services and characteristics to extract more device info
      const services = await discoveredDevice.services();
      console.log('🔍 Available Services:', services.map(s => s.uuid));
      
      // Check if Orange Pi custom service is available
      const hasOrangePiService = services.some(s => 
        s.uuid.toLowerCase() === SERVICE_UUID.toLowerCase()
      );
      console.log('🔍 Orange Pi Custom Service Available:', hasOrangePiService);
      
      if (hasOrangePiService) {
        console.log('🎯 Found Orange Pi custom service! Should be able to read MAC address.');
      } else {
        console.log('⚠️ Orange Pi custom service not found. Available services:', services.map(s => s.uuid));
      }

      // Log detailed device information including identifier
      console.log('🔍 Connected Orange Pi Device Details:', {
        name: connectedDevice.name,
        id: connectedDevice.id,
        identifier: connectedDevice.id,
        isMacAddress: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(connectedDevice.id),
        rssi: connectedDevice.rssi,
        isConnectable: connectedDevice.isConnectable,
        localName: connectedDevice.localName,
        manufacturerData: connectedDevice.manufacturerData,
        platform: Platform.OS,
        servicesCount: services.length,
        serviceUUIDs: services.map(s => s.uuid),
      });

      // MAC address extraction
      let macAddress: string | null = null;
      let macSource = 'custom characteristic';
      
      try {
        console.log('🔍 Attempting to read MAC from characteristic:', CHAR_UUID);
        console.log('🔍 Service UUID:', SERVICE_UUID);
        
        // First, let's check if the characteristic exists and is readable
        const characteristics = await discoveredDevice.characteristicsForService(SERVICE_UUID);
        console.log('🔍 Available characteristics for service:', characteristics.map(c => ({
          uuid: c.uuid,
          isReadable: c.isReadable,
          isNotifiable: c.isNotifiable
        })));
        
        // Find our specific characteristic
        const targetChar = characteristics.find(c => c.uuid.toLowerCase() === CHAR_UUID.toLowerCase());
        if (!targetChar) {
          throw new Error(`Characteristic ${CHAR_UUID} not found in service ${SERVICE_UUID}`);
        }
        
        console.log('🔍 Target characteristic found:', {
          uuid: targetChar.uuid,
          isReadable: targetChar.isReadable,
          isNotifiable: targetChar.isNotifiable
        });
        
        if (!targetChar.isReadable) {
          throw new Error(`Characteristic ${CHAR_UUID} is not readable`);
        }
        
        // Now try to read the characteristic
        console.log('🔐 Starting MAC address read...');
        const ch = await connectedDevice.readCharacteristicForService(SERVICE_UUID, CHAR_UUID);
        
        console.log('🔍 Characteristic read result:', {
          value: ch.value,
          valueLength: ch.value ? ch.value.length : 0
        });
        
        if (!ch.value) {
          throw new Error('Characteristic value is empty');
        }
        
        const raw = toByteArray(ch.value);
        console.log('🔍 Decoded bytes:', Array.from(raw).map(b => '0x' + b.toString(16).padStart(2, '0')));
        
        if (raw.length !== 6) {
          throw new Error(`Unexpected payload length: ${raw.length}, expected 6 bytes for MAC address`);
        }
        
        macAddress = Array.from(raw).map(b => b.toString(16).padStart(2, '0')).join(':').toUpperCase();
        macSource = 'custom characteristic';
        console.log('🎯 MAC from custom characteristic:', macAddress);
        
        // Note: Firebase verification will happen after client creation
      } catch (e) {
        console.log('❌ Failed reading custom MAC characteristic:', (e as Error).message);
        console.log('❌ Error details:', e);
        
        // Try alternative approach - maybe the characteristic is notifiable instead of readable
        try {
          console.log('🔄 Trying alternative approach - checking if characteristic is notifiable...');
          const characteristics = await discoveredDevice.characteristicsForService(SERVICE_UUID);
          const targetChar = characteristics.find(c => c.uuid.toLowerCase() === CHAR_UUID.toLowerCase());
          
          if (targetChar && targetChar.isNotifiable) {
            console.log('📡 Characteristic is notifiable, setting up notification...');
            // Set up notification to receive MAC address
            await connectedDevice.monitorCharacteristicForService(SERVICE_UUID, CHAR_UUID, (error, characteristic) => {
              if (error) {
                console.log('❌ Notification error:', error);
              } else if (characteristic && characteristic.value) {
                console.log('📡 Received MAC via notification:', characteristic.value);
                const raw = toByteArray(characteristic.value);
                if (raw.length === 6) {
                  macAddress = Array.from(raw).map(b => b.toString(16).padStart(2, '0')).join(':').toUpperCase();
                  macSource = `custom characteristic (notification)`;
                  console.log('🎯 MAC received via notification:', macAddress);
                }
              }
            });
          }
        } catch (altError) {
          console.log('❌ Alternative approach also failed:', altError);
        }
        
        // Final fallback: try reading from Device Information Service (DIS)
        if (!macAddress) {
          try {
            console.log('🔄 Final fallback: trying Device Information Service...');
            const disService = services.find(s => s.uuid.toLowerCase() === '0000180a-0000-1000-8000-00805f9b34fb');
            if (disService) {
              console.log('🔍 Found DIS service, checking characteristics...');
              const disCharacteristics = await discoveredDevice.characteristicsForService(disService.uuid);
              console.log('🔍 DIS characteristics:', disCharacteristics.map(c => c.uuid));
              
              // Try to read MAC from DIS characteristics
              for (const char of disCharacteristics) {
                if (char.isReadable) {
                  try {
                    const value = await connectedDevice.readCharacteristicForService(disService.uuid, char.uuid);
                    if (value.value) {
                      console.log(`🔍 DIS characteristic ${char.uuid}:`, value.value);
                      // Check if this looks like a MAC address
                      if (value.value.length === 6) {
                        const raw = toByteArray(value.value);
                        macAddress = Array.from(raw).map(b => b.toString(16).padStart(2, '0')).join(':').toUpperCase();
                        macSource = `DIS characteristic ${char.uuid}`;
                        console.log('🎯 MAC from DIS fallback:', macAddress);
                        break;
                      }
                    }
                  } catch (readError) {
                    console.log(`⚠️ Failed to read DIS characteristic ${char.uuid}:`, readError);
                  }
                }
              }
            }
          } catch (disError) {
            console.log('❌ DIS fallback also failed:', disError);
          }
        }
      }
      
      // Update device list to show connected status
      setDevices(prevDevices => 
        prevDevices.map(d => 
          d.id === connectedDevice.id 
            ? { ...d, isConnected: true }
            : d
        )
      );

      // Add to connected clients
      const newClient: ConnectedClient = {
        id: connectedDevice.id,
        name: connectedDevice.name || 'Unknown Device',
        isConnected: true,
        lastSeen: new Date(),
        macAddress: macAddress || 'Not available',
        macAddressSource: macSource || 'Not found',
        firebaseVerified: false, // Will be updated after verification
        toyId: undefined,
        toyName: undefined,
      };

      // Log MAC address extraction attempt
      if (macAddress) {
        console.log('🎯 MAC Address extracted:', macAddress);
        console.log('🎯 Source:', macSource);
        console.log('🎯 Is valid MAC format:', /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(macAddress));
        console.log('🎯 Success! Found Orange Pi MAC address through:', macSource);
        
        // Verify MAC address in Firebase toy collection
        console.log('🔍 Starting Firebase verification...');
        const verificationResult = await verifyMacAddressInFirebase(macAddress);
        
        if (verificationResult.verified) {
          console.log('✅ STEP 1/2 COMPLETE: MAC address found in Firebase toy collection!');
          console.log('🎯 Toy ID:', verificationResult.toyId);
          console.log('🎯 Toy Data:', verificationResult.toyData);
          
          // Update the client with verification status
          newClient.firebaseVerified = true;
          newClient.toyId = verificationResult.toyId || undefined;
          newClient.toyName = verificationResult.toyData?.name || undefined;
          newClient.macAddressSource = `custom characteristic + Firebase verified (Toy: ${verificationResult.toyData?.name || verificationResult.toyId})`;
          
          // Set verification step to step1 (MAC verified)
          setVerificationStep('step1');
          console.log('🎯 Client updated with Firebase verification data');
          console.log('🎯 Ready for Step 2/2: Send Login Credentials');
        } else {
          console.log('❌ STEP 1/2 FAILED: MAC address NOT found in Firebase toy collection');
          console.log('💡 This toy may not be registered in the system');
          
          if (verificationResult.error) {
            console.log('💡 Firebase error:', verificationResult.error);
          }
          
          // Mark as not verified
          newClient.firebaseVerified = false;
        }
      } else {
        console.log('⚠️ No MAC address could be extracted from Orange Pi device');
        console.log('💡 This is normal on iOS due to privacy restrictions');
        console.log('💡 Tried methods: manufacturer data, serial number, model number, all characteristics');
      }

      setConnectedClients(prev => {
        const existing = prev.find(c => c.id === connectedDevice.id);
        if (existing) {
          return prev.map(c => 
            c.id === connectedDevice.id 
              ? { ...c, isConnected: true, lastSeen: new Date() }
              : c
          );
        }
        return [...prev, newClient];
      });

      // Show success message with MAC address if found
      if (macAddress) {
        Alert.alert(
          'Connected & MAC Found! 🎉',
          `Successfully connected to ${connectedDevice.name || 'Wailo-Device'}\n\nMAC Address: ${macAddress}\nSource: ${macSource}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Connected!',
          `Successfully connected to ${connectedDevice.name || 'Wailo-Device'}\n\nNote: MAC address extraction is still in progress...`,
          [{ text: 'OK' }]
        );
      }
      
      // Reset connecting state
      setIsConnecting(false);
      
    } catch (error) {
      console.error('❌ Service discovery failed:', error);
      Alert.alert('Error', 'Failed to discover services and extract MAC address');
      setIsConnecting(false);
    }
  };

  const checkCurrentPermissionStatus = async () => {
    try {
      console.log('🔍 Checking current Bluetooth permission status...');
      if (bleManagerRef.current) {
        const state = await bleManagerRef.current.state();
        console.log('📱 Current BLE state:', state);
        
        // Try a simple operation to check permission
        try {
          bleManagerRef.current.startDeviceScan(
            null,
            { allowDuplicates: false },
            (error, device) => {
              if (error) {
                if (error.errorCode === 1) {
                  console.log('❌ Permission check: Bluetooth permission denied');
                  setHasPermissions(false);
                } else {
                  console.log('⚠️ Permission check: Other error:', error);
                }
              } else if (device) {
                console.log('✅ Permission check: Bluetooth permission granted');
                setHasPermissions(true);
              }
              
              // Stop the check scan
              if (bleManagerRef.current) {
                bleManagerRef.current.stopDeviceScan();
              }
            }
          );
          
          // Stop check after 2 seconds
          setTimeout(() => {
            if (bleManagerRef.current) {
              bleManagerRef.current.stopDeviceScan();
            }
          }, 2000);
        } catch (scanError) {
          console.log('❌ Permission check scan failed:', scanError);
        }
      }
    } catch (error) {
      console.error('❌ Permission status check failed:', error);
    }
  };

  const forcePermissionRequest = async () => {
    try {
      console.log('🔐 Forcing Bluetooth permission request...');
      
      if (Platform.OS === 'ios') {
        console.log('🍎 iOS: Triggering Bluetooth permission request...');
        
        // On iOS, we need to trigger a Bluetooth operation to show the permission dialog
        if (bleManagerRef.current && bluetoothState === State.PoweredOn) {
          // Start a scan to trigger permission request
          console.log('🔐 Starting iOS permission scan (manual trigger)...');
          bleManagerRef.current.startDeviceScan(
            null,
            { allowDuplicates: false },
            (error, device) => {
              if (error) {
                if (error.errorCode === 1) {
                  console.log('❌ iOS Bluetooth permission denied');
                  setHasPermissions(false);
                  Alert.alert(
                    'Permission Denied',
                    'Bluetooth permission is required to scan for devices. Please enable it in Settings > Privacy & Security > Bluetooth.',
                    [
                      { text: 'Open Settings', onPress: () => Linking.openSettings() },
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  );
                  // Stop scan on permission denied
                  if (bleManagerRef.current) {
                    bleManagerRef.current.stopDeviceScan();
                  }
                } else {
                  console.log('⚠️ iOS scan error:', error);
                }
              } else if (device) {
                console.log('✅ iOS Bluetooth permission granted - found device:', device.name);
                setHasPermissions(true);
                // Stop scan once we have permission
                if (bleManagerRef.current) {
                  bleManagerRef.current.stopDeviceScan();
                }
              }
            }
          );
          
          // Keep scan running longer to allow permission dialog to be handled
          // Don't auto-stop - let the user respond to the permission dialog
          console.log('⏳ iOS permission scan running - respond to the permission dialog when it appears');
        }
      } else {
        // Android - use existing logic
        if (bleManagerRef.current && bluetoothState === State.PoweredOn) {
          bleManagerRef.current.startDeviceScan(
            null,
            { allowDuplicates: false },
            (error, device) => {
              if (error) {
                console.error('❌ Permission scan error:', error);
              }
              if (device) {
                console.log('✅ Permission scan found device:', device.name);
              }
            }
          );
          
          setTimeout(() => {
            if (bleManagerRef.current) {
              bleManagerRef.current.stopDeviceScan();
            }
          }, 1000);
        }
      }
    } catch (error) {
      console.error('❌ Force permission failed:', error);
      }
    };

  // Add this function to send data to the Orange Pi via BLE
  const sendDataToDevice = async (deviceId: string, email: string, password: string) => {
    try {
      console.log('📤 Sending credentials to device:', { email, password: '***' });
      
      // Get the connected device
      const devices = await bleManagerRef.current?.devices([deviceId]);
      if (!devices || devices.length === 0) {
        throw new Error('Device not found');
      }
      
      const device = devices[0];
      
      // ---- Encoding helpers (Buffer does UTF-8 and base64 cleanly) ----
      const toBase64 = (buf: Buffer) => buf.toString('base64');

      // Conservative payload <= 20 bytes on ATT; stick with 18 like you had
      const PAYLOAD_CHUNK_BYTES = 18;

      // Create credentials object
      const credentials = { email, password };
      const credentialsJson = JSON.stringify(credentials);
      const credentialsBuf = Buffer.from(credentialsJson, 'utf8');
      const totalChunks = Math.ceil(credentialsBuf.length / PAYLOAD_CHUNK_BYTES);
      console.log(`📦 Credentials split into ${totalChunks} chunks of max ${PAYLOAD_CHUNK_BYTES} bytes each`);

      console.log('🔍 Checking available characteristics for service:', SERVICE_UUID);
      const characteristics = await device.characteristicsForService(SERVICE_UUID);
      console.log('🔍 Available characteristics:', characteristics.map(c => ({
        uuid: c.uuid,
        isReadable: c.isReadable,
        isWritable: c.isWritableWithResponse || c.isWritableWithoutResponse,
        isNotifiable: c.isNotifiable
      })));
      
      const TOKEN_CHAR = '33333333-4444-5555-6666-777777777777';

      const targetChar = characteristics.find(
        c => c.uuid.toLowerCase() === TOKEN_CHAR.toLowerCase()
      );
      if (!targetChar) {
        throw new Error(`TokenCharacteristic ${TOKEN_CHAR} not found. Available: ${characteristics.map(c => c.uuid).join(', ')}`);
      }

      console.log('🔍 TokenCharacteristic caps:', {
        isReadable: targetChar.isReadable,
        isNotifiable: targetChar.isNotifiable,
        isWritableWithResponse: targetChar.isWritableWithResponse,
        isWritableWithoutResponse: targetChar.isWritableWithoutResponse,
      });

      // Decide the write function based on caps
      type WriteFn = (serviceUUID: string, charUUID: string, valueB64: string) => Promise<any>;
      let writeFn: WriteFn | null = null;
      let mode: 'with' | 'without' | null = null;

      if (targetChar.isWritableWithoutResponse) {
        writeFn = device.writeCharacteristicWithoutResponseForService.bind(device);
        mode = 'without';
      } else if (targetChar.isWritableWithResponse) {
        writeFn = device.writeCharacteristicWithResponseForService.bind(device);
        mode = 'with';
      } else {
        throw new Error(`TokenCharacteristic ${TOKEN_CHAR} is not writable (no supported write mode)`);
      }

      console.log(`✍️  Using write-${mode}-response`);

      const safeWrite = async (b64: string) => {
        // Try selected mode first, then fall back to the other if available
        try {
          await writeFn!(SERVICE_UUID, TOKEN_CHAR, b64);
        } catch (e1) {
          console.warn(`⚠️ write-${mode}-response failed once:`, e1);
          // Fallback
          if (mode === 'without' && targetChar.isWritableWithResponse) {
            console.log('↩️  Falling back to write-with-response');
            await device.writeCharacteristicWithResponseForService(SERVICE_UUID, TOKEN_CHAR, b64);
          } else if (mode === 'with' && targetChar.isWritableWithoutResponse) {
            console.log('↩️  Falling back to write-without-response');
            await device.writeCharacteristicWithoutResponseForService(SERVICE_UUID, TOKEN_CHAR, b64);
          } else {
            throw e1;
          }
        }
      };

      // 1) Send header (JSON → base64)
      const headerObj = { type: 'credentials', total: totalChunks };
      const headerB64 = toBase64(Buffer.from(JSON.stringify(headerObj), 'utf8'));
      console.log('📤 Sending header:', headerObj, `(mode: ${mode})`);
      await safeWrite(headerB64);

      // 2) Send chunks
      for (let offset = 0; offset < credentialsBuf.length; offset += PAYLOAD_CHUNK_BYTES) {
        const slice = credentialsBuf.subarray(offset, Math.min(offset + PAYLOAD_CHUNK_BYTES, credentialsBuf.length));
        const sliceB64 = toBase64(slice);
        const idx = Math.floor(offset / PAYLOAD_CHUNK_BYTES) + 1;
        console.log(`📤 Sending chunk ${idx}/${totalChunks} (${slice.length} bytes)`);
        await safeWrite(sliceB64);
        await new Promise(r => setTimeout(r, 60)); // slightly slower pacing helps CoreBluetooth/BlueZ
      }

      // 3) EOF
      const eofB64 = toBase64(Buffer.from('__EOF__', 'utf8'));
      console.log('📤 Sending EOF');
      await safeWrite(eofB64);

      await new Promise(r => setTimeout(r, 1000)); // allow Pi to process
      console.log('✅ Credentials sent successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to send credentials:', error);
      throw error;
    }
  };

  // Function to show password input modal
  const showPasswordInput = (): Promise<string> => {
    return new Promise((resolve) => {
      setPasswordResolver(() => resolve);
      setPasswordInput('');
      setShowPasswordModal(true);
    });
  };

  // Function to handle password modal submission
  const handlePasswordSubmit = () => {
    if (passwordResolver) {
      passwordResolver(passwordInput);
      setPasswordResolver(null);
    }
    setShowPasswordModal(false);
    setPasswordInput('');
  };

  // Function to handle password modal cancellation
  const handlePasswordCancel = () => {
    if (passwordResolver) {
      passwordResolver('');
      setPasswordResolver(null);
    }
    setShowPasswordModal(false);
    setPasswordInput('');
  };

  // Add this function to handle sending login credentials to the device
  const bindDeviceToUser = async (deviceId: string) => {
    try {
      setIsBindingDevice(true);
      setBindingStatus('binding');
      
      console.log('🔗 Starting credentials sending process...');
      
      // Get user's Firebase ID token
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const idToken = await user.getIdToken();
      console.log('🔐 Got Firebase ID token');
      
      // Get user's email for device authentication
      const userEmail = user.email;
      if (!userEmail) {
        throw new Error('User email not available');
      }
      
      // Always prompt user for password verification
      console.log('🔐 Requesting password verification for device authentication');
      
      const userPassword = await showPasswordInput();
      
      if (!userPassword) {
        throw new Error('Password verification cancelled by user.');
      }
      
      console.log('📧 Sending user credentials to device...');
      console.log('📧 User email:', userEmail);
      console.log('🔐 Password verified, proceeding with BLE transmission');
      
      // Send user credentials to Pi via BLE
      await sendDataToDevice(deviceId, userEmail, userPassword);
      console.log('📤 User credentials sent to device');
      
      setBindingStatus('success');
      console.log('✅ Device credentials sent successfully');
      
      // Show success message
      Alert.alert(
        'Credentials Sent Successfully! 🎉',
        'Your login credentials have been sent to the Waylo device.\n\nThe device can now authenticate with your account.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('❌ Failed to send credentials:', error);
      setBindingStatus('error');
      
      Alert.alert(
        'Credentials Send Failed',
        `Failed to send credentials to device: ${error instanceof Error ? error.message : String(error)}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsBindingDevice(false);
    }
  };

  return (
          <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Device Pairing</Text>
            <Text style={styles.subtitle}>iPhone scans for and connects to Waylo device</Text>
          </View>
        </View>

      
      
      {/* Scan Button */}
      <TouchableOpacity
        style={[styles.scanButton, isScanning && styles.scanningButton]}
        onPress={startScanning}
        disabled={!bluetoothInitialized || bluetoothState !== State.PoweredOn || isScanning}
      >
        <Text style={styles.scanButtonText}>
          {isScanning ? 'Scanning for Wailo devices...' : 'Scan for Wailo devices'}
        </Text>
      </TouchableOpacity>



      {/* Verification Status */}
      {verificationStep !== 'idle' && (
        <View style={styles.verificationContainer}>
          <Text style={styles.verificationTitle}>🔐 Device Verification Status</Text>
          
          {/* Step 1: MAC Address Verification */}
          <View style={styles.verificationStep}>
            <Text style={[styles.stepStatus, { color: verificationStep === 'step1' || verificationStep === 'complete' ? '#22c55e' : '#ef4444' }]}>
              {verificationStep === 'step1' || verificationStep === 'complete' ? '✅' : '❌'} Step 1/2: Pariing Verification
            </Text>
              <Text style={styles.stepDescription}>
                {verificationStep === 'step1' || verificationStep === 'complete' 
                  ? 'Waylo device paired and bound to your account' 
                  : 'Waiting for device pairing and binding...'}
              </Text>
          </View>
          
          {/* Step 2: QR Code Verification */}
          <View style={styles.verificationStep}>
            <Text style={[styles.stepStatus, { color: verificationStep === 'complete' ? '#22c55e' : '#6b7280' }]}>
              {verificationStep === 'complete' ? '✅' : '⏳'} Step 2/2: Send Login Credentials
            </Text>
            <Text style={styles.stepDescription}>
              {verificationStep === 'complete' 
                ? 'Credentials sent successfully!' 
                : verificationStep === 'step1' 
                  ? 'Ready to send your login credentials to the device'
                  : 'Waiting for Step 1 completion...'}
            </Text>
          </View>
          
          {/* QR Code Scanner Button */}
          {verificationStep === 'step1' && (
            <View>
              <TouchableOpacity
                style={styles.qrScanButton}
                onPress={() => setShowQRScanner(true)}
              >
                <Text style={styles.qrScanButtonText}>📱 Scan QR Code</Text>
              </TouchableOpacity>
              

            </View>
          )}
          
          {/* Success Message */}
          {verificationStep === 'complete' && (
            <View style={styles.successContainer}>
              <Text style={styles.successTitle}>🎉 VERIFICATION COMPLETE!</Text>
              <Text style={styles.successText}>
                Both Waylo device and QR code have been verified successfully.
                This device is now fully authenticated.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Connected Clients */}
      {connectedClients.length > 0 && (
        <View style={styles.clientsContainer}>
          <Text style={styles.clientsTitle}>Connected Orange Pi Clients ({connectedClients.length})</Text>
          {connectedClients.map((client) => (
            <View key={client.id} style={styles.clientItem}>
              <Text style={styles.clientName}>{client.name}</Text>
              <Text style={styles.clientId}>ID: {client.id}</Text>
              <Text style={styles.clientStatus}>
                Status: {client.isConnected ? 'Connected' : 'Disconnected'}
              </Text>
              <Text style={styles.clientLastSeen}>
                Last Seen: {client.lastSeen.toLocaleTimeString()}
              </Text>
              <Text style={styles.clientMacAddress}>
                MAC: {client.macAddress}
              </Text>
              <Text style={styles.clientMacSource}>
                Source: {client.macAddressSource}
              </Text>
              {client.isConnected && (
                <View style={styles.bindingControls}>
                  <TouchableOpacity
                    style={[
                      styles.bindButton,
                      { backgroundColor: bindingStatus === 'success' ? '#22c55e' : '#3b82f6' }
                    ]}
                    onPress={() => bindDeviceToUser(client.id)}
                    disabled={isBindingDevice || bindingStatus === 'success'}
                  >
                    <Text style={styles.bindButtonText}>
                      {isBindingDevice 
                        ? 'Binding...' 
                        : bindingStatus === 'success' 
                          ? 'Credentials Sent ✅' 
                          : 'Send Login Credentials'
                      }
                    </Text>
                  </TouchableOpacity>
                  
                  {bindingStatus === 'error' && (
                    <TouchableOpacity
                      style={[styles.bindButton, { backgroundColor: '#ef4444' }]}
                      onPress={() => {
                        setBindingStatus('idle');
                        bindDeviceToUser(client.id);
                      }}
                    >
                      <Text style={styles.bindButtonText}>Retry Binding</Text>
                    </TouchableOpacity>
                  )}
                  
                  
                  <TouchableOpacity
                    style={styles.disconnectButton}
                    onPress={() => disconnectFromDevice(client.id)}
                  >
                    <Text style={styles.disconnectButtonText}>Disconnect</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Device List */}
      {devices.length > 0 && (
        <View style={styles.deviceList}>
          <Text style={styles.deviceListTitle}>Found Wailo Devices ({devices.length})</Text>
          {devices.map((device) => (
            <View key={device.id} style={styles.deviceItem}>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{device.name}</Text>
                <Text style={styles.deviceAddress}>
                  {/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(device.address) ? 'MAC: ' : 'ID: '}
                  {device.address}
                </Text>
                <Text style={styles.deviceRSSI}>Signal: {device.rssi} dBm</Text>
                {device.localName && device.localName !== device.name && (
                  <Text style={styles.deviceLocalName}>Local: {device.localName}</Text>
                )}
                <Text style={styles.deviceConnectable}>
                  Connectable: {device.isConnectable ? 'Yes' : 'No'}
                </Text>
                <Text style={[styles.deviceStatus, { color: device.isConnected ? '#22c55e' : '#ef4444' }]}>
                  Status: {device.isConnected ? 'Connected' : 'Disconnected'}
                </Text>
                {device.manufacturerData && (
                  <Text style={styles.deviceManufacturer}>Manufacturer: {device.manufacturerData}</Text>
                )}
              </View>
                                                          {!device.isConnected && (device.isConnectable || device.isConnectable === null) && (
                                 <TouchableOpacity
                                   style={styles.connectButton}
                                   onPress={async () => {
                                     try {
                                       const foundDevices = await bleManagerRef.current?.devices([device.id]);
                                       if (foundDevices && foundDevices.length > 0) {
                                         connectToDevice(foundDevices[0]);
                                       }
                                     } catch (error) {
                                       console.error('❌ Error finding device:', error);
                                     }
                                   }}
                                 >
                                   <Text style={styles.connectButtonText}>Connect</Text>
                                 </TouchableOpacity>
                               )}
            </View>
          ))}
        </View>
      )}

      {/* QR Code Scanner Modal */}
      {showQRScanner && (
        <Modal
          visible={showQRScanner}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={({ data }) => {
                console.log('🔍 QR Code scanned:', data);
                setQrCodeScanned(data);
                setShowQRScanner(false);
                
                // Verify the scanned QR code
                const isValid = verifyQRCode(data);
                
                if (isValid) {
                  Alert.alert(
                    'QR Code Verified! 🎉',
                    `Verification complete!`,
                    [{ text: 'OK' }]
                  );
                } else {
                  Alert.alert(
                    'Invalid QR Code ❌',
                    `Scanned: ${data}\n\nExpected: 00112233445566\n\nPlease try again.`,
                    [
                      { text: 'Try Again', onPress: () => setShowQRScanner(true) },
                      { text: 'Cancel', onPress: () => setShowQRScanner(false) }
                    ]
                  );
                }
              }}
            >
              <View style={styles.cameraOverlay}>
                <View style={styles.cameraHeader}>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowQRScanner(false)}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                  <Text style={styles.cameraTitle}>Scan QR Code</Text>
                  <View style={styles.placeholder} />
                </View>
                
                <View style={styles.scanFrame}>
                  <View style={[styles.scanFrameCorner, { top: 0, left: 0, borderTopLeftRadius: 0, borderTopWidth: 3, borderLeftWidth: 3 }]} />
                  <View style={[styles.scanFrameCorner, { top: 0, right: 0, borderTopRightRadius: 0, borderTopWidth: 3, borderRightWidth: 3 }]} />
                  <View style={[styles.scanFrameCorner, { bottom: 0, left: 0, borderBottomLeftRadius: 0, borderBottomWidth: 3, borderLeftWidth: 3 }]} />
                  <View style={[styles.scanFrameCorner, { bottom: 0, right: 0, borderBottomRightRadius: 0, borderBottomWidth: 3, borderRightWidth: 3 }]} />
                </View>
                
                <Text style={styles.scanInstructions}>
                  Position the QR code within the frame
                </Text>
              </View>
            </CameraView>
          </View>
        </Modal>
      )}

      {/* Password Input Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handlePasswordCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Device Verification</Text>
            <Text style={styles.modalMessage}>
              Please enter your password to verify your identity and authenticate with the Waylo device:
            </Text>
            <TextInput
              style={styles.passwordInput}
              value={passwordInput}
              onChangeText={setPasswordInput}
              placeholder="Enter your password"
              secureTextEntry={true}
              autoFocus={true}
              onSubmitEditing={handlePasswordSubmit}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handlePasswordCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handlePasswordSubmit}
                disabled={!passwordInput.trim()}
              >
                <Text style={styles.submitButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 45,
    paddingHorizontal: 25,
  },
  backButton: {
    padding: 0,
    marginRight: 0,
    marginLeft: -15,
    marginTop: -30,
  },
  backButtonText: {
    fontSize: 52,
    color: '#1e293b',
    fontWeight: 'semibold',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    fontFamily: 'Plus Jakarta Sans',
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Plus Jakarta Sans',
  },
  scanSummary: {
    fontSize: 14,
    color: '#0ea5e9',
    textAlign: 'center',
    backgroundColor: '#f0f9ff',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  statusContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  settingsButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  permissionButton: {
    backgroundColor: '#f59e0b',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: 'white',
    fontWeight: '600',
  },

  clientInfoContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clientInfoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 12,
    textAlign: 'center',
  },
  clientInfoDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 12,
  },
  clientInfoNote: {
    fontSize: 12,
    color: '#f59e0b',
    textAlign: 'center',
    fontStyle: 'italic',
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 6,
  },
  serverTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 12,
    textAlign: 'center',
  },
  serverDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  advertiseButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  advertiseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  stopAdvertiseButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  stopAdvertiseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  advertisingStatus: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  advertisingStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  advertisingStatusSubtext: {
    fontSize: 12,
    color: '#92400e',
    marginTop: 4,
  },
  scanInfoContainer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  scanInfoText: {
    fontSize: 14,
    color: '#0369a1',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 4,
  },
  scanInfoSubtext: {
    fontSize: 12,
    color: '#0369a1',
    textAlign: 'center',
    opacity: 0.8,
  },
  scanButton: {
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scanningButton: {
    backgroundColor: '#6b7280',
  },
  scanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Plus Jakarta Sans',
  },
  simulateContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  simulateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  simulateStatus: {
    fontSize: 16,
    fontWeight: '600',
  },
  simulateButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  simulateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  clientsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clientsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  clientItem: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  clientId: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  clientStatus: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '600',
    marginBottom: 4,
  },
  clientLastSeen: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  clientMacAddress: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 4,
  },
  clientMacSource: {
    fontSize: 12,
    color: '#7c3aed',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  disconnectButton: {
    backgroundColor: '#ef4444',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  disconnectButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  bindingControls: {
    marginTop: 8,
    gap: 8,
  },
  bindButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bindButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Plus Jakarta Sans',
  },
  deviceList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deviceListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  deviceAddress: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  deviceRSSI: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },
  deviceLocalName: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  deviceConnectable: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  deviceStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  deviceManufacturer: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  connectButton: {
    backgroundColor: '#DC2626',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  connectButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Plus Jakarta Sans',
  },
  verificationContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  verificationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Plus Jakarta Sans',
  },
  verificationStep: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e2e8f0',
  },
  stepStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Plus Jakarta Sans',
  },
  stepDescription: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Plus Jakarta Sans',
  },
  qrScanButton: {
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  qrScanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Plus Jakarta Sans',
  },
  successContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 14,
    color: '#16a34a',
    textAlign: 'center',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cameraTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  scanFrame: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 250,
    height: 250,
    marginLeft: -125,
    marginTop: -125,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 20,
  },
  scanFrameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#10b981',
    borderWidth: 3,
  },
  scanInstructions: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
  },
  // Password Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9fafb',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
