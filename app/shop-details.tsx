import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Share, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { api, ApiProduct, imgUrl } from '../lib/api';
import { useCart, useItemQuantity } from '../hooks/useCart';
import { useFavourites } from '../hooks/useFavourites';
import { useAuthGuard } from '../hooks/useAuthGuard';

const QTY_OPTIONS = [1, 2, 5, 10];

export default function ShopDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [loading, setLoading]  = useState(true);
  const [selectedQty, setSelectedQty] = useState(1);
  const { addItem, increase, decrease } = useCart();
  const cartQty = useItemQuantity(id || '');
  const { ids, toggle } = useFavourites();
  const { guard } = useAuthGuard();
  const isFav = id ? ids.includes(id) : false;

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    api.get<ApiProduct>(`/api/products/${id}`)
      .then(setProduct)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = async () => {
    if (!product) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({
      title: product.name,
      message: `🛒 ${product.name} — ₹${product.price}/${product.unit}\nOrder fresh from Vizag Vegetables!`,
    });
  };

  const handleAddToCart = () => {
    if (!product) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addItem({
      id: product.id,
      name: product.name,
      te: product.telugu_name || '',
      emoji: product.emoji || '🥦',
      price: product.price,
      unit: product.unit,
      quantity: selectedQty,
    });
  };

  if (loading) return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar style="dark" />
      <Pressable style={[styles.iconBtn, { left: Spacing.lg, top: Spacing.lg + 44 }]} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
      </Pressable>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    </SafeAreaView>
  );

  if (!product) return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar style="dark" />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md }}>
        <Text style={{ fontSize: 48 }}>😕</Text>
        <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary }}>Product not found</Text>
        <Pressable onPress={() => router.back()}><Text style={{ color: Colors.primary, fontFamily: FontFamily.medium }}>Go back</Text></Pressable>
      </View>
    </SafeAreaView>
  );

  const discount = product.previous_price > product.price
    ? Math.round(((product.previous_price - product.price) / product.previous_price) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar style="dark" />

      {/* Hero */}
      <View style={styles.heroWrap}>
        <View style={styles.hero}>
          {imgUrl(product.image_url)
            ? <Image source={{ uri: imgUrl(product.image_url)! }} style={styles.heroImage} resizeMode="contain" />
            : <Text style={styles.heroEmoji}>{product.emoji || '🥦'}</Text>
          }
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          )}
        </View>
        <Pressable style={[styles.iconBtn, { left: Spacing.lg }]} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.topRight}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => guard(
              { type: 'TOGGLE_FAVOURITE', payload: product.id, returnTo: '/shop-details' },
              () => toggle(product.id)
            )}
          >
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={20}
              color={isFav ? Colors.danger : Colors.textPrimary}
            />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={Colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      {/* Bottom sheet */}
      <ScrollView style={styles.sheet} showsVerticalScrollIndicator={false}>
        <View style={styles.sheetHandle} />

        <View style={styles.nameRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.productName}>{product.name}</Text>
            {product.telugu_name ? <Text style={styles.productTe}>{product.telugu_name}</Text> : null}
            <Text style={styles.productUnit}>per {product.unit}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.price}>₹{product.price}</Text>
            {product.previous_price > product.price && (
              <Text style={styles.origPrice}>₹{product.previous_price}</Text>
            )}
          </View>
        </View>

        {/* Quantity selector */}
        <Text style={styles.sectionLabel}>Select Quantity</Text>
        <View style={styles.weightRow}>
          {QTY_OPTIONS.map(q => (
            <Pressable
              key={q}
              style={[styles.weightChip, selectedQty === q && styles.weightChipActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedQty(q); }}
            >
              <Text style={[styles.weightText, selectedQty === q && styles.weightTextActive]}>
                {q} {product.unit}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>Product Detail</Text>
        <Text style={styles.description}>
          {product.description || `Fresh ${product.name} sourced directly from Rythu Bazar farmers. Delivered the same morning they are procured.`}
        </Text>

        <View style={styles.tagsRow}>
          <View style={styles.tag}><Text style={styles.tagText}>✓ Farm Fresh</Text></View>
          <View style={styles.tag}><Text style={styles.tagText}>✓ Daily Sourced</Text></View>
          <View style={styles.tag}><Text style={styles.tagText}>✓ Pesticide-free</Text></View>
          {product.category_name ? (
            <View style={styles.tag}><Text style={styles.tagText}>✓ {product.category_name}</Text></View>
          ) : null}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={styles.bottomBar}>
        {cartQty > 0 ? (
          <View style={styles.stepper}>
            <Pressable style={styles.stepCircleBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); decrease(product.id); }}>
              <Text style={styles.stepIcon}>−</Text>
            </Pressable>
            <View style={styles.stepQtyBox}>
              <Text style={styles.stepQty}>{cartQty}</Text>
            </View>
            <Pressable style={styles.stepCircleBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); increase(product.id); }}>
              <Text style={styles.stepIcon}>+</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ width: 120 }} />
        )}
        <Pressable style={styles.addToCartBtn} onPress={handleAddToCart}>
          <Text style={styles.addToCartText}>
            Add {selectedQty} {product.unit} · ₹{product.price * selectedQty}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  heroWrap: { height: 300, position: 'relative' },
  hero: { height: 300, backgroundColor: Colors.primaryPale, alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 120 },
  heroImage: { width: '80%', height: '80%' },
  topRight: { position: 'absolute', top: Spacing.lg, right: Spacing.lg, flexDirection: 'row', gap: Spacing.sm },
  discountBadge: { position: 'absolute', top: Spacing.lg, right: Spacing.lg, backgroundColor: Colors.danger, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  discountText: { fontFamily: FontFamily.bold, fontSize: FontSize.xs, color: Colors.textInverse },
  iconBtn: { position: 'absolute', top: Spacing.lg, width: 40, height: 40, borderRadius: Radius.sm, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  sheet: { flex: 1, backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, marginTop: -Radius.xxl, paddingHorizontal: Spacing.xxl },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: Spacing.md, marginBottom: Spacing.lg },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xl },
  productName: { fontFamily: FontFamily.bold, fontSize: FontSize.xxxl, color: Colors.textPrimary, letterSpacing: -0.3 },
  productTe: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  productUnit: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  price: { fontFamily: FontFamily.bold, fontSize: FontSize.xxxl, color: Colors.textPrimary, letterSpacing: -0.3 },
  origPrice: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, textDecorationLine: 'line-through' },
  sectionLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  weightRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl, flexWrap: 'wrap' },
  weightChip: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  weightChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  weightText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary },
  weightTextActive: { color: Colors.primary },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.xl },
  description: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.lg },
  tagsRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  tag: { backgroundColor: Colors.primaryPale, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  tagText: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.primary },
  bottomBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.lg, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, gap: Spacing.md },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stepCircleBtn: { width: 36, height: 36, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  stepQtyBox: { width: 40, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  stepIcon: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.primary },
  stepQty: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },
  addToCartBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing.lg, alignItems: 'center' },
  addToCartText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.textInverse },
});
