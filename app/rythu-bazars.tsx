import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, FlatList, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius } from '../constants/spacing';
import { marketApi, ApiMarket } from '../lib/api';
import { FALLBACK_RYTHU, DAY_KEYS, sortByDistance } from '../lib/marketsData';
import { useUserGps } from '../hooks/useUserGps';
import MarketListRow from '../components/MarketListRow';

const DAY_FULL: Record<string, string> = {
  Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
  Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday',
};

export default function RythuBazarsScreen() {
  const [query, setQuery]   = useState('');
  const [area, setArea]     = useState('All');
  const todayIdx = new Date().getDay();
  const [selDay, setSelDay] = useState(DAY_KEYS[todayIdx]);
  const [markets, setMarkets] = useState<ApiMarket[]>(FALLBACK_RYTHU);
  const userLocation = useUserGps();

  const fetchMarkets = useCallback(async () => {
    try {
      const all = await marketApi.getAll({ type: 'rythu-bazar' });
      const rythu = all.filter(m => m.category_slug === 'rythu-bazar');
      if (rythu.length) setMarkets(rythu);
    } catch {
      // keep fallback data on network error
    }
  }, []);
  useEffect(() => { fetchMarkets(); }, [fetchMarkets]);

  const areas = useMemo(() => ['All', ...Array.from(new Set(markets.map(m => m.area)))], [markets]);

  const filtered = sortByDistance(
    markets.filter(m =>
      (area === 'All' || m.area === area) &&
      m.holiday !== DAY_FULL[selDay] &&
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
          <Pressable
            style={styles.iconBtn}
            onPress={() => Linking.openURL('https://maps.google.com/?q=Rythu+Bazar+Visakhapatnam')}
          >
            <Ionicons name="map-outline" size={18} color={Colors.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.titleRow}>
          <View style={styles.titleBadge}>
            <Ionicons name="storefront" size={18} color={Colors.textInverse} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Rythu Bazars</Text>
            <Text style={styles.subtitle}>All government Rythu Bazar locations in Visakhapatnam</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search bazars, areas…"
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <View style={styles.chipsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={styles.chipsContent}>
            {areas.map(a => (
              <Pressable key={a} style={[styles.chip, area === a && styles.chipActive]} onPress={() => setArea(a)}>
                <Text style={[styles.chipLabel, area === a && styles.chipLabelActive]}>{a}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {/* Placeholder for future filter options (price, facilities, etc.) */}
          <Pressable style={styles.filterBtn}>
            <Ionicons name="options-outline" size={16} color={Colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysRow}>
          {DAY_KEYS.map(d => {
            const active = d === selDay;
            return (
              <Pressable key={d} style={[styles.dayChip, active && styles.dayChipActive]} onPress={() => setSelDay(d)}>
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
        ListEmptyComponent={<Text style={styles.empty}>No Rythu Bazars match your filters</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },

  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, gap: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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

  daysRow: { gap: Spacing.sm },
  dayChip: { width: 42, height: 36, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  dayChipActive: { backgroundColor: Colors.primaryDark, borderColor: Colors.primaryDark },
  dayLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.textPrimary },
  dayLabelActive: { color: Colors.textInverse },

  empty: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', padding: Spacing.xl },
});
