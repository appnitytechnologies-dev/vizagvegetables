import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { AppDispatch } from '../../store';
import { loginSuccess, clearPendingAction, selectPendingAction } from '../../store/authSlice';
import { addToCart, CartItem } from '../../store/cartSlice';
import { toggleFavourite } from '../../store/favouritesSlice';
import { api, setToken } from '../../lib/api';

const OTP_LENGTH = 6;

export default function OtpVerify() {
  const { phone, name: paramName, mode } = useLocalSearchParams<{ phone: string; name?: string; mode?: string }>();
  const [otp, setOtp]       = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer]   = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const inputs = useRef<(TextInput | null)[]>([]);
  const dispatch       = useDispatch<AppDispatch>();
  const pendingAction  = useSelector(selectPendingAction);

  /* one shared value per digit */
  const s0 = useSharedValue(1); const s1 = useSharedValue(1);
  const s2 = useSharedValue(1); const s3 = useSharedValue(1);
  const s4 = useSharedValue(1); const s5 = useSharedValue(1);
  const scales = [s0, s1, s2, s3, s4, s5];

  const a0 = useAnimatedStyle(() => ({ transform: [{ scale: s0.value }] }));
  const a1 = useAnimatedStyle(() => ({ transform: [{ scale: s1.value }] }));
  const a2 = useAnimatedStyle(() => ({ transform: [{ scale: s2.value }] }));
  const a3 = useAnimatedStyle(() => ({ transform: [{ scale: s3.value }] }));
  const a4 = useAnimatedStyle(() => ({ transform: [{ scale: s4.value }] }));
  const a5 = useAnimatedStyle(() => ({ transform: [{ scale: s5.value }] }));
  const animStyles = [a0, a1, a2, a3, a4, a5];

  useEffect(() => {
    inputs.current[0]?.focus();
    const interval = setInterval(() => {
      setTimer(t => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (text: string, idx: number) => {
    const digit = text.slice(-1);
    const newOtp = [...otp];
    newOtp[idx] = digit;
    setOtp(newOtp);
    setError('');
    if (digit && idx < OTP_LENGTH - 1) inputs.current[idx + 1]?.focus();
    scales[idx].value = withSpring(1.12, {}, () => { scales[idx].value = withSpring(1); });
  };

  const handleKeyPress = (key: string, idx: number) => {
    if (key === 'Backspace' && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleResend = async () => {
    try {
      await api.post('/api/auth/send-otp', { phone });
      setTimer(30);
      setOtp(Array(OTP_LENGTH).fill(''));
      setError('');
      setTimeout(() => inputs.current[0]?.focus(), 50);
    } catch (e: any) {
      setError(e.message || 'Failed to resend OTP');
    }
  };

  const handleVerify = async () => {
    if (otp.some(d => d === '') || loading) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{
        token: string;
        user: { id: string; phone: string; name?: string };
        isNewUser: boolean;
      }>('/api/auth/verify-otp', { phone, otp: otp.join(''), name: paramName || undefined, mode: mode || 'signup' });

      /* persist token */
      await setToken(res.token);
      const displayName =
        res.user.name || `User ${res.user.phone.slice(-4)}`;
      await AsyncStorage.setItem('user_name', displayName);

      dispatch(loginSuccess({
        token: res.token,
        id:    res.user.id,
        phone: res.user.phone,
        name:  displayName,
      }));

      /* replay any action the user tried before logging in */
      if (pendingAction) {
        if (pendingAction.type === 'ADD_TO_CART' && pendingAction.payload) {
          dispatch(addToCart(pendingAction.payload as CartItem));
        } else if (pendingAction.type === 'TOGGLE_FAVOURITE' && pendingAction.payload) {
          dispatch(toggleFavourite(pendingAction.payload as string));
        }
        const returnTo = pendingAction.returnTo;
        dispatch(clearPendingAction());
        router.replace(returnTo as any);
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(e.message || 'Invalid OTP. Please try again.');
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimeout(() => inputs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const maskedPhone = phone
    ? `+91 ${phone.slice(0, 4)}${'*'.repeat(Math.max(0, phone.length - 4))}`
    : '+91 ****';

  const isComplete = otp.every(d => d !== '');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backArrow}>←</Text>
      </Pressable>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Text style={styles.heading}>Verify Code</Text>
        <Text style={styles.sub}>
          Please enter the 6-digit code we sent to {maskedPhone}
        </Text>

        {/* Dev hint */}
        <View style={styles.devHint}>
          <Text style={styles.devHintText}>🔧 Testing — check API console for the OTP</Text>
        </View>

        {!!error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <View style={styles.otpRow}>
          {otp.map((digit, idx) => (
            <Animated.View
              key={idx}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null, animStyles[idx]]}
            >
              <TextInput
                ref={r => { inputs.current[idx] = r; }}
                style={styles.otpInput}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={t => handleChange(t, idx)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, idx)}
                caretHidden
              />
            </Animated.View>
          ))}
        </View>

        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Didn't receive OTP?</Text>
          {timer > 0 ? (
            <Text style={styles.resendTimer}>Resend in {timer}s</Text>
          ) : (
            <Pressable onPress={handleResend}>
              <Text style={styles.resendLink}>Resend Code</Text>
            </Pressable>
          )}
        </View>

        <Pressable
          style={[styles.verifyBtn, (!isComplete || loading) && styles.verifyBtnDisabled]}
          onPress={handleVerify}
        >
          {loading
            ? <ActivityIndicator color={Colors.textInverse} size="small" />
            : <Text style={styles.verifyBtnText}>Verify &amp; Continue</Text>
          }
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  backBtn: {
    marginLeft: Spacing.lg,
    marginTop: Spacing.sm,
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  backArrow: { fontSize: 18, color: Colors.textPrimary },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxxl,
  },
  heading: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xxxl,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  sub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  devHint: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFE082',
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  devHintText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: '#F57F17',
  },
  errorText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.lg,
  },
  otpBox: {
    width: 50,
    height: 58,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  otpInput: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xxl,
    color: Colors.textPrimary,
    textAlign: 'center',
    width: '100%',
    height: '100%',
    outlineStyle: 'none',
  } as any,
  resendRow: {
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  resendLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  resendTimer: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  resendLink: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.warning,
    textDecorationLine: 'underline',
  },
  verifyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  verifyBtnDisabled: { opacity: 0.5 },
  verifyBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.textInverse,
  },
});
