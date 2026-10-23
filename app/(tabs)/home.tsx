import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  ScrollView, TextInput, Modal, KeyboardAvoidingView, Platform, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import BANNER_IMG from '../../assets/icons/banner-home.png';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { TINTS } from '../../constants/tints';
import { Image } from 'expo-image';
import { api, ApiProduct, imgUrl } from '../../lib/api';
import { useFavourites } from '../../hooks/useFavourites';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useLocation } from '../../hooks/useLocation';

interface MarketRate { id: string; emoji: string; image_url: string | null; name: string; te: string; today: number; prev: number; chg: number; unit: string; }
interface ShopProduct { id: string; name: string; te: string; emoji: string; price: number; orig: number; unit: string; image_url: string | null; discount: number; }

function apiToRate(p: ApiProduct): MarketRate {
  return { id: p.id, emoji: p.emoji || '🥦', image_url: imgUrl(p.image_url), name: p.name, te: p.telugu_name || '', today: Math.round(p.price), prev: Math.round(p.previous_price), chg: +(p.price - p.previous_price).toFixed(0), unit: p.unit };
}
function apiToShop(p: ApiProduct): ShopProduct {
  const discount = p.previous_price > p.price ? Math.round(((p.previous_price - p.price) / p.previous_price) * 100) : 0;
  return { id: p.id, name: p.name, te: p.telugu_name || '', emoji: p.emoji || '🥦', price: Math.round(p.price), orig: Math.round(p.previous_price), unit: p.unit, image_url: imgUrl(p.image_url), discount };
}

interface ChickenRate { id: string; emoji: string; image_url: string | null; name: string; price: number; unit: string; }
const CHICKEN_TINTS = ['#FDEBEC', '#E6F6F3', '#EAF3FC', '#FDF3DC'];
// Placeholder until the backend exposes a chicken-rates endpoint (there is no
// /api/... source for these yet — replace with a fetched list once one exists).
const CHICKEN_RATES: ChickenRate[] = [
  { id: 'broiler',  emoji: '🐔', image_url: null, name: 'Broiler',          price: 145,  unit: 'kg' },
  { id: 'dressed',  emoji: '🍗', image_url: null, name: 'Dressed Chicken',  price: 260,  unit: 'kg' },
  { id: 'skinless', emoji: '🍖', image_url: null, name: 'Skinless Chicken', price: 270,  unit: 'kg' },
  { id: 'egg',      emoji: '🥚', image_url: null, name: 'Egg',              price: 5.45, unit: 'each' },
];

type Lang = 'en' | 'te';

/* ── small building blocks ───────────────────────────────── */

function SectionHeader({ title, icon, action, onPress }: {
  title: string; icon?: React.ReactNode; action?: string; onPress?: () => void;
}) {
  return (
    <View style={sh.row}>
      <View style={sh.left}>
        {icon}
        <Text style={sh.title}>{title}</Text>
      </View>
      {action && onPress && (
        <Pressable onPress={onPress} hitSlop={8}>
          <Text style={sh.action}>{action} ›</Text>
        </Pressable>
      )}
    </View>
  );
}

const sh = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  left: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary, letterSpacing: -0.3 },
  action: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primaryAccent },
});

/** Produce thumbnail with a tinted backdrop, falling back to the emoji. */
function Produce({ url, emoji, size, tint, radius }: {
  url: string | null; emoji: string; size: number; tint: string; radius?: number;
}) {
  return (
    <View style={[pr.box, { width: size, height: size, backgroundColor: tint, borderRadius: radius ?? size / 2 }]}>
      {url
        ? <Image source={{ uri: url }} style={{ width: size, height: size }} contentFit="contain" />
        : <Text style={{ fontSize: size * 0.45 }}>{emoji}</Text>}
    </View>
  );
}

const pr = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});

/** ▲ ₹4 / ▼ ₹1 pill against yesterday's price. */
function Delta({ chg }: { chg: number }) {
  if (!chg) return null;
  const up = chg > 0;
  return (
    <View style={[dl.pill, { backgroundColor: up ? '#FDECEC' : '#E8F6EC' }]}>
      <Ionicons name={up ? 'arrow-up' : 'arrow-down'} size={9} color={up ? Colors.danger : Colors.primaryAccent} />
      <Text style={[dl.text, { color: up ? Colors.danger : Colors.primaryAccent }]}>₹{Math.abs(chg)}</Text>
    </View>
  );
}

