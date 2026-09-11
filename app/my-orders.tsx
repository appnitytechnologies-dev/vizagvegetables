import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { api, ApiOrder } from '../lib/api';
import PageHeader from '../components/ui/PageHeader';

/* ── Status config ───────────────────────────────────────── */
type DisplayStatus = 'Delivered' | 'In Transit' | 'Processing' | 'Cancelled';

const STATUS_MAP: Record<string, DisplayStatus> = {
  pending:          'Processing',
  confirmed:        'Processing',
  preparing:        'Processing',
  out_for_delivery: 'In Transit',
  delivered:        'Delivered',
  cancelled:        'Cancelled',
};

const STATUS_CFG: Record<DisplayStatus, { bg: string; text: string; icon: string; accent: string; step: number }> = {
  'Processing': { bg: '#FFF3E0', text: '#E65100', icon: 'time',            accent: '#FB8C00', step: 1 },
  'In Transit': { bg: '#E3F2FD', text: '#1565C0', icon: 'bicycle',         accent: '#1E88E5', step: 2 },
  'Delivered':  { bg: '#E8F5E9', text: '#2E7D32', icon: 'checkmark-circle',accent: Colors.primary, step: 3 },
  'Cancelled':  { bg: '#FFEBEE', text: '#C62828', icon: 'close-circle',    accent: Colors.danger, step: -1 },
};

/* 3-dot mini stepper labels */
const MINI_STEPS = ['Placed', 'Packing', 'On Way', 'Done'];

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

