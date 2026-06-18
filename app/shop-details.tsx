import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Share, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { api, ApiProduct, imgUrl } from '../lib/api';
import { useCart } from '../hooks/useCart';
import { useAuthGuard } from '../hooks/useAuthGuard';
import FloatingCart from '../components/ui/FloatingCart';

const QTY_OPTIONS = [1, 2, 5, 10];

export default function ShopDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct]     = useState<ApiProduct | null>(null);
  const [loading, setLoading]     = useState(true);
  const [selectedQty, setSelectedQty] = useState(1);
  const [added, setAdded]         = useState(false);
  const { addItem } = useCart();
  const { guard } = useAuthGuard();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const HERO_H = screenH * 0.50;

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
      message: `🛒 ${product.name} — ₹${product.price}/${product.unit}\nOrder fresh from YZAG Fresh!`,
    });
  };

  const handleAddToCart = () => {
    if (!product) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    guard(
      { type: 'ADD_TO_CART', payload: { id: product.id, name: product.name, te: product.telugu_name || '', emoji: product.emoji || '🥦', image_url: photo, price: product.price, unit: product.unit, quantity: selectedQty }, returnTo: '/shop-details' },
      () => {
        addItem({ id: product.id, name: product.name, te: product.telugu_name || '', emoji: product.emoji || '🥦', image_url: photo, price: product.price, unit: product.unit, quantity: selectedQty });
        setAdded(true);
        setTimeout(() => setAdded(false), 1800);
      }
    );
  };

  const topBtnStyle = { top: insets.top + Spacing.md };

  if (loading) return (
    <View style={styles.centered}>
      <StatusBar style="light" />
      <ActivityIndicator size="large" color={Colors.primaryDark} />
    </View>
  );

  if (!product) return (
    <View style={styles.centered}>
      <StatusBar style="dark" />
      <Text style={{ fontSize: 48 }}>😕</Text>
      <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary, marginTop: Spacing.md }}>Product not found</Text>
      <Pressable onPress={() => router.back()} style={{ marginTop: Spacing.md }}>
        <Text style={{ color: Colors.primaryDark, fontFamily: FontFamily.medium }}>Go back</Text>
      </Pressable>
    </View>
  );

  const discount = product.previous_price > product.price
    ? Math.round(((product.previous_price - product.price) / product.previous_price) * 100)
    : 0;

  const photo = imgUrl(product.image_url);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ── Full-bleed hero image ── */}
      <View style={[styles.hero, { height: HERO_H }]}>
        {photo
          ? <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" />
          : <View style={[StyleSheet.absoluteFill, styles.heroFallback]}>
              <Text style={styles.heroEmoji}>{product.emoji || '🥦'}</Text>
            </View>
        }

        {/* Dark gradient scrim — pointerEvents none so buttons behind it still work */}
        <View style={styles.heroScrim} pointerEvents="none" />

        {/* Back button */}
        <Pressable style={[styles.iconBtn, { left: Spacing.lg }, topBtnStyle]} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </Pressable>

        {/* Share button */}
        <Pressable style={[styles.iconBtn, { right: Spacing.lg }, topBtnStyle]} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color={Colors.textPrimary} />
        </Pressable>

        {/* Discount badge */}
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        )}

        {/* Dots */}
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>

      {/* ── White sheet overlapping the image ── */}
      <ScrollView
        style={[styles.sheet, { marginTop: -Radius.xxl }]}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.handle} />

        {/* Name + Price row */}
        <View style={styles.nameRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.productName}>{product.name}</Text>
            {product.telugu_name ? <Text style={styles.productTe}>{product.telugu_name}</Text> : null}
            <Text style={styles.productUnit}>{product.unit}, Price</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.price}>₹ {product.price}</Text>
            {product.previous_price > product.price && (
              <Text style={styles.origPrice}>₹{product.previous_price}</Text>
            )}
          </View>
        </View>

        {/* Select Weight */}
        <Text style={styles.sectionLabel}>Select Weight</Text>
        <View style={styles.weightRow}>
          {QTY_OPTIONS.map(q => (
            <Pressable
              key={q}
              style={[styles.weightChip, selectedQty === q && styles.weightChipActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedQty(q); }}
            >
              <Text style={[styles.weightText, selectedQty === q && styles.weightTextActive]}>
                {q}{product.unit}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.divider} />

        {/* Product Detail */}
        <Text style={styles.sectionTitle}>Product Detail</Text>
        <Text style={styles.description}>
          {product.description || `Fresh ${product.name} sourced directly from Rythu Bazar farmers. Delivered the same morning they are procured.`}
        </Text>

        <View style={{ height: 120 }} />
      </ScrollView>

      <FloatingCart />

      {/* ── Sticky bottom bar ── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || Spacing.lg }]}>
        <View style={styles.stepper}>
          <Pressable
            style={styles.stepBtn}
            onPress={() => { if (selectedQty > 1) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedQty(q => q - 1); } }}
          >
            <Text style={styles.stepIcon}>−</Text>
          </Pressable>
          <View style={styles.stepQtyBox}>
            <Text style={styles.stepQty}>{selectedQty}</Text>
          </View>
          <Pressable
            style={styles.stepBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedQty(q => q + 1); }}
          >
            <Text style={styles.stepIcon}>+</Text>
          </Pressable>
        </View>

        <Pressable
          style={added ? [styles.addToCartBtn, styles.addToCartBtnAdded] : styles.addToCartBtn}
          onPress={handleAddToCart}
          disabled={added}
        >
          <Text style={styles.addToCartText}>
            {added ? '✓  Added to Cart' : 'Add to Cart'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  centered: { flex: 1, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },

  /* Hero */
  hero: { width: '100%', backgroundColor: '#111', overflow: 'hidden' },
  heroFallback: { backgroundColor: Colors.primaryPale, alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 120 },
  heroScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.08)' },
  iconBtn: { position: 'absolute', width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  discountBadge: { position: 'absolute', bottom: 56, right: Spacing.lg, backgroundColor: Colors.danger, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  discountText: { fontFamily: FontFamily.numBold, fontSize: FontSize.xs, color: Colors.textInverse },
  dotsRow: { position: 'absolute', bottom: Spacing.lg, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.45)' },
  dotActive: { backgroundColor: Colors.surface },

  /* Sheet */
  sheet: { flex: 1, backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl },
  sheetContent: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xl },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: Spacing.md, marginBottom: Spacing.lg },

  /* Name row */
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xl },
  productName: { fontFamily: FontFamily.bold, fontSize: FontSize.xxxl, color: Colors.textPrimary, letterSpacing: -0.5 },
  productTe: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  productUnit: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4 },
  price: { fontFamily: FontFamily.numBold, fontSize: FontSize.xxxl, color: Colors.textPrimary, letterSpacing: -0.5 },
  origPrice: { fontFamily: FontFamily.num, fontSize: FontSize.sm, color: Colors.textMuted, textDecorationLine: 'line-through', textAlign: 'right' },

  /* Quantity */
  sectionLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.md, color: Colors.textMuted, marginBottom: Spacing.md },
  weightRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl, flexWrap: 'wrap' },
  weightChip: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  weightChipActive: { borderColor: Colors.primaryDark },
  weightText: { fontFamily: FontFamily.numMed, fontSize: FontSize.sm, color: Colors.textSecondary },
  weightTextActive: { color: Colors.primaryDark },

  divider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.lg },

  /* Product detail */
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary, marginBottom: Spacing.sm },
  description: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22 },

  /* Bottom bar */
  bottomBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xxl, paddingTop: Spacing.lg, backgroundColor: Colors.surface, gap: Spacing.md },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stepBtn: { width: 40, height: 40, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  stepIcon: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },
  stepQtyBox: { width: 44, height: 40, borderRadius: Radius.md, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  stepQty: { fontFamily: FontFamily.numBold, fontSize: FontSize.lg, color: Colors.primaryDark },
  addToCartBtn: { flex: 1, backgroundColor: Colors.primaryDark, borderRadius: Radius.full, paddingVertical: Spacing.lg, alignItems: 'center', ...Shadow.sm },
  addToCartBtnAdded: { backgroundColor: Colors.success },
  addToCartText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.textInverse },
});
