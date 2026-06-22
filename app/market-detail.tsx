import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import LeafletMap from '../components/ui/LeafletMap';
import { api, marketApi, ApiProduct, ApiMarket } from '../lib/api';
import { haversineKm, formatKm } from '../utils/distance';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius, Shadow } from '../constants/spacing';

function buildDetailMapHtml(m: ApiMarket): string {
  if (!m.lat || !m.lng) return '<html><body style="background:#f0f0f0"></body></html>';
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden}
#map{width:100%;height:100%}
.leaflet-control-attribution{display:none}
.mpin{width:26px;height:26px;background:#2E7D32;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 8px rgba(0,0,0,.4)}
.leaflet-tooltip{background:#2E7D32;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;padding:4px 10px;box-shadow:0 2px 8px rgba(0,0,0,.25)}
.leaflet-tooltip::before{border-top-color:#2E7D32}
</style>
</head>
<body>
<div id="map"></div>
<script>
var map=L.map('map',{zoomControl:false,dragging:false,scrollWheelZoom:false}).setView([${m.lat},${m.lng}],15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
var pin=L.divIcon({className:'',html:'<div class="mpin"></div>',iconSize:[26,26],iconAnchor:[13,26],popupAnchor:[0,-30]});
L.marker([${m.lat},${m.lng}],{icon:pin}).addTo(map)
  .bindTooltip('${m.name}',{permanent:true,direction:'top',offset:[0,-10]});
</script>
</body>
</html>`;
}

function isOpen(m: ApiMarket) {
  if (!m.open_hour || !m.close_hour) return false;
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  return h >= m.open_hour && h < m.close_hour;
}

const TABS = ["Today's Prices", 'About', 'Photos'];
const PRODUCE_EMOJIS = ['🥦','🍅','🧅','🥕','🌽','🍆','🌿','🥒','🫑','🍌','🧄','🫛'];

export default function MarketDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [market,        setMarket]        = useState<ApiMarket | null>(null);
  const [activeTab,     setActiveTab]     = useState(0);
  const [products,      setProducts]      = useState<ApiProduct[]>([]);
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [userLocation,  setUserLocation]  = useState<{ lat: number; lng: number } | null>(null);

  // Get real GPS location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    })();
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoadingMarket(true);
    marketApi.getById(id)
      .then(setMarket)
      .catch(() => {})
      .finally(() => setLoadingMarket(false));
  }, [id]);

  useEffect(() => {
    if (activeTab !== 0) return;
    setLoadingPrices(true);
    api.get<ApiProduct[]>('/api/products?limit=20')
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoadingPrices(false));
  }, [activeTab]);

  if (loadingMarket || !market) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const open = isOpen(market);

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
            {
              icon: 'location-outline',
              val: userLocation && market.lat && market.lng
                ? formatKm(haversineKm(userLocation.lat, userLocation.lng, market.lat, market.lng))
                : market.distance_km ? `${market.distance_km} km` : '—',
            },
            { icon: 'time-outline',   val: market.opens ?? '—' },
            { icon: 'people-outline', val: `${market.vendors_count} vendors` },
          ].map(s => (
            <View key={s.icon} style={styles.statItem}>
              <Ionicons name={s.icon as any} size={16} color={Colors.primary} />
              <Text style={styles.statVal}>{s.val}</Text>
            </View>
          ))}
        </View>

        {/* Location map */}
        <View style={styles.mapCard}>
          <LeafletMap html={buildDetailMapHtml(market)} style={styles.mapView} />
          <View style={styles.mapFooter}>
            <View style={styles.mapInfo}>
              <Ionicons name="location-sharp" size={15} color={Colors.primary} />
              <View>
                <Text style={styles.mapTitle}>{market.name}</Text>
                <Text style={styles.mapAddr}>{market.address}</Text>
              </View>
            </View>
            <Pressable
              style={styles.directionsBtn}
              onPress={() => Linking.openURL(`https://maps.google.com/?q=${market.lat},${market.lng}`)}
            >
              <Ionicons name="navigate-outline" size={14} color={Colors.textInverse} />
              <Text style={styles.directionsTxt}>Directions</Text>
            </Pressable>
          </View>
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
            <View style={styles.aboutRow}><Text style={styles.aboutKey}>Vendors</Text><Text style={styles.aboutVal}>{market.vendors_count}</Text></View>
            <View style={styles.sep} />
            <View style={styles.aboutRow}>
              <Text style={styles.aboutKey}>Distance</Text>
              <Text style={styles.aboutVal}>
                {userLocation && market.lat && market.lng
                  ? `${formatKm(haversineKm(userLocation.lat, userLocation.lng, market.lat, market.lng))} from you`
                  : market.distance_km ? `${market.distance_km} km from city centre` : '—'}
              </Text>
            </View>
            <View style={styles.sep} />
            <Text style={[styles.aboutKey, { padding: Spacing.md }]}>Facilities</Text>
            <View style={styles.chipsRow}>
              {(market.facilities ?? []).map(f => (
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
  tabActive: { backgroundColor: Colors.primaryDark },
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

  mapCard: { marginHorizontal: Spacing.xxl, marginBottom: Spacing.lg, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm, height: 230, backgroundColor: Colors.surface },
  mapView: { flex: 1 },
  mapFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border, backgroundColor: Colors.surface },
  mapInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs, flex: 1 },
  mapTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  mapAddr: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  directionsBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.primaryDark, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  directionsTxt: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.textInverse },
});
