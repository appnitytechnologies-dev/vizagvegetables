import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Radius, Spacing } from '../../constants/spacing';

interface BadgeProps {
  chg: number;
}

export default function Badge({ chg }: BadgeProps) {
  if (chg === 0) return <Text style={styles.neutral}>—</Text>;

  const isUp = chg > 0;
  return (
    <View style={[styles.pill, isUp ? styles.upBg : styles.downBg]}>
      <Text style={[styles.text, isUp ? styles.upText : styles.downText]}>
        {isUp ? '↑' : '↓'} ₹{Math.abs(chg)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  upBg:   { backgroundColor: Colors.dangerLight },
  downBg: { backgroundColor: Colors.successLight },
  text: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
  },
  upText:   { color: Colors.danger },
  downText: { color: Colors.success },
  neutral: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});
