import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';

export default function GetStarted() {
  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 14 });
    opacity.value = withTiming(1, { duration: 500 });
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(auth)/otp-number');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.brandTitle}>Vizag Vegetables 🥕</Text>
      </View>

      <Animated.View style={[styles.illustrationWrap, contentStyle]}>
        <View style={styles.illustrationPlaceholder}>
          <Text style={styles.illustrationEmoji}>🥦🥕🍅🧅🌽</Text>
          <Text style={styles.illustrationSub}>Fresh from Rythu Bazar</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.bottom, contentStyle]}>
        <Text style={styles.tagline}>
          Vizag Vegetables is a solution for{' '}
          <Text style={styles.taglineBold}>Grocery Shopping</Text>
          {' '}every you need
        </Text>

        <Pressable
          style={styles.button}
          onPress={handleGetStarted}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>

        <View style={styles.dotsRow}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.dot, i === 2 && styles.dotActive]} />
          ))}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  brandTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xxl,
    color: Colors.textInverse,
    letterSpacing: -0.3,
  },
  illustrationWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  illustrationPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationEmoji: {
    fontSize: 72,
    letterSpacing: 4,
    marginBottom: Spacing.md,
  },
  illustrationSub: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.7)',
  },
  bottom: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
    alignItems: 'center',
  },
  tagline: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.lg,
    color: Colors.textInverse,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: FontSize.lg * 1.5,
  },
  taglineBold: {
    fontFamily: FontFamily.bold,
    color: Colors.textInverse,
  },
  button: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxxl,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  buttonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.primary,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: Colors.textInverse,
    width: 20,
  },
});
