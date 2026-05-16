import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius, Shadow } from '../constants/spacing';

const STEPS = [
  { label: 'Order Placed',      done: true  },
  { label: 'Confirmed',         done: true  },
  { label: 'Packed',            done: true  },
  { label: 'Out for Delivery',  done: false, active: true },
  { label: 'Delivered',         done: false },
];

export default function OrderTracking() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Order Tracking</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Map placeholder */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapEmoji}>🗺️</Text>
        <Text style={styles.mapText}>Live tracking map</Text>
        <View style={styles.etaChip}>
          <Text style={styles.etaText}>~12 min</Text>
        </View>
        <Text style={styles.riderEmoji}>🛵</Text>
      </View>

      {/* Rider card */}
      <View style={styles.riderCard}>
        <View style={styles.riderAvatar}>
          <Text style={styles.riderAvatarText}>SK</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.riderName}>Suresh K.</Text>
          <Text style={styles.riderDist}>1.2 km away</Text>
        </View>
        <Pressable style={styles.callBtn}>
          <Ionicons name="call-outline" size={18} color={Colors.primary} />
        </Pressable>
      </View>

      {/* Progress tracker */}
      <View style={styles.progressCard}>
        {STEPS.map((s, i) => (
          <View key={s.label} style={styles.step}>
            <View style={styles.stepLeft}>
              <View style={[
                styles.stepDot,
                s.done && styles.stepDotDone,
                s.active && styles.stepDotActive,
              ]}>
                {s.done
                  ? <Ionicons name="checkmark" size={12} color={Colors.textInverse} />
                  : <View style={[styles.innerDot, s.active && styles.innerDotActive]} />}
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, s.done && styles.stepLineDone]} />
              )}
            </View>
            <Text style={[styles.stepLabel, (s.done || s.active) && styles.stepLabelActive]}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },
  mapPlaceholder: { height: 200, backgroundColor: Colors.primaryPale, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, position: 'relative' },
  mapEmoji: { fontSize: 48 },
  mapText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },
  etaChip: { position: 'absolute', top: Spacing.md, right: Spacing.md, backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  etaText: { fontFamily: FontFamily.bold, fontSize: FontSize.xs, color: Colors.textInverse },
  riderEmoji: { position: 'absolute', bottom: 40, left: '40%', fontSize: 32 },
  riderCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, margin: Spacing.xxl, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.sm },
  riderAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  riderAvatarText: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.primary },
  riderName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.textPrimary },
  riderDist: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },
  callBtn: { width: 44, height: 44, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  progressCard: { marginHorizontal: Spacing.xxl, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.sm },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  stepLeft: { alignItems: 'center', width: 24 },
  stepDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  stepDotDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepDotActive: { borderColor: Colors.primary },
  innerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  innerDotActive: { backgroundColor: Colors.primary },
  stepLine: { width: 2, height: 28, backgroundColor: Colors.border, marginVertical: 2 },
  stepLineDone: { backgroundColor: Colors.primary },
  stepLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textMuted, paddingTop: 2, paddingBottom: Spacing.lg },
  stepLabelActive: { color: Colors.textPrimary, fontFamily: FontFamily.semiBold },
});
