import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { marketRates, MarketRate } from '../../dummy-data/marketRates';
import { useFavourites } from '../../hooks/useFavourites';
import Badge from '../../components/ui/Badge';
import Chip from '../../components/ui/Chip';

type Category = 'all' | 'vegetables' | 'fruits' | 'leafy' | 'flowers' | 'favourite';
const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'vegetables', label: 'Vegetables' },
  { key: 'fruits', label: 'Fruits' },
  { key: 'leafy', label: 'Leafy' },
  { key: 'flowers', label: 'Flowers' },
  { key: 'favourite', label: 'Favorite' },
];

function PriceRowItem({ item }: { item: MarketRate }) {
  return (
    <View style={listStyles.row}>
      <View style={listStyles.itemCell}>
        <Text style={listStyles.emoji}>{item.emoji}</Text>
        <Text style={listStyles.name}>{item.name}</Text>
      </View>
      <Text style={listStyles.today}>₹{item.today}</Text>
      <Text style={listStyles.prev}>₹{item.prev}</Text>
      <View style={listStyles.chgCell}><Badge chg={item.chg} /></View>
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
  const { ids, toggle } = useFavourites();

  const filtered = marketRates.filter(r => {
    const matchCat = category === 'all'
      ? true
      : category === 'favourite'
      ? ids.includes(r.id)
      : r.cat === category;
    const matchQ = r.name.toLowerCase().includes(query.toLowerCase()) || r.te.includes(query);
    return matchCat && matchQ;
  });

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

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
              placeholder={`${marketRates.length} items  Search for vegetables, fruits...`}
              placeholderTextColor={Colors.textMuted}
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <Pressable style={styles.toggleBtn} onPress={() => setIsGrid(g => !g)}>
            <Ionicons name={isGrid ? 'list-outline' : 'grid-outline'} size={16} color={Colors.textPrimary} />
            <Text style={styles.toggleText}>{isGrid ? 'List' : 'Grid'}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={{ paddingHorizontal: Spacing.xxl, gap: Spacing.sm, paddingVertical: Spacing.sm }}>
        {CATEGORIES.map(c => (
          <Chip key={c.key} label={c.label} active={category === c.key} onPress={() => setCategory(c.key)} />
        ))}
      </ScrollView>

      {isGrid ? (
        <FlatList
          key="grid"
          data={filtered}
          numColumns={2}
          keyExtractor={i => i.id}
          columnWrapperStyle={{ gap: Spacing.md, paddingHorizontal: Spacing.xxl }}
          contentContainerStyle={{ gap: Spacing.md, paddingTop: Spacing.md, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <PriceGridItem item={item} isFav={ids.includes(item.id)} onToggleFav={() => toggle(item.id)} />
          )}
        />
      ) : (
        <FlatList
          key="list"
          data={filtered}
          keyExtractor={i => i.id}
          contentContainerStyle={{ paddingHorizontal: Spacing.xxl, paddingTop: Spacing.md, paddingBottom: 100 }}
          ListHeaderComponent={
            <View style={listStyles.header}>
              <Text style={[listStyles.headerCol, { flex: 2 }]}>Item</Text>
              <Text style={listStyles.headerCol}>Today</Text>
              <Text style={listStyles.headerCol}>Prev</Text>
              <Text style={listStyles.headerCol}>Chg</Text>
            </View>
          }
          renderItem={({ item }) => <PriceRowItem item={item} />}
          ItemSeparatorComponent={() => <View style={listStyles.sep} />}
          style={listStyles.card}
        />
      )}
    </SafeAreaView>
  );
}

const listStyles = StyleSheet.create({
  card: { marginHorizontal: Spacing.xxl, backgroundColor: Colors.surface, borderRadius: Radius.lg, ...Shadow.sm },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryPale, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg },
  headerCol: { flex: 1, fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.primary, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  itemCell: { flex: 2, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  emoji: { fontSize: 22 },
  name: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textPrimary },
  today: { flex: 1, fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary, textAlign: 'center' },
  prev: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  chgCell: { flex: 1, alignItems: 'center' },
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
  header: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.lg },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.xxl, color: Colors.textInverse, letterSpacing: -0.3 },
  telugu: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  date: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.textInverse },
  updated: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)' },
  searchRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
  searchInput: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textPrimary, padding: 0 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: 4, ...Shadow.sm },
  toggleText: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.textPrimary },
  chipsRow: { maxHeight: 52, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
});
