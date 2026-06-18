import { View, Text, StyleSheet, Pressable, ScrollView, Switch, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { selectAuth, logout as logoutAction, setAvatarUrl } from '../../store/authSlice';
import { clearToken, api, ApiOrder, imgUrl } from '../../lib/api';
import { useFavourites } from '../../hooks/useFavourites';
import { clearFavourites } from '../../store/favouritesSlice';
import { AppDispatch } from '../../store';

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

/* ── Menu item ──────────────────────────────────────────── */
function MenuItem({ icon, bg, label, badge, value, onPress }: {
  icon: string; bg: string; label: string;
  badge?: number; value?: string; onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [menu.row, pressed && { backgroundColor: Colors.primaryPale }]}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress?.(); }}
    >
      <View style={[menu.iconBox, { backgroundColor: bg }]}>
        <Ionicons name={icon as any} size={18} color="#fff" />
      </View>
      <Text style={menu.label}>{label}</Text>
      {badge !== undefined && badge > 0 && (
        <View style={menu.badge}><Text style={menu.badgeText}>{badge}</Text></View>
      )}
      {value ? <Text style={menu.value}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={15} color={Colors.textMuted} />
    </Pressable>
  );
}

/* ── Toggle item ────────────────────────────────────────── */
function ToggleItem({ icon, bg, label, subtitle }: {
  icon: string; bg: string; label: string; subtitle: string;
}) {
  const [enabled, setEnabled] = useState(true);
  return (
    <View style={menu.row}>
      <View style={[menu.iconBox, { backgroundColor: bg }]}>
        <Ionicons name={icon as any} size={18} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={menu.label}>{label}</Text>
        <Text style={menu.sub}>{subtitle}</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={setEnabled}
        trackColor={{ true: Colors.primary, false: Colors.border }}
        thumbColor={Colors.surface}
      />
    </View>
  );
}

const menu = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: 13,
    gap: Spacing.md, backgroundColor: Colors.surface,
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textPrimary },
  sub: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  value: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted },
  badge: {
    backgroundColor: Colors.danger, borderRadius: Radius.full,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  badgeText: { fontFamily: FontFamily.bold, fontSize: 11, color: '#fff' },
});

