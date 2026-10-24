import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  TextInput, ScrollView, ActivityIndicator, Dimensions,
  Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { TINTS } from '../../constants/tints';
import { api, ApiProduct, imgUrl } from '../../lib/api';
import { Image } from 'expo-image';
import { useFavourites } from '../../hooks/useFavourites';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useLocation } from '../../hooks/useLocation';
import { shareProduct } from '../../lib/share';

const SCREEN_W = Dimensions.get('window').width;
const H_PAD    = Spacing.lg;
const COL_GAP  = Spacing.sm;
const CARD_W   = (SCREEN_W - H_PAD * 2 - COL_GAP) / 2;
const IMG_H    = CARD_W * 0.85;

type Lang = 'en' | 'te';

/* local shape the UI expects */
export interface MarketRate {
  id: string;
  emoji: string;
  image_url: string | null;
  name: string;
  te: string;
  cat: 'vegetables' | 'fruits' | 'leafy' | 'flowers';
  today: number;
  prev: number;
  chg: number;
  unit: string;
}

function toCat(categoryName: string | null): MarketRate['cat'] {
  const n = (categoryName || '').toLowerCase();
  if (n.includes('fruit')) return 'fruits';
  if (n.includes('leaf') || n.includes('green')) return 'leafy';
  if (n.includes('flower')) return 'flowers';
  return 'vegetables';
}

function toRate(p: ApiProduct): MarketRate {
  return {
    id:        p.id,
    emoji:     p.emoji || '🥦',
    image_url: imgUrl(p.image_url),
    name:      p.name,
    te:        p.telugu_name || '',
    cat:       toCat(p.category_name),
    today:     Math.round(p.price),
    prev:      Math.round(p.previous_price),
    chg:       +(p.price - p.previous_price).toFixed(0),
    unit:      p.unit,
  };
}

type Category = 'all' | 'vegetables' | 'fruits' | 'flowers' | 'leafy' | 'favourite';
const CATEGORIES: { key: Category; label: string; icon?: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'favourite', label: 'Favorites', icon: '❤️' },
  { key: 'vegetables', label: 'Vegetables', icon: '🥕' },
  { key: 'leafy', label: 'Leaves', icon: '🌿' },
  { key: 'flowers', label: 'Flowers', icon: '🌸' },
  { key: 'fruits', label: 'Fruits', icon: '🍎' },
];

async function handleShare(item: MarketRate) {
  await shareProduct({
    id: item.id,
    name: `${item.name} (${item.te})`,
    price: item.today,
    unit: item.unit,
    imageUrl: item.image_url,
  });
}

function PriceRowItem({ item, tint, label, subLabel, isFav, onToggleFav }: {
  item: MarketRate; tint: string; label: string; subLabel: string; isFav: boolean; onToggleFav: () => void;
}) {
  return (
    <View style={listStyles.row}>
      <View style={[listStyles.imgWrap, { backgroundColor: tint }]}>
        {item.image_url
          ? <Image source={{ uri: item.image_url }} style={listStyles.img} contentFit="contain" />
          : <Text style={listStyles.emoji}>{item.emoji}</Text>
        }
      </View>

      <View style={listStyles.info}>
        <Text style={listStyles.name} numberOfLines={1}>{label}</Text>
        {!!subLabel && <Text style={listStyles.te} numberOfLines={1}>{subLabel}</Text>}
      </View>

      <Text style={listStyles.price}>₹{item.today}<Text style={listStyles.unit}>/{item.unit}</Text></Text>

      <Pressable onPress={onToggleFav} hitSlop={8} style={listStyles.heartBtn}>
        <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={18} color={isFav ? Colors.danger : Colors.textMuted} />
      </Pressable>
      <Pressable style={listStyles.shareBtn} onPress={() => handleShare(item)} hitSlop={8}>
        <Ionicons name="share-social-outline" size={14} color={Colors.primaryAccent} />
      </Pressable>
    </View>
  );
}

