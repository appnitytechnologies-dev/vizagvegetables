import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ScrollView, ActivityIndicator, Alert, Share, Platform, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { File as FSFile, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSelector } from 'react-redux';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { api, ApiProduct, imgUrl } from '../../lib/api';
import { Image } from 'expo-image';
import { selectAuth } from '../../store/authSlice';
import { useFavourites } from '../../hooks/useFavourites';
import Badge from '../../components/ui/Badge';

const SCREEN_W = Dimensions.get('window').width;
const H_PAD    = Spacing.md;
const COL_GAP  = Spacing.sm;
const CARD_W   = (SCREEN_W - H_PAD * 2 - COL_GAP) / 2;
const IMG_H    = CARD_W * 0.85;

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

type Category = 'all' | 'vegetables' | 'fruits' | 'leafy' | 'flowers' | 'favourite';
const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'favourite', label: 'Favorite' },
  { key: 'vegetables', label: 'Vegetables' },
  { key: 'fruits', label: 'Fruits' },
  { key: 'flowers', label: 'Flowers' },
  { key: 'leafy', label: 'Leafs' },
];


function ShareIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Path d="M9 12C9 12.663 8.73661 13.2989 8.26777 13.7678C7.79893 14.2366 7.16304 14.5 6.5 14.5C5.83696 14.5 5.20107 14.2366 4.73223 13.7678C4.26339 13.2989 4 12.663 4 12C4 11.337 4.26339 10.7011 4.73223 10.2322C5.20107 9.76339 5.83696 9.5 6.5 9.5C7.16304 9.5 7.79893 9.76339 8.26777 10.2322C8.73661 10.7011 9 11.337 9 12Z" stroke="#9C9C9C" strokeWidth="1.5" />
      <Path d="M14 6.5L9 10M14 17.5L9 14" stroke="#9C9C9C" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M19 18.5C19 19.163 18.7366 19.7989 18.2678 20.2678C17.7989 20.7366 17.163 21 16.5 21C15.837 21 15.2011 20.7366 14.7322 20.2678C14.2634 19.7989 14 19.163 14 18.5C14 17.837 14.2634 17.2011 14.7322 16.7322C15.2011 16.2634 15.837 16 16.5 16C17.163 16 17.7989 16.2634 18.2678 16.7322C18.7366 17.2011 19 17.837 19 18.5ZM19 5.5C19 6.16304 18.7366 6.79893 18.2678 7.26777C17.7989 7.73661 17.163 8 16.5 8C15.837 8 15.2011 7.73661 14.7322 7.26777C14.2634 6.79893 14 6.16304 14 5.5C14 4.83696 14.2634 4.20107 14.7322 3.73223C15.2011 3.26339 15.837 3 16.5 3C17.163 3 17.7989 3.26339 18.2678 3.73223C18.7366 4.20107 19 4.83696 19 5.5Z" stroke="#9C9C9C" strokeWidth="1.5" />
    </Svg>
  );
}

async function handleShare(item: MarketRate) {
  const message =
    `🛒 ${item.name} (${item.te})\n` +
    `💰 ₹${item.today}/${item.unit} today at Rythu Bazar, Vizag\n` +
    (item.chg > 0
      ? `📈 Up ₹${item.chg} from yesterday\n`
      : item.chg < 0
      ? `📉 Down ₹${Math.abs(item.chg)} from yesterday\n`
      : '') +
    `\n🌿 Check live rates: https://yzagfresh.in/prices`;

  try {
    // On native, try to share with the product image
    if (Platform.OS !== 'web' && item.image_url) {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        const ext = item.image_url.split('.').pop()?.split('?')[0] || 'jpg';
        const localFile = await FSFile.downloadFileAsync(
          item.image_url,
          new FSFile(Paths.cache, `share_${item.id}.${ext}`)
        );
        await Sharing.shareAsync(localFile.uri, {
          mimeType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
          dialogTitle: message,
          UTI: ext === 'png' ? 'public.png' : 'public.jpeg',
        });
        return;
      }
    }
    // Web and native fallback: share text via native share sheet / navigator.share
    await Share.share({ message });
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      Alert.alert('Share failed', 'Could not share this item right now.');
    }
  }
}