/* ── Screen ─────────────────────────────────────────────── */
export default function ProfileScreen() {
  const auth     = useSelector(selectAuth);
  const dispatch = useDispatch<AppDispatch>();
  const { ids }  = useFavourites();
  const [orderCount,    setOrderCount]    = useState(0);
  const [allProducts,   setAllProducts]   = useState<{ id: string }[]>([]);

  const favProductCount = allProducts.filter(p => ids.includes(p.id)).length;

  const initials  = getInitials(auth.name) || 'U';
  const avatarUrl = auth.avatarUrl;

  useEffect(() => {
    if (!auth.isLoggedIn) return;
    api.get<ApiOrder[]>('/api/orders/my').then(o => setOrderCount(o.length)).catch(() => {});
    api.get<{ avatar_url?: string | null }>('/api/users/profile')
      .then(d => { if (d.avatar_url) dispatch(setAvatarUrl(imgUrl(d.avatar_url))); })
      .catch(() => {});
    api.get<{ id: string }[]>('/api/products?limit=500')
      .then(ps => setAllProducts(ps))
      .catch(() => {});
  }, [auth.isLoggedIn]);

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await clearToken();
    dispatch(logoutAction());
    dispatch(clearFavourites());
    router.replace('/(auth)/get-started' as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── Green gradient hero ────────────────── */}
        <LinearGradient
          colors={['#1B5E35', '#2E7D32']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroTitle}>Profile</Text>

          <View style={styles.heroUser}>
            {/* Avatar */}
            <Pressable style={styles.avatarWrap} onPress={() => router.push('/edit-profile' as any)}>
              {avatarUrl
                ? <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
                : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </View>
                )
              }
              <View style={styles.cameraRing}>
                <Ionicons name="camera" size={11} color="#fff" />
              </View>
            </Pressable>

            {/* Info */}
            <View style={styles.userMeta}>
              <Text style={styles.userName}>{auth.name || 'My Account'}</Text>
              <Text style={styles.userPhone}>{auth.phone ? `+91 ${auth.phone}` : ''}</Text>
              <Pressable style={styles.editBtn} onPress={() => router.push('/edit-profile' as any)}>
                <Ionicons name="pencil-outline" size={11} color="#fff" />
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </Pressable>
            </View>
          </View>
        </LinearGradient>

        {/* ── Stats strip ───────────────────────── */}
        <View style={styles.statsCard}>
          <Pressable style={styles.statItem} onPress={() => router.push('/my-orders' as any)}>
            <Text style={styles.statNum}>{orderCount}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </Pressable>
          <View style={styles.statLine} />
          <Pressable style={styles.statItem} onPress={() => router.push('/saved-favourites' as any)}>
            <Text style={styles.statNum}>{favProductCount}</Text>
            <Text style={styles.statLabel}>Favourites</Text>
          </Pressable>
          <View style={styles.statLine} />
          <Pressable style={styles.statItem} onPress={() => router.push('/addresses' as any)}>
            <Ionicons name="location-outline" size={22} color={Colors.primary} />
            <Text style={styles.statLabel}>Addresses</Text>
          </Pressable>
        </View>

        {/* ── My Account ────────────────────────── */}
        <Text style={styles.section}>MY ACCOUNT</Text>
        <View style={styles.card}>
          <MenuItem icon="bag-handle-outline" bg="#F59E0B" label="My Orders"
            badge={orderCount} onPress={() => router.push('/my-orders' as any)} />
          <View style={styles.sep} />
          <MenuItem icon="heart-outline" bg="#EF4444" label="Saved Favourites"
            onPress={() => router.push('/saved-favourites' as any)} />
          <View style={styles.sep} />
          <MenuItem icon="location-outline" bg="#3B82F6" label="Manage Addresses"
            onPress={() => router.push('/addresses' as any)} />
          <View style={styles.sep} />
          <MenuItem icon="person-outline" bg={Colors.primaryAccent} label="Edit Profile"
            onPress={() => router.push('/edit-profile' as any)} />
        </View>

        {/* ── Notifications ─────────────────────── */}
        <Text style={styles.section}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <ToggleItem icon="pricetag-outline"  bg="#8B5CF6" label="Price Alerts"   subtitle="Get notified on price drops" />
          <View style={styles.sep} />
          <ToggleItem icon="cart-outline"      bg="#F59E0B" label="Order Updates"  subtitle="Track your order status" />
          <View style={styles.sep} />
          <ToggleItem icon="megaphone-outline" bg="#EC4899" label="Offers & Deals" subtitle="Daily Rythu Bazar specials" />
        </View>

        {/* ── More ──────────────────────────────── */}
        <Text style={styles.section}>MORE</Text>
        <View style={styles.card}>
          <MenuItem icon="headset-outline"             bg="#06B6D4" label="Customer Support"
            onPress={() => router.push('/support' as any)} />
          <View style={styles.sep} />
          <MenuItem icon="information-circle-outline"  bg={Colors.primary} label="About Us"
            onPress={() => router.push('/about-us' as any)} />
        </View>

        {/* ── Logout ────────────────────────────── */}
        <Pressable style={styles.logoutRow} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

        <Text style={styles.footer}>YZAG Fresh v1.0.0 · Made with ❤️ in Vizag</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F3F5' },

  /* green hero */
  hero: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  heroTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: '#fff' },
  heroUser:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },

  avatarWrap: { position: 'relative' },
  avatarImg: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  avatarFallback: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontFamily: FontFamily.bold, fontSize: 26, color: '#fff' },
  cameraRing: {
    position: 'absolute', bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  userMeta: { flex: 1, gap: 3 },
  userName:  { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: '#fff' },
  userPhone: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  editBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: '#fff' },

  /* stats strip — pulled up to overlap the hero */
  statsCard: {
    marginHorizontal: Spacing.lg, marginTop: -Spacing.xl,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    flexDirection: 'row', ...Shadow.md, overflow: 'hidden',
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.lg, gap: 4 },
  statNum: { fontFamily: FontFamily.numBold, fontSize: 22, color: Colors.primary },
  statLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },
  statLine: { width: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginVertical: Spacing.md },

  /* sections */
  section: {
    fontFamily: FontFamily.semiBold, fontSize: 11, color: Colors.textMuted,
    letterSpacing: 0.8, paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xl, marginBottom: Spacing.sm,
  },
  card: {
    marginHorizontal: Spacing.lg, backgroundColor: Colors.surface,
    borderRadius: Radius.xl, overflow: 'hidden', ...Shadow.sm,
  },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginLeft: 68 },

  /* logout */
  logoutRow: {
    marginHorizontal: Spacing.lg, marginTop: Spacing.xl,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    paddingVertical: Spacing.lg, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, ...Shadow.sm,
  },
  logoutText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.danger },

  footer: {
    fontFamily: FontFamily.regular, fontSize: FontSize.xs,
    color: Colors.textMuted, textAlign: 'center',
    marginTop: Spacing.xl, marginBottom: Spacing.sm,
  },
});
