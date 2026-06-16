import { useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing } from '../constants/spacing';
import { clearCart } from '../store/cartSlice';
import { AppDispatch } from '../store';
import { api } from '../lib/api';

type Params = {
  rzpOrderId: string;
  amount:     string; // paise
  currency:   string;
  keyId:      string;
  orderJson:  string; // JSON-encoded orderData
  total:      string; // INR total for success screen
  name:       string;
  phone:      string;
};

function buildHtml(p: Params) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f5f5f5; font-family: -apple-system, sans-serif;
           display: flex; align-items: center; justify-content: center; height: 100vh; }
    .card { background: #fff; border-radius: 16px; padding: 32px 24px;
            text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.08); max-width: 320px; width: 90%; }
    .spinner { width: 44px; height: 44px; border: 4px solid #eee;
               border-top-color: #3AA655; border-radius: 50%;
               animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    p { color: #888; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <p>Opening secure payment…</p>
  </div>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    function postMsg(obj) {
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(obj));
    }
    window.onload = function() {
      var rzp = new Razorpay({
        key:         '${p.keyId}',
        amount:      ${p.amount},
        currency:    '${p.currency}',
        name:        'Vizag Vegetables',
        description: 'Fresh Vegetables Order',
        order_id:    '${p.rzpOrderId}',
        prefill:     { name: '${p.name.replace(/'/g, "\\'")}', contact: '${p.phone}' },
        theme:       { color: '#3AA655' },
        handler: function(r) {
          postMsg({ type: 'SUCCESS',
                    razorpay_payment_id: r.razorpay_payment_id,
                    razorpay_order_id:   r.razorpay_order_id,
                    razorpay_signature:  r.razorpay_signature });
        },
        modal: { ondismiss: function() { postMsg({ type: 'DISMISSED' }); } }
      });
      rzp.open();
    };
  </script>
</body>
</html>`;
}

export default function RazorpayCheckoutScreen() {
  const params   = useLocalSearchParams<Params>();
  const dispatch = useDispatch<AppDispatch>();
  const [webLoading, setWebLoading] = useState(true);
  const [error,      setError]      = useState('');
  const [verifying,  setVerifying]  = useState(false);

  const html = buildHtml(params);

  const handleMessage = async (event: WebViewMessageEvent) => {
    let msg: any;
    try { msg = JSON.parse(event.nativeEvent.data); } catch { return; }

    if (msg.type === 'DISMISSED') {
      router.back();
      return;
    }

    if (msg.type === 'SUCCESS') {
      setVerifying(true);
      try {
        const orderData = JSON.parse(params.orderJson);
        const order = await api.post<{ id: string }>('/api/payments/verify', {
          razorpay_order_id:   msg.razorpay_order_id,
          razorpay_payment_id: msg.razorpay_payment_id,
          razorpay_signature:  msg.razorpay_signature,
          orderData,
        });
        dispatch(clearCart());
        api.delete('/api/cart').catch(() => {});
        router.replace({
          pathname: '/order-success',
          params: { id: order.id, method: orderData.payment_method, total: params.total },
        } as any);
      } catch {
        setVerifying(false);
        setError('Payment received but order creation failed. Contact support.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} disabled={verifying}>
          <Ionicons name="close" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Secure Payment</Text>
        <View style={{ width: 36 }} />
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={20} color="#E53935" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <>
          <WebView
            source={{ html }}
            onLoadEnd={() => setWebLoading(false)}
            onMessage={handleMessage}
            javaScriptEnabled
            domStorageEnabled
            style={{ flex: 1 }}
          />
          {(webLoading || verifying) && (
            <View style={styles.overlay}>
              <ActivityIndicator size="large" color={Colors.primary} />
              {verifying && <Text style={styles.verifyText}>Confirming your order…</Text>}
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#fff' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                 paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
                 borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title:       { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.textPrimary },
  overlay:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.92)',
                 alignItems: 'center', justifyContent: 'center', gap: 12 },
  verifyText:  { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary },
  errorBox:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: Spacing.xxl },
  errorText:   { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: '#E53935', textAlign: 'center' },
});
