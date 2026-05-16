import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { products } from '../dummy-data/products';
import { useCart, useItemQuantity } from '../hooks/useCart';

const { width: SW } = Dimensions.get('window');
const WEIGHTS = ['1kg', '5kg', '10kg'];

export default function ShopDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = products.find(p => p.id === id) ?? products[0];
  const [selectedWeight, setSelectedWeight] = useState(WEIGHTS[0]);
  const { addItem, increase, decrease } = useCart();
  const qty = useItemQuantity(product.id);

  const handleAddToCart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addItem({ id: product.id, name: product.name, te: product.te, emoji: product.emoji, price: product.price, weight: selectedWeight, quantity: 1 });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar style="dark" />

      {/* Image hero */}
      <View style={styles.heroWrap}>
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{product.emoji}</Text>
        </View>
        <Pressable style={[styles.iconBtn, { left: Spacing.lg }]} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </Pressable>
        <Pressable style={[styles.iconBtn, { right: Spacing.lg }]}>
          <Ionicons name="share-outline" size={20} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.dotsRow}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
          ))}
        </View>
      </View>

      {/* Bottom sheet */}
      <ScrollView style={styles.sheet} showsVerticalScrollIndicator={false}>
        <View style={styles.sheetHandle} />

        <View style={styles.nameRow}>
          <View>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productUnit}>{product.weight}, Price</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.price}>₹ {product.price}</Text>
            <Text style={styles.origPrice}>₹{product.orig}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Select Weight</Text>
        <View style={styles.weightRow}>
          {WEIGHTS.map(w => (
            <Pressable
              key={w}
              style={[styles.weightChip, selectedWeight === w && styles.weightChipActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedWeight(w); }}
            >
              <Text style={[styles.weightText, selectedWeight === w && styles.weightTextActive]}>{w}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>Product Detail</Text>
        <Text style={styles.description}>{product.description}</Text>

        <View style={styles.tagsRow}>
          {product.tags.map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>✓ {tag}</Text>
            </View>
          ))}
          <View style={styles.tag}>
            <Text style={styles.tagText}>✓ Pesticide-free</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={styles.bottomBar}>
        {qty > 0 ? (
          <View style={styles.stepper}>
            <Pressable style={styles.stepBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); decrease(product.id); }}>
              <Text style={styles.stepIcon}>−</Text>
            </Pressable>
            <Text style={styles.stepQty}>{qty}</Text>
            <Pressable style={styles.stepBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); increase(product.id); }}>
              <Text style={styles.stepIcon}>+</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ width: 120 }} />
        )}
        <Pressable style={styles.addToCartBtn} onPress={handleAddToCart}>
          <Text style={styles.addToCartText}>Add to Cart</Text>
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
  iconBtn: { position: 'absolute', top: Spacing.lg, width: 40, height: 40, borderRadius: Radius.sm, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  dotsRow: { position: 'absolute', bottom: Spacing.md, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.primary, width: 16 },
  sheet: { flex: 1, backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, marginTop: -Radius.xxl, paddingHorizontal: Spacing.xxl },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: Spacing.md, marginBottom: Spacing.lg },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xl },
  productName: { fontFamily: FontFamily.bold, fontSize: FontSize.xxxl, color: Colors.textPrimary, letterSpacing: -0.3 },
  productUnit: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary },
  price: { fontFamily: FontFamily.bold, fontSize: FontSize.xxxl, color: Colors.textPrimary, letterSpacing: -0.3 },
  origPrice: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, textDecorationLine: 'line-through' },
  sectionLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  weightRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
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
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  stepBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  stepIcon: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.primary },
  stepQty: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary, minWidth: 24, textAlign: 'center' },
  addToCartBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing.lg, alignItems: 'center' },
  addToCartText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.textInverse },
});
