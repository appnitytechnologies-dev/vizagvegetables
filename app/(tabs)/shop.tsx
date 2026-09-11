import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput,
         ActivityIndicator, ScrollView, Dimensions } from 'react-native';
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

/* ── Layout constants ────────────────────────────────────── */
const SCREEN_W   = Dimensions.get('window').width;
const H_PAD      = Spacing.md;   // 12 each side
const COL_GAP    = Spacing.sm;   // 8 between columns
const CARD_W     = (SCREEN_W - H_PAD * 2 - COL_GAP) / 2;
const IMG_H      = CARD_W * 0.85; // ~85% of card width = nice square-ish

/* ── Data types & helpers ────────────────────────────────── */
export interface Product {
  id: string; name: string; te: string; emoji: string;
  cat: 'vegetables' | 'fruits' | 'leafy' | 'combos';
  price: number; orig: number; unit: string; discount: number;
  image_url: string | null;
}

function toCat(n: string): Product['cat'] {
  n = n.toLowerCase();
  if (n.includes('fruit'))                   return 'fruits';
  if (n.includes('leaf') || n.includes('green')) return 'leafy';
  if (n.includes('combo'))                   return 'combos';
  return 'vegetables';
}

function toProduct(p: ApiProduct): Product {
  const discount = p.previous_price > p.price
    ? Math.round(((p.previous_price - p.price) / p.previous_price) * 100) : 0;
  return {
    id: p.id, name: p.name, te: p.telugu_name || '', emoji: p.emoji || '🥦',
    cat: toCat(p.category_name), price: Math.round(p.price),
    orig: Math.round(p.previous_price), unit: p.unit, discount,
    image_url: imgUrl(p.image_url),
  };
}

type ShopCat = 'all' | 'vegetables' | 'fruits' | 'leafy' | 'combos';
const CATS: { key: ShopCat; label: string; emoji: string }[] = [
  { key: 'all',        label: 'All',        emoji: '🛒' },
  { key: 'vegetables', label: 'Vegetables', emoji: '🥕' },
  { key: 'fruits',     label: 'Fruits',     emoji: '🍎' },
  { key: 'combos',     label: 'Combos',     emoji: '🎁' },
];

/* ── Add / Stepper button ────────────────────────────────── */
function AddStepper({ product }: { product: Product }) {
  const { addItem, increase, decrease } = useCart();
  const { guard }  = useAuthGuard();
  const qty = useItemQuantity(product.id);

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    guard(
      { type: 'ADD_TO_CART', payload: { id: product.id, name: product.name, te: product.te,
        emoji: product.emoji, image_url: product.image_url, price: product.price, unit: product.unit, quantity: 1 },
        returnTo: '/(tabs)/shop' },
      () => addItem({ id: product.id, name: product.name, te: product.te,
        emoji: product.emoji, image_url: product.image_url, price: product.price, unit: product.unit, quantity: 1 })
    );
  };

  if (qty === 0) {
    return (
      <Pressable style={stp.addBtn} onPress={handleAdd}>
        <Ionicons name="add" size={16} color={Colors.primary} />
        <Text style={stp.addText}>Add</Text>
      </Pressable>
    );
  }
  return (
    <View style={stp.stepper}>
      <Pressable style={stp.stepBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); decrease(product.id); }}>
        <Text style={stp.icon}>−</Text>
      </Pressable>
      <Text style={stp.qty}>{qty}</Text>
      <Pressable style={[stp.stepBtn, stp.stepBtnFill]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); increase(product.id); }}>
        <Text style={[stp.icon, { color: '#fff' }]}>+</Text>
      </Pressable>
    </View>
  );
}

const stp = StyleSheet.create({
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: 5,
    backgroundColor: Colors.primaryPale,
  },
  addText: { fontFamily: FontFamily.bold, fontSize: 12, color: Colors.primary },
  stepper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: Radius.md, overflow: 'hidden',
  },
  stepBtn: { width: 26, height: 28, alignItems: 'center', justifyContent: 'center' },
  stepBtnFill: { backgroundColor: Colors.primary },
  icon: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.primary },
  qty: { minWidth: 22, textAlign: 'center', fontFamily: FontFamily.numBold, fontSize: FontSize.xs, color: Colors.primary },
});

