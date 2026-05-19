import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { products, Product } from '../../dummy-data/products';
import { useCart, useItemQuantity } from '../../hooks/useCart';
import Chip from '../../components/ui/Chip';

type ShopCat = 'all' | 'vegetables' | 'fruits' | 'leafy' | 'combos';
const CATS: { key: ShopCat; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'vegetables', label: 'Vegetables' },
  { key: 'fruits', label: 'Fruits' },
  { key: 'leafy', label: 'Leafy' },
  { key: 'combos', label: 'Combos' },
];

function AddStepper({ product }: { product: Product }) {
  const { addItem, increase, decrease } = useCart();
  const qty = useItemQuantity(product.id);
  const width = useSharedValue(qty > 0 ? 88 : 64);

  const animStyle = useAnimatedStyle(() => ({ width: width.value }));

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addItem({ id: product.id, name: product.name, te: product.te, emoji: product.emoji, price: product.price, weight: product.weight, quantity: 1 });
    width.value = withSpring(88);
  };

  const handleIncrease = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    increase(product.id);
  };

  const handleDecrease = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    decrease(product.id);
    if (qty <= 1) width.value = withSpring(64);
  };

  if (qty === 0) {
    return (
      <Animated.View style={[stepperStyles.addBtn, animStyle]}>
        <Pressable onPress={handleAdd} style={stepperStyles.addPressable}>
          <Text style={stepperStyles.addText}>Add</Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[stepperStyles.stepper, animStyle]}>
      <Pressable onPress={handleDecrease} style={stepperStyles.stepBtn}>
        <Text style={stepperStyles.stepIcon}>−</Text>
      </Pressable>
      <Text style={stepperStyles.qty}>+{qty}</Text>
      <Pressable onPress={handleIncrease} style={stepperStyles.stepBtn}>
        <Text style={stepperStyles.stepIcon}>+</Text>
      </Pressable>
    </Animated.View>
  );
}

const stepperStyles = StyleSheet.create({
  addBtn: { height: 36, backgroundColor: Colors.primary, borderRadius: Radius.full, overflow: 'hidden' },
  addPressable: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  addText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textInverse },
  stepper: { height: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.primary, overflow: 'hidden', paddingHorizontal: 2 },
  stepBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  stepIcon: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.primary },
  qty: { fontFamily: FontFamily.bold, fontSize: FontSize.xs, color: Colors.primary },
});

function ProductCard({ item }: { item: Product }) {
  return (
    <Pressable style={prodStyles.card} onPress={() => router.push({ pathname: '/shop-details', params: { id: item.id } } as any)}>
      {/* Photo area */}
      <View style={prodStyles.photoArea}>
        <View style={prodStyles.vvBadge}><Text style={prodStyles.vvText}>VV</Text></View>
        {item.discount > 0 && (
          <View style={prodStyles.discountBadge}>
            <Text style={prodStyles.discountText}>{item.discount}% off</Text>
          </View>
        )}
        <Text style={prodStyles.emoji}>{item.emoji}</Text>
      </View>
      {/* Info area */}
      <View style={prodStyles.info}>
        <Text style={prodStyles.name}>{item.name}</Text>
        <Text style={prodStyles.te}>{item.te}</Text>
        <View style={prodStyles.weightRow}>
          <Text style={prodStyles.weight}>{item.weight}</Text>
          <View style={prodStyles.etaChip}><Text style={prodStyles.etaText}>🕐 {item.eta}</Text></View>
        </View>
        <View style={prodStyles.footer}>
          <View style={prodStyles.priceRow}>
            <Text style={prodStyles.price}>₹{item.price}</Text>
            <Text style={prodStyles.orig}>₹{item.orig}</Text>
          </View>
          <AddStepper product={item} />
        </View>
      </View>
    </Pressable>
  );
}

const prodStyles = StyleSheet.create({
  card: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  photoArea: { height: 140, backgroundColor: Colors.primaryPale, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  vvBadge: { position: 'absolute', top: Spacing.sm, left: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.sm, paddingHorizontal: Spacing.xs, paddingVertical: 2, zIndex: 1 },
  vvText: { fontFamily: FontFamily.bold, fontSize: 9, color: Colors.textInverse },
  discountBadge: { position: 'absolute', top: Spacing.sm, right: Spacing.sm, backgroundColor: Colors.danger, borderRadius: Radius.full, paddingHorizontal: Spacing.xs, paddingVertical: 2, zIndex: 1 },
  discountText: { fontFamily: FontFamily.bold, fontSize: 9, color: Colors.textInverse },
  emoji: { fontSize: 56 },
  info: { padding: Spacing.md },
  name: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.textPrimary, marginBottom: 2 },
  te: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.xs },
  weightRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  weight: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },
  etaChip: { backgroundColor: Colors.primaryPale, borderRadius: Radius.full, paddingHorizontal: Spacing.xs, paddingVertical: 2 },
  etaText: { fontFamily: FontFamily.regular, fontSize: 9, color: Colors.primary },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  price: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary },
  orig: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, textDecorationLine: 'line-through' },
});

export default function ShopScreen() {
  const [cat, setCat] = useState<ShopCat>('all');
  const [query, setQuery] = useState('');
  const { count } = useCart();

  const filtered = products.filter(p => {
    const matchCat = cat === 'all' || p.cat === cat;
    const matchQ = p.name.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.title}>Shopping</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color={Colors.primary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for vegetables, fruits..."
              placeholderTextColor={Colors.primary}
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <Pressable style={styles.cartBtn} onPress={() => router.push('/cart' as any)}>
            <Ionicons name="cart-outline" size={22} color={Colors.primary} />
            {count > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{count > 9 ? '9+' : count}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <View style={styles.verifiedBanner}>
        <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
        <Text style={styles.verifiedText}>All products by Vizag Vegetables</Text>
      </View>

      <View style={styles.chipsRow}>
        {CATS.map(c => (
          <Chip key={c.key} label={c.label} active={cat === c.key} onPress={() => setCat(c.key)} />
        ))}
      </View>

      <FlatList
        data={filtered}
        numColumns={2}
        keyExtractor={i => i.id}
        columnWrapperStyle={{ gap: Spacing.md, paddingHorizontal: Spacing.xxl }}
        contentContainerStyle={{ gap: Spacing.md, paddingTop: Spacing.md, paddingBottom: 100 }}
        renderItem={({ item }) => <ProductCard item={item} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.lg },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.xxl, color: Colors.textInverse, letterSpacing: -0.3, marginBottom: Spacing.md },
  searchRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
  searchInput: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.primary, padding: 0, outlineStyle: 'none' } as any,
  cartBtn: { width: 44, height: 44, borderRadius: Radius.full, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cartBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: Colors.danger, borderRadius: 999, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  cartBadgeText: { fontFamily: FontFamily.bold, fontSize: 9, color: Colors.textInverse },
  verifiedBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primaryPale, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.sm },
  verifiedText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },
  chipsRow: { flexDirection: 'row', paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.sm, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
});
