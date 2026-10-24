import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, FlatList, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import LeafletMap from '../../components/ui/LeafletMap';
import { marketApi, ApiMarket, imgUrl } from '../../lib/api';
import { Image } from 'expo-image';
import { haversineKm, formatKm } from '../../utils/distance';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { FALLBACK_RYTHU, isOpenNow, sortByDistance } from '../../lib/marketsData';
import { useUserGps } from '../../hooks/useUserGps';

function buildMapHtml(markets: ApiMarket[]): string {
  const pinned = markets.filter(m => m.lat != null && m.lng != null);
  const markerJs = pinned.map(m =>
    `L.marker([${m.lat},${m.lng}],{icon:pin}).addTo(map).bindPopup('<b>${m.name}</b><br><small>${m.opens ?? ''}–${m.closes ?? ''}</small>');`
  ).join('\n    ');

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
.mpin{width:22px;height:22px;background:#2E7D32;border:2.5px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.35)}
</style>
</head>
<body>
<div id="map"></div>
<script>
var map=L.map('map',{zoomControl:false,dragging:true}).setView([17.7100,83.2900],12);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{maxZoom:19}).addTo(map);
var pin=L.divIcon({className:'',html:'<div class="mpin"></div>',iconSize:[22,22],iconAnchor:[11,22],popupAnchor:[0,-26]});
    ${markerJs}
</script>
</body>
</html>`;
}

/** Category shortcuts under the map. Only the three that have a matching
 *  filter on the Price screen navigate anywhere — Plants/Fish/Meat are
 *  visual placeholders until the catalogue covers them. */
const CATEGORY_SHORTCUTS: { key: string; label: string; icon: string; tint: string; priceCat?: string }[] = [
  { key: 'vegetables', label: 'Vegetables', icon: '🥬', tint: '#E6F6F3', priceCat: 'vegetables' },
  { key: 'fruits',     label: 'Fruits',     icon: '🍎', tint: '#FDEBEC', priceCat: 'fruits' },
  { key: 'flowers',    label: 'Flowers',    icon: '🌸', tint: '#F1ECFB', priceCat: 'flowers' },
  { key: 'plants',     label: 'Plants',     icon: '🪴', tint: '#E9F7EA' },
  { key: 'fish',       label: 'Fish',       icon: '🐟', tint: '#EAF3FC' },
  { key: 'meat',       label: 'Meat',       icon: '🍗', tint: '#FDEBEC' },
];

function FeaturedCard({ m, userLocation }: { m: ApiMarket; userLocation: ReturnType<typeof useUserGps> }) {
  const open     = isOpenNow(m.open_hour, m.close_hour);
  const firstImg = m.images?.[0] ? imgUrl(m.images[0]) : null;
  const dist = userLocation && m.lat && m.lng
    ? formatKm(haversineKm(userLocation.lat, userLocation.lng, m.lat, m.lng))
    : m.distance_km ? `${m.distance_km} km` : null;
  return (
    <Pressable
      style={featCard.card}
      onPress={() => router.push({ pathname: '/market-detail', params: { id: m.id } } as any)}
    >
      <View style={[featCard.img, { backgroundColor: m.bg_color }]}>
        {firstImg
          ? <Image source={{ uri: firstImg }} style={StyleSheet.absoluteFill} contentFit="cover" />
          : <Text style={featCard.emoji}>🏪</Text>
        }
        <View style={featCard.distChip}>
          <Ionicons name="location-sharp" size={10} color={Colors.primaryAccent} />
          <Text style={featCard.distText}>{dist ?? '—'}</Text>
        </View>
      </View>
      <View style={featCard.info}>
        <Text style={featCard.name} numberOfLines={1}>{m.name}</Text>
        <View style={featCard.metaRow}>
          <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
          <Text style={featCard.meta}>{m.opens} – {m.closes}</Text>
        </View>
        <View style={[featCard.statusPill, open ? featCard.openPill : featCard.closedPill]}>
          <Text style={[featCard.statusText, open ? featCard.openText : featCard.closedText]}>
            {open ? 'Open' : 'Closed'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
const featCard = StyleSheet.create({
  card:      { width: 190, backgroundColor: Colors.surface, borderRadius: Radius.xl, overflow: 'hidden', ...Shadow.sm },
  img:       { height: 120, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  emoji:     { fontSize: 52 },
  distChip:  { position: 'absolute', top: Spacing.sm, left: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3, ...Shadow.sm },
  distText:  { fontFamily: FontFamily.semiBold, fontSize: 10, color: Colors.textPrimary },
  info:      { padding: Spacing.md, gap: 4 },
  name:      { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary },
  metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  meta:      { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },
  statusPill:  { alignSelf: 'flex-start', borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 2, marginTop: 2 },
  openPill:    { backgroundColor: Colors.successLight },
  closedPill:  { backgroundColor: Colors.dangerLight },
  statusText:  { fontFamily: FontFamily.bold, fontSize: 10 },
  openText:    { color: Colors.success },
  closedText:  { color: Colors.danger },
});

export default function MarketsScreen() {
  const [query, setQuery] = useState('');
  const [rythuMarkets, setRythuMarkets] = useState<ApiMarket[]>(FALLBACK_RYTHU);
  const [mapHtml,      setMapHtml]      = useState(() => buildMapHtml(FALLBACK_RYTHU));
  const userLocation = useUserGps();

  const fetchMarkets = useCallback(async () => {
    try {
      const all = await marketApi.getAll();
      const rythu = all.filter(m => m.category_slug === 'rythu-bazar');
      if (rythu.length) { setRythuMarkets(rythu); setMapHtml(buildMapHtml(rythu)); }
    } catch {
      // keep fallback data on network error
    }
  }, []);

  useEffect(() => { fetchMarkets(); }, [fetchMarkets]);

  const filteredRythu = sortByDistance(
    rythuMarkets.filter(m => query === '' || m.name.toLowerCase().includes(query.toLowerCase())),
    userLocation
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Markets</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={13} color={Colors.primaryAccent} />
              <Text style={styles.locationText}>Visakhapatnam</Text>
              <Ionicons name="chevron-down" size={11} color={Colors.textMuted} />
            </View>
          </View>
          <Pressable style={styles.bellBtn} onPress={() => router.push('/notifications' as any)}>
            <Ionicons name="notifications-outline" size={20} color={Colors.textPrimary} />
          </Pressable>
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
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Map */}
        <View style={styles.mapBox}>
          <LeafletMap html={mapHtml} style={styles.mapWebView} />
          <Pressable
            style={styles.locateBtn}
            onPress={() => Linking.openURL('https://maps.google.com/?q=Rythu+Bazar+Visakhapatnam')}
          >
            <Ionicons name="locate-outline" size={16} color={Colors.primary} />
          </Pressable>
          <Pressable
            style={styles.fullMapBtn}
            onPress={() => Linking.openURL('https://maps.google.com/?q=Rythu+Bazar+Visakhapatnam')}
          >
            <Ionicons name="map-outline" size={14} color={Colors.textPrimary} />
            <Text style={styles.fullMapText}>View Full Map</Text>
          </Pressable>
        </View>

        {/* Rythu Bazars / Local Markets — navigate to the dedicated list screens */}
        <View style={styles.navRow}>
          <Pressable style={[styles.navBtn, styles.navBtnActive]} onPress={() => router.push('/rythu-bazars' as any)}>
            <Ionicons name="storefront-outline" size={16} color={Colors.textInverse} />
            <Text style={[styles.navText, styles.navTextActive]}>Rythu Bazars</Text>
          </Pressable>
          <Pressable style={styles.navBtn} onPress={() => router.push('/local-markets' as any)}>
            <Ionicons name="basket-outline" size={16} color={Colors.textPrimary} />
            <Text style={styles.navText}>Local Markets</Text>
          </Pressable>
        </View>

        {/* Category shortcuts */}
        <View style={styles.catGrid}>
          {CATEGORY_SHORTCUTS.map(c => (
            <Pressable
              key={c.key}
              style={styles.catItem}
              onPress={() => c.priceCat && router.push({ pathname: '/(tabs)/price', params: { cat: c.priceCat } } as any)}
            >
              <View style={[styles.catIcon, { backgroundColor: c.tint }]}>
                <Text style={styles.catEmoji}>{c.icon}</Text>
              </View>
              <Text style={styles.catLabel}>{c.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Nearby Rythu Bazars */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Nearby Rythu Bazars</Text>
          <Pressable onPress={() => router.push('/rythu-bazars' as any)} hitSlop={8}>
            <Text style={styles.viewAll}>View All ›</Text>
          </Pressable>
        </View>
        <FlatList
          data={filteredRythu}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={m => String(m.id)}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.sm }}
          renderItem={({ item }) => <FeaturedCard m={item} userLocation={userLocation} />}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },

  header:       { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, backgroundColor: Colors.surface, gap: Spacing.md },
  headerTop:    { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title:        { fontFamily: FontFamily.bold, fontSize: FontSize.xxl, color: Colors.textPrimary, letterSpacing: -0.5 },
  locationRow:  { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  locationText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary },
  bellBtn:      { width: 38, height: 38, borderRadius: Radius.full, backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },

  searchBar:   { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceAlt, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.lg, height: 46, gap: Spacing.sm },
  searchInput: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textPrimary, padding: 0 },

  mapBox:       { margin: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.xl, overflow: 'hidden', ...Shadow.sm, height: 210 },
  mapWebView:   { flex: 1 },
  locateBtn:    { position: 'absolute', top: Spacing.sm, right: Spacing.sm, width: 34, height: 34, borderRadius: Radius.full, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  fullMapBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: Spacing.xs, padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface },
  fullMapText:  { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textPrimary },

  navRow:        { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  navBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: Spacing.md, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  navBtnActive:  { backgroundColor: Colors.primaryDark, borderColor: Colors.primaryDark },
  navText:       { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  navTextActive: { color: Colors.textInverse },

  catGrid:  { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  catItem:  { width: '16.66%', alignItems: 'center', gap: 6 },
  catIcon:  { width: 48, height: 48, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  catEmoji: { fontSize: 22 },
  catLabel: { fontFamily: FontFamily.medium, fontSize: 10, color: Colors.textSecondary, textAlign: 'center' },

  sectionHead:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary, letterSpacing: -0.3 },
  viewAll:      { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primaryAccent },
});
