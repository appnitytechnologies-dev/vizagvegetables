import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ScrollView, TextInput, Modal, KeyboardAvoidingView, Platform, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import BANNER_IMG from '../../assets/icons/banner-home.png';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { useSelector } from 'react-redux';
import { selectAuth } from '../../store/authSlice';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { api, ApiProduct, imgUrl } from '../../lib/api';

interface MarketRate { id: string; emoji: string; image_url: string | null; name: string; te: string; today: number; prev: number; chg: number; unit: string; }
interface ShopProduct { id: string; name: string; te: string; emoji: string; price: number; orig: number; unit: string; image_url: string | null; discount: number; }

function apiToRate(p: ApiProduct): MarketRate {
  return { id: p.id, emoji: p.emoji || '🥦', image_url: imgUrl(p.image_url), name: p.name, te: p.telugu_name || '', today: Math.round(p.price), prev: Math.round(p.previous_price), chg: +(p.price - p.previous_price).toFixed(0), unit: p.unit };
}
function apiToShop(p: ApiProduct): ShopProduct {
  const discount = p.previous_price > p.price ? Math.round(((p.previous_price - p.price) / p.previous_price) * 100) : 0;
  return { id: p.id, name: p.name, te: p.telugu_name || '', emoji: p.emoji || '🥦', price: Math.round(p.price), orig: Math.round(p.previous_price), unit: p.unit, image_url: imgUrl(p.image_url), discount };
}
import Badge from '../../components/ui/Badge';
import { useCart, useItemQuantity } from '../../hooks/useCart';
import { useFavourites } from '../../hooks/useFavourites';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useLocation } from '../../hooks/useLocation';

/* ── Home Add / Stepper ──────────────────────────────────── */
function HomeAddStepper({ product }: { product: ShopProduct }) {
  const { addItem, increase, decrease } = useCart();
  const { guard } = useAuthGuard();
  const qty = useItemQuantity(product.id);

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    guard(
      { type: 'ADD_TO_CART', payload: { id: product.id, name: product.name, te: product.te,
        emoji: product.emoji, image_url: product.image_url, price: product.price, unit: product.unit, quantity: 1 },
        returnTo: '/(tabs)/home' },
      () => addItem({ id: product.id, name: product.name, te: product.te,
        emoji: product.emoji, image_url: product.image_url, price: product.price, unit: product.unit, quantity: 1 })
    );
  };

  if (qty === 0) {
    return (
      <Pressable style={stp.addBtn} onPress={handleAdd}>
        <Ionicons name="add" size={16} color={Colors.primary} />
        <Text style={stp.addText}>Add</Text>
      </Pressable>
    );
  }
  return (
    <View style={stp.stepper}>
      <Pressable style={stp.stepBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); decrease(product.id); }}>
        <Text style={stp.icon}>−</Text>
      </Pressable>
      <Text style={stp.qty}>{qty}</Text>
      <Pressable style={[stp.stepBtn, stp.stepBtnFill]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); increase(product.id); }}>
        <Text style={[stp.icon, { color: '#fff' }]}>+</Text>
      </Pressable>
    </View>
  );
}

function HomeProductCard({ item }: { item: ShopProduct }) {
  return (
    <Pressable
      style={({ pressed }) => [prodCard.wrap, pressed && { opacity: 0.92 }]}
      onPress={() => router.push({ pathname: '/shop-details', params: { id: item.id } } as any)}
    >
      <View style={prodCard.imgBox}>
        {item.image_url
          ? <Image source={{ uri: item.image_url }} style={prodCard.img} contentFit="contain" />
          : <View style={prodCard.imgFallback}><Text style={prodCard.emoji}>{item.emoji}</Text></View>
        }
        {item.discount > 0 && (
          <View style={prodCard.badge}>
            <Text style={prodCard.badgeText}>{item.discount}% OFF</Text>
          </View>
        )}
      </View>
      <View style={prodCard.info}>
        <View style={prodCard.nameRow}>
          <Text style={prodCard.name} numberOfLines={1}>{item.name}</Text>
          <Text style={prodCard.unit}>{item.unit}</Text>
        </View>
        <View style={prodCard.footer}>
          <View style={prodCard.priceRow}>
            <Text style={prodCard.price}>₹{item.price}</Text>
            {item.orig > item.price && <Text style={prodCard.orig}>₹{item.orig}</Text>}
          </View>
          <HomeAddStepper product={item} />
        </View>
      </View>
    </Pressable>
  );
}

