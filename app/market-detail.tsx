import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LeafletMap from '../components/ui/LeafletMap';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing } from '../constants/spacing';
import { FontFamily, FontSize } from '../constants/typography';
import { ApiMarket, imgUrl, marketApi } from '../lib/api';
import { formatKm, haversineKm } from '../utils/distance';

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
var map=L.map('map',{zoomControl:true,dragging:true,scrollWheelZoom:false,doubleClickZoom:true}).setView([${m.lat},${m.lng}],15);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{maxZoom:19}).addTo(map);
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

const TABS = [
  { label: 'About',  icon: 'information-circle-outline' },
  { label: 'Photos', icon: 'images-outline' },
] as const;

export default function MarketDetail() {
  const { id }            = useLocalSearchParams<{ id: string }>();
  const { width: SW, height: SH } = useWindowDimensions();

  const [market,        setMarket]        = useState<ApiMarket | null>(null);
  const [activeTab,     setActiveTab]     = useState(0);
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [userLocation,  setUserLocation]  = useState<{ lat: number; lng: number } | null>(null);
  const [lightboxIdx,   setLightboxIdx]   = useState<number | null>(null);
  const flatListRef = useRef<FlatList<string>>(null);

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
        {market.images?.[0]
          ? <Image source={{ uri: imgUrl(market.images[0])! }} style={StyleSheet.absoluteFill} contentFit="cover" />
          : <Text style={styles.heroEmoji}>🏪</Text>
        }
        <Pressable style={[styles.iconBtn, { left: Spacing.lg }]} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </Pressable>
        <View style={[styles.statusChip, open ? styles.openChip : styles.closedChip]}>
          <Text style={[styles.statusText, open ? styles.openText : styles.closedText]}>
            {open ? 'OPEN' : 'CLOSED'}
          </Text>
        </View>
      </View>

      {/* Fullscreen image lightbox */}
      <Modal
        visible={lightboxIdx !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setLightboxIdx(null)}
        statusBarTranslucent
      >
        <View style={lb.overlay}>
          <FlatList
            ref={flatListRef}
            data={market.images ?? []}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={lightboxIdx ?? 0}
            getItemLayout={(_, index) => ({ length: SW, offset: SW * index, index })}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <View style={{ width: SW, height: SH, alignItems: 'center', justifyContent: 'center' }}>
                <Image
                  source={{ uri: imgUrl(item)! }}
                  style={{ width: SW, height: SH * 0.75 }}
                  contentFit="contain"
                />
              </View>
            )}
            onMomentumScrollEnd={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
              setLightboxIdx(idx);
            }}
          />

          {/* Left arrow */}
          {(lightboxIdx ?? 0) > 0 && (
            <Pressable
              style={[lb.arrow, lb.arrowLeft]}
              onPress={() => {
                const next = (lightboxIdx ?? 0) - 1;
                flatListRef.current?.scrollToIndex({ index: next, animated: true });
                setLightboxIdx(next);
              }}
            >
              <Ionicons name="chevron-back" size={26} color="#fff" />
            </Pressable>
          )}

          {/* Right arrow */}
          {(lightboxIdx ?? 0) < (market.images?.length ?? 0) - 1 && (
            <Pressable
              style={[lb.arrow, lb.arrowRight]}
              onPress={() => {
                const next = (lightboxIdx ?? 0) + 1;
                flatListRef.current?.scrollToIndex({ index: next, animated: true });
                setLightboxIdx(next);
              }}
            >
              <Ionicons name="chevron-forward" size={26} color="#fff" />
            </Pressable>
          )}

          {/* Close */}
          <Pressable style={lb.close} onPress={() => setLightboxIdx(null)}>
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>

          {/* Counter */}
          <Text style={lb.counter}>
            {(lightboxIdx ?? 0) + 1} / {market.images?.length ?? 0}
          </Text>
        </View>
      </Modal>

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
            <Pressable key={t.label} style={styles.tab} onPress={() => setActiveTab(i)}>
              <Ionicons
                name={t.icon as any}
                size={18}
                color={activeTab === i ? Colors.primary : Colors.textMuted}
              />
              <Text style={[styles.tabLabel, activeTab === i && styles.tabLabelActive]}>
                {t.label}
              </Text>
              {activeTab === i && <View style={styles.tabIndicator} />}
            </Pressable>
          ))}
        </View>

        {/* About */}
        {activeTab === 0 && (
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

        {/* Photos */}
        {activeTab === 1 && (
          <View style={styles.photosGrid}>
            {(market.images ?? []).length > 0
              ? (market.images!).map((img, i) => (
                  <Pressable key={i} style={styles.photoCell} onPress={() => setLightboxIdx(i)}>
                    <Image source={{ uri: imgUrl(img)! }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  </Pressable>
                ))
              : <Text style={{ padding: Spacing.xxl, color: Colors.textMuted, fontFamily: FontFamily.regular }}>No photos yet.</Text>
            }
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

  tabRow: { flexDirection: 'row', marginHorizontal: Spacing.xxl, marginBottom: Spacing.lg, borderBottomWidth: 2, borderBottomColor: Colors.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: Spacing.md, position: 'relative' },
  tabIndicator: { position: 'absolute', bottom: -2, left: 0, right: 0, height: 2, backgroundColor: Colors.primary, borderRadius: 1 },
  tabLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textMuted },
  tabLabelActive: { color: Colors.primary, fontFamily: FontFamily.bold },

  aboutCard: { marginHorizontal: Spacing.xxl, backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.md },
  aboutKey: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary },
  aboutVal: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, padding: Spacing.md },
  facilityChip: { backgroundColor: Colors.primaryLight, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  facilityText: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.primary },

  photosGrid: { marginHorizontal: Spacing.xxl, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoCell: { width: '48.5%', aspectRatio: 1, backgroundColor: Colors.primaryPale, borderRadius: Radius.md, overflow: 'hidden' },

  mapCard: { marginHorizontal: Spacing.xxl, marginBottom: Spacing.lg, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm, height: 230, backgroundColor: Colors.surface },
  mapView: { flex: 1 },
  mapFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border, backgroundColor: Colors.surface },
  mapInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs, flex: 1 },
  mapTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  mapAddr: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  directionsBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.primaryDark, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  directionsTxt: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.textInverse },
});

const lb = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  close:      { position: 'absolute', top: 52, right: Spacing.lg, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  counter:    { position: 'absolute', bottom: 44, alignSelf: 'center', fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)' },
  arrow:      { position: 'absolute', top: '42%', width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  arrowLeft:  { left: Spacing.lg },
  arrowRight: { right: Spacing.lg },
});
