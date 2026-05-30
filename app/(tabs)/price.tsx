import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSelector } from 'react-redux';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { api, ApiProduct } from '../../lib/api';
import { selectAuth } from '../../store/authSlice';
import { useFavourites } from '../../hooks/useFavourites';
import Badge from '../../components/ui/Badge';

/* local shape the UI expects */
export interface MarketRate {
  id: string;
  emoji: string;
  name: string;
  te: string;
  cat: 'vegetables' | 'fruits' | 'leafy' | 'flowers';
  today: number;
  prev: number;
  chg: number;
  unit: string;
}

function toCat(categoryName: string | null): MarketRate['cat'] {
  const n = (categoryName || '').toLowerCase();
  if (n.includes('fruit')) return 'fruits';
  if (n.includes('leaf') || n.includes('green')) return 'leafy';
  if (n.includes('flower')) return 'flowers';
  return 'vegetables';
}

function toRate(p: ApiProduct): MarketRate {
  return {
    id:    p.id,
    emoji: p.emoji || '🥦',
    name:  p.name,
    te:    p.telugu_name || '',
    cat:   toCat(p.category_name),
    today: p.price,
    prev:  p.previous_price,
    chg:   +(p.price - p.previous_price).toFixed(0),
    unit:  p.unit,
  };
}

type Category = 'all' | 'vegetables' | 'fruits' | 'leafy' | 'flowers' | 'favourite';
const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'vegetables', label: 'Vegetables' },
  { key: 'fruits', label: 'Fruits' },
  { key: 'flowers', label: 'Flowers' },
  { key: 'leafy', label: 'Leafs' },
  { key: 'favourite', label: 'Favorite' },
];

function PriceRowItem({ item, isFav, onToggleFav }: { item: MarketRate; isFav: boolean; onToggleFav: () => void }) {
  return (
    <View style={listStyles.row}>
      <View style={listStyles.itemCell}>
        <Text style={listStyles.emoji}>{item.emoji}</Text>
        <View>
          <Text style={listStyles.name}>{item.name}</Text>
          <Text style={listStyles.nameTe}>{item.te}</Text>
        </View>
      </View>
      <Text style={listStyles.today}>₹{item.today}</Text>
      <Text style={listStyles.prev}>₹{item.prev}</Text>
      <View style={listStyles.chgCell}><Badge chg={item.chg} /></View>
      <Pressable onPress={onToggleFav} style={listStyles.heartBtn}>
        <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={16} color={isFav ? Colors.danger : Colors.textMuted} />
      </Pressable>
    </View>
  );
}

function PriceGridItem({ item, isFav, onToggleFav }: { item: MarketRate; isFav: boolean; onToggleFav: () => void }) {
  return (
    <View style={gridStyles.card}>
      <Pressable onPress={onToggleFav} style={gridStyles.heart}>
        <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={16} color={isFav ? Colors.danger : Colors.textMuted} />
      </Pressable>
      <View style={gridStyles.emojiWrap}>
        <Text style={gridStyles.emoji}>{item.emoji}</Text>
      </View>
      <Text style={gridStyles.name}>{item.name}</Text>
      <Text style={gridStyles.te}>{item.te}</Text>
      <View style={gridStyles.footer}>
        <Text style={gridStyles.price}>₹{item.today}/{item.unit}</Text>
        <Badge chg={item.chg} />
      </View>
    </View>
  );
}

