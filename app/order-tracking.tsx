import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { api, ApiOrder } from '../lib/api';

/* ── Status → step index ──────────────────────────────────── */
const STATUS_STEP: Record<string, number> = {
  pending:          0,
  confirmed:        1,
  preparing:        2,
  out_for_delivery: 3,
  delivered:        4,
  cancelled:        -1,
};

const STEP_LABELS = [
  { label: 'Order Placed',     icon: '📦' },
  { label: 'Confirmed',        icon: '✅' },
  { label: 'Being Packed',     icon: '🛍️'  },
  { label: 'Out for Delivery', icon: '🛵' },
  { label: 'Delivered',        icon: '🏠' },
];

const METHOD_LABEL: Record<string, string> = {
  upi:        'UPI',
  card:       'Credit / Debit Card',
  netbanking: 'Net Banking',
  cod:        'Cash on Delivery',
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

export default function OrderTracking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order,   setOrder]   = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!id) { setLoading(false); setError('No order ID provided'); return; }
    api.get<ApiOrder>(`/api/orders/${id}`)
      .then(setOrder)
      .catch(e => setError(e.message || 'Failed to load order'))
      .finally(() => setLoading(false));
  }, [id]);

  const currentStep = order ? (STATUS_STEP[order.status] ?? 0) : 0;
  const isCancelled = order?.status === 'cancelled';

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

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xxl }}>
          <Text style={{ fontSize: 40 }}>😕</Text>
          <Text style={{ fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.textPrimary, textAlign: 'center' }}>{error}</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: Colors.primary, fontFamily: FontFamily.medium }}>Go back</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Map placeholder */}
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapEmoji}>🗺️</Text>
            <Text style={styles.mapText}>Visakhapatnam</Text>
            {!isCancelled && currentStep < 4 && (
              <View style={styles.etaChip}>
                <Text style={styles.etaText}>
                  {currentStep < 3 ? 'Preparing' : '~30 min away'}
                </Text>
              </View>
            )}
            {currentStep === 3 && (
              <Text style={styles.riderEmoji}>🛵</Text>
            )}
          </View>

          {/* Order info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="receipt-outline" size={16} color={Colors.primary} />
              <Text style={styles.infoLabel}>Order</Text>
              <Text style={styles.infoVal}>#{order!.id.slice(0, 8).toUpperCase()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoVal}>{formatDate(order!.created_at)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={Colors.primary} />
              <Text style={styles.infoLabel}>Deliver to</Text>
              <Text style={[styles.infoVal, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                {order!.delivery_address}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color={Colors.primary} />
              <Text style={styles.infoLabel}>Slot</Text>
              <Text style={styles.infoVal}>{order!.delivery_slot}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="card-outline" size={16} color={Colors.primary} />
              <Text style={styles.infoLabel}>Payment</Text>
              <Text style={styles.infoVal}>
                {METHOD_LABEL[order!.payment_method] ?? order!.payment_method}
              </Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Ionicons name="cash-outline" size={16} color={Colors.primary} />
              <Text style={styles.infoLabel}>Total</Text>
              <Text style={[styles.infoVal, { color: Colors.primary, fontFamily: FontFamily.bold }]}>
                ₹{order!.total_amount}
              </Text>
            </View>
          </View>

          {/* Progress tracker */}
          {isCancelled ? (
            <View style={[styles.progressCard, { alignItems: 'center', gap: Spacing.md }]}>
              <Text style={{ fontSize: 36 }}>❌</Text>
              <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.danger }}>
                Order Cancelled
              </Text>
              <Text style={{ fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' }}>
                This order was cancelled. Contact support if you have questions.
              </Text>
            </View>
          ) : (
            <View style={styles.progressCard}>
              <Text style={styles.progressTitle}>Order Progress</Text>
              {STEP_LABELS.map((s, i) => {
                const done   = i < currentStep;
                const active = i === currentStep;
                return (
                  <View key={s.label} style={styles.step}>
                    <View style={styles.stepLeft}>
                      <View style={[
                        styles.stepDot,
                        done   && styles.stepDotDone,
                        active && styles.stepDotActive,
                      ]}>
                        {done
                          ? <Ionicons name="checkmark" size={12} color={Colors.textInverse} />
                          : <View style={[styles.innerDot, active && styles.innerDotActive]} />}
                      </View>
                      {i < STEP_LABELS.length - 1 && (
                        <View style={[styles.stepLine, done && styles.stepLineDone]} />
                      )}
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepIcon}>{s.icon}</Text>
                      <Text style={[styles.stepLabel, (done || active) && styles.stepLabelActive]}>
                        {s.label}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Items */}
          {order!.items && order!.items.length > 0 && (
            <View style={styles.itemsCard}>
              <Text style={styles.itemsTitle}>Items Ordered</Text>
              {order!.items.map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQty}>×{item.quantity} {item.unit}</Text>
                  <Text style={styles.itemPrice}>₹{item.unit_price * item.quantity}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },

  mapPlaceholder: { height: 180, backgroundColor: Colors.primaryPale, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, position: 'relative' },
  mapEmoji: { fontSize: 48 },
  mapText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },
  etaChip: { position: 'absolute', top: Spacing.md, right: Spacing.md, backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  etaText: { fontFamily: FontFamily.bold, fontSize: FontSize.xs, color: Colors.textInverse },
  riderEmoji: { position: 'absolute', bottom: 40, left: '40%', fontSize: 32 },

  infoCard: { marginHorizontal: Spacing.xxl, marginTop: Spacing.xxl, backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, width: 80 },
  infoVal: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },

  progressCard: { margin: Spacing.xxl, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.sm },
  progressTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md },

  step: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  stepLeft: { alignItems: 'center', width: 24 },
  stepDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  stepDotDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepDotActive: { borderColor: Colors.primary },
  innerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  innerDotActive: { backgroundColor: Colors.primary },
  stepLine: { width: 2, height: 28, backgroundColor: Colors.border, marginVertical: 2 },
  stepLineDone: { backgroundColor: Colors.primary },
  stepContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingBottom: Spacing.lg },
  stepIcon: { fontSize: 16 },
  stepLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textMuted, paddingTop: 2 },
  stepLabelActive: { color: Colors.textPrimary, fontFamily: FontFamily.semiBold },

  itemsCard: { marginHorizontal: Spacing.xxl, marginBottom: Spacing.xxl, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.sm, gap: Spacing.sm },
  itemsTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xs },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  itemName: { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textPrimary },
  itemQty: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, marginRight: Spacing.md },
  itemPrice: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary, width: 56, textAlign: 'right' },
});
