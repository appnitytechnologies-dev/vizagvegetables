import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import { useDispatch, useSelector } from 'react-redux';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { AppDispatch } from '../../store';
import { loginSuccess, setGuest, selectPendingAction, selectAuth } from '../../store/authSlice';
import { clearFavourites } from '../../store/favouritesSlice';
import { api, setToken } from '../../lib/api';
import { finishLogin } from '../../lib/authFlow';
import GoogleIcon from '../../components/GoogleIcon';

const TERMS_URL   = 'https://www.yzagfresh.com/terms';
const PRIVACY_URL = 'https://www.yzagfresh.com/privacy';

interface Feature {
  emoji: string;
  title: string;
  body: string;
  tint: string;
}

const FEATURES: Feature[] = [
  {
    emoji: '🥬',
    title: 'Daily Rythu\nBazar Rates',
    body: 'Get latest vegetable & fruit prices',
    tint: '#EAF6EA',
  },
  {
    emoji: '🏪',
    title: 'Market\nUpdates',
    body: 'Find nearby markets, timings & more',
    tint: '#FDF4E3',
  },
  {
    emoji: '❤️',
    title: 'Your\nFavourites',
    body: 'Save your favourite items and track prices',
    tint: '#EAF1FB',
  },
];

export default function OtpNumber() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,         setError]         = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const pendingAction = useSelector(selectPendingAction);
  const auth = useSelector(selectAuth);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });
  }, []);

  // Safety net — splash.tsx already routes a logged-in user past this screen,
  // but this covers backing out of a later screen. A Google login started but
  // never finished (phone still missing) shouldn't sit here looking logged out.
  useEffect(() => {
    if (auth.isLoggedIn && auth.phone) {
      router.replace('/(tabs)/home');
    } else if (auth.isLoggedIn && !auth.phone) {
      router.replace('/(auth)/complete-profile' as any);
    }
  }, [auth.isLoggedIn, auth.phone]);

  const handleGooglePress = async () => {
    const configured = !!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
      && !process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.startsWith('REPLACE_ME');

    if (!configured) {
      Alert.alert(
        'Not configured',
        'Google Sign-In is not set up yet.\n\nAdd your Google Client IDs to the .env file and configure the OAuth app in Google Cloud Console.',
        [{ text: 'OK' }]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGoogleLoading(true);
    setError('');
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) {
        // user cancelled — not an error
        return;
      }
      const idToken = response.data.idToken;
      if (!idToken) throw new Error('Google did not return an ID token');

      const res = await api.post<{
        token: string;
        user: { id: string; phone: string; name: string };
        isNewUser: boolean;
        needsProfile: boolean;
      }>('/api/auth/google', { idToken });

      await setToken(res.token);
      dispatch(loginSuccess({ token: res.token, id: res.user.id, phone: res.user.phone || '', name: res.user.name || '' }));

      if (res.needsProfile) {
        router.replace({ pathname: '/(auth)/complete-profile', params: { name: res.user.name || '' } });
      } else {
        await finishLogin(dispatch, pendingAction);
      }
    } catch (e: any) {
      if (isErrorWithCode(e) && e.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled — not an error
      } else {
        setError(e.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(setGuest());
    dispatch(clearFavourites());
    router.replace('/(tabs)/home');
  };

  const openLink = (url: string) => {
    WebBrowser.openBrowserAsync(url).catch(() => {});
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Sky-to-cream wash behind everything. The hero photograph, once it
          exists, sits on top of this at the bottom of the scroll area. */}
      <LinearGradient
        colors={['#E6F3FB', '#F1FAF2', '#FFFFFF']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View entering={FadeInDown.delay(60).duration(420)} style={styles.brandWrap}>
            <Image
              source={require('../../assets/images/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>FRESH MARKETS   BRIGHTER TOMORROW</Text>
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(140).duration(420)} style={styles.heading}>
            Your Local Market Companion
          </Animated.Text>

          <Animated.View entering={FadeInDown.delay(220).duration(420)} style={styles.cardsRow}>
            {FEATURES.map(f => (
              <View key={f.title} style={[styles.card, { backgroundColor: f.tint }]}>
                <Text style={styles.cardEmoji}>{f.emoji}</Text>
                <Text style={styles.cardTitle}>{f.title}</Text>
                <Text style={styles.cardBody}>{f.body}</Text>
              </View>
            ))}
          </Animated.View>
        </ScrollView>

        {/* ── Bottom sheet: sign in ── */}
        <Animated.View entering={FadeInDown.delay(300).duration(420)} style={styles.sheet}>
          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable
            style={[styles.googleBtn, googleLoading && styles.googleBtnDisabled]}
            onPress={handleGooglePress}
            disabled={googleLoading}
          >
            {googleLoading
              ? <ActivityIndicator size="small" color={Colors.textMuted} />
              : <>
                  <GoogleIcon size={22} />
                  <Text style={styles.googleText}>Continue with Google</Text>
                </>
            }
          </Pressable>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>

          <Pressable onPress={handleSkip} hitSlop={12}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>

          <Text style={styles.terms}>
            By continuing, you agree to our{'\n'}
            <Text style={styles.link} onPress={() => openLink(TERMS_URL)}>Terms of Service</Text>
            {' and '}
            <Text style={styles.link} onPress={() => openLink(PRIVACY_URL)}>Privacy Policy</Text>
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  safe: { flex: 1 },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },

  brandWrap: { alignItems: 'center' },
  logo: {
    width: 190,
    height: 92,
  },
  tagline: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    letterSpacing: 1.6,
    color: Colors.primaryDark,
    marginTop: Spacing.xs,
  },

  heading: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xxl,
    color: Colors.primaryDark,
    textAlign: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },

  cardsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  card: {
    flex: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  cardEmoji: {
    fontSize: 28,
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.primaryDark,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  cardBody: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    lineHeight: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.lg,
    ...Shadow.lg,
  },

  errorText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.danger,
    textAlign: 'center',
  },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    width: '100%',
    minHeight: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
  },
  googleBtnDisabled: { opacity: 0.6 },
  googleText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },

  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    width: '100%',
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  orText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    letterSpacing: 1,
  },

  skipText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.primaryAccent,
  },

  terms: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    lineHeight: 20,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  link: {
    fontFamily: FontFamily.medium,
    color: Colors.primaryAccent,
    textDecorationLine: 'underline',
  },
});
