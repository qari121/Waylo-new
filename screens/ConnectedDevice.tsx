import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Alert, Modal, FlatList, Switch } from 'react-native';
import Slider from '@react-native-community/slider';
import ConnectedDeviceIcon from '../assets/icons/connected_device.svg';
import ChevronLeftIcon from '../assets/icons/chevron-left.svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ensureMacAddress } from '../utils/ensureMacAddress';
import { theme } from '../lib/theme';
import { BackButton } from '../components/ui/back-button';

// Create time options: every 15 minutes, 00:00 to 23:45
const timeOptions = Array.from({ length: 96 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const min = (i % 4) * 15;
  return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
});

interface OptionModalProps {
  visible: boolean;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

const OptionModal: React.FC<OptionModalProps> = ({ visible, options, selectedValue, onSelect, onClose }) => (
  <Modal transparent visible={visible} animationType="fade">
    <TouchableOpacity style={styles.modalOverlay} onPress={onClose} activeOpacity={1}>
      <View style={styles.modalContent}>
        <FlatList
          data={options}
          keyExtractor={item => item}
          initialScrollIndex={Math.max(0, options.findIndex(opt => opt === selectedValue))}
          getItemLayout={(data, index) => (
            { length: 48, offset: 48 * index, index }
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                onSelect(item);
                onClose();
              }}
              style={[
                styles.modalItem,
                item === selectedValue && styles.modalItemSelected
              ]}
            >
              <Text style={item === selectedValue ? styles.modalSelectedText : styles.modalText}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </TouchableOpacity>
  </Modal>
);

interface ToyData {
  boardName?: string;
  connectionStatus?: string;
  Battery?: string;
  mac_address?: string;
  user_uid?: string;
}

interface AudioStatus {
  microphone: {
    volume: number;
    muted: boolean;
  };
  speaker: {
    volume: number;
    muted: boolean;
  };
}

const ConnectedDeviceScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // New: start and end times (default 08:00 to 20:00)
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('20:00');
  const [savedWindow, setSavedWindow] = useState<{ start: string, end: string } | null>(null);

  // Modal state
  const [pickerType, setPickerType] = useState<'start' | 'end' | null>(null);

