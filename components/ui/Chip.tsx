import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Radius, Spacing } from '../../constants/spacing';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress: () => void;
}

export default function Chip({ label, active, onPress }: ChipProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={[styles.chip, active && styles.active]}>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.18)',
    marginRight: Spacing.sm,
  },
  active: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  labelActive: {
    color: Colors.textInverse,
  },
});
