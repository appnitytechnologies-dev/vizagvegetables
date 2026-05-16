import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { useCart } from '../hooks/useCart';
import StepperBar from '../components/StepperBar';
import Divider from '../components/ui/Divider';

const METHODS = [
  { id: 'upi', icon: '📱', label: 'UPI', sub: 'Recommended' },
  { id: 'card', icon: '💳', label: 'Credit / Debit Card', sub: '' },
  { id: 'netbanking', icon: '🏦', label: 'Net Banking', sub: '' },
  { id: 'cod', icon: '💵', label: 'Cash on Delivery', sub: '' },
];

export default function CheckoutPayment() {
  const [method, setMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const { total, clear } = useCart();
  const delivery = 30;

  const handlePlaceOrder = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    clear();
    router.replace('/order-success' as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Payment</Text>
        <View style={{ width: 32 }} />
      </View>
      <Divider />

      <StepperBar step={3} />
      <Divider />

      <ScrollView contentContainerStyle={{ padding: Spacing.xxl, gap: Spacing.lg, paddingBottom: 140 }}>
        <Text style={styles.sectionLabel}>Payment Method</Text>

        {METHODS.map(m => (
          <View key={m.id}>
            <Pressable
              style={[styles.methodRow, method === m.id && styles.methodRowActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMethod(m.id); }}
            >
              <Text style={styles.methodIcon}>{m.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.methodLabel}>{m.label}</Text>
                {m.sub ? <Text style={styles.methodSub}>{m.sub}</Text> : null}
              </View>
              <View style={[styles.radio, method === m.id && styles.radioActive]}>
                {method === m.id && <View style={styles.radioDot} />}
              </View>
            </Pressable>

            {method === 'upi' && m.id === 'upi' && (
              <View style={styles.upiInput}>
                <TextInput
                  style={styles.upiField}
                  placeholder="Enter UPI ID (e.g. name@upi)"
                  placeholderTextColor={Colors.textMuted}
                  value={upiId}
                  onChangeText={setUpiId}
                  keyboardType="email-address"
                />
              </View>
            )}
          </View>
        ))}

        <Text style={[styles.sectionLabel, { marginTop: Spacing.sm }]}>Order Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Subtotal</Text>
            <Text style={styles.summaryVal}>₹{total}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Delivery</Text>
            <Text style={styles.summaryVal}>₹{delivery}</Text>
          </View>
          <View style={styles.sep} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalKey}>Total</Text>
            <Text style={styles.totalVal}>₹{total + delivery}</Text>
          </View>
        </View>

        <View style={styles.razorpayRow}>
          <Ionicons name="lock-closed" size={12} color={Colors.textMuted} />
          <Text style={styles.razorpayText}>Secured by Razorpay · 256-bit SSL</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable style={styles.placeBtn} onPress={handlePlaceOrder}>
          <Text style={styles.placeText}>Place Order  ₹{total + delivery}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },
  sectionLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textSecondary },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, backgroundColor: Colors.surface },
  methodRowActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryPale },
  methodIcon: { fontSize: 24 },
  methodLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  methodSub: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.primary },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  upiInput: { marginTop: Spacing.xs, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.surface },
  upiField: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textPrimary },
  summaryCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.sm, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryKey: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary },
  summaryVal: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textPrimary },
  sep: { height: 1, backgroundColor: Colors.border },
  totalKey: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary },
  totalVal: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.primary },
  razorpayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  razorpayText: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surface, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  placeBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing.lg, alignItems: 'center' },
  placeText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.textInverse },
});
