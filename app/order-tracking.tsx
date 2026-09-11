import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { api, ApiOrder } from '../lib/api';
import PageHeader from '../components/ui/PageHeader';

/* ── Status config ───────────────────────────────────────── */
const STATUS_STEP: Record<string, number> = {
  pending:          0,
  confirmed:        1,
  preparing:        2,
  out_for_delivery: 3,
  delivered:        4,
  cancelled:        -1,
};

const STEPS = [
  { short: 'Placed',    icon: '📦' },
  { short: 'Confirmed', icon: '✅' },
  { short: 'Packing',   icon: '🛍️' },
  { short: 'On Way',    icon: '🛵' },
  { short: 'Delivered', icon: '🏠' },
];

const STATUS_INFO: Record<number, { title: string; sub: string; gradient: [string, string] }> = {
  0: { title: 'Order Placed',       sub: "We received your order — hang tight!",          gradient: ['#1B5E35', '#2E7D32'] },
  1: { title: 'Order Confirmed',    sub: 'Your order has been confirmed by our team.',     gradient: ['#1B5E35', '#388E3C'] },
  2: { title: 'Being Packed',       sub: 'Packing your fresh vegetables with care.',       gradient: ['#2E7D32', '#43A047'] },
  3: { title: 'Out for Delivery',   sub: 'Your order is on its way to you!',              gradient: ['#388E3C', '#66BB6A'] },
  4: { title: 'Order Delivered!',   sub: 'Enjoy your fresh vegetables 🎉',                gradient: ['#2E7D32', '#43A047'] },
};

