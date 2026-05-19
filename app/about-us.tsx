import { View, Text, StyleSheet, Pressable, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import Divider from '../components/ui/Divider';

const STATS = [
  { value: '20+',  label: 'Vegetables' },
  { value: '4',    label: 'Markets' },
  { value: '2K+',  label: 'Happy Users' },
  { value: '100%', label: 'Fresh' },
];

const TEAM = [
  { initials: 'RK', name: 'Ravi Kumar',  role: 'Founder & CEO' },
  { initials: 'SL', name: 'Sita Lakshmi', role: 'Operations Head' },
  { initials: 'MR', name: 'Mohan Rao',   role: 'Tech Lead' },
];

const LINKS = [
  { label: 'Privacy Policy',    icon: 'shield-checkmark-outline', url: 'https://vizagvegetables.in/privacy' },
  { label: 'Terms of Service',  icon: 'document-text-outline',    url: 'https://vizagvegetables.in/terms' },
  { label: 'Rate the App',      icon: 'star-outline',             url: 'https://play.google.com' },
  { label: 'Follow on Instagram', icon: 'logo-instagram',         url: 'https://instagram.com' },
];

export default function AboutUs() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>About Us</Text>
        <View style={{ width: 36 }} />
      </View>
      <Divider />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Hero brand block */}
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoEmoji}>🥦</Text>
          </View>
          <Text style={styles.brandName}>Vizag Vegetables</Text>
          <Text style={styles.brandTagline}>Farm to Table · Rythu Bazar Prices</Text>
          <View style={styles.versionChip}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>

        {/* Stats strip */}
        <View style={styles.statsRow}>
          {STATS.map(s => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ padding: Spacing.xxl, gap: Spacing.lg }}>

          {/* Mission */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="leaf-outline" size={18} color={Colors.primary} />
              <Text style={styles.cardTitle}>Our Mission</Text>
            </View>
            <Text style={styles.cardBody}>
              We connect Vizag residents with the freshest vegetables straight from Rythu Bazar. By making daily market prices transparent and deliveries easy, we support both local farmers and households across Visakhapatnam.
            </Text>
          </View>

          {/* Team */}
          <Text style={styles.sectionLabel}>THE TEAM</Text>
          <View style={styles.card}>
            {TEAM.map((t, i) => (
              <View key={t.name}>
                <View style={styles.teamRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{t.initials}</Text>
                  </View>
                  <View>
                    <Text style={styles.memberName}>{t.name}</Text>
                    <Text style={styles.memberRole}>{t.role}</Text>
                  </View>
                </View>
                {i < TEAM.length - 1 && <Divider />}
              </View>
            ))}
          </View>

          {/* Links */}
          <Text style={styles.sectionLabel}>MORE</Text>
          <View style={styles.card}>
            {LINKS.map((l, i) => (
              <View key={l.label}>
                <Pressable
                  style={styles.linkRow}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL(l.url); }}
                >
                  <View style={styles.linkIconWrap}>
                    <Ionicons name={l.icon as any} size={17} color={Colors.primary} />
                  </View>
                  <Text style={styles.linkLabel}>{l.label}</Text>
                  <Ionicons name="open-outline" size={14} color={Colors.textMuted} />
                </Pressable>
                {i < LINKS.length - 1 && <Divider />}
              </View>
            ))}
          </View>

          <Text style={styles.footer}>Made with ❤️ in Visakhapatnam{'\n'}© 2026 Vizag Vegetables. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface },
  backBtn: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },

  hero: { backgroundColor: Colors.primary, alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.sm },
  logoWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  logoEmoji: { fontSize: 44 },
  brandName: { fontFamily: FontFamily.bold, fontSize: FontSize.xxl, color: Colors.textInverse, letterSpacing: -0.3 },
  brandTagline: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)' },
  versionChip: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 3, marginTop: Spacing.xs },
  versionText: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.textInverse },

  statsRow: { flexDirection: 'row', backgroundColor: Colors.surface, ...Shadow.sm },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.lg, gap: 2 },
  statValue: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.primary },
  statLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },

  sectionLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 0.8 },

  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  cardTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary },
  cardBody: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },

  teamRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.primary },
  memberName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  memberRole: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  linkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  linkIconWrap: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  linkLabel: { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textPrimary },

  footer: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
});
