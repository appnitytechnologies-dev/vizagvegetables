import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { api, ApiOrder, ApiProduct } from '../lib/api';
import Divider from '../components/ui/Divider';
import PageHeader from '../components/ui/PageHeader';

/* ── Types ──────────────────────────────────────────────────── */
interface Notification {
  id:    string;
  type:  'price' | 'order' | 'offer';
  icon:  string;
  title: string;
  body:  string;
  time:  string;
  read:  boolean;
}

const TYPE_COLOR: Record<Notification['type'], string> = {
  price: Colors.primaryLight,
  order: '#E3F2FD',
  offer: '#FFF3E0',
};

const STATUS_COPY: Record<string, { icon: string; title: string; body: (id: string) => string }> = {
  pending:          { icon: '📦', title: 'Order Received',     body: id => `Your order ${id} has been received and is pending confirmation.` },
  confirmed:        { icon: '✅', title: 'Order Confirmed',    body: id => `Great news! Order ${id} has been confirmed by our team.` },
  preparing:        { icon: '🛍️', title: 'Order Being Packed', body: id => `Order ${id} is being packed with fresh vegetables.` },
  out_for_delivery: { icon: '🛵', title: 'Out for Delivery',   body: id => `Order ${id} is on its way to you!` },
  delivered:        { icon: '🏠', title: 'Order Delivered',    body: id => `Order ${id} has been delivered. Enjoy your fresh veggies!` },
  cancelled:        { icon: '❌', title: 'Order Cancelled',    body: id => `Order ${id} was cancelled.` },
};

function timeAgo(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days  = Math.floor(hours / 24);
    if (days > 0)  return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0)  return `${mins}m ago`;
    return 'Just now';
  } catch { return ''; }
}

function buildNotifications(orders: ApiOrder[], products: ApiProduct[]): Notification[] {
  const notifs: Notification[] = [];

  /* Order notifications — one per order (latest status) */
  orders.slice(0, 6).forEach(order => {
    const shortId = `#${order.id.slice(0, 6).toUpperCase()}`;
    const copy = STATUS_COPY[order.status] ?? STATUS_COPY.pending;
    notifs.push({
      id:    `order-${order.id}`,
      type:  'order',
      icon:  copy.icon,
      title: copy.title,
      body:  copy.body(shortId),
      time:  timeAgo(order.created_at),
      read:  ['delivered', 'cancelled'].includes(order.status),
    });
  });

  /* Price notifications — products with a price drop */
  products
    .filter(p => p.previous_price > p.price)
    .slice(0, 3)
    .forEach(p => {
      const drop = p.previous_price - p.price;
      notifs.push({
        id:    `price-${p.id}`,
        type:  'price',
        icon:  '📉',
        title: 'Price Drop!',
        body:  `${p.emoji ?? ''} ${p.name} dropped to ₹${p.price}/${p.unit} — down ₹${drop} today.`,
        time:  'Today',
        read:  false,
      });
    });

  /* Static promo */
  notifs.push({
    id:    'promo-free-delivery',
    type:  'offer',
    icon:  '🎁',
    title: 'Free Delivery!',
    body:  'Orders above ₹500 get free delivery. Add a few more items!',
    time:  'Today',
    read:  true,
  });

  return notifs;
}

/* ── Screen ─────────────────────────────────────────────────── */
export default function NotificationsScreen() {
  const [notifs,  setNotifs]  = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<ApiOrder[]>('/api/orders/my').catch(() => [] as ApiOrder[]),
      api.get<ApiProduct[]>('/api/market-rates?limit=50').catch(() => [] as ApiProduct[]),
    ]).then(([orders, products]) => {
      setNotifs(buildNotifications(orders, products));
    }).finally(() => setLoading(false));
  }, []);

  const unreadCount = notifs.filter(n => !n.read).length;

  const markAllRead = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotifs(n => n.map(x => ({ ...x, read: true })));
  };

  const markRead = (id: string) => {
    setNotifs(prev => prev.map(x => x.id === id ? { ...x, read: true } : x));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <PageHeader
        title="Notifications"
        fallback="/(tabs)/home"
        right={
          unreadCount > 0
            ? <Pressable onPress={markAllRead} hitSlop={8}>
                <Text style={styles.markAllText}>Mark all</Text>
              </Pressable>
            : undefined
        }
      />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : notifs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔔</Text>
          <Text style={styles.emptyTitle}>You're all caught up!</Text>
          <Text style={styles.emptyBody}>No notifications right now.</Text>
        </View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Spacing.xxxl }}
          ItemSeparatorComponent={() => <Divider />}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.item, !item.read && styles.itemUnread]}
              onPress={() => markRead(item.id)}
            >
              <View style={[styles.iconWrap, { backgroundColor: TYPE_COLOR[item.type] }]}>
                <Text style={styles.iconEmoji}>{item.icon}</Text>
              </View>
              <View style={styles.textWrap}>
                <View style={styles.titleRow}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  {!item.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.itemBody}>{item.body}</Text>
                <Text style={styles.itemTime}>{item.time}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Colors.textMuted}
                style={{ alignSelf: 'center' }}
              />
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },
  countBadge: {
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  countText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.primary },
  markAllBtn: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm },
  markAllText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },

  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  itemUnread: { backgroundColor: '#F1F8F1' },
  iconWrap: {
    width: 48, height: 48,
    borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  iconEmoji: { fontSize: 22 },
  textWrap: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  itemTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary, flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, flexShrink: 0 },
  itemBody: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: 4 },
  itemTime: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },
  emptyBody: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted },
});