const CANCELLED_INFO = {
  title: 'Order Cancelled',
  sub: 'Contact support if you have any questions.',
  gradient: ['#B71C1C', '#C62828'] as [string, string],
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

const METHOD_LABEL: Record<string, string> = {
  upi: 'UPI', card: 'Credit / Debit Card',
  netbanking: 'Net Banking', cod: 'Cash on Delivery',
};

/* ── Hero status banner ──────────────────────────────────── */
function StatusHero({ step, isCancelled }: { step: number; isCancelled: boolean }) {
  const info = isCancelled ? CANCELLED_INFO : (STATUS_INFO[step] ?? STATUS_INFO[0]);
  const icon = isCancelled ? '❌' : STEPS[step]?.icon ?? '📦';

  return (
    <LinearGradient colors={info.gradient} style={hero.wrap}>
      <View style={hero.iconCircle}>
        <Text style={hero.icon}>{icon}</Text>
      </View>
      <Text style={hero.title}>{info.title}</Text>
      <Text style={hero.sub}>{info.sub}</Text>
    </LinearGradient>
  );
}

const hero = StyleSheet.create({
  wrap: { paddingTop: Spacing.xl, paddingBottom: Spacing.xxxl, alignItems: 'center', gap: Spacing.sm },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  icon:  { fontSize: 36 },
  title: { fontFamily: FontFamily.bold,    fontSize: FontSize.xl,  color: '#fff' },
  sub:   { fontFamily: FontFamily.regular, fontSize: FontSize.sm,  color: 'rgba(255,255,255,0.85)', textAlign: 'center', paddingHorizontal: Spacing.xxxl },
});

/* ── Horizontal progress stepper ────────────────────────── */
function ProgressStepper({ step }: { step: number }) {
  return (
    <View style={prog.card}>
      <Text style={prog.heading}>Order Progress</Text>
      <View style={prog.track}>
        {STEPS.map((s, i) => {
          const done   = i < step;
          const active = i === step;
          return (
            <View key={s.short} style={prog.stepGroup}>
              <View style={prog.stepCol}>
                {/* connecting line left */}
                {i > 0 && (
                  <View style={[prog.lineLeft, (done || active) && prog.lineDone]} />
                )}
                <View style={[
                  prog.dot,
                  done   && prog.dotDone,
                  active && prog.dotActive,
                ]}>
                  {done
                    ? <Ionicons name="checkmark" size={11} color="#fff" />
                    : active
                    ? <View style={prog.innerActive} />
                    : <View style={prog.inner} />}
                </View>
                {/* connecting line right */}
                {i < STEPS.length - 1 && (
                  <View style={[prog.lineRight, done && prog.lineDone]} />
                )}
              </View>
              <Text style={[prog.label, (done || active) && prog.labelActive]} numberOfLines={2}>
                {s.short}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const prog = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.md, marginTop: -Spacing.xl,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, ...Shadow.md,
  },
  heading: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.lg },
  track: { flexDirection: 'row', alignItems: 'flex-start' },
  stepGroup: { flex: 1, alignItems: 'center' },
  stepCol: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center' },
  dot: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 1,
  },
  dotDone:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dotActive: { borderColor: Colors.primary, backgroundColor: Colors.surface },
  inner:       { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.border },
  innerActive: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.primary },
  lineLeft:  { flex: 1, height: 2, backgroundColor: Colors.border },
  lineRight: { flex: 1, height: 2, backgroundColor: Colors.border },
  lineDone:  { backgroundColor: Colors.primary },
  label: {
    marginTop: Spacing.xs, fontFamily: FontFamily.regular,
    fontSize: 10, color: Colors.textMuted, textAlign: 'center',
  },
  labelActive: { color: Colors.primary, fontFamily: FontFamily.semiBold },
});

/* ── Info row helper ─────────────────────────────────────── */
function InfoRow({ icon, label, value, last = false, valueStyle }: {
  icon: string; label: string; value: string; last?: boolean; valueStyle?: any;
}) {
  return (
    <View style={[info.row, last && { borderBottomWidth: 0 }]}>
      <View style={info.iconBox}>
        <Ionicons name={icon as any} size={15} color={Colors.primary} />
      </View>
      <Text style={info.label}>{label}</Text>
      <Text style={[info.value, valueStyle]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const info = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  iconBox: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.primaryPale,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, width: 80 },
  value: { flex: 1, fontFamily: FontFamily.numMed, fontSize: FontSize.sm, color: Colors.textPrimary, textAlign: 'right' },
});

/* ── Screen ──────────────────────────────────────────────── */
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

  const currentStep  = order ? (STATUS_STEP[order.status] ?? 0) : 0;
  const isCancelled  = order?.status === 'cancelled';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <PageHeader title="Order Tracking" fallback="/(tabs)/profile" />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorState}>
          <Text style={{ fontSize: 40 }}>😕</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.errorLink}>Go back</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* ── Status hero ── */}
          <StatusHero step={currentStep} isCancelled={isCancelled} />

          {/* ── Progress stepper (only when not cancelled) ── */}
          {!isCancelled && <ProgressStepper step={currentStep} />}

          {/* ── Cancelled card ── */}
          {isCancelled && (
            <View style={styles.cancelCard}>
              <Ionicons name="close-circle" size={32} color={Colors.danger} />
              <Text style={styles.cancelTitle}>Order Cancelled</Text>
              <Text style={styles.cancelSub}>This order was cancelled. Please contact support if you have any questions.</Text>
            </View>
          )}

          {/* ── Order details card ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Details</Text>
            <InfoRow icon="receipt-outline"  label="Order"      value={`#${order!.id.slice(0, 8).toUpperCase()}`} />
            <InfoRow icon="calendar-outline" label="Date"       value={formatDate(order!.created_at)} />
            <InfoRow icon="time-outline"     label="Slot"       value={order!.delivery_slot} />
            <InfoRow icon="card-outline"     label="Payment"    value={METHOD_LABEL[order!.payment_method] ?? order!.payment_method} />
            <InfoRow icon="cash-outline"     label="Total"      value={`₹${order!.total_amount}`}
              valueStyle={{ color: Colors.primary, fontFamily: FontFamily.bold }} />
            <InfoRow icon="location-outline" label="Deliver to" value={order!.delivery_address} last />
          </View>

          {/* ── Items card ── */}
          {order!.items && order!.items.length > 0 && (() => {
            const subtotal    = order!.items!.reduce((s, i) => s + i.unit_price * i.quantity, 0);
            const deliveryFee = Number(order!.total_amount) - subtotal;
            return (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Items Ordered</Text>
                {order!.items.map((item, i) => (
                  <View key={i} style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemQty}>×{item.quantity} {item.unit}</Text>
                    <Text style={styles.itemPrice}>₹{item.unit_price * item.quantity}</Text>
                  </View>
                ))}

                {/* Bill summary */}
                <View style={styles.billSep} />
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Subtotal</Text>
                  <Text style={styles.billVal}>₹{subtotal}</Text>
                </View>
                {deliveryFee > 0 && (
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Delivery</Text>
                    <Text style={styles.billVal}>₹{deliveryFee}</Text>
                  </View>
                )}
                <View style={[styles.billRow, { marginTop: 2 }]}>
                  <Text style={styles.billTotal}>Total</Text>
                  <Text style={styles.billTotalVal}>₹{Number(order!.total_amount).toFixed(2)}</Text>
                </View>
              </View>
            );
          })()}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F3F5' },

  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xxl },
  errorText:  { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.textPrimary, textAlign: 'center' },
  errorLink:  { color: Colors.primary, fontFamily: FontFamily.medium },

  cancelCard: {
    marginHorizontal: Spacing.md, marginTop: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm,
    ...Shadow.sm,
  },
  cancelTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.danger },
  cancelSub:   { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },

  card: {
    marginHorizontal: Spacing.md, marginTop: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, ...Shadow.sm,
  },
  cardTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xs },

  itemRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  itemName:  { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textPrimary },
  itemQty:   { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, marginRight: Spacing.md },
  itemPrice: { fontFamily: FontFamily.numBold, fontSize: FontSize.sm, color: Colors.textPrimary, width: 60, textAlign: 'right' },

  billSep:      { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  billRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  billLabel:    { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary },
  billVal:      { fontFamily: FontFamily.numMed, fontSize: FontSize.sm, color: Colors.textPrimary },
  billTotal:    { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary },
  billTotalVal: { fontFamily: FontFamily.numBold, fontSize: FontSize.md, color: Colors.primary },
});
