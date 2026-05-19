import { useState } from 'react';
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

const FAQS = [
  { q: 'How are prices updated?', a: 'Prices are fetched from Rythu Bazar every morning between 6 AM and 8 AM and reflect the day\'s wholesale rates.' },
  { q: 'What is the delivery area?', a: 'We currently deliver across Visakhapatnam city — Gajuwaka, MVP Colony, Madhurawada, Rushikonda, and surrounding areas.' },
  { q: 'What are the delivery charges?', a: 'A flat delivery fee of ₹30 is applied to all orders. Orders above ₹500 get free delivery.' },
  { q: 'How do I cancel or modify an order?', a: 'Orders can be cancelled within 15 minutes of placing. Open My Orders, select the order and tap Cancel. Modifications are not supported after placement.' },
  { q: 'What payment methods are accepted?', a: 'We accept UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and Cash on Delivery.' },
  { q: 'Are the vegetables fresh?', a: 'Yes! All vegetables are sourced directly from Rythu Bazar farmers and local growers — delivered the same morning they are procured.' },
];

const CONTACTS = [
  { icon: 'call-outline',    label: 'Call Us',       sub: '+91 89195 00000', action: () => Linking.openURL('tel:+918919500000') },
  { icon: 'chatbubble-outline', label: 'WhatsApp',   sub: 'Chat with support', action: () => Linking.openURL('https://wa.me/918919500000') },
  { icon: 'mail-outline',    label: 'Email Us',      sub: 'support@vizagvegetables.in', action: () => Linking.openURL('mailto:support@vizagvegetables.in') },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable
        style={styles.faqRow}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setOpen(v => !v); }}
      >
        <Text style={styles.faqQ}>{q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
      </Pressable>
      {open && <Text style={styles.faqA}>{a}</Text>}
    </View>
  );
}

export default function Support() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Support</Text>
        <View style={{ width: 36 }} />
      </View>
      <Divider />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.xxl, gap: Spacing.lg, paddingBottom: 40 }}>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🤝</Text>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSub}>Our support team is available Mon–Sat, 8 AM – 8 PM</Text>
        </View>

        {/* Contact options */}
        <Text style={styles.sectionLabel}>CONTACT US</Text>
        <View style={styles.card}>
          {CONTACTS.map((c, i) => (
            <View key={c.label}>
              <Pressable
                style={styles.contactRow}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); c.action(); }}
              >
                <View style={styles.contactIconWrap}>
                  <Ionicons name={c.icon as any} size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactLabel}>{c.label}</Text>
                  <Text style={styles.contactSub}>{c.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </Pressable>
              {i < CONTACTS.length - 1 && <Divider />}
            </View>
          ))}
        </View>

        {/* FAQs */}
        <Text style={styles.sectionLabel}>FREQUENTLY ASKED QUESTIONS</Text>
        <View style={styles.card}>
          {FAQS.map((f, i) => (
            <View key={i}>
              <FAQItem q={f.q} a={f.a} />
              {i < FAQS.length - 1 && <Divider />}
            </View>
          ))}
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

  hero: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xxl, alignItems: 'center', gap: Spacing.sm, ...Shadow.sm },
  heroEmoji: { fontSize: 48 },
  heroTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary },
  heroSub: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },

  sectionLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 0.8, marginBottom: -Spacing.sm },

  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },

  contactRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  contactIconWrap: { width: 44, height: 44, borderRadius: Radius.full, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  contactLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  contactSub: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  faqRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, gap: Spacing.md },
  faqQ: { flex: 1, fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  faqA: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, lineHeight: 20 },
});
