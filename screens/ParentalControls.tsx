import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, FlatList, Switch, ScrollView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ensureMacAddress } from '../utils/ensureMacAddress';
import { Button } from '../components/ui/button';
import { Text } from '../components/ui/text';
import CalendarIcon from '../assets/icons/calendar.svg';
import CustomCalendar from '../components/CustomCalendar';

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

const ParentalControlsScreen = () => {
  const router = useRouter();
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('20:00');
  const [timeLimitStart, setTimeLimitStart] = useState<string>('09:00');
  const [timeLimitEnd, setTimeLimitEnd] = useState<string>('18:00');
  const [pickerType, setPickerType] = useState<'start' | 'end' | 'timeLimitStart' | 'timeLimitEnd' | null>(null);
  const [macAddress, setMacAddress] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [schedules, setSchedules] = useState<Array<{ start: string; end: string; date: string | null }>>([]);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [modalStartTime, setModalStartTime] = useState<string>('08:00');
  const [modalEndTime, setModalEndTime] = useState<string>('20:00');
  const [modalSelectedDate, setModalSelectedDate] = useState<Date | null>(null);
  const [modalPickerType, setModalPickerType] = useState<'start' | 'end' | null>(null);
  const [modalShowDatePicker, setModalShowDatePicker] = useState(false);

  useEffect(() => {
    const fetchMac = async () => {
      const mac = await AsyncStorage.getItem('macAddress');
      setMacAddress(mac);
    };
    fetchMac();
  }, []);

  useEffect(() => {
    const fetchDND = async () => {
      if (!macAddress) return;
      const user = auth.currentUser;
      if (!user) return;
      
      const userDocRef = doc(db, 'parental_controls', user.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const controls = docSnap.data();
        setIsLocked(!!controls.DND);
        if (controls.playRestriction && controls.playRestriction.startHour && controls.playRestriction.endHour) {
          setStartTime(`${controls.playRestriction.startHour.padStart(2, '0')}:${controls.playRestriction.startMinute.padStart(2, '0')}`);
          setEndTime(`${controls.playRestriction.endHour.padStart(2, '0')}:${controls.playRestriction.endMinute.padStart(2, '0')}`);
        }
        if (controls.timeLimit && controls.timeLimit.startHour && controls.timeLimit.endHour) {
          setTimeLimitStart(`${controls.timeLimit.startHour.padStart(2, '0')}:${controls.timeLimit.startMinute.padStart(2, '0')}`);
          setTimeLimitEnd(`${controls.timeLimit.endHour.padStart(2, '0')}:${controls.timeLimit.endMinute.padStart(2, '0')}`);
        }
      }
    };
    fetchDND();
  }, [macAddress]);

  // Load saved schedule from AsyncStorage when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const loadSavedSchedules = async () => {
        try {
          const val = await AsyncStorage.getItem('schedules-downtime');
          if (val) {
            const arr = JSON.parse(val);
            if (Array.isArray(arr)) {
              setSchedules(arr);
            } else {
              setSchedules([]);
            }
          } else {
            setSchedules([]);
          }
        } catch (error) {
          setSchedules([]);
          try { await AsyncStorage.removeItem('schedules-downtime'); } catch {}
        }
      };
      loadSavedSchedules();
    }, [])
  );

  // Debug function to check AsyncStorage
  const debugAsyncStorage = async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('ParentalControls - All AsyncStorage keys:', allKeys);
      
      for (const key of allKeys) {
        const value = await AsyncStorage.getItem(key);
        console.log(`ParentalControls - Key: ${key}, Value:`, value);
      }
    } catch (error) {
      console.error('ParentalControls - Error debugging AsyncStorage:', error);
    }
  };

  // Call debug function on mount
  useEffect(() => {
    debugAsyncStorage();
    
    // Test AsyncStorage functionality
    const testAsyncStorage = async () => {
      try {
        await AsyncStorage.setItem('test-key', 'test-value');
        const testValue = await AsyncStorage.getItem('test-key');
        console.log('ParentalControls - AsyncStorage test:', testValue);
        await AsyncStorage.removeItem('test-key');
      } catch (error) {
        console.error('ParentalControls - AsyncStorage test failed:', error);
      }
    };
    testAsyncStorage();
  }, []);

  const handleSave = async () => {
    try {
      if (!macAddress || !ensureMacAddress(macAddress)) return;
      const user = auth.currentUser;
      if (!user) return;
      const newSchedule = {
        start: modalStartTime,
        end: modalEndTime,
        date: modalSelectedDate ? modalSelectedDate.toISOString() : null,
      };
      const updatedSchedules = [...schedules, newSchedule];
      setSchedules(updatedSchedules);
      await AsyncStorage.setItem('schedules-downtime', JSON.stringify(updatedSchedules));
      setShowAddScheduleModal(false);
      Alert.alert('Schedule Saved', `Restriction set from ${modalStartTime} to ${modalEndTime}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save schedule. Please try again.');
    }
  };

  const handleSaveTimeLimit = async () => {
    try {
      console.log('ParentalControls - handleSaveTimeLimit called');
      console.log('ParentalControls - macAddress:', macAddress);
      console.log('ParentalControls - ensureMacAddress result:', macAddress ? ensureMacAddress(macAddress) : 'no macAddress');
      
      if (!macAddress || !ensureMacAddress(macAddress)) {
        console.log('ParentalControls - Early return: macAddress validation failed');
        return;
      }
      
      const mac = macAddress;
      const user = auth.currentUser;
      console.log('ParentalControls - auth.currentUser:', user);
      
      if (!user) {
        console.log('ParentalControls - Early return: no authenticated user');
        return;
      }
      
      const [startHour, startMinute] = timeLimitStart.split(':');
      const [endHour, endMinute] = timeLimitEnd.split(':');
      
      // Use user's UID as document ID instead of MAC address for proper permissions
      const userDocRef = doc(db, 'parental_controls', user.uid);
      await setDoc(
        userDocRef,
        { 
          mac_address: mac, 
          timeLimit: { startHour, startMinute, endHour, endMinute }, 
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
      
      // Save to AsyncStorage for HomeScreen
      const timeLimitData = {
        start: timeLimitStart,
        end: timeLimitEnd
      };
      await AsyncStorage.setItem('time-limit', JSON.stringify(timeLimitData));
      console.log('ParentalControls - Saved time limit to AsyncStorage:', timeLimitData);
      
      // Debug: Check if it was actually saved
      const savedValue = await AsyncStorage.getItem('time-limit');
      console.log('ParentalControls - Verification - Retrieved time limit from AsyncStorage:', savedValue);
      
      Alert.alert('Time Limit Saved', `Time limit set from ${timeLimitStart} to ${timeLimitEnd}`);
    } catch (error) {
      console.error('ParentalControls - Error in handleSaveTimeLimit:', error);
      Alert.alert('Error', 'Failed to save time limit. Please try again.');
    }
  };

  const handleToggleLock = () => {
    const newLockState = !isLocked;
    setIsLocked(newLockState);
    Alert.alert(
      newLockState ? 'Device Locked' : 'Device Unlocked',
      newLockState ? 'Your device is now locked.' : 'Your device is now unlocked.'
    );
  };

  const openAddScheduleModal = () => {
    setModalStartTime('08:00');
    setModalEndTime('20:00');
    setModalSelectedDate(null);
    setModalPickerType(null);
    setModalShowDatePicker(false);
    setShowAddScheduleModal(true);
  };

  // Add delete handler
  const handleDeleteSchedule = async (idx: number) => {
    Alert.alert(
      'Delete Schedule',
      'Are you sure you want to delete this schedule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            const updated = schedules.filter((_, i) => i !== idx);
            setSchedules(updated);
            await AsyncStorage.setItem('schedules-downtime', JSON.stringify(updated));
          }
        }
      ]
    );
  };

  // Helper to format time to 12-hour am/pm
  function formatTime12h(time: string) {
    const [h, m] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).replace('AM', 'am').replace('PM', 'pm');
  }

  return (
    <SafeAreaView edges={['left','right','bottom']} style={styles.safeAreaWhite}>
      <View style={styles.headerRowNoBg}>
        <Text style={styles.headerTitle}>Parental Controls</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.cardWhite}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Device Lock</Text>
            <Switch
              value={isLocked}
              onValueChange={handleToggleLock}
              trackColor={{ false: '#E5E1FF', true: '#7F67FF' }}
              thumbColor={isLocked ? '#fff' : '#7F67FF'}
            />
          </View>
          <Text style={styles.lockStateText}>{isLocked ? 'Device is currently locked.' : 'Device is currently unlocked.'}</Text>
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Device Usage Hours</Text>
          <Text style={styles.sectionDescription}>
            Device will be active during the specified time frames. Outside these hours, the device will be locked.
          </Text>
          {schedules.length === 0 && (
            <Text style={{ color: '#7F67FF', marginBottom: 10 }}>No schedules set.</Text>
          )}
          {schedules.map((sched, idx) => {
            let dayLabel = 'Any Day';
            if (sched.date) {
              const d = new Date(sched.date);
              dayLabel = d.toLocaleDateString(undefined, { weekday: 'long' });
            }
            return (
              <View key={idx} style={{ backgroundColor: '#F7F6FF', borderRadius: 12, padding: 12, marginBottom: 8, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ color: '#3C2FCB', fontWeight: 'bold' }}>{dayLabel} : {formatTime12h(sched.start)} – {formatTime12h(sched.end)}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteSchedule(idx)} style={{ marginLeft: 12, padding: 6 }}>
                  <Text style={{ color: '#FF4D4F', fontWeight: 'bold' }}>Delete</Text>
                </TouchableOpacity>
              </View>
            );
          })}
          <Button style={[styles.saveButton, { marginTop: 10 }]} onPress={openAddScheduleModal}>
            <Text style={styles.saveButtonText}>Add Schedule</Text>
          </Button>
        </View>

        <View style={styles.cardWhite}>
          <Text style={styles.sectionTitle}>Time Limits</Text>
          <Text style={styles.sectionDescription}>
            Set daily time limits for device usage. The device will be locked outside these hours.
          </Text>
          <View style={styles.timePickersRow}>
            <View style={styles.timePickerWrapper}>
              <Text style={styles.timePickerLabel}>Start</Text>
              <TouchableOpacity onPress={() => setPickerType('timeLimitStart' as 'timeLimitStart')} style={styles.timeButton}>
                <Text style={styles.timeButtonText}>{timeLimitStart}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.timePickerWrapper}>
              <Text style={styles.timePickerLabel}>End</Text>
              <TouchableOpacity onPress={() => setPickerType('timeLimitEnd' as 'timeLimitEnd')} style={styles.timeButton}>
                <Text style={styles.timeButtonText}>{timeLimitEnd}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Button style={styles.saveButton} onPress={handleSaveTimeLimit}>
            <Text style={styles.saveButtonText}>Save Time Limit</Text>
          </Button>
        </View>
      </ScrollView>
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
      <OptionModal
        visible={pickerType === 'timeLimitStart'}
        options={timeOptions}
        selectedValue={timeLimitStart}
        onSelect={setTimeLimitStart}
        onClose={() => setPickerType(null)}
      />
      <OptionModal
        visible={pickerType === 'timeLimitEnd'}
        options={timeOptions}
        selectedValue={timeLimitEnd}
        onSelect={setTimeLimitEnd}
        onClose={() => setPickerType(null)}
      />
      <CustomCalendar
        visible={showDatePicker}
        selectedDate={selectedDate}
        onDateSelect={(date) => {
          setSelectedDate(date);
          setShowDatePicker(false);
        }}
        onClose={() => setShowDatePicker(false)}
      />
      <Modal visible={showAddScheduleModal} transparent animationType="slide" onRequestClose={() => setShowAddScheduleModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={[styles.cardWhite, { width: '90%', maxWidth: 400 }]}> 
            <Text style={styles.sectionTitle}>Add Restriction Schedule</Text>
            <View style={styles.datePillContainer}>
              <TouchableOpacity
                style={styles.datePill}
                onPress={() => setModalShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <CalendarIcon width={20} height={20} style={{ marginRight: 8 }} />
                <Text style={[
                  styles.datePillText,
                  { color: modalSelectedDate ? '#7F67FF' : '#A0A0A0' }
                ]}>
                  {modalSelectedDate
                    ? modalSelectedDate.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
                    : 'Select Date'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.timePickersRow}>
              <View style={styles.timePickerWrapper}>
                <Text style={styles.timePickerLabel}>Start</Text>
                <TouchableOpacity onPress={() => setModalPickerType('start')} style={styles.timeButton}>
                  <Text style={styles.timeButtonText}>{modalStartTime}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.timePickerWrapper}>
                <Text style={styles.timePickerLabel}>End</Text>
                <TouchableOpacity onPress={() => setModalPickerType('end')} style={styles.timeButton}>
                  <Text style={styles.timeButtonText}>{modalEndTime}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Button style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Schedule</Text>
            </Button>
            <Button style={[styles.saveButton, { backgroundColor: '#ccc', marginTop: 8 }]} onPress={() => setShowAddScheduleModal(false)}>
              <Text style={[styles.saveButtonText, { color: '#7F67FF' }]}>Cancel</Text>
            </Button>
            <OptionModal
              visible={modalPickerType === 'start'}
              options={timeOptions}
              selectedValue={modalStartTime}
              onSelect={setModalStartTime}
              onClose={() => setModalPickerType(null)}
            />
            <OptionModal
              visible={modalPickerType === 'end'}
              options={timeOptions}
              selectedValue={modalEndTime}
              onSelect={setModalEndTime}
              onClose={() => setModalPickerType(null)}
            />
            <CustomCalendar
              visible={modalShowDatePicker}
              selectedDate={modalSelectedDate}
              onDateSelect={(date) => {
                setModalSelectedDate(date);
                setModalShowDatePicker(false);
              }}
              onClose={() => setModalShowDatePicker(false)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeAreaWhite: { flex: 1, backgroundColor: 'white' },
  headerRowNoBg: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    bottom: 15,
    paddingVertical: 18,
    backgroundColor: 'transparent',
    width: '100%',
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'black',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  cardWhite: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 28,
    alignItems: 'flex-start',
    marginBottom: 24,
    shadowColor: '#AE9FFF',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6,
  },
  sectionTitle: {
    color: 'black',
    fontWeight: '700',
    marginBottom: 20,
    fontSize: 17,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  sectionDescription: {
    color: '#666',
    marginTop: 15,
    fontSize: 14,
    marginBottom: 25,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  lockStateText: {
    color: '#444',
    fontSize: 15,
    marginBottom: 10,
    marginTop: 2,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F2F2F2',
    marginVertical: 18,
    borderRadius: 1,
    marginTop: 40,
    marginBottom: 40,
  },
  timePickersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 18,
    gap: 18,
  },
  timePickerWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  timePickerLabel: {
    color: '#7F67FF',
    fontWeight: '600',
    marginBottom: 4,
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  timeButton: {
    width: 90,
    height: 40,
    backgroundColor: '#F2F2F2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  timeButtonText: {
    color: '#7F67FF',
    fontWeight: '700',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  saveButton: {
    backgroundColor: '#7F67FF',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 10,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
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
    backgroundColor: '#F7F6FF',
  },
  modalText: {
    fontSize: 16,
    color: '#7F67FF',
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  modalSelectedText: {
    fontSize: 16,
    color: '#3C2FCB',
    fontWeight: 'bold',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  datePillContainer: {
    alignItems: 'flex-start',
    marginBottom: 12,
    width: '100%',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    color: 'black',
    marginTop: 20,
    marginBottom: 10,
    borderColor: '#E5E1FF',
  },
  datePillText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
  },
  weekDayText: {
    fontSize: 12,
    color: 'black',
    fontWeight: '500',
  },
  weekDayTextSelected: {
    color: '#7F67FF',
    fontWeight: '700',
  },
  weekDayNum: {
    fontSize: 15,
    color: 'black',
    fontWeight: '600',
  },
  weekDayNumSelected: {
    color: 'white',
    fontWeight: '700',
  },
});

export default ParentalControlsScreen; 