  const [macAddress, setMacAddress] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false); // Track DND/Lock state
  
  // Toy data state
  const [toyData, setToyData] = useState<ToyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [macLoaded, setMacLoaded] = useState(false);

  // Audio control state
  const [audioStatus, setAudioStatus] = useState<AudioStatus>({
    microphone: { volume: 50, muted: false },
    speaker: { volume: 50, muted: false }
  });
  const [audioLoading, setAudioLoading] = useState(false);
  const [orangePiIP, setOrangePiIP] = useState<string>('192.168.87.249'); // Default IP from your Flask server

  useEffect(() => {
    const fetchMac = async () => {
      try {
        const mac = await AsyncStorage.getItem('macAddress');
        
        // If MAC is null, try to get it from the user's Firestore document
        if (!mac) {
          const user = auth.currentUser;
          if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              const userMac = userData.mac_address;
              if (userMac) {
                // Save it to AsyncStorage for future use
                await AsyncStorage.setItem('macAddress', userMac);
                await AsyncStorage.setItem('macAddressEntered', 'true');
                setMacAddress(userMac);
              } else {
                setMacAddress(null);
              }
            } else {
              setMacAddress(null);
            }
          } else {
            setMacAddress(null);
          }
        } else {
          setMacAddress(mac);
        }
      } catch (error) {
        console.error('Error fetching MAC address:', error);
        setMacAddress(null);
      } finally {
        setMacLoaded(true);
      }
    };
    fetchMac();
  }, []);

  // Fetch toy data when MAC address is available
  useEffect(() => {
    const fetchToyData = async () => {
      if (!macLoaded || !macAddress) {
        return;
      }
      
      try {
        setLoading(true);
        console.log('Attempting to fetch toy data for MAC:', macAddress);
        
        // The toy document is stored with document ID "DONT DELETE"
        const docRef = doc(db, 'toy', 'DONT DELETE');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as ToyData;
          console.log('Found toy data:', data);
          
          // Verify this is the correct device by checking MAC address
          if (data.mac_address === macAddress) {
            console.log('MAC address matches, displaying data');
            setToyData(data);
          } else {
            console.log('MAC address mismatch. Expected:', macAddress, 'Got:', data.mac_address);
            setToyData(null);
          }
        } else {
          console.log('No toy document found with ID "DONT DELETE"');
          setToyData(null);
        }
      } catch (error) {
        console.error('Error fetching toy data:', error);
        setToyData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchToyData();
  }, [macLoaded, macAddress]);

  // Optionally, fetch DND state from Firestore on mount
  useEffect(() => {
    const fetchDND = async () => {
      if (!macAddress) return;
      const mac = macAddress as string;
      const docRef = doc(db, 'parental_controls', mac);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const controls = docSnap.data();
        setIsLocked(!!controls.DND);
      }
    };
    fetchDND();
  }, [macAddress]);

  // Fetch audio status from Orange Pi
  const fetchAudioStatus = async () => {
    try {
      setAudioLoading(true);
      const response = await fetch(`http://${orangePiIP}:5001/api/audio/status`);
      if (response.ok) {
        const data = await response.json();
        setAudioStatus(data);
        console.log('Audio status fetched:', data);
      } else {
        console.error('Failed to fetch audio status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching audio status:', error);
      Alert.alert('Error', 'Could not connect to Orange Pi audio server');
    } finally {
      setAudioLoading(false);
    }
  };

  // Set volume for microphone or speaker
  const setVolume = async (type: 'microphone' | 'speaker', volume: number) => {
    try {
      const response = await fetch(`http://${orangePiIP}:5001/api/audio/volume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [type]: volume }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`${type} volume set to ${volume}%:`, data);
        
        // Update local state
        setAudioStatus(prev => ({
          ...prev,
          [type]: { ...prev[type], volume }
        }));
      } else {
        console.error(`Failed to set ${type} volume:`, response.status);
        Alert.alert('Error', `Failed to set ${type} volume`);
      }
    } catch (error) {
      console.error(`Error setting ${type} volume:`, error);
      Alert.alert('Error', `Could not set ${type} volume`);
    }
  };

  // Toggle mute for microphone or speaker
  const toggleMute = async (type: 'microphone' | 'speaker') => {
    try {
      const response = await fetch(`http://${orangePiIP}:5001/api/audio/mute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [type]: true }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`${type} mute toggled:`, data);
        
        // Fetch updated status
        await fetchAudioStatus();
      } else {
        console.error(`Failed to toggle ${type} mute:`, response.status);
        Alert.alert('Error', `Failed to toggle ${type} mute`);
      }
    } catch (error) {
      console.error(`Error toggling ${type} mute:`, error);
      Alert.alert('Error', `Could not toggle ${type} mute`);
    }
  };

  // Fetch audio status when component mounts
  useEffect(() => {
    if (macLoaded && macAddress) {
      fetchAudioStatus();
    }
  }, [macLoaded, macAddress]);

  // Toggle Lock/Unlock (DND)
  const handleToggleLock = async () => {
    if (!ensureMacAddress(macAddress)) return;
    const user = auth.currentUser;
    if (!user) return;
    const newLockState = !isLocked;
    setIsLocked(newLockState);
    const mac = macAddress as string;
    await setDoc(
      doc(db, 'parental_controls', mac),
      { mac_address: mac, playRestriction: { startHour: '', startMinute: '', endHour: '', endMinute: '' }, DND: newLockState },
      { merge: true }
    );
  };

  return (
<SafeAreaView style={styles.safeArea} edges={['top','left','right','bottom']}>
  {/* Full-width header */}
  <View style={styles.headerRow}>
    <BackButton onPress={() => router.back()} />
    <View style={styles.headerCenter}>
      <Text style={styles.headerTitle}>Connected Device</Text>
    </View>
  </View>

  {/* Main content */}
  <View style={styles.screen}>
    {/* DEVICE CARD */}
    <View style={styles.deviceCard}>
      <View style={styles.deviceIconWrapper}>
        <ConnectedDeviceIcon width={40} height={40} />
      </View>
      <Text style={styles.deviceTitle}>Connected Device Info</Text>
      
      {loading ? (
        <Text style={styles.loadingText}>Loading device information...</Text>
      ) : toyData ? (
        <>
          <Text style={styles.deviceInfo}>
            <Text style={styles.deviceInfoLabel}>Board Name: </Text>
            <Text style={styles.deviceInfoValue}>{toyData.boardName || 'Unknown'}</Text>
          </Text>
          <Text style={styles.deviceInfo}>
            <Text style={styles.deviceInfoLabel}>Connection Status: </Text>
            <Text style={styles.deviceInfoValue}>{toyData.connectionStatus || 'Unknown'}</Text>
          </Text>
          <Text style={styles.deviceInfo}>
            <Text style={styles.deviceInfoLabel}>Battery: </Text>
            <Text style={styles.deviceInfoValue}>{toyData.Battery || 'Unknown'}</Text>
          </Text>
        </>
      ) : (
        <Text style={styles.errorText}>No device data found</Text>
      )}
    </View>

    {/* AUDIO CONTROLS */}
    <View style={styles.audioCard}>
      <Text style={styles.audioTitle}>🎵 Audio Controls</Text>
      <Text style={styles.audioSubtitle}>Control Orange Pi audio from your iPhone</Text>
      
      {/* IP Address Input */}
      <View style={styles.ipInputContainer}>
        <Text style={styles.ipLabel}>Orange Pi IP Address:</Text>
        <View style={styles.ipInputRow}>
          <Text style={styles.ipAddress}>{orangePiIP}:5001</Text>
          <TouchableOpacity
            style={styles.changeIpButton}
            onPress={() => {
              Alert.prompt(
                'Change IP Address',
                'Enter the Orange Pi IP address:',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'OK', 
                    onPress: (newIP) => {
                      if (newIP && newIP.trim()) {
                        setOrangePiIP(newIP.trim());
                        Alert.alert('Success', `IP address changed to ${newIP.trim()}`);
                      }
                    }
                  }
                ],
                'plain-text',
                orangePiIP
              );
            }}
          >
            <Text style={styles.changeIpButtonText}>Change</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Microphone Controls */}
      <View style={styles.audioControlSection}>
        <View style={styles.audioHeader}>
          <Text style={styles.audioDeviceLabel}>🎤 Microphone</Text>
          <TouchableOpacity
            style={[styles.muteButton, audioStatus.microphone.muted && styles.muteButtonActive]}
            onPress={() => toggleMute('microphone')}
          >
            <Text style={[styles.muteButtonText, audioStatus.microphone.muted && styles.muteButtonTextActive]}>
              {audioStatus.microphone.muted ? 'Unmute' : 'Mute'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.volumeContainer}>
          <Text style={styles.volumeLabel}>Volume: {audioStatus.microphone.volume}%</Text>
          <Slider
            style={styles.volumeSlider}
            minimumValue={0}
            maximumValue={100}
            value={audioStatus.microphone.volume}
            onValueChange={(value: number) => setVolume('microphone', Math.round(value))}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor={theme.colors.primary}
          />
        </View>
      </View>

      {/* Speaker Controls */}
      <View style={styles.audioControlSection}>
        <View style={styles.audioHeader}>
          <Text style={styles.audioDeviceLabel}>🔊 Speaker</Text>
          <TouchableOpacity
            style={[styles.muteButton, audioStatus.speaker.muted && styles.muteButtonActive]}
            onPress={() => toggleMute('speaker')}
          >
            <Text style={[styles.muteButtonText, audioStatus.speaker.muted && styles.muteButtonTextActive]}>
              {audioStatus.speaker.muted ? 'Unmute' : 'Mute'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.volumeContainer}>
          <Text style={styles.volumeLabel}>Volume: {audioStatus.speaker.volume}%</Text>
          <Slider
            style={styles.volumeSlider}
            minimumValue={0}
            maximumValue={100}
            value={audioStatus.speaker.volume}
            onValueChange={(value: number) => setVolume('speaker', Math.round(value))}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor={theme.colors.primary}
          />
        </View>
      </View>

      {/* Refresh Button */}
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={fetchAudioStatus}
        disabled={audioLoading}
      >
        <Text style={styles.refreshButtonText}>
          {audioLoading ? 'Refreshing...' : '🔄 Refresh Audio Status'}
        </Text>
      </TouchableOpacity>
    </View>
    
    {/* PARENTAL CONTROLS */}
    <View style={styles.parentalCard}>
      <Text style={styles.parentalTitle}>Parental Controls</Text>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Lock Device</Text>
        <Switch
          value={isLocked}
          onValueChange={handleToggleLock}
          trackColor={{ false: '#FEE2E2', true: theme.colors.primary }}
          thumbColor={isLocked ? '#fff' : theme.colors.primary}
        />
      </View>
      <View style={styles.schedulingSection}>
        <Text style={styles.schedulingLabel}>Set Restriction Schedule</Text>
        <View style={styles.schedulingPickersRow}>
          {/* Start Time Picker */}
          <View style={styles.pickerWrapper}>
            <Text style={styles.pickerLabel}>Start</Text>
            <TouchableOpacity
              onPress={() => setPickerType('start')}
              style={styles.pickerButton}
            >
              <Text style={styles.pickerButtonText}>{startTime}</Text>
            </TouchableOpacity>
          </View>
          {/* End Time Picker */}
          <View style={styles.pickerWrapper}>
            <Text style={styles.pickerLabel}>End</Text>
            <TouchableOpacity
              onPress={() => setPickerType('end')}
              style={styles.pickerButton}
            >
              <Text style={styles.pickerButtonText}>{endTime}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.saveButton} onPress={() => {
          if (!ensureMacAddress(macAddress)) return;
          setSavedWindow({ start: startTime, end: endTime });
          const user = auth.currentUser;
          if (!user) return;
          // Split time into hour and minute
          const [startHour, startMinute] = startTime.split(':');
          const [endHour, endMinute] = endTime.split(':');
          const mac = macAddress as string;
          setDoc(
            doc(db, 'parental_controls', mac),
            { mac_address: mac, playRestriction: { startHour, startMinute, endHour, endMinute }, DND: false },
            { merge: true }
          );
        }}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
        {savedWindow && (
          <Text style={styles.savedText}>
            Current Restriction: {savedWindow.start} – {savedWindow.end}
          </Text>
        )}
      </View>
    </View>
    {/* Time modals */}
    <OptionModal
      visible={pickerType === 'start'}
      options={timeOptions}
      selectedValue={startTime}
      onSelect={setStartTime}
      onClose={() => setPickerType(null)}
    />
    <OptionModal
      visible={pickerType === 'end'}
      options={timeOptions}
      selectedValue={endTime}
      onSelect={setEndTime}
      onClose={() => setPickerType(null)}
    />
  </View>
</SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'black',
    marginRight: 40,
    textAlign: 'center',
  },
  deviceCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'flex-start',
    marginBottom: 28,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  deviceIconWrapper: {
    backgroundColor: '#FEE2E2',
    borderRadius: 20,
    padding: 12,
    marginBottom: 10,
  },
  deviceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  deviceInfo: {
    fontSize: 15,
    color: '#444',
    marginBottom: 8,
  },
  deviceInfoLabel: {
    fontSize: 15,
    color: '#444',
    fontWeight: 'bold',
  },
  deviceInfoValue: {
    fontSize: 15,
    color: '#444',
  },
  loadingText: {
    fontSize: 15,
    color: '#666',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 15,
    color: '#E53E3E',
    fontStyle: 'italic',
  },
  audioCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'flex-start',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  audioTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  audioSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  ipInputContainer: {
    width: '100%',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  ipInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ipAddress: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  changeIpButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  changeIpButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  audioControlSection: {
    width: '100%',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  audioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  audioDeviceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  muteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  muteButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  muteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  muteButtonTextActive: {
    color: '#fff',
  },
  volumeContainer: {
    width: '100%',
  },
  volumeLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  volumeSlider: {
    width: '100%',
    height: 40,
  },
  refreshButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  parentalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  parentalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    width: '100%',
  },
  toggleLabel: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  schedulingSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  schedulingLabel: {
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 20,
    color: '#444',
    fontSize: 15,
  },
  schedulingPickersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
  },
  pickerWrapper: {
    alignItems: 'center',
    marginHorizontal: 12,
  },
  pickerLabel: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pickerButton: {
    width: 90,
    height: 40,
    backgroundColor: '#F2F2F2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  pickerButtonText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 16,
    width: '70%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  savedText: {
    marginTop: 10,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 150,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 8,
    elevation: 4,
    maxHeight: 350,
  },
  modalItem: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalItemSelected: {
    backgroundColor: '#FEF2F2',
  },
  modalText: {
    fontSize: 16,
    color: theme.colors.primary,
  },
  modalSelectedText: {
    fontSize: 16,
    color: theme.colors.primaryDark,
    fontWeight: 'bold',
  },
});

export default ConnectedDeviceScreen;
