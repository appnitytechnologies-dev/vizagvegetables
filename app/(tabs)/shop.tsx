import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { api, ApiProduct, imgUrl } from '../../lib/api';
import { useCart, useItemQuantity } from '../../hooks/useCart';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import Chip from '../../components/ui/Chip';

export interface Product {
  id: string;
  name: string;
  te: string;
  emoji: string;
  cat: 'vegetables' | 'fruits' | 'leafy' | 'combos';
  price: number;
  orig: number;
  unit: string;
  eta: string;
  discount: number;
  image_url: string | null;
}

function toCat(categoryName: string): Product['cat'] {
  const n = categoryName.toLowerCase();
  if (n.includes('fruit')) return 'fruits';
  if (n.includes('leaf') || n.includes('green')) return 'leafy';
  if (n.includes('combo')) return 'combos';
  return 'vegetables';
}

function toProduct(p: ApiProduct): Product {
  const discount = p.previous_price > p.price
    ? Math.round(((p.previous_price - p.price) / p.previous_price) * 100)
    : 0;
  return {
    id:        p.id,
    name:      p.name,
    te:        p.telugu_name || '',
    emoji:     p.emoji || '🥦',
    cat:       toCat(p.category_name),
    price:     Math.round(p.price),
    orig:      Math.round(p.previous_price),
    unit:      p.unit,
    eta:       '45 min',
    discount,
    image_url: imgUrl(p.image_url),
  };
}

type ShopCat = 'all' | 'vegetables' | 'fruits' | 'leafy' | 'combos';
const CATS: { key: ShopCat; label: string }[] = [
  { key: 'all',        label: 'All' },
  { key: 'vegetables', label: 'Vegetables' },
  { key: 'fruits',     label: 'Fruits' },
  { key: 'combos',     label: 'Combos' },
];

const BTN_W = 72;

function AddStepper({ product }: { product: Product }) {
  const { addItem, increase, decrease } = useCart();
  const { guard } = useAuthGuard();
  const qty = useItemQuantity(product.id);

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    guard(
      { type: 'ADD_TO_CART', payload: { id: product.id, name: product.name, te: product.te, emoji: product.emoji, price: product.price, unit: product.unit, quantity: 1 }, returnTo: '/(tabs)/shop' },
      () => addItem({ id: product.id, name: product.name, te: product.te, emoji: product.emoji, price: product.price, unit: product.unit, quantity: 1 })
    );
  };

  if (qty === 0) {
    return (
      <Pressable style={stepperStyles.addBtn} onPress={handleAdd}>
        <Text style={stepperStyles.addText}>Add</Text>
      </Pressable>
    );
  }

  return (
    <View style={stepperStyles.stepper}>
      <Pressable style={stepperStyles.stepBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); decrease(product.id); }}>
        <Text style={stepperStyles.stepIcon}>−</Text>
      </Pressable>
      <Text style={stepperStyles.qty}>{qty}</Text>
      <Pressable style={stepperStyles.stepBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); increase(product.id); }}>
        <Text style={stepperStyles.stepIcon}>+</Text>
      </Pressable>
    </View>
  );
}

const stepperStyles = StyleSheet.create({
  addBtn: { width: BTN_W, height: 36, backgroundColor: Colors.primaryDark, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  addText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textInverse },
  stepper: { width: BTN_W, height: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.primaryDark, paddingHorizontal: 2 },
  stepBtn: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  stepIcon: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.primaryDark },
  qty: { fontFamily: FontFamily.bold, fontSize: FontSize.xs, color: Colors.primaryDark },
});

function ProductCard({ item }: { item: Product }) {
  return (
    <Pressable style={prodStyles.card} onPress={() => router.push({ pathname: '/shop-details', params: { id: item.id } } as any)}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={prodStyles.photo} contentFit="cover" />
      ) : (
        <View style={prodStyles.photoFallback}>
          <Text style={prodStyles.emoji}>{item.emoji}</Text>
        </View>
      )}
      <View style={prodStyles.info}>
        <Text style={prodStyles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={prodStyles.unit}>{item.unit}</Text>
        <View style={prodStyles.footer}>
          <View style={prodStyles.priceRow}>
            <Text style={prodStyles.price}>₹{item.price}</Text>
            {item.orig > item.price && (
              <Text style={prodStyles.orig}>₹{item.orig}</Text>
            )}
          </View>
          <AddStepper product={item} />
        </View>
      </View>
    </Pressable>
  );
}

const prodStyles = StyleSheet.create({
  card: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.xl, overflow: 'hidden', ...Shadow.md },
  photo: { width: '100%', height: 155 },
  photoFallback: { width: '100%', height: 155, backgroundColor: Colors.primaryPale, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 56 },
  info: { padding: 10, gap: Spacing.xs },
  name: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary },
  unit: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.sm },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  price: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },
  orig: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, textDecorationLine: 'line-through' },
});

export default function ShopScreen() {
  const [cat, setCat]           = useState<ShopCat>('all');
  const [query, setQuery]       = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const { count } = useCart();

  useEffect(() => {
    api.get<ApiProduct[]>('/api/products?limit=200')
      .then(data => setProducts(data.filter(p => p.is_active).map(toProduct)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p: Product) => {
    const matchCat = cat === 'all' || p.cat === cat;
    const matchQ   = p.name.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQ;
  });

  if (loading) return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primaryDark} />
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      <LinearGradient
        colors={['#1B5E35', '#4CAF6F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.4, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.title}>Shopping</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color={Colors.primaryDark} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for vegetables, fruits..."
              placeholderTextColor={Colors.primaryDark}
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <Pressable style={styles.cartBtn} onPress={() => router.push('/cart' as any)}>
            <Ionicons name="cart-outline" size={24} color={Colors.primaryDark} />
            {count > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{count > 9 ? '9+' : count}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsRow}
        contentContainerStyle={styles.chipsContent}
      >
        {CATS.map(c => (
          <Chip key={c.key} label={c.label} active={cat === c.key} onPress={() => setCat(c.key)} />
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        numColumns={2}
        keyExtractor={i => i.id}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={{ gap: Spacing.sm, paddingHorizontal: Spacing.md }}
        contentContainerStyle={{ gap: Spacing.md, paddingTop: Spacing.sm, paddingBottom: 100 }}
        renderItem={({ item }) => <ProductCard item={item} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    overflow: 'hidden',
  },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.xxxl, color: Colors.textInverse, letterSpacing: -0.5, marginBottom: Spacing.md },
  searchRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
  searchInput: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textPrimary, padding: 0, outlineStyle: 'none' } as any,
  cartBtn: { width: 48, height: 48, borderRadius: Radius.full, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  cartBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: Colors.danger, borderRadius: 999, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  cartBadgeText: { fontFamily: FontFamily.bold, fontSize: 9, color: Colors.textInverse },
  chipsRow: { backgroundColor: Colors.background, maxHeight: 60 },
  chipsContent: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, alignItems: 'center' },
});
