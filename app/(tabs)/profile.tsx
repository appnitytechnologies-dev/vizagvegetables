import { View, Text, StyleSheet, Pressable, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { user } from '../../dummy-data/user';

function SettingRow({ icon, label, badge, onPress, showArrow = true }: {
  icon: string; label: string; badge?: number; onPress?: () => void; showArrow?: boolean;
}) {
  return (
    <Pressable style={row.wrap} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress?.(); }}>
      <View style={row.iconWrap}>
        <Ionicons name={icon as any} size={18} color={Colors.primary} />
      </View>
      <Text style={row.label}>{label}</Text>
      {badge !== undefined && badge > 0 && (
        <View style={row.badge}><Text style={row.badgeText}>{badge}</Text></View>
      )}
      {showArrow && <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
    </Pressable>
  );
}

function ToggleRow({ icon, label, subtitle }: { icon: string; label: string; subtitle: string }) {
  const [enabled, setEnabled] = useState(true);
  return (
    <View style={row.wrap}>
      <View style={row.iconWrap}>
        <Ionicons name={icon as any} size={18} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={row.label}>{label}</Text>
        <Text style={row.sub}>{subtitle}</Text>
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

const row = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.md },
  iconWrap: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textPrimary },
  sub: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },
  badge: { backgroundColor: Colors.danger, borderRadius: Radius.full, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { fontFamily: FontFamily.bold, fontSize: 10, color: Colors.textInverse },
});

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{user.initials}</Text>
            <Pressable style={styles.editBtn}>
              <Ionicons name="pencil" size={12} color={Colors.textInverse} />
            </Pressable>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.phone}>{user.phone}</Text>
          <View style={styles.statsPill}>
            <Text style={styles.statsText}>{user.orders} Orders</Text>
            <View style={styles.statsDot} />
            <Text style={styles.statsText}>{user.favourites} Favourites</Text>
            <View style={styles.statsDot} />
            <Text style={styles.statsText}>{user.addresses.length} Addresses</Text>
          </View>
        </View>

        {/* My Account */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>MY ACCOUNT</Text>
          <View style={styles.sep} />
          <SettingRow icon="receipt-outline" label="My Orders" badge={2} onPress={() => router.push('/my-orders' as any)} />
          <View style={styles.sep} />
          <SettingRow icon="heart-outline" label="Saved Favourites" onPress={() => router.push('/saved-favourites' as any)} />
          <View style={styles.sep} />
          <SettingRow icon="location-outline" label="Addresses" onPress={() => router.push('/addresses' as any)} />
        </View>

        {/* Notifications */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>NOTIFICATIONS</Text>
          <View style={styles.sep} />
          <ToggleRow icon="pricetag-outline" label="Price Alerts" subtitle="Get notified on price drops" />
          <View style={styles.sep} />
          <ToggleRow icon="cart-outline" label="Order Updates" subtitle="Track your order status" />
          <View style={styles.sep} />
          <ToggleRow icon="megaphone-outline" label="Offers & Deals" subtitle="Daily Rythu Bazar specials" />
        </View>

        {/* More */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>MORE</Text>
          <View style={styles.sep} />
          <SettingRow icon="headset-outline" label="Support" onPress={() => router.push('/support' as any)} />
          <View style={styles.sep} />
          <SettingRow icon="information-circle-outline" label="About Us" onPress={() => router.push('/about-us' as any)} />
        </View>

        {/* Logout */}
        <Pressable
          style={styles.logoutBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.replace('/(auth)/get-started' as any);
          }}
        >
          <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

        <Text style={styles.footer}>Vizag Vegetables v1.0.0 · Made with ❤️ in Vizag</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  hero: { backgroundColor: Colors.primary, alignItems: 'center', paddingVertical: Spacing.xxxl, paddingHorizontal: Spacing.xxl },
  avatarWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md, position: 'relative' },
  avatarText: { fontFamily: FontFamily.bold, fontSize: FontSize.xxl, color: Colors.textInverse },
  editBtn: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primaryAccent, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textInverse, marginBottom: 4 },
  phone: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.lg },
  statsPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, gap: Spacing.sm },
  statsText: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.textInverse },
  statsDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.5)' },
  card: { marginHorizontal: Spacing.xxl, marginTop: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  cardTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.textMuted, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm, letterSpacing: 0.8 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginHorizontal: Spacing.lg },
  logoutBtn: { marginHorizontal: Spacing.xxl, marginTop: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.lg, paddingVertical: Spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, ...Shadow.sm },
  logoutText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.danger },
  footer: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xl, marginBottom: Spacing.md },
});
