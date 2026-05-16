import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ScrollView, TextInput, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { marketRates } from '../../dummy-data/marketRates';
import { products } from '../../dummy-data/products';
import { user } from '../../dummy-data/user';
import Badge from '../../components/ui/Badge';
import { useCart } from '../../hooks/useCart';
import { useFavourites } from '../../hooks/useFavourites';

const { width: SW } = Dimensions.get('window');

const BANNERS = [
  { id: '1', emoji: '🥦', title: 'Fresh\nVegetables', subtitle: 'Farm to table daily', bg: '#E8F5E9' },
  { id: '2', emoji: '🍅', title: 'Rythu\nBazar Rates', subtitle: 'Updated every morning', bg: '#FFF3E0' },
  { id: '3', emoji: '🛒', title: 'Order\nOnline', subtitle: 'Delivered in 45 mins', bg: '#E3F2FD' },
];

function BannerCarousel() {
  const [active, setActive] = useState(0);

  return (
    <View style={bannerStyles.wrap}>
      <ScrollView
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => {
          setActive(Math.round(e.nativeEvent.contentOffset.x / (SW - Spacing.xxl * 2)));
        }}
      >
        {BANNERS.map(b => (
          <View key={b.id} style={[bannerStyles.slide, { backgroundColor: b.bg }]}>
            <Text style={bannerStyles.emoji}>{b.emoji}</Text>
            <View>
              <Text style={bannerStyles.title}>{b.title}</Text>
              <Text style={bannerStyles.sub}>{b.subtitle}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={bannerStyles.dots}>
        {BANNERS.map((_, i) => (
          <View key={i} style={[bannerStyles.dot, i === active && bannerStyles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const bannerStyles = StyleSheet.create({
  wrap: { marginHorizontal: Spacing.xxl, borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing.xl },
  slide: {
    width: SW - Spacing.xxl * 2,
    height: 120,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
    borderRadius: Radius.lg,
  },
  emoji: { fontSize: 52 },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary, letterSpacing: -0.3 },
  sub: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: Spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 999, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.primary, width: 16 },
});

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={sh.row}>
      <Text style={sh.title}>{title}</Text>
      {onSeeAll && <Pressable onPress={onSeeAll}><Text style={sh.seeAll}>See all &gt;</Text></Pressable>}
    </View>
  );
}

const sh = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: Spacing.xxl, marginBottom: Spacing.md },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary, letterSpacing: -0.3 },
  seeAll: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },
});

