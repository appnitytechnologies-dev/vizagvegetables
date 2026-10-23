import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius } from '../constants/spacing';
import { marketApi, ApiMarket } from '../lib/api';
import { FALLBACK_LOCAL, DAY_KEYS, sortByDistance } from '../lib/marketsData';
import { useUserGps } from '../hooks/useUserGps';
import MarketListRow from '../components/MarketListRow';

// The catalogue has no market "type" field yet (Main / Wholesale / Nursery),
// so these chips are visual placeholders — only "All" actually filters.
const TYPE_CHIPS = ['All', 'Main Markets', 'Wholesale', 'Nursery'];

export default function LocalMarketsScreen() {
  const [query, setQuery]   = useState('');
  const [type, setType]     = useState('All');
  const todayIdx = new Date().getDay();
  const [selDay, setSelDay] = useState(DAY_KEYS[todayIdx]);
  const [markets, setMarkets] = useState<ApiMarket[]>(FALLBACK_LOCAL);
  const userLocation = useUserGps();

  const fetchMarkets = useCallback(async () => {
    try {
      const all = await marketApi.getAll({ type: 'local-market' });
      const local = all.filter(m => m.category_slug === 'local-market');
      if (local.length) setMarkets(local);
    } catch {
      // keep fallback data on network error
    }
  }, []);
  useEffect(() => { fetchMarkets(); }, [fetchMarkets]);

  const filtered = sortByDistance(
    markets.filter(m =>
      m.day_of_week === selDay &&
      (query === '' || m.name.toLowerCase().includes(query.toLowerCase()) || m.area.toLowerCase().includes(query.toLowerCase()))
    ),
    userLocation
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.titleRow}>
          <View style={styles.titleBadge}>
            <Ionicons name="basket" size={18} color={Colors.textInverse} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Local Markets</Text>
            <Text style={styles.subtitle}>Nearby local vegetable & fruit markets in Visakhapatnam</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search markets, areas…"
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <View style={styles.chipsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={styles.chipsContent}>
            {TYPE_CHIPS.map(t => (
              <Pressable key={t} style={[styles.chip, type === t && styles.chipActive]} onPress={() => setType(t)}>
                <Text style={[styles.chipLabel, type === t && styles.chipLabelActive]}>{t}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {/* Placeholder for future filter options (price, facilities, etc.) */}
          <Pressable style={styles.filterBtn}>
            <Ionicons name="options-outline" size={16} color={Colors.textPrimary} />
          </Pressable>
        </View>

        <Text style={styles.selectDay}>Select Day</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysRow}>
          {DAY_KEYS.map((d, i) => {
            const isToday = i === todayIdx;
            const active  = d === selDay;
            return (
              <Pressable key={d} style={[styles.dayChip, active && styles.dayChipActive]} onPress={() => setSelDay(d)}>
                {isToday && <Text style={[styles.dayChipSub, active && styles.dayLabelActive]}>Today</Text>}
                <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>{d}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={m => String(m.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md, paddingBottom: 100 }}
        renderItem={({ item }) => <MarketListRow m={item} userLocation={userLocation} />}
        ListEmptyComponent={<Text style={styles.empty}>No markets on {selDay}</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },

  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, gap: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { width: 38, height: 38, borderRadius: Radius.full, backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  titleBadge: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.lg, height: 46 },
  searchInput: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textPrimary, padding: 0 },

  chipsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  chipsContent: { gap: Spacing.sm, alignItems: 'center' },
  chip: { borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primaryDark, borderColor: Colors.primaryDark },
  chipLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary },
  chipLabelActive: { color: Colors.textInverse },
  filterBtn: { width: 38, height: 38, borderRadius: Radius.full, backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },

  selectDay: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  daysRow: { gap: Spacing.sm },
  dayChip: { width: 52, height: 52, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  dayChipActive: { backgroundColor: Colors.primaryDark, borderColor: Colors.primaryDark },
  dayChipSub: { fontFamily: FontFamily.regular, fontSize: 9, color: Colors.textMuted },
  dayLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.textPrimary },
  dayLabelActive: { color: Colors.textInverse },

  empty: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', padding: Spacing.xl },
});
