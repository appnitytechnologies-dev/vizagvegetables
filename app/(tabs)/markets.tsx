import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  ScrollView, TextInput, FlatList, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import LeafletMap from '../../components/ui/LeafletMap';
import { marketApi, ApiMarket } from '../../lib/api';
import { haversineKm, formatKm } from '../../utils/distance';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius, Shadow } from '../../constants/spacing';

type UserLocation = { lat: number; lng: number } | null;

// ── Fallback data (shown instantly, replaced by API response) ──
const FALLBACK_RYTHU: ApiMarket[] = [
  { id: 1, category_id: 1, category_name: 'Rythu Bazar', category_slug: 'rythu-bazar', name: 'MVP Rythu Bazar',       area: 'MVP Colony',    address: 'MVP Colony, Sector 4, Visakhapatnam, AP 530017', lat: 17.7333, lng: 83.3167, distance_km: 1.2, rating: 4.3, reviews_count: 128, vendors_count: 45, opens: '6:00 AM', closes: '1:00 PM', open_hour: 6,   close_hour: 13,   days: 'Mon–Sat', holiday: 'Tuesday', day_of_week: null, bg_color: '#D4EDDA', facilities: ['Parking','Restrooms','ATM Nearby','Bus Stop'], is_active: true },
  { id: 2, category_id: 1, category_name: 'Rythu Bazar', category_slug: 'rythu-bazar', name: 'Jagadamba Rythu Bazar', area: 'Jagadamba',     address: 'Jagadamba Centre, Visakhapatnam, AP 530002',      lat: 17.7229, lng: 83.3012, distance_km: 2.8, rating: 4.3, reviews_count: 96,  vendors_count: 62, opens: '5:30 AM', closes: '1:00 PM', open_hour: 5.5, close_hour: 13,   days: 'Daily',   holiday: 'None',    day_of_week: null, bg_color: '#FFF3CD', facilities: ['Parking','Restrooms','ATM Nearby','Bus Stop'], is_active: true },
  { id: 3, category_id: 1, category_name: 'Rythu Bazar', category_slug: 'rythu-bazar', name: 'Gajuwaka Rythu Bazar',  area: 'Gajuwaka',      address: 'Gajuwaka, Visakhapatnam, AP 530026',              lat: 17.6807, lng: 83.2122, distance_km: 4.5, rating: 4.3, reviews_count: 74,  vendors_count: 38, opens: '6:00 AM', closes: '1:00 PM', open_hour: 6,   close_hour: 13,   days: 'Mon–Sat', holiday: 'Sunday',  day_of_week: null, bg_color: '#D1ECF1', facilities: ['Parking','Restrooms','Bus Stop'],               is_active: true },
  { id: 4, category_id: 1, category_name: 'Rythu Bazar', category_slug: 'rythu-bazar', name: 'Dwaraka Nagar Bazar',   area: 'Dwaraka Nagar', address: 'Dwaraka Nagar, Visakhapatnam, AP 530016',         lat: 17.7269, lng: 83.3013, distance_km: 3.1, rating: 4.1, reviews_count: 55,  vendors_count: 28, opens: '6:30 AM', closes: '12:30 PM', open_hour: 6.5, close_hour: 12.5, days: 'Daily',   holiday: 'Monday',  day_of_week: null, bg_color: '#F8D7DA', facilities: ['Parking','ATM Nearby'],                         is_active: true },
];

