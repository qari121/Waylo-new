import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Alert, Modal, FlatList, Switch } from 'react-native';
import ConnectedDeviceIcon from '../assets/icons/connected_device.svg';
import ChevronLeftIcon from '../assets/icons/chevron-left.svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ensureMacAddress } from '../utils/ensureMacAddress';

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

  useEffect(() => {
    const fetchMac = async () => {
      const mac = await AsyncStorage.getItem('macAddress');
      setMacAddress(mac);
    };
    fetchMac();
  }, []);

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

  const handleSave = async () => {
    if (!ensureMacAddress(macAddress)) return;
    setSavedWindow({ start: startTime, end: endTime });
    const user = auth.currentUser;
    if (!user) return;
    // Split time into hour and minute
    const [startHour, startMinute] = startTime.split(':');
    const [endHour, endMinute] = endTime.split(':');
    const mac = macAddress as string;
    await setDoc(
      doc(db, 'parental_controls', mac),
      { mac_address: mac, playRestriction: { startHour, startMinute, endHour, endMinute }, DND: false },
      { merge: true }
    );
    // Optionally show a message
    // Alert.alert('Saved', `Restriction will be active from ${startTime} to ${endTime}`);
  };

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
    // Optionally show a message
    // Alert.alert(newLockState ? 'Device Locked' : 'Device Unlocked');
  };

  const getControls = async () => {
    if (!ensureMacAddress(macAddress)) return;
    const mac = macAddress as string;
    const docRef = doc(db, 'parental_controls', mac);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const controls = docSnap.data();
      // use controls.playRestriction, controls.DND, etc.
    }
  };

  return (
<SafeAreaView style={styles.safeArea} edges={['top','left','right','bottom']}>
  {/* Full-width header */}
  <View style={styles.headerRow}>
    <TouchableOpacity
      onPress={() => router.back()}
      style={styles.backButton}
      hitSlop={{ left: 20, right: 20, top: 10, bottom: 10 }}
    >
      <ChevronLeftIcon width={28} height={28} />
    </TouchableOpacity>
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
      <Text style={styles.deviceInfo}><Text style={styles.deviceInfoLabel}>Device Name: </Text><Text style={styles.deviceInfoValue}>TeddyBot</Text></Text>
      <Text style={styles.deviceInfo}><Text style={styles.deviceInfoLabel}>Status: </Text><Text style={styles.deviceInfoValue}>Connected</Text></Text>
      <Text style={styles.deviceInfo}><Text style={styles.deviceInfoLabel}>Battery: </Text><Text style={styles.deviceInfoValue}>85%</Text></Text>
    </View>
    {/* PARENTAL CONTROLS */}
    <View style={styles.parentalCard}>
      <Text style={styles.parentalTitle}>Parental Controls</Text>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Lock Device</Text>
        <Switch
          value={isLocked}
          onValueChange={handleToggleLock}
          trackColor={{ false: '#E5E1FF', true: '#7F67FF' }}
          thumbColor={isLocked ? '#fff' : '#7F67FF'}
        />
      </View>
      <View style={styles.schedulingSection}>
        <Text style={styles.schedulingLabel}>Set Restriction Start and End Time</Text>
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
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
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
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'white',
    width: '100%',
    zIndex: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
    backButton: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      paddingLeft: 4,
      zIndex: 10,
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },
  deviceCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'flex-start',
    marginBottom: 28,
    shadowColor: '#AE9FFF',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  deviceIconWrapper: {
    backgroundColor: '#E5E1FF',
    borderRadius: 20,
    padding: 12,
    marginBottom: 10,
  },
  deviceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7F67FF',
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
  parentalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'flex-start',
    shadowColor: '#AE9FFF',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  parentalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7F67FF',
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: 12,
    marginTop: 12,
  },
  toggleLabel: {
    color: '#7F67FF',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
  schedulingSection: {
    width: '100%',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  schedulingLabel: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#444',
    fontSize: 15,
  },
  schedulingPickersRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%',
    marginBottom: 16,
  },
  pickerWrapper: {
    alignItems: 'center',
    marginHorizontal: 12,
  },
  pickerLabel: {
    color: '#7F67FF',
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
    color: '#7F67FF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#7F67FF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  savedText: {
    marginTop: 10,
    color: '#7F67FF',
    fontWeight: 'bold',
  },
  // Modal styles for picker replacement
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
    backgroundColor: '#F7F6FF',
  },
  modalText: {
    fontSize: 16,
    color: '#7F67FF',
  },
  modalSelectedText: {
    fontSize: 16,
    color: '#3C2FCB',
    fontWeight: 'bold',
  },
});

export default ConnectedDeviceScreen;