/* ── Mini inline progress ────────────────────────────────── */
function MiniProgress({ step }: { step: number }) {
  if (step < 0) return null;
  return (
    <View style={mp.wrap}>
      {MINI_STEPS.map((label, i) => {
        const done   = i < step;
        const active = i === step;
        return (
          <View key={label} style={mp.stepGroup}>
            <View style={mp.stepRow}>
              {i > 0 && <View style={[mp.line, done && mp.lineDone, active && mp.lineActive]} />}
              <View style={[mp.dot, done && mp.dotDone, active && mp.dotActive]}>
                {done && <Ionicons name="checkmark" size={8} color="#fff" />}
              </View>
              {i < MINI_STEPS.length - 1 && <View style={[mp.line, done && mp.lineDone]} />}
            </View>
            <Text style={[mp.label, (done || active) && mp.labelActive]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const mp = StyleSheet.create({
  wrap:       { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Spacing.md },
  stepGroup:  { flex: 1, alignItems: 'center' },
  stepRow:    { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center' },
  dot:        { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  dotDone:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dotActive:  { borderColor: Colors.primary },
  line:       { flex: 1, height: 1.5, backgroundColor: Colors.border },
  lineDone:   { backgroundColor: Colors.primary },
  lineActive: { backgroundColor: Colors.primary },
  label:      { marginTop: 4, fontSize: 9, fontFamily: FontFamily.regular, color: Colors.textMuted, textAlign: 'center' },
  labelActive:{ color: Colors.primary, fontFamily: FontFamily.semiBold },
});

/* ── Order card ──────────────────────────────────────────── */
function OrderCard({ item }: { item: ApiOrder }) {
  const displayStatus = STATUS_MAP[item.status] ?? 'Processing';
  const cfg = STATUS_CFG[displayStatus];
  const items = (item.items || []).filter(Boolean);
  const shown = items.slice(0, 3);
  const extra = items.length - shown.length;
  const canTrack = displayStatus === 'Processing' || displayStatus === 'In Transit';

  return (
    <View style={card.wrap}>
      {/* Colored left accent bar */}
      <View style={[card.accent, { backgroundColor: cfg.accent }]} />

      <View style={card.body}>
        {/* Header row */}
        <View style={card.headRow}>
          <View>
            <Text style={card.orderId}>#{item.id.slice(0, 8).toUpperCase()}</Text>
            <Text style={card.date}>{formatDate(item.created_at)}</Text>
          </View>
          <View style={[card.statusChip, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon as any} size={11} color={cfg.text} />
            <Text style={[card.statusText, { color: cfg.text }]}>{displayStatus}</Text>
          </View>
        </View>

        {/* Mini progress */}
        {displayStatus !== 'Cancelled' && <MiniProgress step={cfg.step} />}

        {/* Thin divider */}
        <View style={card.divider} />

        {/* Items */}
        <View style={card.itemsBox}>
          {shown.map((it, i) => (
            <View key={i} style={card.itemRow}>
              <View style={card.emojiBox}>
                <Text style={card.emojiText}>{it.name.slice(0, 1)}</Text>
              </View>
              <Text style={card.itemName} numberOfLines={1}>{it.name}</Text>
              <Text style={card.itemQty}>×{it.quantity} {it.unit}</Text>
              <Text style={card.itemPrice}>₹{it.unit_price * it.quantity}</Text>
            </View>
          ))}
          {extra > 0 && (
            <Text style={card.more}>+{extra} more item{extra > 1 ? 's' : ''}</Text>
          )}
        </View>

        <View style={card.divider} />

        {/* Footer */}
        <View style={card.footRow}>
          <View style={card.addressBox}>
            <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
            <Text style={card.addressText} numberOfLines={1}>{item.delivery_address}</Text>
          </View>
          <View style={card.totalBox}>
            <Text style={card.totalLabel}>Total</Text>
            <Text style={card.totalVal}>₹{Number(item.total_amount).toFixed(2)}</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={card.actions}>
          {canTrack && (
            <Pressable
              style={card.primaryBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push({ pathname: '/order-tracking', params: { id: item.id } } as any);
              }}
            >
              <Ionicons name="navigate-outline" size={14} color="#fff" />
              <Text style={card.primaryBtnText}>Track Order</Text>
            </Pressable>
          )}
          <Pressable
            style={[card.outlineBtn, !canTrack && { flex: 1 }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/shop' as any); }}
          >
            <Ionicons name="refresh-outline" size={14} color={Colors.primary} />
            <Text style={card.outlineBtnText}>Reorder</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const card = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
    overflow: 'hidden',
    ...Shadow.sm,
  },
  accent: { width: 4 },
  body:   { flex: 1, padding: Spacing.lg },

  headRow:    { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  orderId:    { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary },
  date:       { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  statusText: { fontFamily: FontFamily.semiBold, fontSize: 11 },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginVertical: Spacing.sm },

  itemsBox: { gap: Spacing.sm },
  itemRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  emojiBox: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.primaryPale,
    alignItems: 'center', justifyContent: 'center',
  },
  emojiText:  { fontFamily: FontFamily.bold, fontSize: 12, color: Colors.primary },
  itemName:   { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textPrimary },
  itemQty:    { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },
  itemPrice:  { fontFamily: FontFamily.numBold, fontSize: FontSize.sm, color: Colors.textPrimary, width: 50, textAlign: 'right' },
  more:       { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  footRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.xs },
  addressBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 3 },
  addressText:{ flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },
  totalBox:   { alignItems: 'flex-end' },
  totalLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },
  totalVal:   { fontFamily: FontFamily.numBold, fontSize: FontSize.md, color: Colors.primary },

  actions:       { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  primaryBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 9 },
  primaryBtnText:{ fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: '#fff' },
  outlineBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 9 },
  outlineBtnText:{ fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.primary },
});

/* ── Screen ──────────────────────────────────────────────── */
export default function MyOrders() {
  const [orders,  setOrders]  = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true); setError('');
    try {
      setOrders(await api.get<ApiOrder[]>('/api/orders/my'));
    } catch (e: any) {
      setError(e.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <PageHeader
        title="My Orders"
        fallback="/(tabs)/profile"
        right={
          <Pressable onPress={loadOrders} hitSlop={8}>
            <Ionicons name="refresh-outline" size={20} color={Colors.primary} />
          </Pressable>
        }
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 40 }}>😕</Text>
          <Text style={styles.msgText}>{error}</Text>
          <Pressable style={styles.actionBtn} onPress={loadOrders}>
            <Text style={styles.actionBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 52 }}>🛒</Text>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptyBody}>Your orders will appear here once you place them.</Text>
          <Pressable style={styles.actionBtn} onPress={() => router.push('/(tabs)/shop' as any)}>
            <Text style={styles.actionBtnText}>Start Shopping</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={o => o.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <OrderCard item={item} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F3F5' },
  list:      { padding: Spacing.md, gap: Spacing.md, paddingBottom: 40 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xxl },
  msgText:   { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.textPrimary, textAlign: 'center' },
  emptyTitle:{ fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },
  emptyBody: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  actionBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md },
  actionBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: '#fff' },
});
