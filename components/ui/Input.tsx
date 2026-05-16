import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Radius, Spacing, Shadow } from '../../constants/spacing';

interface InputProps extends TextInputProps {
  prefix?: string;
  label?: string;
}

export default function Input({ prefix, label, style, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);
  const borderAnim = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    borderColor: borderAnim.value === 1 ? Colors.primary : Colors.border,
    borderWidth: borderAnim.value === 1 ? 1.5 : 1,
  }));

  const onFocus = () => {
    setFocused(true);
    borderAnim.value = withSpring(1);
    rest.onFocus?.({} as any);
  };

  const onBlur = () => {
    setFocused(false);
    borderAnim.value = withSpring(0);
    rest.onBlur?.({} as any);
  };

  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View style={[styles.container, animStyle, Shadow.sm]}>
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          style={[styles.input, style as any]}
          placeholderTextColor={Colors.textMuted}
          onFocus={onFocus}
          onBlur={onBlur}
          {...rest}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  prefix: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    padding: 0,
  },
});