export default function HomeScreen() {
  const { addItem } = useCart();
  const { ids, toggle } = useFavourites();
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const topRates = marketRates.slice(0, 5);
  const favRates = marketRates.filter(r => ids.includes(r.id)).slice(0, 3);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Green Header */}
      <View style={styles.header}>
        <View style={styles.headerRow1}>
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={14} color={Colors.textInverse} />
            <Text style={styles.locationText}>Vizag, Gajuwaka..</Text>
          </View>
          <Pressable style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={20} color={Colors.textInverse} />
            <View style={styles.bellDot} />
          </Pressable>
        </View>
        <View style={styles.headerRow2}>
          <Text style={styles.greeting}>Hey {user.name} 👋</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vegetables, fruits..."
            placeholderTextColor={Colors.textMuted}
            editable={false}
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ height: Spacing.xl }} />

        <BannerCarousel />

        {/* Today's Rythu Bazar Rates */}
        <SectionHeader title="Today's Rythu Bazar Rates" onSeeAll={() => router.push('/(tabs)/price' as any)} />
        <FlatList
          data={topRates}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={i => i.id}
          contentContainerStyle={{ paddingHorizontal: Spacing.xxl, gap: Spacing.md, paddingBottom: Spacing.sm }}
          renderItem={({ item }) => (
            <Pressable
              style={rateCard.card}
              onPress={() => toggle(item.id)}
            >
              <Pressable onPress={() => toggle(item.id)} style={rateCard.heart}>
                <Ionicons
                  name={ids.includes(item.id) ? 'heart' : 'heart-outline'}
                  size={16}
                  color={ids.includes(item.id) ? Colors.danger : Colors.textMuted}
                />
              </Pressable>
              <Text style={rateCard.emoji}>{item.emoji}</Text>
              <Text style={rateCard.name}>{item.name}</Text>
              <Text style={rateCard.te}>{item.te}</Text>
              <View style={rateCard.priceRow}>
                <Text style={rateCard.price}>₹{item.today}/{item.unit}</Text>
                <Badge chg={item.chg} />
              </View>
            </Pressable>
          )}
        />

        {/* Favourite Price */}
        <View style={{ height: Spacing.xl }} />
        <SectionHeader title="❤️  Favourite Price" onSeeAll={() => router.push('/(tabs)/price' as any)} />
        {favRates.length === 0 ? (
          <Text style={styles.emptyFav}>Tap ♡ on any rate card to add favourites</Text>
        ) : (
          <View style={favStyles.card}>
            {favRates.map((r, i) => (
              <View key={r.id}>
                <View style={favStyles.row}>
                  <Text style={favStyles.emoji}>{r.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={favStyles.name}>{r.name}</Text>
                    <Text style={favStyles.te}>{r.te}</Text>
                  </View>
                  <Text style={favStyles.price}>₹{r.today}/{r.unit}</Text>
                </View>
                {i < favRates.length - 1 && <View style={favStyles.divider} />}
              </View>
            ))}
          </View>
        )}

        {/* Shopping List */}
        <View style={{ height: Spacing.xl }} />
        <SectionHeader title="🛒  Shopping List" onSeeAll={() => router.push('/(tabs)/shop' as any)} />
        <FlatList
          data={products.slice(0, 4)}
          numColumns={2}
          scrollEnabled={false}
          keyExtractor={i => i.id}
          columnWrapperStyle={{ gap: Spacing.md, paddingHorizontal: Spacing.xxl }}
          contentContainerStyle={{ gap: Spacing.md }}
          renderItem={({ item }) => (
            <Pressable style={prodCard.card} onPress={() => router.push('/shop-details' as any)}>
              <Text style={prodCard.emoji}>{item.emoji}</Text>
              <Text style={prodCard.name}>{item.name}</Text>
              <Text style={prodCard.weight}>{item.weight}</Text>
              <View style={prodCard.footer}>
                <Text style={prodCard.price}>₹{item.price}</Text>
                <Pressable
                  style={prodCard.addBtn}
                  onPress={() => addItem({ id: item.id, name: item.name, te: item.te, emoji: item.emoji, price: item.price, weight: item.weight, quantity: 1 })}
                >
                  <Text style={prodCard.addText}>Add</Text>
                </Pressable>
              </View>
            </Pressable>
          )}
        />

        {/* Today's Price Table */}
        <View style={{ height: Spacing.xl }} />
        <SectionHeader title="Today's Price Table" onSeeAll={() => router.push('/(tabs)/price' as any)} />
        <View style={tableStyles.card}>
          <View style={tableStyles.headerRow}>
            <Text style={[tableStyles.col, { flex: 2 }]}>Item</Text>
            <Text style={tableStyles.col}>Today</Text>
            <Text style={tableStyles.col}>Prev</Text>
            <Text style={tableStyles.col}>Chg</Text>
          </View>
          {marketRates.slice(0, 8).map(r => (
            <View key={r.id} style={tableStyles.row}>
              <View style={[tableStyles.itemCol, { flex: 2 }]}>
                <Text style={tableStyles.itemEmoji}>{r.emoji}</Text>
                <Text style={tableStyles.itemName}>{r.name}</Text>
              </View>
              <Text style={tableStyles.today}>₹{r.today}</Text>
              <Text style={tableStyles.prev}>₹{r.prev}</Text>
              <Badge chg={r.chg} />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const rateCard = StyleSheet.create({
  card: { width: 120, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.sm },
  heart: { alignSelf: 'flex-end', marginBottom: Spacing.xs },
  emoji: { fontSize: 36, marginBottom: Spacing.xs },
  name: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  te: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.xs },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  price: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.primary },
});

const favStyles = StyleSheet.create({
  card: { marginHorizontal: Spacing.xxl, backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  row: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  emoji: { fontSize: 28 },
  name: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  te: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },
  price: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.textPrimary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
});

const prodCard = StyleSheet.create({
  card: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.sm },
  emoji: { fontSize: 40, marginBottom: Spacing.xs },
  name: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  weight: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary },
  addBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  addText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textInverse },
});

const tableStyles = StyleSheet.create({
  card: { marginHorizontal: Spacing.xxl, backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm, marginBottom: Spacing.xxl },
  headerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryPale, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  col: { flex: 1, fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.primary, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  itemCol: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  itemEmoji: { fontSize: 18 },
  itemName: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textPrimary },
  today: { flex: 1, fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.textPrimary, textAlign: 'center' },
  prev: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.lg },
  headerRow1: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textInverse },
  bellBtn: { position: 'relative' },
  bellDot: { position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.danger },
  headerRow2: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  greeting: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textInverse, letterSpacing: -0.3 },
  date: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, gap: Spacing.sm },
  searchInput: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textPrimary, padding: 0 },
  emptyFav: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', marginHorizontal: Spacing.xxl, marginBottom: Spacing.md },
});