const stp = StyleSheet.create({
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: 5,
    backgroundColor: Colors.primaryPale,
  },
  addText: { fontFamily: FontFamily.bold, fontSize: 12, color: Colors.primary },
  stepper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: Radius.md, overflow: 'hidden',
  },
  stepBtn: { width: 26, height: 28, alignItems: 'center', justifyContent: 'center' },
  stepBtnFill: { backgroundColor: Colors.primary },
  icon: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.primary },
  qty: { minWidth: 22, textAlign: 'center', fontFamily: FontFamily.numBold, fontSize: FontSize.xs, color: Colors.primary },
});

const RATE_CIRCLE_COLORS = ['#FFE4E8', '#EDE4FF', '#FFE8D4', '#E4F0FF', '#E4FFE8', '#FFF4E4'];

const BANNER_SLIDES = [
  { title: 'Fresh from Rythu Bazar', sub: 'Daily prices updated every morning', tint: 'rgba(0,0,0,0.28)' },
  { title: 'Order Fresh Vegetables', sub: 'Home delivery across Vizag', tint: 'rgba(27,94,53,0.52)' },
  { title: 'Live Market Rates', sub: '500+ items, updated every day', tint: 'rgba(0,0,0,0.32)' },
];



function LocationPinIcon() {
  return (
    <Svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <Path d="M8 9C7.50555 9 7.0222 8.85338 6.61108 8.57868C6.19995 8.30397 5.87952 7.91352 5.6903 7.45671C5.50108 6.99989 5.45157 6.49723 5.54804 6.01228C5.6445 5.52732 5.8826 5.08187 6.23223 4.73223C6.58187 4.3826 7.02732 4.1445 7.51228 4.04804C7.99723 3.95157 8.49989 4.00108 8.95671 4.1903C9.41353 4.37952 9.80397 4.69995 10.0787 5.11108C10.3534 5.5222 10.5 6.00555 10.5 6.5C10.4992 7.1628 10.2356 7.79822 9.76689 8.26689C9.29822 8.73556 8.6628 8.99921 8 9V9ZM8 5C7.70333 5 7.41332 5.08797 7.16665 5.2528C6.91997 5.41762 6.72771 5.65189 6.61418 5.92598C6.50065 6.20007 6.47095 6.50167 6.52882 6.79264C6.5867 7.08361 6.72956 7.35088 6.93934 7.56066C7.14912 7.77044 7.41639 7.9133 7.70737 7.97118C7.99834 8.02906 8.29994 7.99935 8.57403 7.88582C8.84812 7.77229 9.08238 7.58003 9.24721 7.33336C9.41203 7.08668 9.5 6.79667 9.5 6.5C9.4996 6.1023 9.34144 5.721 9.06022 5.43978C8.779 5.15856 8.3977 5.0004 8 5V5Z" fill="white" />
      <Path d="M8.00001 15L3.78201 10.0255C3.7234 9.95081 3.66539 9.87564 3.60801 9.8C2.8875 8.85089 2.49826 7.69161 2.50001 6.5C2.50001 5.04131 3.07947 3.64236 4.11092 2.61091C5.14237 1.57946 6.54132 1 8.00001 1C9.4587 1 10.8576 1.57946 11.8891 2.61091C12.9205 3.64236 13.5 5.04131 13.5 6.5C13.5018 7.69107 13.1127 8.84982 12.3925 9.7985L12.392 9.8C12.392 9.8 12.242 9.997 12.2195 10.0235L8.00001 15ZM4.40601 9.1975C4.40701 9.1975 4.52301 9.3515 4.54951 9.3845L8.00001 13.454L11.455 9.379C11.477 9.3515 11.594 9.1965 11.5945 9.196C12.1831 8.42056 12.5012 7.47352 12.5 6.5C12.5 5.30653 12.0259 4.16193 11.182 3.31802C10.3381 2.47411 9.19348 2 8.00001 2C6.80653 2 5.66194 2.47411 4.81803 3.31802C3.97411 4.16193 3.50001 5.30653 3.50001 6.5C3.49896 7.47412 3.81739 8.42171 4.40651 9.1975H4.40601Z" fill="white" />
    </Svg>
  );
}

function ShareIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Path d="M9 12C9 12.663 8.73661 13.2989 8.26777 13.7678C7.79893 14.2366 7.16304 14.5 6.5 14.5C5.83696 14.5 5.20107 14.2366 4.73223 13.7678C4.26339 13.2989 4 12.663 4 12C4 11.337 4.26339 10.7011 4.73223 10.2322C5.20107 9.76339 5.83696 9.5 6.5 9.5C7.16304 9.5 7.79893 9.76339 8.26777 10.2322C8.73661 10.7011 9 11.337 9 12Z" stroke="#9C9C9C" strokeWidth="1.5" />
      <Path d="M14 6.5L9 10M14 17.5L9 14" stroke="#9C9C9C" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M19 18.5C19 19.163 18.7366 19.7989 18.2678 20.2678C17.7989 20.7366 17.163 21 16.5 21C15.837 21 15.2011 20.7366 14.7322 20.2678C14.2634 19.7989 14 19.163 14 18.5C14 17.837 14.2634 17.2011 14.7322 16.7322C15.2011 16.2634 15.837 16 16.5 16C17.163 16 17.7989 16.2634 18.2678 16.7322C18.7366 17.2011 19 17.837 19 18.5ZM19 5.5C19 6.16304 18.7366 6.79893 18.2678 7.26777C17.7989 7.73661 17.163 8 16.5 8C15.837 8 15.2011 7.73661 14.7322 7.26777C14.2634 6.79893 14 6.16304 14 5.5C14 4.83696 14.2634 4.20107 14.7322 3.73223C15.2011 3.26339 15.837 3 16.5 3C17.163 3 17.7989 3.26339 18.2678 3.73223C18.7366 4.20107 19 4.83696 19 5.5Z" stroke="#9C9C9C" strokeWidth="1.5" />
    </Svg>
  );
}