function PriceGridItem({ item, tint, label, subLabel, isFav, onToggleFav }: {
  item: MarketRate; tint: string; label: string; subLabel: string; isFav: boolean; onToggleFav: () => void;
}) {
  return (
    <View style={gridStyles.card}>
      <View style={[gridStyles.imgBox, { backgroundColor: tint }]}>
        {item.image_url
          ? <Image source={{ uri: item.image_url }} style={gridStyles.img} contentFit="contain" />
          : <View style={gridStyles.imgFallback}><Text style={gridStyles.emoji}>{item.emoji}</Text></View>
        }
        <Pressable style={gridStyles.heartBtn} onPress={onToggleFav} hitSlop={6}>
          <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={15} color={isFav ? Colors.danger : Colors.textMuted} />
        </Pressable>
      </View>

      <View style={gridStyles.info}>
        <Text style={gridStyles.name} numberOfLines={1}>{label}</Text>
        {!!subLabel && <Text style={gridStyles.te} numberOfLines={1}>{subLabel}</Text>}
        <View style={gridStyles.footer}>
          <Text style={gridStyles.price}>₹{item.today}<Text style={gridStyles.unit}>/{item.unit}</Text></Text>
          <Pressable style={gridStyles.shareBtn} onPress={() => handleShare(item)} hitSlop={6}>
            <Ionicons name="share-social-outline" size={14} color={Colors.primaryAccent} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function PriceScreen() {
  const { cat } = useLocalSearchParams<{ cat?: string }>();
  const [category, setCategory] = useState<Category>((cat as Category) || 'all');

  useEffect(() => {
    if (cat && CATEGORIES.some(c => c.key === cat)) {
      setCategory(cat as Category);
    }
  }, [cat]);

  const [query, setQuery] = useState('');
  const [isGrid, setIsGrid] = useState(true);
  const [rates, setRates] = useState<MarketRate[]>([]);
  const [loading, setLoading] = useState(true);
  const { ids, toggle } = useFavourites();
  const { guard } = useAuthGuard();
  const { locationText, loading: locLoading, isCustom, setCustomLocation, resetToGPS } = useLocation();
  const [locationModal, setLocationModal] = useState(false);
  const [locationInput, setLocationInput] = useState('');

  const [lang, setLang] = useState<Lang>('en');
  const label = (it: { name: string; te: string }) => (lang === 'te' && it.te ? it.te : it.name);
  const subLabel = (it: { name: string; te: string }) => (lang === 'te' ? it.name : it.te);

  const handleToggleFav = (id: string) =>
    guard({ type: 'TOGGLE_FAVOURITE', payload: id, returnTo: '/(tabs)/price' }, () => toggle(id));

  useEffect(() => {
    api.get<ApiProduct[]>('/api/market-rates?limit=500')
      .then(data => setRates(data.map(toRate)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = rates.filter((r: MarketRate) => {
    const matchCat = category === 'all'
      ? true
      : category === 'favourite'
      ? ids.includes(r.id)
      : r.cat === category;
    const matchQ = r.name.toLowerCase().includes(query.toLowerCase()) || r.te.includes(query);
    return matchCat && matchQ;
  });

  const now = new Date();
  const dateLine = `${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} | ${now.toLocaleDateString('en-IN', { weekday: 'long' })} • Updated ${now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`;

  if (loading) return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    </SafeAreaView>
  );

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

        <View style={styles.searchRow}>
          <View style={styles.search}>
            <Ionicons name="search" size={17} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search vegetables, fruits…"
              placeholderTextColor={Colors.textMuted}
              value={query}
              onChangeText={setQuery}
              underlineColorAndroid="transparent"
              returnKeyType="search"
            />
          </View>
          <Pressable style={styles.toggleBtn} onPress={() => setIsGrid(g => !g)}>
            <Ionicons name={isGrid ? 'grid-outline' : 'list-outline'} size={15} color={Colors.textInverse} />
            <Text style={styles.toggleText}>{isGrid ? 'Grid' : 'List'}</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Title + date ── */}
      <View style={styles.rateHead}>
        <Text style={styles.pageTitle}>Today&apos;s Rythu Bazar Rates</Text>
        <Text style={styles.dateLine}>{dateLine}</Text>
      </View>

      {/* ── Category chips ── */}
      <View style={styles.chipsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContent}>
          {CATEGORIES.map(c => (
            <Pressable key={c.key} style={[styles.tab, category === c.key && styles.tabActive]} onPress={() => setCategory(c.key)}>
              {!!c.icon && <Text style={styles.tabIcon}>{c.icon}</Text>}
              <Text style={[styles.tabLabel, category === c.key && styles.tabLabelActive]}>{c.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {isGrid ? (
        <FlatList
          key="grid"
          data={filtered}
          numColumns={2}
          keyExtractor={i => i.id}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          columnWrapperStyle={{ gap: COL_GAP, paddingHorizontal: H_PAD }}
          contentContainerStyle={{ gap: COL_GAP, paddingTop: Spacing.sm, paddingBottom: 100 }}
          renderItem={({ item, index }) => (
            <PriceGridItem
              item={item}
              tint={TINTS[index % TINTS.length]}
              label={label(item)}
              subLabel={subLabel(item)}
              isFav={ids.includes(item.id)}
              onToggleFav={() => handleToggleFav(item.id)}
            />
          )}
        />
      ) : (
        <FlatList
          key="list"
          data={filtered}
          keyExtractor={i => i.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: Spacing.sm, paddingHorizontal: H_PAD, paddingBottom: 100, gap: Spacing.sm }}
          renderItem={({ item, index }) => (
            <PriceRowItem
              item={item}
              tint={TINTS[index % TINTS.length]}
              label={label(item)}
              subLabel={subLabel(item)}
              isFav={ids.includes(item.id)}
              onToggleFav={() => handleToggleFav(item.id)}
            />
          )}
        />
      )}

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

const listStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  imgWrap: {
    width: 56, height: 56, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', flexShrink: 0,
  },
  img: { width: 56, height: 56 },
  emoji: { fontSize: 28 },
  info: { flex: 1, gap: 2 },
  name: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.textPrimary },
  te: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  price: { fontFamily: FontFamily.numBold, fontSize: FontSize.md, color: Colors.primaryAccent },
  unit: { fontFamily: FontFamily.num, fontSize: FontSize.xs, color: Colors.primaryAccent },
  heartBtn: { marginLeft: Spacing.sm },
  shareBtn: {
    marginLeft: Spacing.sm, width: 30, height: 30, borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
});

const gridStyles = StyleSheet.create({
  card: {
    width: CARD_W, backgroundColor: Colors.surface,
    borderRadius: Radius.xl, borderWidth: 1,
    borderColor: Colors.border, overflow: 'hidden', ...Shadow.sm,
  },
  imgBox: { width: CARD_W, height: IMG_H, position: 'relative' },
  img: { width: '100%', height: '100%' },
  imgFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 52 },
  heartBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  info: { padding: Spacing.md, gap: 2 },
  name: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.textPrimary },
  te: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  price: { fontFamily: FontFamily.numBold, fontSize: FontSize.md, color: Colors.primaryAccent },
  unit: { fontFamily: FontFamily.num, fontSize: FontSize.xs, color: Colors.primaryAccent },
  shareBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },

  /* header — matches the home screen's header exactly */
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, backgroundColor: Colors.surface },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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

  searchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  search: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surfaceAlt, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.lg, height: 46,
  },
  searchInput: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textPrimary, padding: 0 },
  toggleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg, height: 46,
  },
  toggleText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textInverse },

  /* title + date */
  rateHead: { marginHorizontal: Spacing.lg, marginTop: Spacing.md, marginBottom: Spacing.md },
  pageTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary, letterSpacing: -0.3 },
  dateLine: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.primaryAccent, marginTop: 3 },

  /* category chips */
  chipsRow: { paddingBottom: Spacing.md, backgroundColor: Colors.surface },
  chipsContent: { paddingHorizontal: Spacing.lg, alignItems: 'center', gap: Spacing.sm },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 8,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primaryDark, borderColor: Colors.primaryDark },
  tabIcon: { fontSize: 13 },
  tabLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary },
  tabLabelActive: { color: Colors.textInverse },
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