/* ── Product card ────────────────────────────────────────── */
function ProductCard({ item }: { item: Product }) {
  return (
    <Pressable
      style={({ pressed }) => [card.wrap, pressed && { opacity: 0.92 }]}
      onPress={() => router.push({ pathname: '/shop-details', params: { id: item.id } } as any)}
    >
      {/* Image area */}
      <View style={card.imgBox}>
        {item.image_url
          ? <Image source={{ uri: item.image_url }} style={card.img} contentFit="contain" />
          : <View style={card.imgFallback}><Text style={card.emoji}>{item.emoji}</Text></View>
        }
        {item.discount > 0 && (
          <View style={card.badge}>
            <Text style={card.badgeText}>{item.discount}% OFF</Text>
          </View>
        )}
      </View>

      {/* Info area */}
      <View style={card.info}>
        <View style={card.nameRow}>
          <Text style={card.name} numberOfLines={1}>{item.name}</Text>
          <Text style={card.unit}>{item.unit}</Text>
        </View>
        <View style={card.footer}>
          <View style={card.priceRow}>
            <Text style={card.price}>₹{item.price}</Text>
            {item.orig > item.price && (
              <Text style={card.orig}>₹{item.orig}</Text>
            )}
          </View>
          <AddStepper product={item} />
        </View>
      </View>
    </Pressable>
  );
}

const card = StyleSheet.create({
  wrap: {
    width: CARD_W,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    overflow: 'hidden',
    ...Shadow.sm,
  },
  imgBox: { width: CARD_W, height: IMG_H, backgroundColor: '#F8F9FA', position: 'relative' },
  img: { width: '100%', height: '100%' },
  imgFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 52 },
  badge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: Colors.primaryAccent,
    borderRadius: Radius.sm, paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeText: { fontFamily: FontFamily.bold, fontSize: 10, color: '#fff' },
  info: { padding: Spacing.sm, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  name: { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.textPrimary, flexShrink: 1 },
  unit: { fontFamily: FontFamily.regular, fontSize: 11, color: Colors.textMuted },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  price: { fontFamily: FontFamily.numBold, fontSize: FontSize.md, color: Colors.textPrimary },
  orig: { fontFamily: FontFamily.num, fontSize: 10, color: Colors.textMuted, textDecorationLine: 'line-through' },
});

/* ── Screen ──────────────────────────────────────────────── */
export default function ShopScreen() {
  const [cat, setCat]           = useState<ShopCat>('all');
  const [query, setQuery]       = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  useEffect(() => {
    api.get<ApiProduct[]>('/api/products?limit=200')
      .then(data => setProducts(data.filter(p => p.is_active).map(toProduct)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p => {
    const matchCat = cat === 'all' || p.cat === cat;
    const matchQ   = p.name.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* ── Header ──────────────────────────────── */}
      <LinearGradient
        colors={['#1B5E35', '#2E7D32']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Shop</Text>
            <Text style={styles.subtitle}>Fresh from Rythu Bazar</Text>
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vegetables, fruits..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      </LinearGradient>

      {/* ── Category chips ───────────────────────── */}
      <View style={styles.catBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catContent}>
          {CATS.map(c => (
            <Pressable
              key={c.key}
              style={[styles.catChip, cat === c.key && styles.catChipActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCat(c.key); }}
            >
              <Text style={styles.catEmoji}>{c.emoji}</Text>
              <Text style={[styles.catLabel, cat === c.key && styles.catLabelActive]}>{c.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* ── Product grid ─────────────────────────── */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyText}>No products found</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={i => i.id}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => <ProductCard item={item} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F3F5' },

  /* header */
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.lg, gap: Spacing.sm, borderBottomLeftRadius: Radius.xl, borderBottomRightRadius: Radius.xl, overflow: 'hidden' },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.xxl, color: '#fff' },
  subtitle: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: '#fff', borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  searchInput: {
    flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.sm,
    color: Colors.textPrimary, padding: 0,
    outlineStyle: 'none',
  } as any,

  /* categories */
  catBar: { backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  catContent: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: '#fff',
  },
  catChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryPale },
  catEmoji: { fontSize: 14 },
  catLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary },
  catLabelActive: { color: Colors.primary, fontFamily: FontFamily.semiBold },

  /* grid */
  grid: { paddingHorizontal: H_PAD, paddingTop: Spacing.md, paddingBottom: 100, gap: COL_GAP },
  row: { gap: COL_GAP },

  /* empty */
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontFamily: FontFamily.medium, fontSize: FontSize.md, color: Colors.textMuted },
});
