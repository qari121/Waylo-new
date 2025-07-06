import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Text } from './ui/text';

interface CustomCalendarProps {
  visible: boolean;
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onClose: () => void;
}

const CustomCalendar: React.FC<CustomCalendarProps> = ({
  visible,
  selectedDate,
  onDateSelect,
  onClose,
}) => {
  const formatDateForCalendar = (date: Date) => {
    return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  };

  const markedDates = selectedDate
    ? {
        [formatDateForCalendar(selectedDate)]: {
          selected: true,
          selectedColor: '#7F67FF',
          selectedTextColor: '#FFFFFF',
        },
      }
    : {};

  const handleDayPress = (day: any) => {
    const selectedDate = new Date(day.timestamp);
    onDateSelect(selectedDate);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.calendarContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Date</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Calendar
            onDayPress={handleDayPress}
            markedDates={markedDates}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#7F67FF',
              selectedDayBackgroundColor: '#7F67FF',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#7F67FF',
              dayTextColor: '#2d4150',
              textDisabledColor: '#d9e1e8',
              dotColor: '#7F67FF',
              selectedDotColor: '#ffffff',
              arrowColor: '#7F67FF',
              monthTextColor: '#2d4150',
              indicatorColor: '#7F67FF',
              textDayFontFamily: 'PlusJakartaSans_400Regular',
              textMonthFontFamily: 'PlusJakartaSans_600SemiBold',
              textDayHeaderFontFamily: 'PlusJakartaSans_600SemiBold',
              textDayFontWeight: '400',
              textMonthFontWeight: '600',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
            style={styles.calendar}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxWidth: 350,
    width: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d4150',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F2F2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#7F67FF',
    fontWeight: '600',
  },
  calendar: {
    borderRadius: 10,
  },
});

export default CustomCalendar; 