import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { ApiMarket, imgUrl } from '../lib/api';
import { UserLocation, isOpenNow } from '../lib/marketsData';
import { haversineKm, formatKm } from '../utils/distance';

/** Row used by the Rythu Bazars and Local Markets list screens: thumbnail,
 *  rating, distance/hours, an open/closed pill and a chevron to drill in. */
export default function MarketListRow({ m, userLocation }: { m: ApiMarket; userLocation: UserLocation }) {
  const open     = isOpenNow(m.open_hour, m.close_hour);
  const firstImg = m.images?.[0] ? imgUrl(m.images[0]) : null;
  const dist = userLocation && m.lat && m.lng
    ? formatKm(haversineKm(userLocation.lat, userLocation.lng, m.lat, m.lng))
    : m.distance_km ? `${m.distance_km} km` : null;

  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push({ pathname: '/market-detail', params: { id: m.id } } as any)}
    >
      <View style={[styles.img, { backgroundColor: m.bg_color }]}>
        {firstImg
          ? <Image source={{ uri: firstImg }} style={StyleSheet.absoluteFill} contentFit="cover" />
          : <Text style={styles.emoji}>🏪</Text>
        }
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{m.name}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="star" size={12} color="#F59E0B" />
          <Text style={styles.meta}>{m.rating}</Text>
          {m.reviews_count > 0 && <Text style={styles.meta}>({m.reviews_count} reviews)</Text>}
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={11} color={Colors.textMuted} />
          <Text style={styles.meta}>{dist ?? '—'}</Text>
          <Ionicons name="time-outline" size={11} color={Colors.textMuted} style={{ marginLeft: 4 }} />
          <Text style={styles.meta}>{m.opens} – {m.closes}</Text>
        </View>
        <View style={[styles.statusPill, open ? styles.openPill : styles.closedPill]}>
          <Text style={[styles.statusText, open ? styles.openText : styles.closedText]}>
            {open ? 'Open' : 'Closed'}
          </Text>
        </View>
      </View>

      <View style={styles.chevron}>
        <Ionicons name="chevron-forward" size={16} color={Colors.primaryAccent} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, gap: Spacing.md, ...Shadow.sm,
  },
  img: { width: 68, height: 68, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  emoji: { fontSize: 30 },
  info: { flex: 1, gap: 4 },
  name: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  meta: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },
  statusPill: { alignSelf: 'flex-start', borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 2, marginTop: 2 },
  openPill: { backgroundColor: Colors.successLight },
  closedPill: { backgroundColor: Colors.dangerLight },
  statusText: { fontFamily: FontFamily.bold, fontSize: 10 },
  openText: { color: Colors.success },
  closedText: { color: Colors.danger },
  chevron: {
    width: 30, height: 30, borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
});
