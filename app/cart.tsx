import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

function CartItemRow({ item }: { item: CartItem }) {
  const { increase, decrease, removeItem } = useCart();
  return (
    <View style={itemStyles.row}>
      <View style={itemStyles.emojiWrap}>
        <Text style={itemStyles.emoji}>{item.emoji}</Text>
      </View>
      <View style={itemStyles.info}>
        <Text style={itemStyles.name}>{item.name}</Text>
        <Text style={itemStyles.weight}>{item.weight}</Text>
        <Text style={itemStyles.price}>₹{item.price}</Text>
      </View>
      <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); removeItem(item.id); }}>
        <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
      </Pressable>
      <View style={itemStyles.stepper}>
        <Pressable
          style={itemStyles.stepBtn}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); decrease(item.id); }}
        >
          <Text style={itemStyles.stepIcon}>−</Text>
        </Pressable>
        <Text style={itemStyles.qty}>{item.quantity}</Text>
        <Pressable
          style={[itemStyles.stepBtn, itemStyles.stepBtnFilled]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); increase(item.id); }}
        >
          <Text style={[itemStyles.stepIcon, { color: Colors.textInverse }]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const itemStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
  emojiWrap: { width: 60, height: 60, borderRadius: Radius.md, backgroundColor: Colors.primaryPale, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 32 },
  info: { flex: 1 },
  name: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  weight: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 2 },
  price: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.primary },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  stepBtn: { width: 32, height: 32, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  stepBtnFilled: { backgroundColor: Colors.primaryLight, borderColor: Colors.primaryLight },
  stepIcon: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.primary },
  qty: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary, minWidth: 20, textAlign: 'center' },
});

export default function CartScreen() {
  const { items, count, total } = useCart();

  const EmptyState = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🛒</Text>
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptySub}>Add items from the Shop to get started</Text>
      <Pressable style={styles.shopBtn} onPress={() => router.replace('/(tabs)/shop' as any)}>
        <Text style={styles.shopBtnText}>Shop Now</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>My Cart{count > 0 ? ` (${count})` : ''}</Text>
        <View style={{ width: 32 }} />
      </View>
      <Divider />

      <StepperBar step={1} />
      <Divider />

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id}
          renderItem={({ item }) => <CartItemRow item={item} />}
          ItemSeparatorComponent={Divider}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {items.length > 0 && (
        <View style={styles.bottomBar}>
          <Pressable
            style={styles.checkoutBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/checkout-address' as any);
            }}
          >
            <Text style={styles.checkoutText}>Go to Checkout — ₹{total}</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xxl },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary },
  emptySub: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  shopBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.xxxl, paddingVertical: Spacing.lg, marginTop: Spacing.sm },
  shopBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.textInverse },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surface, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  checkoutBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing.lg, alignItems: 'center' },
  checkoutText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.textInverse },
});
