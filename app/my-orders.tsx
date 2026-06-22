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
import Divider from '../components/ui/Divider';

/* ── Types ──────────────────────────────────────────────────── */
type DisplayStatus = 'Delivered' | 'In Transit' | 'Processing' | 'Cancelled';

const STATUS_MAP: Record<string, DisplayStatus> = {
  pending:          'Processing',
  confirmed:        'Processing',
  preparing:        'Processing',
  out_for_delivery: 'In Transit',
  delivered:        'Delivered',
  cancelled:        'Cancelled',
};

const STATUS_COLORS: Record<DisplayStatus, { bg: string; text: string }> = {
  'Delivered':  { bg: Colors.successLight, text: Colors.success },
  'In Transit': { bg: '#E3F2FD',           text: '#1565C0' },
  'Processing': { bg: '#FFF3E0',           text: '#E65100' },
  'Cancelled':  { bg: Colors.dangerLight,  text: Colors.danger },
};

const STATUS_ICON: Record<DisplayStatus, string> = {
  'Delivered':  'checkmark-circle',
  'In Transit': 'bicycle',
  'Processing': 'time',
  'Cancelled':  'close-circle',
};

/* ── Helpers ────────────────────────────────────────────────── */
function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

/* ── Screen ─────────────────────────────────────────────────── */
export default function MyOrders() {
  const [orders,  setOrders]  = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<ApiOrder[]>('/api/orders/my');
      setOrders(data);
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

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>My Orders</Text>
        <Pressable onPress={loadOrders} style={styles.backBtn}>
          <Ionicons name="refresh-outline" size={20} color={Colors.primary} />
        </Pressable>
      </View>
      <Divider />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xxl }}>
          <Text style={{ fontSize: 40 }}>😕</Text>
          <Text style={{ fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.textPrimary, textAlign: 'center' }}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={loadOrders}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : orders.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xxl }}>
          <Text style={{ fontSize: 48 }}>🛒</Text>
          <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary }}>No orders yet</Text>
          <Text style={{ fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' }}>
            Your orders will appear here once you shop.
          </Text>
          <Pressable style={styles.retryBtn} onPress={() => router.push('/(tabs)/shop' as any)}>
            <Text style={styles.retryText}>Shop Now</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={o => o.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: Spacing.xxl, gap: Spacing.lg, paddingBottom: 40 }}
          renderItem={({ item }) => {
            const displayStatus = STATUS_MAP[item.status] ?? 'Processing';
            const sc = STATUS_COLORS[displayStatus];
            return (
              <View style={styles.card}>
                {/* Card header */}
                <View style={styles.cardHead}>
                  <View>
                    <Text style={styles.orderId}>#{item.id.slice(0, 8).toUpperCase()}</Text>
                    <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: sc.bg }]}>
                    <Ionicons name={STATUS_ICON[displayStatus] as any} size={12} color={sc.text} />
                    <Text style={[styles.statusText, { color: sc.text }]}>{displayStatus}</Text>
                  </View>
                </View>

                <Divider />

                {/* Items */}
                <View style={styles.itemsList}>
                  {(item.items || []).filter(Boolean).map((it, i) => (
                    <View key={i} style={styles.itemRow}>
                      <Text style={styles.itemName} numberOfLines={1}>{it.name}</Text>
                      <Text style={styles.itemQty}>×{it.quantity} {it.unit}</Text>
                      <Text style={styles.itemPrice}>₹{it.unit_price * it.quantity}</Text>
                    </View>
                  ))}
                </View>

                <Divider />

                {/* Footer */}
                <View style={styles.cardFoot}>
                  <View style={styles.addressRow}>
                    <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.addressText} numberOfLines={1}>{item.delivery_address}</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total paid</Text>
                    <Text style={styles.totalVal}>₹{item.total_amount}</Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                  {(displayStatus === 'In Transit' || displayStatus === 'Processing') && (
                    <Pressable
                      style={styles.primaryBtn}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        router.push({ pathname: '/order-tracking', params: { id: item.id } } as any);
                      }}
                    >
                      <Ionicons name="navigate-outline" size={15} color={Colors.textInverse} />
                      <Text style={styles.primaryBtnText}>Track Order</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.outlineBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/(tabs)/shop' as any);
                    }}
                  >
                    <Ionicons name="refresh-outline" size={15} color={Colors.primary} />
                    <Text style={styles.outlineBtnText}>Reorder</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },

  retryBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md },
  retryText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textInverse },

  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: Spacing.lg },
  orderId: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary },
  orderDate: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full },
  statusText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs },

  itemsList: { padding: Spacing.lg, gap: Spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  itemName: { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textPrimary },
  itemQty: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted },
  itemPrice: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary, width: 60, textAlign: 'right' },

  cardFoot: { padding: Spacing.lg, gap: Spacing.sm },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addressText: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary },
  totalVal: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.primary },

  actions: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  primaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing.sm },
  primaryBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textInverse },
  outlineBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing.sm },
  outlineBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.primary },
});
