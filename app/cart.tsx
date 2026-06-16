import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { useCart } from '../hooks/useCart';
import { CartItem } from '../store/cartSlice';
import StepperBar from '../components/StepperBar';
import Divider from '../components/ui/Divider';

const FREE_AT   = 199;
const DELIV_FEE = 30;

/* ── Item row ────────────────────────────────────────────── */
function ItemRow({ item }: { item: CartItem }) {
  const { increase, decrease, removeItem } = useCart();
  return (
    <View style={r.wrap}>
      <View style={r.imgBox}>
        {item.image_url
          ? <Image source={{ uri: item.image_url }} style={r.img} contentFit="contain" />
          : <Text style={r.emoji}>{item.emoji}</Text>
        }
      </View>

      <View style={r.mid}>
        <Text style={r.name} numberOfLines={2}>{item.name}</Text>
        <Text style={r.sub}>{item.unit}  ·  ₹{item.price}/{item.unit}</Text>
        <Text style={r.price}>₹{item.price * item.quantity}</Text>
      </View>

      <View style={r.actions}>
        <Pressable hitSlop={8} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); removeItem(item.id); }}>
          <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
        </Pressable>
        <View style={r.stepper}>
          <Pressable style={r.sBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); decrease(item.id); }}>
            <Text style={r.sMinus}>−</Text>
          </Pressable>
          <Text style={r.qty}>{item.quantity}</Text>
          <Pressable style={[r.sBtn, r.sBtnGreen]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); increase(item.id); }}>
            <Text style={r.sPlus}>+</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const r = StyleSheet.create({
  wrap:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.md },
  imgBox:    { width: 72, height: 72, borderRadius: Radius.md, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  img:       { width: 72, height: 72 },
  emoji:     { fontSize: 36 },
  mid:       { flex: 1, gap: 3 },
  name:      { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  sub:       { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },
  price:     { fontFamily: FontFamily.numBold, fontSize: FontSize.md, color: Colors.textPrimary, marginTop: 4 },
  actions:   { alignItems: 'flex-end', gap: Spacing.sm, flexShrink: 0 },
  stepper:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.sm, overflow: 'hidden' },
  sBtn:      { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  sBtnGreen: { backgroundColor: Colors.primary },
  sMinus:    { fontFamily: FontFamily.bold, fontSize: 18, color: Colors.primary, lineHeight: 22 },
  sPlus:     { fontFamily: FontFamily.bold, fontSize: 18, color: '#fff', lineHeight: 22 },
  qty:       { minWidth: 26, textAlign: 'center', fontFamily: FontFamily.numBold, fontSize: FontSize.sm, color: Colors.primary },
});

/* ── Bill row ─────────────────────────────────────────────── */
function BillRow({ label, value, isFree, isTotal }: { label: string; value: string; isFree?: boolean; isTotal?: boolean }) {
  return (
    <View style={b.row}>
      <Text style={isTotal ? b.totalLabel : b.label}>{label}</Text>
      {isFree
        ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={b.strike}>₹{DELIV_FEE}</Text>
            <Text style={b.free}>FREE</Text>
          </View>
        : <Text style={isTotal ? b.totalValue : b.value}>{value}</Text>
      }
    </View>
  );
}

const b = StyleSheet.create({
  row:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 },
  label:      { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary },
  value:      { fontFamily: FontFamily.numMed, fontSize: FontSize.sm, color: Colors.textPrimary },
  strike:     { fontFamily: FontFamily.num, fontSize: FontSize.xs, color: Colors.textMuted, textDecorationLine: 'line-through' },
  free:       { fontFamily: FontFamily.bold, fontSize: FontSize.xs, color: Colors.primaryAccent },
  totalLabel: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary },
  totalValue: { fontFamily: FontFamily.numBold, fontSize: FontSize.md, color: Colors.textPrimary },
});

/* ── Screen ───────────────────────────────────────────────── */
export default function CartScreen() {
  const { items, count, total } = useCart();
  const insets = useSafeAreaInsets();

  const freeDelivery = total >= FREE_AT;
  const deliveryFee  = total > 0 && !freeDelivery ? DELIV_FEE : 0;
  const grandTotal   = total + deliveryFee;

  /* ── Empty state ── */
  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <StatusBar style="light" />
        <LinearGradient colors={['#1B5E35', '#2E7D32']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.title}>My Cart</Text>
          <View style={{ width: 36 }} />
        </LinearGradient>
        <View style={styles.empty}>
          <Text style={{ fontSize: 64 }}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Add fresh vegetables and fruits from the Shop</Text>
          <Pressable style={styles.shopBtn} onPress={() => router.replace('/(tabs)/shop' as any)}>
            <Text style={styles.shopBtnText}>Shop Now</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="light" />

      {/* ── Header ── */}
      <LinearGradient colors={['#1B5E35', '#2E7D32']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>My Cart</Text>
          <Text style={styles.subtitle}>{count} item{count !== 1 ? 's' : ''}  ·  ₹{grandTotal}</Text>
        </View>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <StepperBar step={1} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: (insets.bottom || Spacing.lg) + 88 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Delivery strip */}
        <View style={styles.strip}>
          <View style={styles.stripIcon}>
            <Ionicons name={freeDelivery ? 'gift-outline' : 'bicycle-outline'} size={16} color="#F57C00" />
          </View>
          <Text style={styles.stripText}>
            {freeDelivery
              ? 'You get free delivery on this order!'
              : `Add ₹${FREE_AT - total} more for free delivery`}
          </Text>
        </View>

        {/* Items card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Items ({count})</Text>
          {items.map((item, i) => (
            <View key={item.id}>
              {i > 0 && <Divider />}
              <ItemRow item={item} />
            </View>
          ))}
        </View>

        {/* Bill details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bill Details</Text>
          <View style={styles.billBody}>
            <BillRow label="Items total" value={`₹${total}`} />
            <BillRow label="Delivery fee" value={`₹${DELIV_FEE}`} isFree={freeDelivery} />
            <View style={styles.billLine} />
            <BillRow label="Grand Total" value={`₹${grandTotal}`} isTotal />
          </View>
        </View>
      </ScrollView>

      {/* ── Sticky bottom bar ── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || Spacing.lg }]}>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{grandTotal}</Text>
        </View>
        <Pressable
          style={styles.checkoutBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/checkout-address' as any);
          }}
        >
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F3F5' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  title:    { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: '#fff' },
  subtitle: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  scroll: { padding: Spacing.md, gap: Spacing.md },

  strip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: '#FFF4E5',
    borderWidth: 1, borderColor: 'rgba(245,124,0,0.25)',
  },
  stripIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(245,124,0,0.2)',
  },
  stripText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: '#C45000', flex: 1 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  cardTitle: {
    fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm,
  },
  billBody: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  billLine: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginVertical: Spacing.sm },

  bottomBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border,
    ...Shadow.md,
  },
  totalBox: {
    backgroundColor: '#F2F3F5', borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  totalLabel:  { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },
  totalValue:  { fontFamily: FontFamily.numBold, fontSize: FontSize.md, color: Colors.textPrimary },
  checkoutBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, backgroundColor: Colors.primaryDark,
    borderRadius: Radius.full, paddingVertical: Spacing.lg,
    ...Shadow.sm,
  },
  checkoutText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.textInverse },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xxl },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary },
  emptySub:   { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  shopBtn:    { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.xxxl, paddingVertical: Spacing.lg, marginTop: Spacing.sm },
  shopBtnText:{ fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.textInverse },
});