function BannerCarousel() {
  const { width: SW } = useWindowDimensions();
  const BANNER_W = SW - Spacing.lg * 2;
  const [active, setActive] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive(prev => {
        const next = (prev + 1) % BANNER_SLIDES.length;
        scrollRef.current?.scrollTo({ x: next * BANNER_W, animated: true });
        return next;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, [BANNER_W]);

  return (
    <View style={bannerStyles.wrap}>
      <View style={[bannerStyles.slider, { width: BANNER_W }]}>
        <ScrollView
          ref={scrollRef}
          horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e => {
            setActive(Math.round(e.nativeEvent.contentOffset.x / BANNER_W));
          }}
        >
          {BANNER_SLIDES.map((slide, i) => (
            <View key={i} style={{ width: BANNER_W, height: 170 }}>
              <Image source={BANNER_IMG} style={{ width: BANNER_W, height: 170 }} contentFit="cover" />
              <View style={[StyleSheet.absoluteFill, bannerStyles.overlay, { backgroundColor: slide.tint }]}>
                <Text style={bannerStyles.slideTitle}>{slide.title}</Text>
                <Text style={bannerStyles.slideSub}>{slide.sub}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
      <View style={bannerStyles.dots}>
        {BANNER_SLIDES.map((_, i) => (
          <View key={i} style={[bannerStyles.dot, i === active && bannerStyles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const bannerStyles = StyleSheet.create({
  wrap: { marginHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  slider: { borderRadius: Radius.xl, overflow: 'hidden', ...Shadow.md },
  overlay: { padding: Spacing.lg, justifyContent: 'flex-end' },
  slideTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: '#fff', marginBottom: 2 },
  slideSub: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: 'rgba(255,255,255,0.88)' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: Spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 999, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.primary, width: 16 },
});

function SectionHeader({ title, onSeeAll, count, seeAllLabel = 'See all' }: {
  title: string; onSeeAll?: () => void; count?: number; seeAllLabel?: string;
}) {
  return (
    <View style={sh.row}>
      <View style={sh.left}>
        <Text style={sh.title}>{title}</Text>
        {count !== undefined && count > 0 && (
          <View style={sh.badge}><Text style={sh.badgeText}>{count}</Text></View>
        )}
      </View>
      {onSeeAll && (
        <Pressable onPress={onSeeAll}><Text style={sh.seeAll}>{seeAllLabel} &gt;</Text></Pressable>
      )}
    </View>
  );
}

const sh = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary, letterSpacing: -0.3 },
  badge: { backgroundColor: '#FF9800', borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 2, minWidth: 24, alignItems: 'center' },
  badgeText: { fontFamily: FontFamily.semiBold, fontSize: 11, color: Colors.textInverse },
  seeAll: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },
});

export default function HomeScreen() {
  const auth = useSelector(selectAuth);
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
      <LinearGradient colors={['#1B5E35', '#4CAF6F']} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={styles.header}>
        <View style={styles.headerRow1}>
          <Pressable
            style={styles.locationCol}
            onPress={() => { setLocationInput(locationText); setLocationModal(true); }}
          >
            <View style={styles.locationRow}>
              <LocationPinIcon />
              <Text style={styles.locationBrand}>YZAG Fresh</Text>
            </View>
            <View style={styles.locationRow}>
              <Text style={styles.locationSub} numberOfLines={1}>
                {locLoading ? '...' : (locationText || 'Visakhapatnam')}
              </Text>
              <Ionicons name="chevron-down" size={11} color={Colors.textInverse} style={{ opacity: 0.7, marginLeft: 2, marginTop: 1 }} />
            </View>
          </Pressable>
          <Pressable style={styles.bellBtn} onPress={() => router.push('/notifications' as any)}>
            <Ionicons name="notifications-outline" size={22} color={Colors.primary} />
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
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ height: Spacing.xl }} />

        <BannerCarousel />

        {/* Today's Rythu Bazar Rates */}
        <SectionHeader title="Today's Rythu Bazar Rates" count={rates.length} seeAllLabel="All prices" onSeeAll={() => router.push('/(tabs)/price' as any)} />
        <FlatList
          data={topRates}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={i => i.id}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: 9, paddingBottom: Spacing.sm }}
          renderItem={({ item, index }) => (
            <Pressable
              style={rateCard.card}
              onPress={() => router.push('/(tabs)/price' as any)}
            >
              <View style={rateCard.topRow}>
                <Text style={rateCard.te}>{item.te}</Text>
                <Pressable
                  onPress={() => guard({ type: 'TOGGLE_FAVOURITE', payload: item.id, returnTo: '/(tabs)/home' }, () => toggle(item.id))}
                  hitSlop={8}
                >
                  <Ionicons
                    name={ids.includes(item.id) ? 'heart' : 'heart-outline'}
                    size={16}
                    color={ids.includes(item.id) ? Colors.danger : Colors.textMuted}
                  />
                </Pressable>
              </View>
              <View style={[rateCard.imageArea, { backgroundColor: RATE_CIRCLE_COLORS[index % RATE_CIRCLE_COLORS.length] }]}>
                {item.image_url
                  ? <Image source={{ uri: item.image_url }} style={rateCard.img} contentFit="cover" />
                  : <Text style={rateCard.emoji}>{item.emoji}</Text>
                }
              </View>
              <Text style={rateCard.name}>{item.name}</Text>
              <View style={rateCard.priceRow}>
                <Text style={rateCard.price}>₹{item.today}/{item.unit}</Text>
                <Badge chg={item.chg} />
              </View>
            </Pressable>
          )}
        />

        {/* Favourite Items */}
        <View style={{ height: Spacing.xl }} />
        <SectionHeader title="❤️  Favourite Items" count={ids.length || undefined} onSeeAll={() => router.push({ pathname: '/(tabs)/price', params: { cat: 'favourite' } } as any)} />
        {favRates.length === 0 ? (
          <Text style={styles.emptyFav}>Tap ♡ on any rate card to add favourites</Text>
        ) : (
          <View style={favStyles.list}>
            {favRates.map((r) => (
              <View key={r.id} style={favStyles.card}>
                <View style={favStyles.row}>
                  <View style={favStyles.emojiCircle}>
                    {r.image_url
                      ? <Image source={{ uri: r.image_url }} style={favStyles.img} contentFit="cover" />
                      : <Text style={favStyles.emoji}>{r.emoji}</Text>
                    }
                  </View>
                  <View style={favStyles.nameCol}>
                    <Text style={favStyles.name}>{r.name}</Text>
                    <Text style={favStyles.te}>{r.te}</Text>
                  </View>
                  <View style={favStyles.priceCol}>
                    <Text style={favStyles.price}>₹{r.today}/{r.unit}</Text>
                    <Badge chg={r.chg} />
                  </View>
                  <Pressable
                    onPress={() => guard({ type: 'TOGGLE_FAVOURITE', payload: r.id, returnTo: '/(tabs)/home' }, () => toggle(r.id))}
                    style={favStyles.iconBtn}
                    hitSlop={6}
                  >
                    <Ionicons name={ids.includes(r.id) ? 'heart' : 'heart-outline'} size={20} color={ids.includes(r.id) ? Colors.danger : Colors.textMuted} />
                  </Pressable>
                  <Pressable style={favStyles.iconBtn} hitSlop={6}>
                    <ShareIcon />
                  </Pressable>
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
          columnWrapperStyle={{ gap: Spacing.sm, paddingHorizontal: Spacing.md }}
          contentContainerStyle={{ gap: Spacing.sm }}
          renderItem={({ item }) => <HomeProductCard item={item} />}
        />

        {/* Today's Prices */}
        <View style={{ height: Spacing.xl }} />
        <SectionHeader title="Today's Prices" onSeeAll={() => router.push('/(tabs)/price' as any)} />
        <View style={priceList.wrap}>
          {rates.slice(0, 8).map((r, i) => (
            <Pressable
              key={r.id}
              style={[priceList.row, i === Math.min(rates.length, 8) - 1 && { borderBottomWidth: 0 }]}
              onPress={() => router.push('/(tabs)/price' as any)}
            >
              <View style={[priceList.circle, { backgroundColor: RATE_CIRCLE_COLORS[i % RATE_CIRCLE_COLORS.length] }]}>
                {r.image_url
                  ? <Image source={{ uri: r.image_url }} style={priceList.img} contentFit="cover" />
                  : <Text style={priceList.emoji}>{r.emoji}</Text>
                }
              </View>
              <View style={priceList.meta}>
                <Text style={priceList.name}>{r.name}</Text>
                <Text style={priceList.unit}>{r.unit}</Text>
              </View>
              <View style={priceList.right}>
                <Text style={priceList.price}>₹{r.today}</Text>
                <Badge chg={r.chg} />
              </View>
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
  card: { width: 160, backgroundColor: Colors.surface, borderRadius: 16, padding: 12, ...Shadow.sm },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  te: { fontFamily: FontFamily.regular, fontSize: 11, color: Colors.textMuted, flex: 1 },
  imageArea: { height: 110, borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  img: { width: '100%', height: 110 } as any,
  emoji: { fontSize: 40 },
  name: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  price: { fontFamily: FontFamily.numBold, fontSize: FontSize.sm, color: Colors.primary },
});

const favStyles = StyleSheet.create({
  list: { marginHorizontal: Spacing.lg, gap: Spacing.sm },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: Spacing.md, gap: Spacing.sm },
  emojiCircle: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', backgroundColor: Colors.primaryPale, alignItems: 'center', justifyContent: 'center' },
  img: { width: 44, height: 44 },
  emoji: { fontSize: 22 },
  nameCol: { flex: 1 },
  name: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  te: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },
  priceCol: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 4 },
  price: { fontFamily: FontFamily.numBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  iconBtn: { padding: 4 },
});

const prodCard = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    overflow: 'hidden',
    ...Shadow.sm,
  },
  imgBox: { width: '100%', aspectRatio: 1 / 0.85, backgroundColor: '#F8F9FA', position: 'relative' },
  img: { width: '100%', height: '100%' },
  imgFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 52 },
  badge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: Colors.primaryAccent,
    borderRadius: Radius.sm, paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeText: { fontFamily: FontFamily.bold, fontSize: 10, color: '#fff' },
  info: { padding: Spacing.sm, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  name: { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.textPrimary, flexShrink: 1 },
  unit: { fontFamily: FontFamily.regular, fontSize: 11, color: Colors.textMuted },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  price: { fontFamily: FontFamily.numBold, fontSize: FontSize.md, color: Colors.textPrimary },
  orig: { fontFamily: FontFamily.num, fontSize: 10, color: Colors.textMuted, textDecorationLine: 'line-through' },
});

const priceList = StyleSheet.create({
  wrap: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadow.sm,
    marginBottom: Spacing.xxl,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  circle: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  img: { width: 44, height: 44 },
  emoji: { fontSize: 22 },
  meta: { flex: 1 },
  name: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  unit: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },
  right: { alignItems: 'flex-end', gap: 4 },
  price: { fontFamily: FontFamily.numBold, fontSize: FontSize.md, color: Colors.primary },
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
  container: { flex: 1, backgroundColor: '#F2F3F5' },
  header: { backgroundColor: Colors.primaryDark, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, paddingTop: Spacing.sm },
  headerRow1: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs },
  locationCol: { flexDirection: 'column', gap: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationBrand: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textInverse },
  locationSub: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', paddingLeft: 17 },
  bellBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  bellBadge: { position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: Colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  bellBadgeText: { fontFamily: FontFamily.bold, fontSize: 9, color: Colors.textInverse },
  headerRow2: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md, marginTop: Spacing.xs },
  greeting: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textInverse, letterSpacing: -0.3 },
  date: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, gap: Spacing.sm },
  searchInput: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textPrimary, padding: 0, outlineStyle: 'none' } as any,
  emptyFav: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
});
