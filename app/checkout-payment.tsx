import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useDispatch, useSelector } from 'react-redux';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { useCart } from '../hooks/useCart';
import { selectAuth } from '../store/authSlice';
import { clearCart } from '../store/cartSlice';
import { AppDispatch } from '../store';
import { api } from '../lib/api';
import StepperBar from '../components/StepperBar';
import Divider from '../components/ui/Divider';

type RazorpayOrderRes = {
  razorpay_order_id: string;
  amount: number; // paise
  currency: string;
  key_id: string;
};

const DELIVERY_FEE = 30;

const METHODS = [
  { id: 'upi',        icon: '📱', label: 'UPI',                  sub: 'Recommended' },
  { id: 'card',       icon: '💳', label: 'Credit / Debit Card',   sub: '' },
  { id: 'netbanking', icon: '🏦', label: 'Net Banking',           sub: '' },
  { id: 'cod',        icon: '💵', label: 'Cash on Delivery',      sub: '' },
];

export default function CheckoutPayment() {
  const { address, slot } = useLocalSearchParams<{ address: string; slot: string }>();
  const [method,     setMethod]     = useState('upi');
  const [upiId,      setUpiId]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  /* Card details */
  const [cardNum,    setCardNum]    = useState('');
  const [cardName,   setCardName]   = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv,    setCardCvv]    = useState('');
  const [showCvv,    setShowCvv]    = useState(false);

  const fmtCardNum = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 16);
    return d.replace(/(.{4})(?=.)/g, '$1 ');
  };
  const fmtExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };
  const cardBrand = () => {
    const d = cardNum.replace(/\s/g, '');
    if (/^4/.test(d))      return 'Visa';
    if (/^5[1-5]/.test(d)) return 'Mastercard';
    if (/^6/.test(d))      return 'RuPay';
    if (/^3[47]/.test(d))  return 'Amex';
    return '';
  };
  const { items, total } = useCart();
  const count = items.length;
  const dispatch = useDispatch<AppDispatch>();
  const auth     = useSelector(selectAuth);
  const delivery = total >= 500 ? 0 : DELIVERY_FEE;

  const handlePlaceOrder = async () => {
    if (!auth.isLoggedIn) {
      setError('Please log in to place an order.');
      return;
    }
    setLoading(true);
    setError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const orderItems = items.map(i => ({ product_id: i.id, quantity: i.quantity, unit_price: i.price }));
    const grandTotal = total + delivery;

    try {
      if (method === 'cod') {
        // ── Cash on delivery — create order directly ──
        const res = await api.post<{ id: string }>('/api/orders', {
          items:            orderItems,
          delivery_address: address || 'N/A',
          delivery_slot:    slot || '9 AM – 12 PM',
          payment_method:   'cod',
          delivery_fee:     delivery,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        dispatch(clearCart());
        api.delete('/api/cart').catch(() => {});
        router.replace({
          pathname: '/order-success',
          params: { id: res.id, method: 'cod', total: String(grandTotal) },
        } as any);
      } else {
        // ── Online payment — open Razorpay checkout ──
        const rzp = await api.post<RazorpayOrderRes>('/api/payments/create-order', { amount: grandTotal });
        const orderData = {
          items:            orderItems,
          delivery_address: address || 'N/A',
          delivery_slot:    slot || '9 AM – 12 PM',
          payment_method:   method,
          delivery_fee:     delivery,
        };
        router.push({
          pathname: '/razorpay-checkout',
          params: {
            rzpOrderId: rzp.razorpay_order_id,
            amount:     String(rzp.amount),
            currency:   rzp.currency,
            keyId:      rzp.key_id,
            orderJson:  JSON.stringify(orderData),
            total:      String(grandTotal),
            name:       auth.name || '',
            phone:      auth.phone || '',
          },
        } as any);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
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

        {/* Delivery summary */}
        <View style={styles.deliveryBox}>
          <Ionicons name="location-outline" size={16} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.deliveryAddress} numberOfLines={2}>{address}</Text>
            <Text style={styles.deliverySlot}>🕐 {slot}</Text>
          </View>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.changeText}>Change</Text>
          </Pressable>
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Payment methods */}
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

            {method === 'card' && m.id === 'card' && (
              <View style={styles.cardForm}>
                {/* Card number */}
                <View style={styles.cardFieldWrap}>
                  <Text style={styles.cardLabel}>Card Number</Text>
                  <View style={styles.cardInputRow}>
                    <Ionicons name="card-outline" size={16} color={Colors.textMuted} />
                    <TextInput
                      style={styles.cardInput}
                      placeholder="1234 5678 9012 3456"
                      placeholderTextColor={Colors.textMuted}
                      value={cardNum}
                      onChangeText={v => setCardNum(fmtCardNum(v))}
                      keyboardType="number-pad"
                      maxLength={19}
                    />
                    {cardBrand() !== '' && (
                      <Text style={styles.cardBrand}>{cardBrand()}</Text>
                    )}
                  </View>
                </View>

                {/* Name on card */}
                <View style={styles.cardFieldWrap}>
                  <Text style={styles.cardLabel}>Name on Card</Text>
                  <TextInput
                    style={styles.cardInputFull}
                    placeholder="RAVI KUMAR"
                    placeholderTextColor={Colors.textMuted}
                    value={cardName}
                    onChangeText={v => setCardName(v.toUpperCase())}
                    autoCapitalize="characters"
                  />
                </View>

                {/* Expiry + CVV row */}
                <View style={styles.cardRow}>
                  <View style={[styles.cardFieldWrap, { flex: 1 }]}>
                    <Text style={styles.cardLabel}>Expiry</Text>
                    <TextInput
                      style={styles.cardInputFull}
                      placeholder="MM/YY"
                      placeholderTextColor={Colors.textMuted}
                      value={cardExpiry}
                      onChangeText={v => setCardExpiry(fmtExpiry(v))}
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                  </View>
                  <View style={[styles.cardFieldWrap, { flex: 1 }]}>
                    <Text style={styles.cardLabel}>CVV</Text>
                    <View style={styles.cardInputRow}>
                      <TextInput
                        style={[styles.cardInput, { flex: 1 }]}
                        placeholder="•••"
                        placeholderTextColor={Colors.textMuted}
                        value={cardCvv}
                        onChangeText={v => setCardCvv(v.replace(/\D/g, ''))}
                        keyboardType="number-pad"
                        maxLength={4}
                        secureTextEntry={!showCvv}
                      />
                      <Pressable onPress={() => setShowCvv(v => !v)} hitSlop={8}>
                        <Ionicons name={showCvv ? 'eye-off-outline' : 'eye-outline'} size={16} color={Colors.textMuted} />
                      </Pressable>
                    </View>
                  </View>
                </View>

                <View style={styles.secureRow}>
                  <Ionicons name="lock-closed" size={11} color={Colors.textMuted} />
                  <Text style={styles.secureText}>Your card details are encrypted and secure</Text>
                </View>
              </View>
            )}
          </View>
        ))}

        {/* Order summary */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.sm }]}>Order Summary</Text>
        <View style={styles.summaryCard}>
          {/* Item breakdown */}
          {items.map(i => (
            <View key={i.id} style={styles.summaryRow}>
              <Text style={styles.summaryKey} numberOfLines={1}>{i.name}</Text>
              <Text style={styles.summaryVal}>
                {i.quantity} {i.unit}  ×  ₹{i.price} = ₹{i.price * i.quantity}
              </Text>
            </View>
          ))}
          <View style={styles.sep} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Subtotal ({count} {count === 1 ? 'item' : 'items'})</Text>
            <Text style={styles.summaryVal}>₹{total}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Delivery</Text>
            <Text style={styles.summaryVal}>{delivery === 0 ? 'FREE 🎉' : `₹${delivery}`}</Text>
          </View>
          <View style={styles.sep} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalKey}>Total</Text>
            <Text style={styles.totalVal}>₹{total + delivery}</Text>
          </View>
        </View>

        <View style={styles.secureRow}>
          <Ionicons name="lock-closed" size={12} color={Colors.textMuted} />
          <Text style={styles.secureText}>Secured by 256-bit SSL encryption</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          style={[styles.placeBtn, loading && styles.placeBtnDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={Colors.textInverse} size="small" />
            : <Text style={styles.placeText}>Place Order  ₹{total + delivery}</Text>
          }
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
  deliveryBox: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, backgroundColor: Colors.primaryPale, borderRadius: Radius.lg, padding: Spacing.lg },
  deliveryAddress: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textPrimary, flex: 1 },
  deliverySlot: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  changeText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.primary },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.dangerLight, borderRadius: Radius.md, padding: Spacing.md },
  errorText: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.danger },
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
  summaryVal: { fontFamily: FontFamily.numMed, fontSize: FontSize.sm, color: Colors.textPrimary },
  sep: { height: 1, backgroundColor: Colors.border },
  totalKey: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary },
  totalVal: { fontFamily: FontFamily.numBold, fontSize: FontSize.md, color: Colors.primary },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  secureText: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surface, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  placeBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing.lg, alignItems: 'center' },
  placeBtnDisabled: { opacity: 0.6 },
  placeText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.textInverse },

  /* Card form */
  cardForm: { marginTop: Spacing.xs, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md, backgroundColor: Colors.surface, gap: Spacing.md },
  cardFieldWrap: { gap: 4 },
  cardLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.textSecondary },
  cardInputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 10 },
  cardInput: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textPrimary, flex: 1 },
  cardInputFull: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 10, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textPrimary },
  cardRow: { flexDirection: 'row', gap: Spacing.md },
  cardBrand: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.primary },
});
