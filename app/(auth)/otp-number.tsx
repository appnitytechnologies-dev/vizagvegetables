import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useDispatch } from 'react-redux';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { AppDispatch } from '../../store';
import { setGuest } from '../../store/authSlice';
import { api } from '../../lib/api';

type Mode = 'login' | 'signup';

export default function OtpNumber() {
  const [mode,    setMode]    = useState<Mode>('login');
  const [phone,   setPhone]   = useState('');
  const [name,    setName]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const dispatch = useDispatch<AppDispatch>();

  const isValid = phone.length === 10;

  const switchMode = (next: Mode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode(next);
    setName('');
    setError('');
  };

  const handleSendOtp = async () => {
    if (!isValid || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError('');
    try {
      await api.post('/api/auth/send-otp', { phone, mode });
      router.push({
        pathname: '/(auth)/otp-verify',
        params: { phone, mode, name: mode === 'signup' ? name.trim() : '' },
      });
    } catch (e: any) {
      setError(e.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(setGuest());
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      <View style={styles.greenTop}>
        <View style={styles.illustrationWrap}>
          <Text style={styles.illustrationEmoji}>🛒👨‍👩‍👧‍👦</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.bottomCard}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Login / Sign Up toggle ── */}
          <View style={styles.modeToggle}>
            <Pressable
              style={[styles.modeBtn, mode === 'login' && styles.modeBtnActive]}
              onPress={() => switchMode('login')}
            >
              <Text style={[styles.modeBtnText, mode === 'login' && styles.modeBtnTextActive]}>
                Login
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeBtn, mode === 'signup' && styles.modeBtnActive]}
              onPress={() => switchMode('signup')}
            >
              <Text style={[styles.modeBtnText, mode === 'signup' && styles.modeBtnTextActive]}>
                Sign Up
              </Text>
            </Pressable>
          </View>

          <Text style={styles.heading}>
            {mode === 'login' ? 'Welcome back!' : 'Create account'}
          </Text>
          <Text style={styles.subHeading}>
            {mode === 'login'
              ? 'Enter your mobile number to continue'
              : 'Enter your details to get started'}
          </Text>

          {/* ── Name field — signup only ── */}
          {mode === 'signup' && (
            <View style={styles.inputRow}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor={Colors.textMuted}
                keyboardType="default"
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
                returnKeyType="next"
              />
            </View>
          )}

          {/* ── Phone field ── */}
          <View style={styles.inputRow}>
            <Text style={styles.prefix}>+91</Text>
            <TextInput
              style={styles.input}
              placeholder="9999999999"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={t => { setPhone(t); setError(''); }}
              autoFocus={mode === 'login'}
            />
          </View>

          {!!error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <Pressable
            style={[styles.sendBtn, (!isValid || loading) && styles.sendBtnDisabled]}
            onPress={handleSendOtp}
          >
            {loading
              ? <ActivityIndicator color={Colors.textInverse} size="small" />
              : <Text style={styles.sendBtnText}>Send OTP</Text>
            }
          </Pressable>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>Or continue with</Text>
            <View style={styles.orLine} />
          </View>

          <Pressable style={styles.googleBtn}>
            <View style={styles.googleIconCircle}>
              <Text style={styles.googleIconText}>G</Text>
            </View>
            <Text style={styles.googleText}>Google</Text>
          </Pressable>

          {/* ── Mode switch link ── */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            </Text>
            <Pressable onPress={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
              <Text style={styles.switchLink}>
                {mode === 'login' ? 'Sign Up' : 'Login'}
              </Text>
            </Pressable>
          </View>

          <Pressable onPress={handleSkip} style={styles.skipWrap}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  flex: { flex: 1 },

  greenTop: {
    height: 220,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationWrap: { alignItems: 'center' },
  illustrationEmoji: { fontSize: 80 },

  bottomCard: {
    flexGrow: 1,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },

  /* ── Mode toggle ── */
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: Radius.full,
    padding: 4,
    marginBottom: Spacing.xs,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.full,
  },
  modeBtnActive: {
    backgroundColor: Colors.primary,
    ...Shadow.sm,
  },
  modeBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  modeBtnTextActive: {
    color: Colors.textInverse,
  },

  heading: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  subHeading: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: -Spacing.xs,
  },

  /* ── Inputs ── */
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  prefix: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    padding: 0,
    outlineStyle: 'none',
  } as any,

  errorText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: '#D32F2F',
    textAlign: 'center',
    marginTop: -Spacing.xs,
  },

  /* ── Send OTP button ── */
  sendBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.textInverse,
  },

  /* ── Divider ── */
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  orLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  orText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },

  /* ── Google button ── */
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  googleIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: '#4285F4',
  },
  googleText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },

  /* ── Mode switch link ── */
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  switchLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  switchLink: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },

  /* ── Skip ── */
  skipWrap: { alignItems: 'center', paddingTop: Spacing.xs },
  skipText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});