const dl = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 1, borderRadius: Radius.full, paddingHorizontal: 5, paddingVertical: 2 },
  text: { fontFamily: FontFamily.numMed, fontSize: 10 },
});

/* ── screen ──────────────────────────────────────────────── */

export default function HomeScreen() {
  const { ids, toggle } = useFavourites();
  const { guard } = useAuthGuard();
  const { locationText, loading: locLoading, isCustom, setCustomLocation, resetToGPS } = useLocation();
  const [locationModal, setLocationModal] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [query, setQuery] = useState('');
  const [rates, setRates] = useState<MarketRate[]>([]);
  const [allProducts, setAllProducts] = useState<ShopProduct[]>([]);

  // The header's 文A button. Product names come from the API in both
  // languages, so this swaps the label without needing any translation layer;
  // section headings stay in English.
  const [lang, setLang] = useState<Lang>('en');
  const label = (it: { name: string; te: string }) => (lang === 'te' && it.te ? it.te : it.name);
  const subLabel = (it: { name: string; te: string }) => (lang === 'te' ? it.name : it.te);

  const now = new Date();
  const dateLine = `${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} | ${now.toLocaleDateString('en-IN', { weekday: 'long' })}`;
  const lastUpdateLine = `${dateLine} • Last update: ${now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`;

  const shareChickenRates = async () => {
    const lines = CHICKEN_RATES.map(c => `${c.name}: ₹${c.price}/${c.unit}`).join('\n');
    try {
      await Share.share({ message: `🐔 Vizag Chicken Rates — ${dateLine}\n\n${lines}\n\nYZAG Fresh` });
    } catch { /* user cancelled or share sheet unavailable */ }
  };

  useEffect(() => {
    // Market rates come from the market_rates table (daily Rythu Bazar wholesale prices)
    api.get<ApiProduct[]>('/api/market-rates?limit=500')
      .then(data => setRates(data.map(apiToRate)))
      .catch(() => {});
    // Shop products come from the products table (orderable items)
    api.get<ApiProduct[]>('/api/products?limit=200')
      .then(data => setAllProducts(data.filter(p => p.is_active).map(apiToShop)))
      .catch(() => {});
  }, []);

  const q = query.trim().toLowerCase();
  const match = (it: { name: string; te: string }) =>
    it.name.toLowerCase().includes(q) || it.te.toLowerCase().includes(q);

  const gridRates    = q ? rates.filter(match) : rates.slice(0, 6);
  const favRates     = rates.filter(r => ids.includes(r.id)).slice(0, 8);
  const shopProducts = q ? allProducts.filter(match) : allProducts.slice(0, 4);
  const bestBuys     = [...rates].sort((a, b) => a.chg - b.chg).slice(0, 8);
  const tableRates   = q ? rates.filter(match) : rates.slice(0, 8);

  const toggleFav = (id: string) =>
    guard({ type: 'TOGGLE_FAVOURITE', payload: id, returnTo: '/(tabs)/home' }, () => toggle(id));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Image
            source={require('../../assets/images/home-logo.png')}
            style={styles.logo}
            contentFit="contain"
            contentPosition="left"
          />
          <View style={styles.headerActions}>
            <Pressable
              style={[styles.circleBtn, lang === 'te' && styles.circleBtnActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setLang(l => (l === 'en' ? 'te' : 'en')); }}
              hitSlop={6}
            >
              <MaterialIcons name="translate" size={19} color={lang === 'te' ? Colors.textInverse : Colors.textPrimary} />
            </Pressable>
            <Pressable style={styles.circleBtn} onPress={() => router.push('/notifications' as any)} hitSlop={6}>
              <Ionicons name="notifications-outline" size={19} color={Colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        <Pressable
          style={styles.locRow}
          onPress={() => { setLocationInput(locationText); setLocationModal(true); }}
          hitSlop={6}
        >
          <Ionicons name="location-sharp" size={13} color={Colors.primaryAccent} />
          <Text style={styles.locText} numberOfLines={1}>
            {locLoading ? '…' : (locationText || 'Visakhapatnam')}
          </Text>
          <Ionicons name="chevron-down" size={11} color={Colors.textMuted} />
        </Pressable>

        <View style={styles.search}>
          <Ionicons name="search" size={17} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${rates.length || ''} items…`.replace('  ', ' ')}
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            underlineColorAndroid="transparent"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={17} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>

        {/* ── Today's Rythu Bazar Rates ── */}
        <View style={styles.rateHead}>
          <View style={{ flex: 1 }}>
            <Text style={sh.title}>Today&apos;s Vizag Rythu Bazar Rates</Text>
            <Text style={styles.dateLine}>{lastUpdateLine}</Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/price' as any)} hitSlop={8}>
            <Text style={sh.action}>View All ›</Text>
          </Pressable>
        </View>

        <View style={styles.grid}>
          {gridRates.map((r, i) => (
            <Pressable
              key={r.id}
              style={[styles.gridCard, { backgroundColor: TINTS[i % TINTS.length] }]}
              onPress={() => router.push('/(tabs)/price' as any)}
            >
              <Produce url={r.image_url} emoji={r.emoji} size={62} tint="transparent" radius={12} />
              <Text style={styles.gridName} numberOfLines={1}>{label(r)}</Text>
              <Text style={styles.gridPrice}>₹{r.today}/{r.unit}</Text>
            </Pressable>
          ))}
        </View>

        {/* ── Your Favourite Vegetables ── */}
        <View style={{ height: Spacing.xl }} />
        <SectionHeader
          title="Your Favourite Vegetables"
          icon={<Ionicons name="heart" size={18} color={Colors.primaryAccent} />}
          action="View All"
          onPress={() => router.push({ pathname: '/(tabs)/price', params: { cat: 'favourite' } } as any)}
        />
        {favRates.length === 0 ? (
          <Text style={styles.empty}>Tap ♡ on any item to follow its price here</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.favRow}>
            {favRates.map((r, i) => (
              <Pressable key={r.id} style={styles.favItem} onPress={() => router.push('/(tabs)/price' as any)}>
                <Produce url={r.image_url} emoji={r.emoji} size={62} tint={TINTS[i % TINTS.length]} />
                <Text style={styles.favPrice}>₹{r.today}/{r.unit}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* ── Vizag Chicken Rates ── */}
        <View style={{ height: Spacing.xl }} />
        <View style={styles.rateHead}>
          <View style={{ flex: 1 }}>
            <View style={sh.left}>
              <MaterialCommunityIcons name="food-drumstick" size={17} color={Colors.danger} />
              <Text style={sh.title}>Vizag Chicken Rates</Text>
            </View>
            <Text style={styles.dateLine}>{lastUpdateLine}</Text>
          </View>
          <Pressable onPress={shareChickenRates} hitSlop={8} style={{ marginTop: 2 }}>
            <Ionicons name="share-social-outline" size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>
        <View style={styles.chickenGrid}>
          {CHICKEN_RATES.map((c, i) => (
            <View key={c.id} style={[styles.chickenCard, { backgroundColor: CHICKEN_TINTS[i % CHICKEN_TINTS.length] }]}>
              <Produce url={c.image_url} emoji={c.emoji} size={54} tint="transparent" radius={12} />
              <Text style={styles.chickenName} numberOfLines={1}>{c.name}</Text>
              <Text style={styles.chickenPrice}>₹{c.price}/{c.unit}</Text>
            </View>
          ))}
        </View>

        {/* ── Shopping List ── */}
        <View style={{ height: Spacing.xl }} />
        <SectionHeader
          title="Shopping List"
          icon={<Ionicons name="cart-outline" size={19} color={Colors.textPrimary} />}
          action="See all"
          onPress={() => router.push('/(tabs)/shop' as any)}
        />
        <View style={styles.shopGrid}>
          {shopProducts.map(p => (
            <View key={p.id} style={styles.shopCard}>
              <View style={styles.shopImgBox}>
                {p.image_url
                  ? <Image source={{ uri: p.image_url }} style={styles.shopImg} contentFit="cover" />
                  : <Text style={{ fontSize: 44 }}>{p.emoji}</Text>}
              </View>
              <View style={styles.shopBody}>
                <Text style={styles.shopName} numberOfLines={1}>{label(p)}</Text>
                <Text style={styles.shopUnit}>{p.unit}</Text>
                <View style={styles.shopFooter}>
                  <View style={styles.shopPriceRow}>
                    <Text style={styles.shopPrice}>₹{p.price}</Text>
                    {p.orig > p.price && <Text style={styles.shopOrig}>₹{p.orig}</Text>}
                  </View>
                  <Pressable
                    style={styles.viewBtn}
                    onPress={() => router.push({ pathname: '/shop-details', params: { id: p.id } } as any)}
                  >
                    <Text style={styles.viewBtnText}>view</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ── Best Buy Today ── */}
        <View style={{ height: Spacing.xl }} />
        <SectionHeader title="Best Buy Today" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bestRow}>
          {bestBuys.map((r, i) => (
            <Pressable key={r.id} style={styles.bestCard} onPress={() => router.push('/(tabs)/price' as any)}>
              <Pressable style={styles.bestHeart} onPress={() => toggleFav(r.id)} hitSlop={8}>
                <Ionicons
                  name={ids.includes(r.id) ? 'heart' : 'heart-outline'}
                  size={17}
                  color={ids.includes(r.id) ? Colors.danger : Colors.textMuted}
                />
              </Pressable>
              <Produce url={r.image_url} emoji={r.emoji} size={58} tint={TINTS[i % TINTS.length]} radius={12} />
              <Text style={styles.bestName} numberOfLines={1}>{label(r)}</Text>
              <Text style={styles.bestTe} numberOfLines={1}>{subLabel(r)}</Text>
              <View style={styles.bestPriceRow}>
                <Text style={styles.bestPrice}>₹{r.today}</Text>
                <Text style={styles.bestUnit}>/{r.unit}</Text>
                <Delta chg={r.chg} />
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Banner ── */}
        <View style={{ height: Spacing.xl }} />
        <Image source={BANNER_IMG} style={styles.banner} contentFit="cover" />

        {/* ── Today's Price Table ── */}
        <View style={{ height: Spacing.xl }} />
        <View style={styles.tableHead}>
          <Text style={[sh.title, { flex: 1 }]}>Today&apos;s Price Table</Text>
          <Text style={styles.colToday}>Today</Text>
          <Text style={styles.colPrev}>Yesterday</Text>
        </View>
        <View style={styles.table}>
          {tableRates.map((r, i) => (
            <Pressable
              key={r.id}
              style={[styles.tableRow, i === tableRates.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => router.push('/(tabs)/price' as any)}
            >
              <Produce url={r.image_url} emoji={r.emoji} size={42} tint={TINTS[i % TINTS.length]} />
              <View style={styles.tableMeta}>
                <Text style={styles.tableName} numberOfLines={1}>{label(r)}</Text>
                {!!subLabel(r) && <Text style={styles.tableTe} numberOfLines={1}>{subLabel(r)}</Text>}
              </View>
              <Text style={[
                styles.tableToday,
                r.chg > 0 && { color: Colors.danger },
                r.chg < 0 && { color: Colors.primaryAccent },
              ]}>
                ₹{r.today}/{r.unit}
              </Text>
              <Text style={styles.tablePrev}>₹{r.prev}/{r.unit}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Location picker modal */}
      <Modal visible={locationModal} transparent animationType="fade" onRequestClose={() => setLocationModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={locModal.overlay}>
          <Pressable style={locModal.backdrop} onPress={() => setLocationModal(false)} />
          <View style={locModal.sheet}>
            <Text style={locModal.title}>Set your area</Text>
            <Text style={locModal.sub}>Type your neighbourhood, area or city name</Text>
            <TextInput
              style={locModal.input}
              placeholder="e.g. Gajuwaka, Vizag"
              placeholderTextColor={Colors.textMuted}
              value={locationInput}
              onChangeText={setLocationInput}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => {
                if (locationInput.trim()) { setCustomLocation(locationInput.trim()); setLocationModal(false); }
              }}
            />
            <Pressable
              style={[locModal.saveBtn, !locationInput.trim() && locModal.saveBtnDisabled]}
              onPress={() => {
                if (locationInput.trim()) { setCustomLocation(locationInput.trim()); setLocationModal(false); }
              }}
            >
              <Text style={locModal.saveBtnText}>Save</Text>
            </Pressable>
            {isCustom && (
              <Pressable style={locModal.gpsBtn} onPress={() => { resetToGPS(); setLocationModal(false); }}>
                <Ionicons name="locate-outline" size={14} color={Colors.primary} />
                <Text style={locModal.gpsBtnText}>Use GPS instead</Text>
              </Pressable>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },

  /* header */
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, backgroundColor: Colors.surface },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  // Box matches the artwork's 2.77 aspect, so "contain" fills it exactly and the
  // wordmark starts flush with the location row below rather than being
  // letterboxed and centred inside a wider box.
  logo: { width: 116, height: 42 },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  circleBtn: {
    width: 38, height: 38, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  circleBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  locText: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, maxWidth: '78%' },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surfaceAlt, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.lg, height: 46, marginTop: Spacing.md,
  },
  searchInput: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textPrimary, padding: 0 },

  /* rates grid */
  rateHead: { flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: Spacing.lg, marginTop: Spacing.lg, marginBottom: Spacing.md, gap: Spacing.sm },
  dateLine: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginHorizontal: Spacing.lg },
  gridCard: {
    width: '31.3%', borderRadius: Radius.lg,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm, alignItems: 'center',
  },
  gridName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary, marginTop: 6 },
  gridPrice: { fontFamily: FontFamily.numBold, fontSize: FontSize.sm, color: Colors.textPrimary, marginTop: 1 },

  /* favourites */
  empty: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, marginHorizontal: Spacing.lg },
  favRow: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  favItem: { alignItems: 'center', gap: 6 },
  favPrice: { fontFamily: FontFamily.numMed, fontSize: FontSize.sm, color: Colors.textPrimary },

  /* chicken rates */
  chickenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginHorizontal: Spacing.lg },
  chickenCard: {
    width: '47.6%', borderRadius: Radius.lg,
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.md, alignItems: 'center',
  },
  chickenName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary, marginTop: 8 },
  chickenPrice: { fontFamily: FontFamily.numBold, fontSize: FontSize.md, color: Colors.textPrimary, marginTop: 2 },

  /* shopping list */
  shopGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginHorizontal: Spacing.lg },
  shopCard: {
    width: '47.6%', backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadow.sm,
  },
  shopImgBox: { height: 112, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  shopImg: { width: '100%', height: 112 },
  shopBody: { padding: Spacing.md },
  shopName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.textPrimary },
  shopUnit: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  shopFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.sm },
  shopPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  shopPrice: { fontFamily: FontFamily.numBold, fontSize: FontSize.md, color: Colors.textPrimary },
  shopOrig: { fontFamily: FontFamily.num, fontSize: FontSize.xs, color: Colors.textMuted, textDecorationLine: 'line-through' },
  viewBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 6 },
  viewBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textInverse },

  /* best buy */
  bestRow: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingBottom: 2 },
  bestCard: {
    width: 132, backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, alignItems: 'center', ...Shadow.sm,
  },
  bestHeart: { position: 'absolute', top: 8, right: 8, zIndex: 1 },
  bestName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary, marginTop: 6 },
  bestTe: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },
  bestPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  bestPrice: { fontFamily: FontFamily.numBold, fontSize: FontSize.md, color: Colors.textPrimary },
  bestUnit: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },

  /* banner */
  banner: { height: 118, marginHorizontal: Spacing.lg, borderRadius: Radius.xl },

  /* price table */
  tableHead: { flexDirection: 'row', alignItems: 'flex-end', marginHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  colToday: { width: 78, textAlign: 'right', fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.primaryAccent },
  colPrev:  { width: 78, textAlign: 'right', fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textSecondary },
  table: { marginHorizontal: Spacing.lg },
  tableRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tableMeta: { flex: 1 },
  tableName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  tableTe: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  tableToday: { width: 78, textAlign: 'right', fontFamily: FontFamily.numBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  tablePrev:  { width: 78, textAlign: 'right', fontFamily: FontFamily.num, fontSize: FontSize.sm, color: Colors.textMuted },
});

const locModal = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.overlay },
  sheet: { backgroundColor: Colors.surface, marginHorizontal: Spacing.xl, borderRadius: Radius.xl, padding: Spacing.xl, ...Shadow.lg },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },
  sub: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing.lg },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg, paddingVertical: 12,
    fontFamily: FontFamily.regular, fontSize: FontSize.md, color: Colors.textPrimary,
  },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 13, alignItems: 'center', marginTop: Spacing.lg },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.textInverse },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: Spacing.md },
  gpsBtnText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },
});
