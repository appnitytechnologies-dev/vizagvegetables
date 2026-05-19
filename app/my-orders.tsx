import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import Divider from '../components/ui/Divider';

interface OrderItem { emoji: string; name: string; qty: number; price: number }
interface Order {
  id: string; date: string; status: 'Delivered' | 'In Transit' | 'Processing' | 'Cancelled';
  items: OrderItem[]; total: number; address: string; deliveryFee: number;
}

const ORDERS: Order[] = [
  {
    id: 'VV2344', date: '15 May 2026', status: 'Delivered',
    items: [
      { emoji: '🍅', name: 'Tomato', qty: 2, price: 18 },
      { emoji: '🧅', name: 'Onion',  qty: 1, price: 35 },
      { emoji: '🥕', name: 'Carrot', qty: 1, price: 28 },
    ],
    total: 99, deliveryFee: 30, address: '123, Steel Plant Road, Gajuwaka',
  },
  {
    id: 'VV2343', date: '12 May 2026', status: 'Delivered',
    items: [
      { emoji: '🥦', name: 'Broccoli',  qty: 1, price: 60 },
      { emoji: '🌿', name: 'Coriander', qty: 2, price: 10 },
    ],
    total: 80, deliveryFee: 30, address: '45, MVP Colony, Sector 7, Vizag',
  },
  {
    id: 'VV2342', date: '8 May 2026', status: 'Delivered',
    items: [
      { emoji: '🍆', name: 'Brinjal',  qty: 2, price: 22 },
      { emoji: '🥒', name: 'Cucumber', qty: 1, price: 15 },
      { emoji: '🌽', name: 'Corn',     qty: 2, price: 20 },
    ],
    total: 97, deliveryFee: 30, address: '123, Steel Plant Road, Gajuwaka',
  },
];

const STATUS_COLORS: Record<Order['status'], { bg: string; text: string }> = {
  'Delivered':   { bg: Colors.successLight, text: Colors.success },
  'In Transit':  { bg: '#E3F2FD',           text: '#1565C0' },
  'Processing':  { bg: '#FFF3E0',           text: '#E65100' },
  'Cancelled':   { bg: Colors.dangerLight,  text: Colors.danger },
};

const STATUS_ICON: Record<Order['status'], string> = {
  'Delivered':  'checkmark-circle',
  'In Transit': 'bicycle',
  'Processing': 'time',
  'Cancelled':  'close-circle',
};

export default function MyOrders() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>My Orders</Text>
        <View style={{ width: 36 }} />
      </View>
      <Divider />

      <FlatList
        data={ORDERS}
        keyExtractor={o => o.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: Spacing.xxl, gap: Spacing.lg, paddingBottom: 40 }}
        renderItem={({ item }) => {
          const sc = STATUS_COLORS[item.status];
          return (
            <View style={styles.card}>
              {/* Card header */}
              <View style={styles.cardHead}>
                <View>
                  <Text style={styles.orderId}>#{item.id}</Text>
                  <Text style={styles.orderDate}>{item.date}</Text>
                </View>
                <View style={[styles.statusChip, { backgroundColor: sc.bg }]}>
                  <Ionicons name={STATUS_ICON[item.status] as any} size={12} color={sc.text} />
                  <Text style={[styles.statusText, { color: sc.text }]}>{item.status}</Text>
                </View>
              </View>

              <Divider />

              {/* Items */}
              <View style={styles.itemsList}>
                {item.items.map((it, i) => (
                  <View key={i} style={styles.itemRow}>
                    <Text style={styles.itemEmoji}>{it.emoji}</Text>
                    <Text style={styles.itemName}>{it.name}</Text>
                    <Text style={styles.itemQty}>×{it.qty}</Text>
                    <Text style={styles.itemPrice}>₹{it.price * it.qty}</Text>
                  </View>
                ))}
              </View>

              <Divider />

              {/* Footer */}
              <View style={styles.cardFoot}>
                <View style={styles.addressRow}>
                  <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
                  <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total (incl. delivery)</Text>
                  <Text style={styles.totalVal}>₹{item.total + item.deliveryFee}</Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                {item.status === 'In Transit' && (
                  <Pressable
                    style={styles.primaryBtn}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/order-tracking' as any); }}
                  >
                    <Ionicons name="navigate-outline" size={15} color={Colors.textInverse} />
                    <Text style={styles.primaryBtnText}>Track Order</Text>
                  </Pressable>
                )}
                <Pressable
                  style={styles.outlineBtn}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/shop' as any); }}
                >
                  <Ionicons name="refresh-outline" size={15} color={Colors.primary} />
                  <Text style={styles.outlineBtnText}>Reorder</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },

  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: Spacing.lg },
  orderId: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary },
  orderDate: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full },
  statusText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs },

  itemsList: { padding: Spacing.lg, gap: Spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  itemEmoji: { fontSize: 18, width: 28 },
  itemName: { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textPrimary },
  itemQty: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted },
  itemPrice: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary, width: 52, textAlign: 'right' },

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
