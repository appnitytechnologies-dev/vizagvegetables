import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ScrollView, TextInput, Dimensions, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { useSelector } from 'react-redux';
import { selectAuth } from '../../store/authSlice';
import { api, ApiProduct } from '../../lib/api';

interface MarketRate { id: string; emoji: string; name: string; te: string; today: number; prev: number; chg: number; unit: string; }
interface ShopProduct { id: string; name: string; te: string; emoji: string; price: number; orig: number; unit: string; }

function apiToRate(p: ApiProduct): MarketRate {
  return { id: p.id, emoji: p.emoji || '🥦', name: p.name, te: p.telugu_name || '', today: p.price, prev: p.previous_price, chg: +(p.price - p.previous_price).toFixed(0), unit: p.unit };
}
function apiToShop(p: ApiProduct): ShopProduct {
  return { id: p.id, name: p.name, te: p.telugu_name || '', emoji: p.emoji || '🥦', price: p.price, orig: p.previous_price, unit: p.unit };
}
import Badge from '../../components/ui/Badge';
import { useCart } from '../../hooks/useCart';
import { useFavourites } from '../../hooks/useFavourites';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useLocation } from '../../hooks/useLocation';

const { width: SW } = Dimensions.get('window');
const RATE_CIRCLE_COLORS = ['#FFE4E8', '#EDE4FF', '#FFE8D4', '#E4F0FF', '#E4FFE8', '#FFF4E4'];


const BANNERS = [
  { id: '1', bg: '#EDF8EE', leftEmojis: ['🥦', '🍅', '🧅', '🫑'] as string[], title: 'Fresh', title2: 'Vegetables', rightEmoji: '🥬' },
  { id: '2', bg: '#FFF8E1', leftEmojis: ['⚖️', '🌾', '🥕', '💰'] as string[], title: 'Rythu Bazar', title2: 'Rates', rightEmoji: '🌿' },
  { id: '3', bg: '#E8F4FD', leftEmojis: ['🚚', '📦', '⏱️', '✨'] as string[], title: 'Order', title2: 'Online', rightEmoji: '🛒' },
];

const BANNER_W = SW - Spacing.lg * 2;

