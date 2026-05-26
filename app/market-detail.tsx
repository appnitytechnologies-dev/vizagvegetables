import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { api, ApiProduct } from '../lib/api';

/* ── Inline static market data ──────────────────────────────── */
interface Market {
  id: string; name: string; area: string; km: number; vendors: number;
  opens: string; closes: string; openHour: number; closeHour: number; days: string;
}

const MARKETS: Record<string, Market> = {
  '1': { id: '1', name: 'MVP Colony Rythu Bazar',  area: 'MVP Colony',    km: 1.2, vendors: 45, opens: '6:00 AM',  closes: '1:00 PM',  openHour: 6,   closeHour: 13,   days: 'Mon–Sat' },
  '2': { id: '2', name: 'Jagadamba Rythu Bazar',   area: 'Jagadamba',     km: 2.8, vendors: 62, opens: '5:30 AM',  closes: '12:00 PM', openHour: 5.5, closeHour: 12,   days: 'Daily'   },
  '3': { id: '3', name: 'Gajuwaka Rythu Bazar',    area: 'Gajuwaka',      km: 4.5, vendors: 38, opens: '6:00 AM',  closes: '1:00 PM',  openHour: 6,   closeHour: 13,   days: 'Mon–Sat' },
  '4': { id: '4', name: 'Dwaraka Nagar Bazar',     area: 'Dwaraka Nagar', km: 3.1, vendors: 28, opens: '6:30 AM',  closes: '12:30 PM', openHour: 6.5, closeHour: 12.5, days: 'Daily'   },
};

const TABS = ["Today's Prices", 'About', 'Photos'];
const PRODUCE_EMOJIS = ['🥦','🍅','🧅','🥕','🌽','🍆','🌿','🥒','🫑','🍌','🧄','🫛'];

function isOpen(m: Market) {
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  return h >= m.openHour && h < m.closeHour;
}

export default function MarketDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const market  = MARKETS[id ?? '1'] ?? MARKETS['1'];
  const open    = isOpen(market);

  const [activeTab, setActiveTab]   = useState(0);
  const [products,  setProducts]    = useState<ApiProduct[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);

  useEffect(() => {
    if (activeTab !== 0) return;
    setLoadingPrices(true);
    api.get<ApiProduct[]>('/api/products?limit=20')
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoadingPrices(false));
  }, [activeTab]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar style="light" />

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🏪</Text>
        <Pressable style={[styles.iconBtn, { left: Spacing.lg }]} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </Pressable>
        <View style={[styles.statusChip, open ? styles.openChip : styles.closedChip]}>
          <Text style={[styles.statusText, open ? styles.openText : styles.closedText]}>
            {open ? 'OPEN' : 'CLOSED'}
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
            { icon: 'time-outline',     val: market.opens },
            { icon: 'people-outline',   val: `${market.vendors} vendors` },
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
          loadingPrices ? (
            <View style={{ paddingVertical: Spacing.xxxl, alignItems: 'center' }}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : (
            <View style={styles.priceCard}>
              <View style={styles.priceHeader}>
                <Text style={[styles.priceCol, { flex: 2 }]}>Item</Text>
                <Text style={styles.priceCol}>Price</Text>
                <Text style={styles.priceCol}>Unit</Text>
                <Text style={styles.priceCol}>Chg</Text>
              </View>
              {products.filter(p => p.is_active).map(p => {
                const drop = p.previous_price > p.price;
                const rise = p.previous_price < p.price;
                return (
                  <View key={p.id} style={styles.priceRow}>
                    <View style={[styles.itemCell, { flex: 2 }]}>
                      <Text style={styles.itemEmoji}>{p.emoji ?? '🥦'}</Text>
                      <Text style={styles.itemName} numberOfLines={1}>{p.name}</Text>
                    </View>
                    <Text style={styles.today}>₹{p.price}</Text>
                    <Text style={styles.unitText}>{p.unit}</Text>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <View style={[styles.chgBadge, drop ? styles.chgDown : rise ? styles.chgUp : styles.chgFlat]}>
                        <Text style={[styles.chgText, drop ? styles.chgDownText : rise ? styles.chgUpText : styles.chgFlatText]}>
                          {drop ? `↓${p.previous_price - p.price}` : rise ? `↑${p.price - p.previous_price}` : '–'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )
        )}

        {activeTab === 1 && (
          <View style={styles.aboutCard}>
            <View style={styles.aboutRow}><Text style={styles.aboutKey}>Hours</Text><Text style={styles.aboutVal}>{market.opens} – {market.closes}</Text></View>
            <View style={styles.sep} />
            <View style={styles.aboutRow}><Text style={styles.aboutKey}>Days</Text><Text style={styles.aboutVal}>{market.days}</Text></View>
            <View style={styles.sep} />
            <View style={styles.aboutRow}><Text style={styles.aboutKey}>Vendors</Text><Text style={styles.aboutVal}>{market.vendors}</Text></View>
            <View style={styles.sep} />
            <View style={styles.aboutRow}><Text style={styles.aboutKey}>Distance</Text><Text style={styles.aboutVal}>{market.km} km from city centre</Text></View>
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
            {PRODUCE_EMOJIS.map((emoji, i) => (
              <View key={i} style={styles.photoCell}>
                <Text style={styles.photoEmoji}>{emoji}</Text>
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
  openChip: { backgroundColor: Colors.successLight },
  closedChip: { backgroundColor: Colors.dangerLight },
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
  unitText: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  chgBadge: { borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  chgDown: { backgroundColor: Colors.successLight },
  chgUp: { backgroundColor: Colors.dangerLight },
  chgFlat: { backgroundColor: Colors.background },
  chgText: { fontFamily: FontFamily.bold, fontSize: FontSize.xs },
  chgDownText: { color: Colors.success },
  chgUpText: { color: Colors.danger },
  chgFlatText: { color: Colors.textMuted },

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
