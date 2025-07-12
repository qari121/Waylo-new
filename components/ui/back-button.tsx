import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import ChevronLeftIcon from '../../assets/icons/chevron-left.svg';

interface BackButtonProps {
  onPress?: () => void;
  size?: number;
  color?: string;
  style?: any;
}

export const BackButton: React.FC<BackButtonProps> = ({ 
  onPress, 
  size = 24, 
  color = '#000',
  style 
}) => {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <Pressable 
      onPress={handlePress} 
      style={[styles.backButton, style]}
      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
    >
      <ChevronLeftIcon width={size} height={size} color={color} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'transparent',
  },
}); 