function BannerCarousel() {
  const [active, setActive] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive(prev => {
        const next = (prev + 1) % BANNERS.length;
        scrollRef.current?.scrollTo({ x: next * BANNER_W, animated: true });
        return next;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={bannerStyles.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => {
          setActive(Math.round(e.nativeEvent.contentOffset.x / BANNER_W));
        }}
      >
        {BANNERS.map(b => (
          <View key={b.id} style={[bannerStyles.slide, { backgroundColor: b.bg }]}>
            {/* Scattered emoji cluster on the left */}
            <View style={bannerStyles.clusterWrap}>
              <Text style={bannerStyles.ce0}>{b.leftEmojis[0]}</Text>
              <Text style={bannerStyles.ce1}>{b.leftEmojis[1]}</Text>
              <Text style={bannerStyles.ce2}>{b.leftEmojis[2]}</Text>
              <Text style={bannerStyles.ce3}>{b.leftEmojis[3]}</Text>
            </View>
            {/* Title text */}
            <View style={bannerStyles.textSide}>
              <Text style={bannerStyles.bannerLine1}>{b.title}</Text>
              <Text style={bannerStyles.bannerLine2}>{b.title2}</Text>
            </View>
            {/* Right decoration */}
            <Text style={bannerStyles.rightDeco}>{b.rightEmoji}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={bannerStyles.dots}>
        {BANNERS.map((_, i) => (
          <View key={i} style={[bannerStyles.dot, i === active && bannerStyles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const bannerStyles = StyleSheet.create({
  wrap: { marginHorizontal: Spacing.lg, borderRadius: Radius.xl, overflow: 'hidden', marginBottom: Spacing.xl },
  slide: {
    width: BANNER_W,
    height: 148,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  clusterWrap: { width: 118, height: 148, position: 'relative' },
  ce0: { position: 'absolute', fontSize: 50, left: 6,  top: 8  },
  ce1: { position: 'absolute', fontSize: 38, left: 52, top: 36 },
  ce2: { position: 'absolute', fontSize: 30, left: 10, top: 74 },
  ce3: { position: 'absolute', fontSize: 34, left: 58, top: 6  },
  textSide: { flex: 1, justifyContent: 'center', paddingLeft: 4 },
  bannerLine1: { fontFamily: FontFamily.bold, fontSize: 26, color: Colors.textPrimary, letterSpacing: -0.5 },
  bannerLine2: { fontFamily: FontFamily.bold, fontSize: 26, color: Colors.textPrimary, letterSpacing: -0.5 },
  rightDeco: { fontSize: 52, marginRight: 10 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: Spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 999, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.primary, width: 16 },
});

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={sh.row}>
      <Text style={sh.title}>{title}</Text>
      {onSeeAll && <Pressable onPress={onSeeAll}><Text style={sh.seeAll}>See all &gt;</Text></Pressable>}
    </View>
  );
}

const sh = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary, letterSpacing: -0.3 },
  seeAll: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },
});

export default function HomeScreen() {
  const auth = useSelector(selectAuth);
  const { addItem } = useCart();
  const { ids, toggle } = useFavourites();
  const { guard } = useAuthGuard();
  const { locationText, loading: locLoading, isCustom, setCustomLocation, resetToGPS } = useLocation();
  const [locationModal, setLocationModal] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [query, setQuery] = useState('');
  const [rates, setRates]             = useState<MarketRate[]>([]);
  const [allProducts, setAllProducts] = useState<ShopProduct[]>([]);
  const unreadCount = 0;
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

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
  const topRates = q
    ? rates.filter(r => r.name.toLowerCase().includes(q) || r.te.toLowerCase().includes(q))
    : rates.slice(0, 5);
  const favRates = rates.filter(r => ids.includes(r.id)).slice(0, 3);
  const shopProducts = q
    ? allProducts.filter(p => p.name.toLowerCase().includes(q) || p.te.toLowerCase().includes(q))
    : allProducts.slice(0, 4);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Green Header */}
      <View style={styles.header}>
        <View style={styles.headerRow1}>
          <Pressable
            style={styles.locationCol}
            onPress={() => { setLocationInput(locationText); setLocationModal(true); }}
          >
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={13} color={Colors.textInverse} />
              <Text style={styles.locationBrand}>Vizag Vegetables</Text>
            </View>
            <View style={styles.locationRow}>
              <Text style={styles.locationSub} numberOfLines={1}>
                {locLoading ? '...' : (locationText || 'Set location')}
              </Text>
              <Ionicons name="chevron-down" size={11} color={Colors.textInverse} style={{ opacity: 0.7, marginLeft: 2, marginTop: 1 }} />
            </View>
          </Pressable>
          <Pressable style={styles.bellBtn} onPress={() => router.push('/notifications' as any)}>
            <Ionicons name="notifications-outline" size={22} color={Colors.textInverse} />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
        <View style={styles.headerRow2}>
          <Text style={styles.greeting}>Hey {auth.name || 'there'} 👋</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for vegetables, fruits..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            underlineColorAndroid="transparent"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ height: Spacing.xl }} />

        <BannerCarousel />

        {/* Today's Rythu Bazar Rates */}
        <SectionHeader title="Today's Rythu Bazar Rates" onSeeAll={() => router.push('/(tabs)/price' as any)} />
        <FlatList
          data={topRates}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={i => i.id}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.sm }}
          renderItem={({ item, index }) => (
            <Pressable
              style={rateCard.card}
              onPress={() => guard({ type: 'TOGGLE_FAVOURITE', payload: item.id, returnTo: '/(tabs)/home' }, () => toggle(item.id))}
            >
              <Pressable onPress={() => guard({ type: 'TOGGLE_FAVOURITE', payload: item.id, returnTo: '/(tabs)/home' }, () => toggle(item.id))} style={rateCard.heart}>
                <Ionicons
                  name={ids.includes(item.id) ? 'heart' : 'heart-outline'}
                  size={16}
                  color={ids.includes(item.id) ? Colors.danger : Colors.textMuted}
                />
              </Pressable>
              <View style={[rateCard.emojiCircle, { backgroundColor: RATE_CIRCLE_COLORS[index % RATE_CIRCLE_COLORS.length] }]}>
                <Text style={rateCard.emoji}>{item.emoji}</Text>
              </View>
              <Text style={rateCard.name}>{item.name}</Text>
              <Text style={rateCard.te}>{item.te}</Text>
              <View style={rateCard.priceRow}>
                <Text style={rateCard.price}>₹{item.today}/{item.unit}</Text>
                <Badge chg={item.chg} />
              </View>
            </Pressable>
          )}
        />

        {/* Favourite Price */}
        <View style={{ height: Spacing.xl }} />
        <SectionHeader title="❤️  Favourite Price" onSeeAll={() => router.push('/(tabs)/price' as any)} />
        {favRates.length === 0 ? (
          <Text style={styles.emptyFav}>Tap ♡ on any rate card to add favourites</Text>
        ) : (
          <View style={favStyles.list}>
            {favRates.map((r) => (
              <View key={r.id} style={favStyles.card}>
                <View style={favStyles.row}>
                  <View style={favStyles.emojiCircle}>
                    <Text style={favStyles.emoji}>{r.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={favStyles.name}>{r.name}</Text>
                    <Text style={favStyles.te}>{r.te}</Text>
                  </View>
                  <Text style={favStyles.price}>₹{r.today}/{r.unit}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Shopping List */}
        <View style={{ height: Spacing.xl }} />
        <SectionHeader title="🛒  Shopping List" onSeeAll={() => router.push('/(tabs)/shop' as any)} />
        <FlatList
          data={shopProducts}
          numColumns={2}
          scrollEnabled={false}
          keyExtractor={i => i.id}
          columnWrapperStyle={{ gap: Spacing.md, paddingHorizontal: Spacing.lg }}
          contentContainerStyle={{ gap: Spacing.md }}
          renderItem={({ item }) => (
            <Pressable style={prodCard.card} onPress={() => router.push({ pathname: '/shop-details', params: { id: item.id } } as any)}>
              <View style={prodCard.photoArea}>
                <Text style={prodCard.emoji}>{item.emoji}</Text>
              </View>
              <View style={prodCard.info}>
                <Text style={prodCard.name}>{item.name}</Text>
                <Text style={prodCard.te}>{item.te}</Text>
                <Text style={prodCard.unit}>{item.unit}</Text>
                <View style={prodCard.footer}>
                  <View style={prodCard.priceRow}>
                    <Text style={prodCard.price}>₹{item.price}</Text>
                    <Text style={prodCard.orig}>₹{item.orig}</Text>
                  </View>
                  <Pressable
                    style={prodCard.addBtn}
                    onPress={() => guard(
                      { type: 'ADD_TO_CART', payload: { id: item.id, name: item.name, te: item.te, emoji: item.emoji, price: item.price, unit: item.unit, quantity: 1 }, returnTo: '/(tabs)/home' },
                      () => addItem({ id: item.id, name: item.name, te: item.te, emoji: item.emoji, price: item.price, unit: item.unit, quantity: 1 })
                    )}
                  >
                    <Text style={prodCard.addText}>Add</Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          )}
        />

        {/* Today's Price Table */}
        <View style={{ height: Spacing.xl }} />
        <SectionHeader title="Today's Price Table" onSeeAll={() => router.push('/(tabs)/price' as any)} />
        <View style={tableStyles.card}>
          <View style={tableStyles.headerRow}>
            <Text style={[tableStyles.col, { flex: 2, textAlign: 'left' }]}>Item</Text>
            <Text style={tableStyles.col}>Today</Text>
            <Text style={tableStyles.col}>Prev</Text>
            <Text style={tableStyles.col}>Chg</Text>
          </View>
          {rates.slice(0, 8).map(r => (
            <View key={r.id} style={tableStyles.row}>
              <View style={[tableStyles.itemCol, { flex: 2 }]}>
                <Text style={tableStyles.itemEmoji}>{r.emoji}</Text>
                <Text style={tableStyles.itemName}>{r.name}</Text>
              </View>
              <Text style={tableStyles.today}>₹{r.today}</Text>
              <Text style={tableStyles.prev}>₹{r.prev}</Text>
              <View style={tableStyles.chgCell}><Badge chg={r.chg} /></View>
            </View>
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
            {!isCustom ? null : (
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

const rateCard = StyleSheet.create({
  card: { width: 120, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.sm },
  heart: { alignSelf: 'flex-end', marginBottom: Spacing.xs },
  emojiCircle: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: Spacing.sm },
  emoji: { fontSize: 30 },
  name: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  te: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.xs },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  price: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.primary },
});

const favStyles = StyleSheet.create({
  list: { marginHorizontal: Spacing.lg, gap: Spacing.sm },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  row: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  emojiCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primaryPale, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 22 },
  name: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  te: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },
  price: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.textPrimary, marginLeft: 'auto' },
});

const prodCard = StyleSheet.create({
  card: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  photoArea: { height: 130, backgroundColor: '#F5F5F0', alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 62 },
  info: { padding: Spacing.md },
  name: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.textPrimary, marginBottom: 2 },
  te: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 2 },
  unit: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  price: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary },
  orig: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, textDecorationLine: 'line-through' },
  addBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  addText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textInverse },
});

const tableStyles = StyleSheet.create({
  card: { marginHorizontal: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm, marginBottom: Spacing.xxl },
  headerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryPale, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  col: { flex: 1, fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.primary, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  itemCol: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  itemEmoji: { fontSize: 18 },
  itemName: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textPrimary },
  today: { flex: 1, fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.textPrimary, textAlign: 'center' },
  prev: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  chgCell: { flex: 1, alignItems: 'center' },
});

const locModal = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.overlay },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xxl, gap: Spacing.md, paddingBottom: Spacing.xxxl },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },
  sub: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.xs },
  input: { borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontFamily: FontFamily.regular, fontSize: FontSize.md, color: Colors.textPrimary },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing.lg, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.textInverse },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm },
  gpsBtnText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primaryDark, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, paddingTop: Spacing.sm },
  headerRow1: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs },
  locationCol: { flexDirection: 'column', gap: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationBrand: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textInverse },
  locationSub: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', paddingLeft: 17 },
  bellBtn: { position: 'relative', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.18)', alignItems: 'center', justifyContent: 'center' },
  bellBadge: { position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: Colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  bellBadgeText: { fontFamily: FontFamily.bold, fontSize: 9, color: Colors.textInverse },
  headerRow2: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md, marginTop: Spacing.xs },
  greeting: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textInverse, letterSpacing: -0.3 },
  date: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, gap: Spacing.sm },
  searchInput: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textPrimary, padding: 0, outlineStyle: 'none' } as any,
  emptyFav: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
});