export default function PriceScreen() {
  const [category, setCategory] = useState<Category>('all');
  const [query, setQuery] = useState('');
  const [isGrid, setIsGrid] = useState(false);
  const [rates, setRates] = useState<MarketRate[]>([]);
  const [loading, setLoading] = useState(true);
  const { ids, toggle } = useFavourites();
  const auth = useSelector(selectAuth);

  const handleToggleFav = (id: string) => {
    if (!auth.isLoggedIn) {
      Alert.alert(
        'Login Required',
        'Please log in to save favourites',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/(auth)/otp-number' as any) },
        ]
      );
      return;
    }
    toggle(id);
  };

  useEffect(() => {
    api.get<ApiProduct[]>('/api/market-rates?limit=500')
      .then(data => setRates(data.map(toRate)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = rates.filter((r: MarketRate) => {
    const matchCat = category === 'all'
      ? true
      : category === 'favourite'
      ? ids.includes(r.id)
      : r.cat === category;
    const matchQ = r.name.toLowerCase().includes(query.toLowerCase()) || r.te.includes(query);
    return matchCat && matchQ;
  });

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Today's Prices</Text>
            <Text style={styles.telugu}>రైతు బజార్ కూరగాయల ధరలు</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.date}>{today}</Text>
            <Text style={styles.updated}>Updated 7:00 AM</Text>
          </View>
        </View>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder={`${rates.length} items  Search vegetables, fruits, flowers...`}
              placeholderTextColor={Colors.textMuted}
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <Pressable style={styles.toggleBtn} onPress={() => setIsGrid(g => !g)}>
            <Ionicons name={isGrid ? 'list-outline' : 'grid-outline'} size={16} color={Colors.primary} />
            <Text style={styles.toggleText}>{isGrid ? 'List' : 'Grid'}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.chipsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={styles.chipsContent}>
          {CATEGORIES.map(c => (
            <Pressable key={c.key} style={[styles.tab, category === c.key && styles.tabActive]} onPress={() => setCategory(c.key)}>
              <Text style={[styles.tabLabel, category === c.key && styles.tabLabelActive]}>{c.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {isGrid ? (
        <FlatList
          key="grid"
          data={filtered}
          numColumns={2}
          keyExtractor={i => i.id}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          columnWrapperStyle={{ gap: Spacing.md, paddingHorizontal: Spacing.lg }}
          contentContainerStyle={{ gap: Spacing.md, paddingTop: Spacing.md, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <PriceGridItem item={item} isFav={ids.includes(item.id)} onToggleFav={() => handleToggleFav(item.id)} />
          )}
        />
      ) : (
        <FlatList
          key="list"
          data={filtered}
          keyExtractor={i => i.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: Spacing.md, paddingBottom: 100 }}
          ListHeaderComponent={
            <View style={listStyles.header}>
              <Text style={[listStyles.headerCol, { flex: 2 }]}>Item</Text>
              <Text style={listStyles.headerCol}>Today</Text>
              <Text style={listStyles.headerCol}>Prev</Text>
              <Text style={listStyles.headerCol}>Chg</Text>
              <View style={{ width: 28 }} />
            </View>
          }
          renderItem={({ item }) => <PriceRowItem item={item} isFav={ids.includes(item.id)} onToggleFav={() => handleToggleFav(item.id)} />}
          ItemSeparatorComponent={() => <View style={listStyles.sep} />}
          style={listStyles.card}
        />
      )}
    </SafeAreaView>
  );
}

const listStyles = StyleSheet.create({
  card: { flex: 1, marginHorizontal: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.lg, ...Shadow.sm },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryPale, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg },
  headerCol: { flex: 1, fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.primary, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  itemCell: { flex: 2, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  emoji: { fontSize: 22 },
  name: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textPrimary },
  nameTe: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  today: { flex: 1, fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary, textAlign: 'center' },
  prev: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  chgCell: { flex: 1, alignItems: 'center' },
  heartBtn: { width: 28, alignItems: 'center' },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
});

const gridStyles = StyleSheet.create({
  card: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.sm },
  heart: { alignSelf: 'flex-end' },
  emojiWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primaryPale, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginVertical: Spacing.sm },
  emoji: { fontSize: 32 },
  name: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  te: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.xs },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.xs },
  price: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.primary },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primaryDark, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.lg, borderBottomLeftRadius: Radius.xl, borderBottomRightRadius: Radius.xl },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.xxl, color: Colors.textInverse, letterSpacing: -0.3 },
  telugu: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  date: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.textInverse },
  updated: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)' },
  searchRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
  searchInput: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textPrimary, padding: 0, outlineStyle: 'none' } as any,
  toggleBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: 4, ...Shadow.sm },
  toggleText: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.primary },
  chipsRow: { height: 60, overflow: 'hidden', backgroundColor: Colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  chipsContent: { paddingHorizontal: Spacing.lg, alignItems: 'center' },
  tab: { borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: 7, backgroundColor: 'rgba(0,0,0,0.06)', marginRight: Spacing.sm },
  tabActive: { backgroundColor: Colors.primary },
  tabLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary },
  tabLabelActive: { color: Colors.textInverse },
});
