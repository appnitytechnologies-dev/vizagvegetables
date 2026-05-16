import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius, Shadow } from '../constants/spacing';

export default function OrderSuccess() {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    scale.value = withDelay(200, withSpring(1, { damping: 10 }));
    opacity.value = withDelay(200, withTiming(1, { duration: 400 }));
  }, []);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <Animated.View style={[styles.checkCircle, checkStyle]}>
          <Text style={styles.checkMark}>✓</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <Text style={styles.heading}>Order Placed! 🎉</Text>
          <Text style={styles.eta}>Arriving in 45–60 mins</Text>
        </Animated.View>

        <Animated.View style={[styles.summaryCard, { opacity }]}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Order ID</Text>
            <Text style={styles.summaryVal}>#VV2345</Text>
          </View>
          <View style={styles.sep} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Payment</Text>
            <Text style={styles.summaryVal}>UPI</Text>
          </View>
          <View style={styles.sep} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Total Paid</Text>
            <Text style={[styles.summaryVal, { color: Colors.primary }]}>₹270</Text>
          </View>
        </Animated.View>

        <View style={styles.btnCol}>
          <Pressable
            style={styles.trackBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/order-tracking' as any);
            }}
          >
            <Text style={styles.trackText}>Track Order</Text>
          </Pressable>
          <Pressable
            style={styles.homeBtn}
            onPress={() => router.replace('/(tabs)/home' as any)}
          >
            <Text style={styles.homeText}>Back to Home</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl, gap: Spacing.xl },
  checkCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadow.lg },
  checkMark: { fontSize: 52, color: Colors.textInverse },
  heading: { fontFamily: FontFamily.bold, fontSize: FontSize.xxxl, color: Colors.textPrimary, textAlign: 'center', letterSpacing: -0.3 },
  eta: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
  summaryCard: { width: '100%', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md, ...Shadow.md, borderWidth: 1, borderColor: Colors.border },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryKey: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary },
  summaryVal: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  sep: { height: 1, backgroundColor: Colors.border },
  btnCol: { width: '100%', gap: Spacing.md },
  trackBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing.lg, alignItems: 'center' },
  trackText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.textInverse },
  homeBtn: { borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing.lg, alignItems: 'center' },
  homeText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.primary },
});