function PriceRowItem({ item, isFav, onToggleFav }: { item: MarketRate; isFav: boolean; onToggleFav: () => void }) {
  return (
    <View style={listStyles.row}>
      {/* Image */}
      <View style={listStyles.imgWrap}>
        {item.image_url
          ? <Image source={{ uri: item.image_url }} style={listStyles.img} contentFit="contain" />
          : <Text style={listStyles.emoji}>{item.emoji}</Text>
        }
      </View>

      {/* Info */}
      <View style={listStyles.info}>
        {!!item.te && <Text style={listStyles.te} numberOfLines={1}>{item.te}</Text>}
        <Text style={listStyles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={listStyles.price}>
          ₹{item.today}<Text style={listStyles.unit}>/{item.unit}</Text>
        </Text>
      </View>

      {/* Right: badge + actions */}
      <View style={listStyles.right}>
        <Badge chg={item.chg} />
        <View style={listStyles.actions}>
          <Pressable onPress={onToggleFav} hitSlop={8}>
            <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={16} color={isFav ? Colors.danger : Colors.textMuted} />
          </Pressable>
          <Pressable onPress={() => handleShare(item)} hitSlop={8}>
            <ShareIcon />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function PriceGridItem({ item, isFav, onToggleFav }: { item: MarketRate; isFav: boolean; onToggleFav: () => void }) {
  return (
    <View style={gridStyles.card}>
      {/* Image area */}
      <View style={gridStyles.imgBox}>
        {item.image_url
          ? <Image source={{ uri: item.image_url }} style={gridStyles.img} contentFit="contain" />
          : <View style={gridStyles.imgFallback}><Text style={gridStyles.emoji}>{item.emoji}</Text></View>
        }
        {/* Heart overlay */}
        <Pressable style={gridStyles.heartBtn} onPress={onToggleFav} hitSlop={6}>
          <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={15} color={isFav ? Colors.danger : Colors.textMuted} />
        </Pressable>
      </View>

      {/* Info area */}
      <View style={gridStyles.info}>
        <View style={gridStyles.nameRow}>
          <Text style={gridStyles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={gridStyles.unit}>{item.unit}</Text>
        </View>
        {!!item.te && <Text style={gridStyles.te} numberOfLines={1}>{item.te}</Text>}
        <View style={gridStyles.footer}>
          <View style={gridStyles.priceRow}>
            <Text style={gridStyles.price}>₹{item.today}</Text>
            {item.prev > 0 && item.prev !== item.today && (
              <Text style={gridStyles.prev}>₹{item.prev}</Text>
            )}
          </View>
          <View style={gridStyles.footerRight}>
            <Badge chg={item.chg} />
            <Pressable onPress={() => handleShare(item)} hitSlop={8}>
              <ShareIcon />
            </Pressable>
          </View>
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
  const auth = useSelector(selectAuth);

  const handleToggleFav = (id: string) => {
    if (!auth.isLoggedIn) {
      Alert.alert(
        'Login Required',
        'Please log in to save favourites',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/(auth)/otp-number' as any) },
        ]
      );
      return;
    }
    toggle(id);
  };

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

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      <LinearGradient
        colors={['#1B5E35', '#4CAF6F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.4, y: 1 }}
        style={styles.header}
      >
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Today's Prices</Text>
            <Text style={styles.telugu}>రైతు బజార్ కూరగాయల ధరలు</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.date}>{today}</Text>
            <Text style={styles.updated}>Updated 7:00 AM</Text>
          </View>
        </View>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder={`${rates.length} items  Search vegetables, fruits, flowers...`}
              placeholderTextColor={Colors.textMuted}
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <Pressable style={styles.toggleBtn} onPress={() => setIsGrid(g => !g)}>
            <Ionicons name={isGrid ? 'list-outline' : 'grid-outline'} size={16} color={Colors.primary} />
            <Text style={styles.toggleText}>{isGrid ? 'List' : 'Grid'}</Text>
          </Pressable>
        </View>
      </LinearGradient>

      <View style={styles.chipsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={styles.chipsContent}>
          {CATEGORIES.map(c => (
            <Pressable key={c.key} style={[styles.tab, category === c.key && styles.tabActive]} onPress={() => setCategory(c.key)}>
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
          contentContainerStyle={{ gap: COL_GAP, paddingTop: Spacing.md, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <PriceGridItem item={item} isFav={ids.includes(item.id)} onToggleFav={() => handleToggleFav(item.id)} />
          )}
        />
      ) : (
        <FlatList
          key="list"
          data={filtered}
          keyExtractor={i => i.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: Spacing.md, paddingBottom: 100, gap: Spacing.sm }}
          renderItem={({ item }) => <PriceRowItem item={item} isFav={ids.includes(item.id)} onToggleFav={() => handleToggleFav(item.id)} />}
        />
      )}
    </SafeAreaView>
  );
}

const listStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  imgWrap: {
    width: 56, height: 56, borderRadius: Radius.md,
    backgroundColor: '#F8F9FA',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', flexShrink: 0,
  },
  img: { width: 56, height: 56 },
  emoji: { fontSize: 28 },
  info: { flex: 1, gap: 2 },
  te: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },
  name: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  price: { fontFamily: FontFamily.numBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  unit: { fontFamily: FontFamily.num, fontSize: FontSize.xs, color: Colors.textMuted },
  prev: { fontFamily: FontFamily.num, fontSize: FontSize.xs, color: Colors.textMuted, textDecorationLine: 'line-through' },
  right: { alignItems: 'flex-end', gap: Spacing.xs },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});

const gridStyles = StyleSheet.create({
  card: {
    width: CARD_W, backgroundColor: Colors.surface,
    borderRadius: Radius.xl, borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)', overflow: 'hidden', ...Shadow.sm,
  },
  imgBox: { width: CARD_W, height: IMG_H, backgroundColor: '#F8F9FA', position: 'relative' },
  img: { width: '100%', height: '100%' },
  imgFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 52 },
  heartBtn: {
    position: 'absolute', top: 6, right: 6,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  info: { padding: Spacing.sm, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  name: { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.textPrimary, flexShrink: 1 },
  unit: { fontFamily: FontFamily.regular, fontSize: 11, color: Colors.textMuted },
  te: { fontFamily: FontFamily.regular, fontSize: 11, color: Colors.textMuted },
  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  price: { fontFamily: FontFamily.numBold, fontSize: FontSize.md, color: Colors.textPrimary },
  prev: { fontFamily: FontFamily.num, fontSize: 10, color: Colors.textMuted, textDecorationLine: 'line-through' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F3F5' },
  header: { backgroundColor: '#206B3A', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.lg, borderBottomLeftRadius: Radius.xl, borderBottomRightRadius: Radius.xl, overflow: 'hidden' },
  headerLightStrip: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '48%', backgroundColor: 'rgba(83,177,117,0.55)' } as any,
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.xxxl, color: Colors.textInverse, letterSpacing: -0.5 },
  telugu: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  date: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textInverse },
  updated: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  searchRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
  searchInput: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textPrimary, padding: 0, outlineStyle: 'none' } as any,
  toggleBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: 4, ...Shadow.sm },
  toggleText: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.primaryDark },
  chipsRow: { paddingVertical: Spacing.sm, backgroundColor: Colors.surface },
  chipsContent: { paddingHorizontal: Spacing.lg, alignItems: 'center', gap: Spacing.sm },
  tab: { borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: 8, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primaryDark, borderColor: Colors.primaryDark },
  tabLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary },
  tabLabelActive: { color: Colors.textInverse },
});
