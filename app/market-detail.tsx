import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { markets } from '../dummy-data/markets';
import { marketRates } from '../dummy-data/marketRates';
import Badge from '../components/ui/Badge';

const TABS = ['Today\'s Prices', 'About', 'Photos'];
const market = markets[0];

export default function MarketDetail() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar style="light" />

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🏪</Text>
        <Pressable style={[styles.iconBtn, { left: Spacing.lg }]} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </Pressable>
        <View style={[styles.statusChip, market.open ? styles.open : styles.closed]}>
          <Text style={[styles.statusText, market.open ? styles.openText : styles.closedText]}>
            {market.open ? 'OPEN' : 'CLOSED'}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.nameSection}>
          <Text style={styles.marketName}>{market.name}</Text>
          <Text style={styles.marketArea}>{market.area}</Text>
        </View>

        {/* Stats strip */}
        <View style={styles.statsStrip}>
          {[
            { icon: 'location-outline', val: `${market.km} km` },
            { icon: 'time-outline', val: market.opens },
            { icon: 'people-outline', val: `${market.vendors} vendors` },
          ].map(s => (
            <View key={s.icon} style={styles.statItem}>
              <Ionicons name={s.icon as any} size={16} color={Colors.primary} />
              <Text style={styles.statVal}>{s.val}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map((t, i) => (
            <Pressable key={t} style={[styles.tab, activeTab === i && styles.tabActive]} onPress={() => setActiveTab(i)}>
              <Text style={[styles.tabLabel, activeTab === i && styles.tabLabelActive]}>{t}</Text>
            </Pressable>
          ))}
        </View>

        {activeTab === 0 && (
          <View style={styles.priceCard}>
            <View style={styles.priceHeader}>
              <Text style={[styles.priceCol, { flex: 2 }]}>Item</Text>
              <Text style={styles.priceCol}>Today</Text>
              <Text style={styles.priceCol}>Prev</Text>
              <Text style={styles.priceCol}>Chg</Text>
            </View>
            {marketRates.slice(0, 10).map(r => (
              <View key={r.id} style={styles.priceRow}>
                <View style={[styles.itemCell, { flex: 2 }]}>
                  <Text style={styles.itemEmoji}>{r.emoji}</Text>
                  <Text style={styles.itemName}>{r.name}</Text>
                </View>
                <Text style={styles.today}>₹{r.today}</Text>
                <Text style={styles.prev}>₹{r.prev}</Text>
                <View style={{ flex: 1, alignItems: 'center' }}><Badge chg={r.chg} /></View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 1 && (
          <View style={styles.aboutCard}>
            <View style={styles.aboutRow}><Text style={styles.aboutKey}>Hours</Text><Text style={styles.aboutVal}>{market.opens} – {market.closes}</Text></View>
            <View style={styles.sep} />
            <View style={styles.aboutRow}><Text style={styles.aboutKey}>Days</Text><Text style={styles.aboutVal}>{market.days}</Text></View>
            <View style={styles.sep} />
            <View style={styles.aboutRow}><Text style={styles.aboutKey}>Vendors</Text><Text style={styles.aboutVal}>{market.vendors}</Text></View>
            <View style={styles.sep} />
            <Text style={[styles.aboutKey, { padding: Spacing.md }]}>Facilities</Text>
            <View style={styles.chipsRow}>
              {['Parking', 'Restrooms', 'ATM Nearby', 'Bus Stop'].map(f => (
                <View key={f} style={styles.facilityChip}>
                  <Text style={styles.facilityText}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 2 && (
          <View style={styles.photosGrid}>
            {Array.from({ length: 9 }).map((_, i) => (
              <View key={i} style={styles.photoCell}>
                <Text style={styles.photoEmoji}>{['🥦','🍅','🧅','🥕','🌽','🍆','🌿','🥒','🫑'][i]}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  hero: { height: 200, backgroundColor: Colors.primaryPale, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  heroEmoji: { fontSize: 80 },
  iconBtn: { position: 'absolute', top: Spacing.lg, width: 40, height: 40, borderRadius: Radius.sm, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  statusChip: { position: 'absolute', top: Spacing.lg, right: Spacing.lg, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  open: { backgroundColor: Colors.successLight },
  closed: { backgroundColor: Colors.dangerLight },
  statusText: { fontFamily: FontFamily.bold, fontSize: FontSize.xs },
  openText: { color: Colors.success },
  closedText: { color: Colors.danger },
  nameSection: { padding: Spacing.xxl, paddingBottom: 0 },
  marketName: { fontFamily: FontFamily.bold, fontSize: FontSize.xxl, color: Colors.textPrimary, letterSpacing: -0.3 },
  marketArea: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary },
  statsStrip: { flexDirection: 'row', justifyContent: 'space-around', padding: Spacing.lg, backgroundColor: Colors.surface, margin: Spacing.xxl, borderRadius: Radius.lg, ...Shadow.sm },
  statItem: { alignItems: 'center', gap: 4 },
  statVal: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  tabRow: { flexDirection: 'row', marginHorizontal: Spacing.xxl, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 4, ...Shadow.sm, marginBottom: Spacing.lg },
  tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: Radius.md },
  tabActive: { backgroundColor: Colors.primary },
  tabLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.textMuted },
  tabLabelActive: { color: Colors.textInverse, fontFamily: FontFamily.semiBold },
  priceCard: { marginHorizontal: Spacing.xxl, backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  priceHeader: { flexDirection: 'row', backgroundColor: Colors.primaryPale, padding: Spacing.md },
  priceCol: { flex: 1, fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.primary, textAlign: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  itemCell: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  itemEmoji: { fontSize: 18 },
  itemName: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textPrimary },
  today: { flex: 1, fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.textPrimary, textAlign: 'center' },
  prev: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  aboutCard: { marginHorizontal: Spacing.xxl, backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.md },
  aboutKey: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary },
  aboutVal: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, padding: Spacing.md },
  facilityChip: { backgroundColor: Colors.primaryLight, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  facilityText: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.primary },
  photosGrid: { marginHorizontal: Spacing.xxl, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  photoCell: { width: '31.5%', aspectRatio: 1, backgroundColor: Colors.primaryPale, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  photoEmoji: { fontSize: 40 },
});
