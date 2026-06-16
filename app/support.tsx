import { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  Linking, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import Divider from '../components/ui/Divider';
import PageHeader from '../components/ui/PageHeader';
import { api } from '../lib/api';

const FAQS = [
  { q: 'How are prices updated?', a: 'Prices are fetched from Rythu Bazar every morning between 6 AM and 8 AM and reflect the day\'s wholesale rates.' },
  { q: 'What is the delivery area?', a: 'We currently deliver across Visakhapatnam city — Gajuwaka, MVP Colony, Madhurawada, Rushikonda, and surrounding areas.' },
  { q: 'What are the delivery charges?', a: 'A flat delivery fee of ₹30 is applied to all orders. Orders above ₹500 get free delivery.' },
  { q: 'How do I cancel or modify an order?', a: 'Orders can be cancelled within 15 minutes of placing. Open My Orders, select the order and tap Cancel. Modifications are not supported after placement.' },
  { q: 'What payment methods are accepted?', a: 'We accept UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and Cash on Delivery.' },
  { q: 'Are the vegetables fresh?', a: 'Yes! All vegetables are sourced directly from Rythu Bazar farmers and local growers — delivered the same morning they are procured.' },
];

const CONTACTS = [
  { icon: 'call-outline',       label: 'Call Us',    sub: '+91 89195 00000',             action: () => Linking.openURL('tel:+918919500000') },
  { icon: 'chatbubble-outline', label: 'WhatsApp',   sub: 'Chat with support',           action: () => Linking.openURL('https://wa.me/918919500000') },
  { icon: 'mail-outline',       label: 'Email Us',   sub: 'support@vizagvegetables.in',  action: () => Linking.openURL('mailto:support@vizagvegetables.in') },
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

type FormField = 'name' | 'phone' | 'email' | 'message';

export default function Support() {
  const [form,     setForm]     = useState({ name: '', phone: '', email: '', message: '' });
  const [errors,   setErrors]   = useState({ name: '', phone: '', email: '', message: '' });
  const [sent,     setSent]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState('');

  const setField = (field: FormField, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const e = { name: '', phone: '', email: '', message: '' };
    if (!form.name.trim())
      e.name = 'Name is required';
    else if (form.name.trim().length < 2)
      e.name = 'Name must be at least 2 characters';

    if (!form.phone.trim())
      e.phone = 'Phone number is required';
    else if (!/^[6-9]\d{9}$/.test(form.phone.trim()))
      e.phone = 'Enter a valid 10-digit mobile number';

    if (!form.message.trim())
      e.message = 'Message is required';
    else if (form.message.trim().length < 10)
      e.message = 'Message must be at least 10 characters';

    setErrors(e);
    return !e.name && !e.phone && !e.message;
  };

  const handleSubmit = async () => {
    setApiError('');
    if (!validate()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await api.post('/api/support', form);
      setSent(true);
      setForm({ name: '', phone: '', email: '', message: '' });
      setErrors({ name: '', phone: '', email: '', message: '' });
    } catch (err: any) {
      setApiError(err.message || 'Failed to send. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <PageHeader title="Support" fallback="/(tabs)/profile" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: Spacing.xxl, gap: Spacing.lg, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
        >
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

          {/* Send a Message form */}
          <Text style={styles.sectionLabel}>SEND A MESSAGE</Text>
          <View style={styles.card}>
            {sent ? (
              <View style={styles.sentWrap}>
                <Text style={styles.sentEmoji}>✅</Text>
                <Text style={styles.sentTitle}>Message sent!</Text>
                <Text style={styles.sentSub}>We'll get back to you within 24 hours.</Text>
                <Pressable onPress={() => setSent(false)} style={styles.sendAnotherBtn}>
                  <Text style={styles.sendAnotherText}>Send Another</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ padding: Spacing.lg, gap: Spacing.md }}>
                {/* Name */}
                <View>
                  <Text style={styles.fieldLabel}>Your Name</Text>
                  <TextInput
                    style={[styles.input, errors.name ? styles.inputError : null]}
                    placeholder="Ravi Kumar"
                    placeholderTextColor={Colors.textMuted}
                    value={form.name}
                    onChangeText={v => setField('name', v)}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                  {!!errors.name && <Text style={styles.fieldError}>{errors.name}</Text>}
                </View>

                {/* Phone */}
                <View>
                  <Text style={styles.fieldLabel}>Phone Number</Text>
                  <TextInput
                    style={[styles.input, errors.phone ? styles.inputError : null]}
                    placeholder="9876543210"
                    placeholderTextColor={Colors.textMuted}
                    value={form.phone}
                    onChangeText={v => setField('phone', v.replace(/\D/g, ''))}
                    keyboardType="phone-pad"
                    maxLength={10}
                    returnKeyType="next"
                  />
                  {!!errors.phone && <Text style={styles.fieldError}>{errors.phone}</Text>}
                </View>

                {/* Email (optional) */}
                <View>
                  <Text style={styles.fieldLabel}>
                    Email <Text style={styles.optionalTag}>(optional)</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, errors.email ? styles.inputError : null]}
                    placeholder="you@example.com"
                    placeholderTextColor={Colors.textMuted}
                    value={form.email}
                    onChangeText={v => setField('email', v)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                  {!!errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
                </View>

                {/* Message */}
                <View>
                  <Text style={styles.fieldLabel}>
                    Message <Text style={styles.optionalTag}>({form.message.trim().length}/10 min)</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, styles.textArea, errors.message ? styles.inputError : null]}
                    placeholder="Describe your issue or question…"
                    placeholderTextColor={Colors.textMuted}
                    value={form.message}
                    onChangeText={v => setField('message', v)}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                  {!!errors.message && <Text style={styles.fieldError}>{errors.message}</Text>}
                </View>

                {/* API error */}
                {!!apiError && (
                  <View style={styles.apiErrorBox}>
                    <Text style={styles.apiErrorText}>{apiError}</Text>
                  </View>
                )}

                <Pressable
                  style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.submitBtnText}>Send Message</Text>}
                </Pressable>
              </View>
            )}
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
      </KeyboardAvoidingView>
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

  /* Form */
  fieldLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textPrimary, marginBottom: Spacing.xs },
  optionalTag: { fontFamily: FontFamily.regular, color: Colors.textMuted },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  inputError: { borderColor: '#EF4444' },
  textArea: { height: 100, paddingTop: Spacing.sm + 2 },
  fieldError: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: '#EF4444', marginTop: 4 },
  apiErrorBox: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: Radius.md, padding: Spacing.md },
  apiErrorText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: '#DC2626' },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing.md + 2, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: '#fff' },

  /* Sent state */
  sentWrap: { padding: Spacing.xxl, alignItems: 'center', gap: Spacing.sm },
  sentEmoji: { fontSize: 48 },
  sentTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },
  sentSub: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  sendAnotherBtn: { marginTop: Spacing.sm, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.primary },
  sendAnotherText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.primary },
});
