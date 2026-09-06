import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { goBackSafely } from '../utils/navigation';

export default function BackButton({ navigation, color = '#fff', style, children }) {
  return (
    <TouchableOpacity
      style={[children ? undefined : styles.backBtn, style]}
      onPress={() => goBackSafely(navigation)}
      hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
      accessibilityLabel="Go back"
      accessibilityRole="button"
    >
      {children ?? <Ionicons name="arrow-back" size={20} color={color} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});