const FALLBACK_LOCAL: ApiMarket[] = [
  { id: 5,  category_id: 2, category_name: 'Local Market', category_slug: 'local-market', name: 'Scindia Market',     area: 'Beach Road',  address: 'Scindia, Beach Road, Visakhapatnam', lat: 17.7218, lng: 83.3360, distance_km: 1.2,  rating: 4.3, reviews_count: 0, vendors_count: 30, opens: '7:00 AM', closes: '4:00 PM',  open_hour: 7, close_hour: 16, days: null, holiday: null, day_of_week: 'Sun', bg_color: '#D4EDDA', facilities: [], is_active: true },
  { id: 6,  category_id: 2, category_name: 'Local Market', category_slug: 'local-market', name: 'Duvvada Market',     area: 'Duvvada',     address: 'Duvvada, Visakhapatnam',             lat: 17.7569, lng: 83.2272, distance_km: 7.0,  rating: 4.5, reviews_count: 0, vendors_count: 40, opens: '7:00 AM', closes: '4:00 PM',  open_hour: 7, close_hour: 16, days: null, holiday: null, day_of_week: 'Sun', bg_color: '#FFF3CD', facilities: [], is_active: true },
  { id: 7,  category_id: 2, category_name: 'Local Market', category_slug: 'local-market', name: 'Sri Haripuram',      area: 'Haripuram',   address: 'Sri Haripuram, Visakhapatnam',       lat: 17.7820, lng: 83.3680, distance_km: 5.2,  rating: 4.1, reviews_count: 0, vendors_count: 22, opens: '6:00 AM', closes: '1:00 PM',  open_hour: 6, close_hour: 13, days: null, holiday: null, day_of_week: 'Sun', bg_color: '#D1ECF1', facilities: [], is_active: true },
  { id: 8,  category_id: 2, category_name: 'Local Market', category_slug: 'local-market', name: 'RK Beach Shandha',   area: 'Beach Road',  address: 'RK Beach, Visakhapatnam',            lat: 17.7264, lng: 83.3259, distance_km: 2.1,  rating: 4.4, reviews_count: 0, vendors_count: 25, opens: '6:00 AM', closes: '12:00 PM', open_hour: 6, close_hour: 12, days: null, holiday: null, day_of_week: 'Mon', bg_color: '#F8D7DA', facilities: [], is_active: true },
  { id: 9,  category_id: 2, category_name: 'Local Market', category_slug: 'local-market', name: 'Pendurthi Shandha',  area: 'Pendurthi',   address: 'Pendurthi, Visakhapatnam',           lat: 17.8290, lng: 83.2280, distance_km: 9.0,  rating: 4.0, reviews_count: 0, vendors_count: 35, opens: '6:00 AM', closes: '1:00 PM',  open_hour: 6, close_hour: 13, days: null, holiday: null, day_of_week: 'Tue', bg_color: '#D4EDDA', facilities: [], is_active: true },
  { id: 10, category_id: 2, category_name: 'Local Market', category_slug: 'local-market', name: 'Bheemli Shandha',    area: 'Bheemli',     address: 'Bheemli Beach, Visakhapatnam',       lat: 17.8937, lng: 83.4556, distance_km: 22.0, rating: 4.2, reviews_count: 0, vendors_count: 20, opens: '6:00 AM', closes: '1:00 PM',  open_hour: 6, close_hour: 13, days: null, holiday: null, day_of_week: 'Wed', bg_color: '#FFF3CD', facilities: [], is_active: true },
  { id: 11, category_id: 2, category_name: 'Local Market', category_slug: 'local-market', name: 'Simhachalam Shandha',area: 'Simhachalam', address: 'Simhachalam, Visakhapatnam',         lat: 17.7750, lng: 83.2880, distance_km: 12.0, rating: 4.3, reviews_count: 0, vendors_count: 28, opens: '6:00 AM', closes: '1:00 PM',  open_hour: 6, close_hour: 13, days: null, holiday: null, day_of_week: 'Thu', bg_color: '#D1ECF1', facilities: [], is_active: true },
  { id: 12, category_id: 2, category_name: 'Local Market', category_slug: 'local-market', name: 'Gajuwaka Shandha',   area: 'Gajuwaka',    address: 'Gajuwaka, Visakhapatnam',            lat: 17.6807, lng: 83.2122, distance_km: 4.5,  rating: 4.1, reviews_count: 0, vendors_count: 32, opens: '6:00 AM', closes: '1:00 PM',  open_hour: 6, close_hour: 13, days: null, holiday: null, day_of_week: 'Fri', bg_color: '#F8D7DA', facilities: [], is_active: true },
  { id: 13, category_id: 2, category_name: 'Local Market', category_slug: 'local-market', name: 'MVP Colony Shandha', area: 'MVP Colony',  address: 'MVP Colony, Visakhapatnam',          lat: 17.7333, lng: 83.3167, distance_km: 1.5,  rating: 4.5, reviews_count: 0, vendors_count: 45, opens: '6:00 AM', closes: '1:00 PM',  open_hour: 6, close_hour: 13, days: null, holiday: null, day_of_week: 'Sat', bg_color: '#D4EDDA', facilities: [], is_active: true },
];

