import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
    today: Math.round(p.price),
    prev:  Math.round(p.previous_price),
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

const PASTEL_PALETTE = ['#FFE4E4','#FFF0E0','#FEFCE4','#E4F7E4','#E4EEFF','#F3E4FF','#FFE4F4','#E4FFF9'];
function getPastelColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return PASTEL_PALETTE[Math.abs(h) % PASTEL_PALETTE.length];
}

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
        <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={18} color={isFav ? Colors.danger : Colors.textMuted} />
      </Pressable>
      <View style={[gridStyles.emojiWrap, { backgroundColor: getPastelColor(item.name) }]}>
        <Text style={gridStyles.emoji}>{item.emoji}</Text>
      </View>
      <Text style={gridStyles.name}>{item.name}</Text>
      <Text style={gridStyles.te}>{item.te}</Text>
      <View style={gridStyles.footer}>
        <View style={gridStyles.priceRow}>
          <Text style={gridStyles.priceAmount}>₹{item.today}</Text>
          <Text style={gridStyles.priceUnit}>/{item.unit}</Text>
        </View>
        <Badge chg={item.chg} />
      </View>
    </View>
  );
}

export default function PriceScreen() {
  const [category, setCategory] = useState<Category>('all');
  const [query, setQuery] = useState('');
  const [isGrid, setIsGrid] = useState(true);
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

      <LinearGradient
        colors={['#1B5E35', '#4CAF6F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.4, y: 1 }}
        style={styles.header}
      >
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
      </LinearGradient>

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
          columnWrapperStyle={{ gap: Spacing.md, paddingHorizontal: Spacing.md }}
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
  card: { flex: 1, marginHorizontal: Spacing.md, marginTop: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.lg, ...Shadow.sm },
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
  emojiWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginVertical: Spacing.sm },
  emoji: { fontSize: 36 },
  name: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.textPrimary },
  te: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.xs },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.xs },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  priceAmount: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary },
  priceUnit: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { backgroundColor: '#206B3A', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.lg, borderBottomLeftRadius: Radius.xl, borderBottomRightRadius: Radius.xl, overflow: 'hidden' },
  headerLightStrip: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '48%', backgroundColor: 'rgba(83,177,117,0.55)' } as any,
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.xxxl, color: Colors.textInverse, letterSpacing: -0.5 },
  telugu: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  date: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textInverse },
  updated: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  searchRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
  searchInput: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textPrimary, padding: 0, outlineStyle: 'none' } as any,
  toggleBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: 4, ...Shadow.sm },
  toggleText: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.primaryDark },
  chipsRow: { paddingVertical: Spacing.sm, backgroundColor: Colors.surface },
  chipsContent: { paddingHorizontal: Spacing.lg, alignItems: 'center', gap: Spacing.sm },
  tab: { borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: 8, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primaryDark, borderColor: Colors.primaryDark },
  tabLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary },
  tabLabelActive: { color: Colors.textInverse },
});
