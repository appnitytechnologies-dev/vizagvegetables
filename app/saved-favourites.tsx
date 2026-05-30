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
import { api, ApiProduct } from '../lib/api';
import { useFavourites } from '../hooks/useFavourites';
import { useCart } from '../hooks/useCart';
import Divider from '../components/ui/Divider';

export default function SavedFavourites() {
  const { ids, toggle }   = useFavourites();
  const { addItem }       = useCart();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get<ApiProduct[]>('/api/products?limit=200')
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const favProducts = products.filter(p => ids.includes(p.id));
  const isEmpty     = favProducts.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Saved Favourites</Text>
        <View style={{ width: 36 }} />
      </View>
      <Divider />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : isEmpty ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>❤️</Text>
          <Text style={styles.emptyTitle}>No favourites yet</Text>
          <Text style={styles.emptyBody}>Tap ♡ on products to save them here.</Text>
          <Pressable style={styles.browseBtn} onPress={() => router.push('/(tabs)/shop' as any)}>
            <Text style={styles.browseBtnText}>Browse Products</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={favProducts}
          keyExtractor={p => p.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          ItemSeparatorComponent={() => <Divider />}
          ListHeaderComponent={
            <Text style={styles.sectionLabel}>Products ({favProducts.length})</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.productRow}
              onPress={() => router.push({ pathname: '/shop-details', params: { id: item.id } } as any)}
            >
              <Text style={styles.rowEmoji}>{item.emoji ?? '🥦'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowSub}>
                  {item.telugu_name ? `${item.telugu_name} · ` : ''}per {item.unit}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={styles.productPrice}>₹{item.price}</Text>
                {item.previous_price > item.price && (
                  <Text style={styles.origPrice}>₹{item.previous_price}</Text>
                )}
              </View>
              <Pressable
                style={styles.addBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  addItem({
                    id:       item.id,
                    name:     item.name,
                    te:       item.telugu_name ?? '',
                    emoji:    item.emoji ?? '🥦',
                    price:    item.price,
                    unit:     item.unit,
                    quantity: 1,
                  });
                }}
              >
                <Text style={styles.addBtnText}>Add</Text>
              </Pressable>
              <Pressable
                style={styles.heartBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggle(item.id);
                }}
              >
                <Ionicons name="heart" size={18} color={Colors.danger} />
              </Pressable>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },

  sectionLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 0.8, paddingHorizontal: Spacing.xxl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm, backgroundColor: Colors.background },

  productRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md, backgroundColor: Colors.surface },
  rowEmoji: { fontSize: 32, width: 44 },
  rowName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  rowSub: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  productPrice: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary },
  origPrice: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, textDecorationLine: 'line-through' },
  heartBtn: { padding: Spacing.xs },
  addBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  addBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textInverse },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xxxl },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },
  emptyBody: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  browseBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md, marginTop: Spacing.sm },
  browseBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textInverse },
});
