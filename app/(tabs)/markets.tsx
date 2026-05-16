import { View, Text, StyleSheet, FlatList, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { markets, weeklyShandhas, Market } from '../../dummy-data/markets';

function MarketCard({ market }: { market: Market }) {
  return (
    <View style={card.wrap}>
      <View style={card.imagePlaceholder}>
        <Text style={card.imageEmoji}>🏪</Text>
      </View>
      <View style={card.body}>
        <View style={card.topRow}>
          <View style={[card.statusChip, market.open ? card.open : card.closed]}>
            <Text style={[card.statusText, market.open ? card.openText : card.closedText]}>
              {market.open ? 'OPEN' : 'CLOSED'}
            </Text>
          </View>
        </View>
        <Text style={card.name}>{market.name}</Text>
        <Text style={card.area}>{market.area}</Text>
        <View style={card.statsRow}>
          <View style={card.stat}>
            <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
            <Text style={card.statText}>{market.km} km</Text>
          </View>
          <View style={card.stat}>
            <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
            <Text style={card.statText}>{market.opens} – {market.closes}</Text>
          </View>
          <View style={card.stat}>
            <Ionicons name="people-outline" size={12} color={Colors.textMuted} />
            <Text style={card.statText}>{market.vendors} vendors</Text>
          </View>
        </View>
        <View style={card.btnRow}>
          <Pressable style={card.mapBtn}>
            <Ionicons name="map-outline" size={14} color={Colors.primary} />
            <Text style={card.mapText}>Map</Text>
          </Pressable>
          <Pressable style={card.detailBtn} onPress={() => router.push('/market-detail' as any)}>
            <Text style={card.detailText}>Details</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function MarketsScreen() {
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long' }).slice(0, 3);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Markets</Text>
        <Text style={styles.sub}>Vizag Rythu Bazar Locations</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Mini map placeholder */}
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapEmoji}>🗺️</Text>
          <Text style={styles.mapText}>Vizag Market Locations</Text>
          {markets.map(m => (
            <View key={m.id} style={styles.pin}>
              <Text style={styles.pinEmoji}>📍</Text>
              <Text style={styles.pinName}>{m.area}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Nearby Rythu Bazar</Text>
        <FlatList
          data={markets}
          keyExtractor={m => m.id}
          scrollEnabled={false}
          contentContainerStyle={{ gap: Spacing.md, paddingHorizontal: Spacing.xxl }}
          renderItem={({ item }) => <MarketCard market={item} />}
        />

        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Weekly Shandhas</Text>
        <View style={styles.shandhaCard}>
          {weeklyShandhas.map((s, i) => (
            <View key={s.day}>
              <View style={[styles.shandhaRow, s.day === today && styles.shandhaActive]}>
                <View style={[styles.dayChip, s.day === today && styles.dayChipActive]}>
                  <Text style={[styles.dayText, s.day === today && styles.dayTextActive]}>{s.day}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.shandhaName}>{s.name}</Text>
                  <Text style={styles.shandhaArea}>{s.area}</Text>
                </View>
                {s.day === today && (
                  <View style={styles.todayChip}>
                    <Text style={styles.todayText}>Today</Text>
                  </View>
                )}
              </View>
              {i < weeklyShandhas.length - 1 && <View style={styles.sep} />}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const card = StyleSheet.create({
  wrap: { backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  imagePlaceholder: { height: 80, backgroundColor: Colors.primaryPale, alignItems: 'center', justifyContent: 'center' },
  imageEmoji: { fontSize: 40 },
  body: { padding: Spacing.md },
  topRow: { flexDirection: 'row', marginBottom: Spacing.xs },
  statusChip: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  open: { backgroundColor: Colors.successLight },
  closed: { backgroundColor: Colors.dangerLight },
  statusText: { fontFamily: FontFamily.bold, fontSize: FontSize.xs },
  openText: { color: Colors.success },
  closedText: { color: Colors.danger },
  name: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary, marginBottom: 2 },
  area: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: Spacing.sm },
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },
  btnRow: { flexDirection: 'row', gap: Spacing.sm },
  mapBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing.sm, gap: 4 },
  mapText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },
  detailBtn: { flex: 2, backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing.sm, alignItems: 'center' },
  detailText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textInverse },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.surface, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.xxl, color: Colors.textPrimary, letterSpacing: -0.3 },
  sub: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary },
  mapPlaceholder: { margin: Spacing.xxl, backgroundColor: Colors.primaryPale, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  mapEmoji: { fontSize: 48 },
  mapText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.primary },
  pin: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pinEmoji: { fontSize: 14 },
  pinName: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary, marginHorizontal: Spacing.xxl, marginBottom: Spacing.md, letterSpacing: -0.3 },
  shandhaCard: { marginHorizontal: Spacing.xxl, backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  shandhaRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  shandhaActive: { backgroundColor: Colors.primaryPale },
  dayChip: { width: 40, height: 40, borderRadius: Radius.sm, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  dayChipActive: { backgroundColor: Colors.primary },
  dayText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.textSecondary },
  dayTextActive: { color: Colors.textInverse },
  shandhaName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  shandhaArea: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },
  todayChip: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  todayText: { fontFamily: FontFamily.bold, fontSize: FontSize.xs, color: Colors.textInverse },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
});
