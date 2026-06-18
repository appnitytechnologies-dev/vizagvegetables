import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator, Share } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { api, ApiProduct, imgUrl } from '../lib/api';
import { useFavourites } from '../hooks/useFavourites';
import PageHeader from '../components/ui/PageHeader';

export default function SavedFavourites() {
  const { ids, toggle } = useFavourites();
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <PageHeader title="Saved Favourites" fallback="/(tabs)/profile" />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : isEmpty ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="heart-outline" size={40} color={Colors.danger} />
          </View>
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
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.countText}>{favProducts.length} saved product{favProducts.length !== 1 ? 's' : ''}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const imageUri = imgUrl(item.image_url);
            return (
              <Pressable
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.93 }]}
                onPress={() => router.push({ pathname: '/shop-details', params: { id: item.id } } as any)}
              >
                {/* Image */}
                <View style={styles.imgBox}>
                  {imageUri
                    ? <Image source={{ uri: imageUri }} style={styles.img} contentFit="contain" />
                    : <Text style={styles.emoji}>{item.emoji ?? '🥦'}</Text>
                  }
                </View>

                {/* Info */}
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                  {item.telugu_name ? (
                    <Text style={styles.te} numberOfLines={1}>{item.telugu_name}</Text>
                  ) : null}
                  <Text style={styles.unit}>per {item.unit}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>₹{Math.round(item.price)}</Text>
                    {item.previous_price > item.price && (
                      <Text style={styles.orig}>₹{Math.round(item.previous_price)}</Text>
                    )}
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                  <Pressable
                    hitSlop={8}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggle(item.id); }}
                  >
                    <Ionicons name="heart" size={20} color={Colors.danger} />
                  </Pressable>
                  <Pressable
                    style={styles.shareBtn}
                    hitSlop={8}
                    onPress={() => {
                      Share.share({
                        message: `🛒 ${item.name}\n💰 ₹${Math.round(item.price)}/${item.unit}\n\n🌿 Order fresh vegetables: https://yzagfresh.in`,
                      });
                    }}
                  >
                    <Ionicons name="share-social-outline" size={18} color={Colors.primary} />
                  </Pressable>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F3F5' },

  list: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  listHeader: { paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  countText: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 0.5 },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  imgBox: {
    width: 68, height: 68,
    borderRadius: Radius.lg,
    backgroundColor: '#F8F9FA',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  img:   { width: 68, height: 68 },
  emoji: { fontSize: 32 },

  info:     { flex: 1 },
  name:     { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  te:       { fontFamily: FontFamily.regular,  fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  unit:     { fontFamily: FontFamily.regular,  fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: Spacing.xs },
  price:    { fontFamily: FontFamily.numBold, fontSize: FontSize.md, color: Colors.primary },
  orig:     { fontFamily: FontFamily.num, fontSize: FontSize.xs, color: Colors.textMuted, textDecorationLine: 'line-through' },

  actions: { alignItems: 'center', gap: Spacing.md },
  shareBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.primaryPale,
    alignItems: 'center', justifyContent: 'center',
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xxxl },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle:    { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },
  emptyBody:     { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  browseBtn:     { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md, marginTop: Spacing.sm },
  browseBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textInverse },
});