const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function isOpenNow(openHour: number | null, closeHour: number | null) {
  if (openHour == null || closeHour == null) return false;
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  return h >= openHour && h < closeHour;
}

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
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
var pin=L.divIcon({className:'',html:'<div class="mpin"></div>',iconSize:[22,22],iconAnchor:[11,22],popupAnchor:[0,-26]});
    ${markerJs}
</script>
</body>
</html>`;
}

function OpenBadge({ open }: { open: boolean }) {
  return (
    <View style={[badge.wrap, open ? badge.open : badge.closed]}>
      <Text style={[badge.text, open ? badge.openText : badge.closedText]}>
        {open ? 'OPEN' : 'CLOSED'}
      </Text>
    </View>
  );
}
const badge = StyleSheet.create({
  wrap:       { borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  open:       { backgroundColor: Colors.successLight },
  closed:     { backgroundColor: Colors.dangerLight },
  text:       { fontFamily: FontFamily.bold, fontSize: FontSize.xs },
  openText:   { color: Colors.success },
  closedText: { color: Colors.danger },
});

function FeaturedCard({ m, userLocation }: { m: ApiMarket; userLocation: UserLocation }) {
  const open = isOpenNow(m.open_hour, m.close_hour);
  const dist = userLocation && m.lat && m.lng
    ? formatKm(haversineKm(userLocation.lat, userLocation.lng, m.lat, m.lng))
    : m.distance_km ? `${m.distance_km} km` : null;
  return (
    <Pressable
      style={featCard.card}
      onPress={() => router.push({ pathname: '/market-detail', params: { id: m.id } } as any)}
    >
      <View style={[featCard.img, { backgroundColor: m.bg_color }]}>
        <Text style={featCard.emoji}>🏪</Text>
        <View style={featCard.badge}><OpenBadge open={open} /></View>
      </View>
      <View style={featCard.info}>
        <Text style={featCard.name} numberOfLines={1}>{m.name}</Text>
        <View style={featCard.ratingRow}>
          <Ionicons name="star" size={13} color="#F59E0B" />
          <Text style={featCard.rating}>{m.rating}</Text>
        </View>
        <View style={featCard.metaRow}>
          <Ionicons name="location-outline" size={11} color={Colors.textMuted} />
          <Text style={featCard.meta}>{dist ?? '—'}</Text>
          <Text style={featCard.dot}>·</Text>
          <Text style={featCard.meta}>{m.opens} – {m.closes}</Text>
        </View>
      </View>
    </Pressable>
  );
}
const featCard = StyleSheet.create({
  card:      { width: 190, backgroundColor: Colors.surface, borderRadius: Radius.xl, overflow: 'hidden', ...Shadow.sm },
  img:       { height: 130, alignItems: 'center', justifyContent: 'center' },
  emoji:     { fontSize: 52 },
  badge:     { position: 'absolute', top: Spacing.sm, left: Spacing.sm },
  info:      { padding: Spacing.md, gap: 4 },
  name:      { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating:    { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  meta:      { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },
  dot:       { color: Colors.textMuted, fontSize: FontSize.xs },
});

function ListCard({ m, userLocation }: { m: ApiMarket; userLocation: UserLocation }) {
  const open = isOpenNow(m.open_hour, m.close_hour);
  const dist = userLocation && m.lat && m.lng
    ? formatKm(haversineKm(userLocation.lat, userLocation.lng, m.lat, m.lng))
    : m.distance_km ? `${m.distance_km} km` : null;
  return (
    <Pressable
      style={listCard.card}
      onPress={() => router.push({ pathname: '/market-detail', params: { id: m.id } } as any)}
    >
      <View style={[listCard.img, { backgroundColor: m.bg_color }]}>
        <Text style={listCard.emoji}>🏪</Text>
      </View>
      <View style={listCard.info}>
        <Text style={listCard.name}>{m.name}</Text>
        <View style={listCard.ratingRow}>
          <Ionicons name="star" size={12} color="#F59E0B" />
          <Text style={listCard.rating}>{m.rating}</Text>
        </View>
        <View style={listCard.metaRow}>
          <Ionicons name="location-outline" size={11} color={Colors.textMuted} />
          <Text style={listCard.meta}>{dist ?? '—'}</Text>
          <Text style={listCard.dot}>·</Text>
          <Text style={listCard.meta}>{m.opens} – {m.closes}</Text>
        </View>
      </View>
      <OpenBadge open={open} />
    </Pressable>
  );
}
const listCard = StyleSheet.create({
  card:      { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md, gap: Spacing.md, ...Shadow.sm },
  img:       { width: 72, height: 72, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  emoji:     { fontSize: 32 },
  info:      { flex: 1, gap: 3 },
  name:      { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating:    { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  meta:      { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },
  dot:       { color: Colors.textMuted },
});

export default function MarketsScreen() {
  const [tab,    setTab]    = useState<'rythu' | 'local'>('rythu');
  const [query,  setQuery]  = useState('');
  const todayIdx = new Date().getDay();
  const [selDay, setSelDay] = useState(DAY_KEYS[todayIdx]);

  const [rythuMarkets, setRythuMarkets] = useState<ApiMarket[]>(FALLBACK_RYTHU);
  const [localMarkets, setLocalMarkets] = useState<ApiMarket[]>(FALLBACK_LOCAL);
  const [mapHtml,      setMapHtml]      = useState(() => buildMapHtml(FALLBACK_RYTHU));
  const [userLocation, setUserLocation] = useState<UserLocation>(null);

  // Request GPS and get current position
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    })();
  }, []);

  const fetchMarkets = useCallback(async () => {
    try {
      const all = await marketApi.getAll();
      const rythu = all.filter(m => m.category_slug === 'rythu-bazar');
      const local = all.filter(m => m.category_slug === 'local-market');
      if (rythu.length) { setRythuMarkets(rythu); setMapHtml(buildMapHtml(rythu)); }
      if (local.length)   setLocalMarkets(local);
    } catch {
      // keep fallback data on network error
    }
  }, []);

  useEffect(() => { fetchMarkets(); }, [fetchMarkets]);

  const sortByDistance = (markets: ApiMarket[]) => {
    if (!userLocation) return markets;
    return [...markets].sort((a, b) => {
      const da = a.lat && a.lng ? haversineKm(userLocation.lat, userLocation.lng, a.lat, a.lng) : 999;
      const db = b.lat && b.lng ? haversineKm(userLocation.lat, userLocation.lng, b.lat, b.lng) : 999;
      return da - db;
    });
  };

  const filteredRythu = sortByDistance(
    rythuMarkets.filter(m => query === '' || m.name.toLowerCase().includes(query.toLowerCase()))
  );
  const filteredLocal = sortByDistance(
    localMarkets.filter(m =>
      m.day_of_week === selDay &&
      (query === '' || m.name.toLowerCase().includes(query.toLowerCase()))
    )
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Markets</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={13} color={Colors.primaryDark} />
            <Text style={styles.locationText}>visakhapatnam</Text>
          </View>
        </View>
        <Pressable style={styles.bellBtn} onPress={() => router.push('/notifications' as any)}>
          <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
          <View style={styles.bellDot} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search markets"
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Real map with Rythu Bazar pins */}
        <View style={styles.mapBox}>
          <LeafletMap html={mapHtml} style={styles.mapWebView} />
          <Pressable
            style={styles.fullMapBtn}
            onPress={() => Linking.openURL('https://maps.google.com/?q=Rythu+Bazar+Visakhapatnam')}
          >
            <Ionicons name="map-outline" size={14} color={Colors.textPrimary} />
            <Text style={styles.fullMapText}>View Full Map</Text>
          </Pressable>
        </View>

        {/* Tab toggle */}
        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggleBtn, tab === 'rythu' && styles.toggleBtnActive]}
            onPress={() => setTab('rythu')}
          >
            <Ionicons name="storefront-outline" size={16} color={tab === 'rythu' ? Colors.textInverse : Colors.textPrimary} />
            <Text style={[styles.toggleText, tab === 'rythu' && styles.toggleTextActive]}>Rythu Bazars</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, tab === 'local' && styles.toggleBtnActive]}
            onPress={() => setTab('local')}
          >
            <Ionicons name="basket-outline" size={16} color={tab === 'local' ? Colors.textInverse : Colors.textPrimary} />
            <Text style={[styles.toggleText, tab === 'local' && styles.toggleTextActive]}>Local Markets</Text>
          </Pressable>
        </View>

        {tab === 'rythu' && (
          <>
            <Text style={styles.sectionTitle}>Near by Rythu Bazars :</Text>
            <FlatList
              data={filteredRythu}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={m => String(m.id)}
              contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.sm }}
              renderItem={({ item }) => <FeaturedCard m={item} userLocation={userLocation} />}
            />
            <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>All Rythu Bazar Near you</Text>
            <View style={styles.listContainer}>
              {filteredRythu.map(m => <ListCard key={m.id} m={m} userLocation={userLocation} />)}
            </View>
          </>
        )}

        {tab === 'local' && (
          <>
            <Text style={styles.sectionTitle}>Select Day</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysRow}>
              {DAY_KEYS.map((d, i) => {
                const isToday = i === todayIdx;
                const active  = d === selDay;
                return (
                  <Pressable
                    key={d}
                    style={[styles.dayChip, active && styles.dayChipActive]}
                    onPress={() => setSelDay(d)}
                  >
                    {isToday && <Text style={[styles.dayChipSub, active && styles.dayChipSubActive]}>Today</Text>}
                    <Text style={[styles.dayChipLabel, active && styles.dayChipLabelActive]}>{d}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.sectionTitle}>
              Markets On {selDay === DAY_KEYS[todayIdx]
                ? new Date().toLocaleDateString('en-IN', { weekday: 'long' })
                : selDay} ({filteredLocal.length})
            </Text>
            <View style={styles.listContainer}>
              {filteredLocal.length > 0
                ? filteredLocal.map(m => <ListCard key={m.id} m={m} userLocation={userLocation} />)
                : <Text style={styles.empty}>No markets on {selDay}</Text>
              }
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header:       { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface },
  title:        { fontFamily: FontFamily.bold, fontSize: FontSize.xxxl, color: Colors.textPrimary, letterSpacing: -0.5 },
  locationRow:  { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  locationText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primaryDark },
  bellBtn:      { width: 44, height: 44, borderRadius: Radius.full, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', ...Shadow.sm, position: 'relative' },
  bellDot:      { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.danger },

  searchWrap:  { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, backgroundColor: Colors.surface },
  searchBar:   { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, gap: Spacing.sm },
  searchInput: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textPrimary, padding: 0, outlineStyle: 'none' } as any,

  mapBox:       { margin: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.xl, overflow: 'hidden', ...Shadow.sm, height: 210 },
  mapWebView:   { flex: 1 },
  fullMapBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: Spacing.xs, padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface },
  fullMapText:  { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textPrimary },

  toggleRow:        { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  toggleBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: Spacing.md, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  toggleBtnActive:  { backgroundColor: Colors.primaryDark, borderColor: Colors.primaryDark },
  toggleText:       { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  toggleTextActive: { color: Colors.textInverse },

  sectionTitle:  { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary, marginHorizontal: Spacing.lg, marginBottom: Spacing.md, letterSpacing: -0.3 },
  listContainer: { paddingHorizontal: Spacing.lg, gap: Spacing.md },

  daysRow:           { paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.lg },
  dayChip:           { width: 60, height: 60, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  dayChipActive:     { backgroundColor: Colors.primaryDark, borderColor: Colors.primaryDark },
  dayChipSub:        { fontFamily: FontFamily.regular, fontSize: 9, color: Colors.textMuted },
  dayChipSubActive:  { color: 'rgba(255,255,255,0.8)' },
  dayChipLabel:      { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.textPrimary },
  dayChipLabelActive:{ color: Colors.textInverse },

  empty: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', padding: Spacing.xl },
});
