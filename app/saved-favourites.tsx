import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { products } from '../dummy-data/products';
import { marketRates } from '../dummy-data/marketRates';
import { useFavourites } from '../hooks/useFavourites';
import { useCart } from '../hooks/useCart';
import Badge from '../components/ui/Badge';
import Divider from '../components/ui/Divider';

export default function SavedFavourites() {
  const { ids, toggle } = useFavourites();
  const { addItem } = useCart();

  const favRates = marketRates.filter(r => ids.includes(r.id));
  const favProducts = products.filter(p => ids.includes(p.id));

  const isEmpty = favRates.length === 0 && favProducts.length === 0;

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

      {isEmpty ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>❤️</Text>
          <Text style={styles.emptyTitle}>No favourites yet</Text>
          <Text style={styles.emptyBody}>Tap ♡ on rate cards or products to save them here.</Text>
          <Pressable style={styles.browseBtn} onPress={() => router.push('/(tabs)/price' as any)}>
            <Text style={styles.browseBtnText}>Browse Prices</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={[
            ...(favRates.length > 0 ? [{ type: 'section', label: `Rate Cards (${favRates.length})` }] : []),
            ...favRates.map(r => ({ type: 'rate', ...r })),
            ...(favProducts.length > 0 ? [{ type: 'section', label: `Products (${favProducts.length})` }] : []),
            ...favProducts.map(p => ({ type: 'product', ...p })),
          ] as any[]}
          keyExtractor={(item, i) => item.id ?? `section-${i}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => {
            if (item.type === 'section') {
              return <Text style={styles.sectionLabel}>{item.label}</Text>;
            }

            if (item.type === 'rate') {
              return (
                <View style={styles.rateRow}>
                  <Text style={styles.rowEmoji}>{item.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName}>{item.name}</Text>
                    <Text style={styles.rowSub}>{item.te} · per {item.unit}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={styles.ratePrice}>₹{item.today}</Text>
                    <Badge chg={item.chg} />
                  </View>
                  <Pressable
                    style={styles.heartBtn}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggle(item.id); }}
                  >
                    <Ionicons name="heart" size={18} color={Colors.danger} />
                  </Pressable>
                </View>
              );
            }

            // product
            return (
              <View style={styles.productRow}>
                <Text style={styles.rowEmoji}>{item.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{item.name}</Text>
                  <Text style={styles.rowSub}>{item.weight}</Text>
                </View>
                <Text style={styles.productPrice}>₹{item.price}</Text>
                <Pressable
                  style={styles.addBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    addItem({ id: item.id, name: item.name, te: item.te, emoji: item.emoji, price: item.price, weight: item.weight, quantity: 1 });
                  }}
                >
                  <Text style={styles.addBtnText}>Add</Text>
                </Pressable>
                <Pressable
                  style={styles.heartBtn}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggle(item.id); }}
                >
                  <Ionicons name="heart" size={18} color={Colors.danger} />
                </Pressable>
              </View>
            );
          }}
          ItemSeparatorComponent={() => <Divider />}
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

  rateRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md, backgroundColor: Colors.surface },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md, backgroundColor: Colors.surface },
  rowEmoji: { fontSize: 32, width: 44 },
  rowName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  rowSub: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  ratePrice: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.textPrimary },
  productPrice: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary },
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
