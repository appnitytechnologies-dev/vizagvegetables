import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
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

/** login-hero.png is a full composition, not a texture: sky wash, the
 *  photograph, leaf accents and the white curved sheet are all painted in.
 *
 *  resizeMode="cover" left the scale up to the layout engine, which magnified
 *  the corner and pushed the photograph off screen. Sizing by width instead put
 *  the artwork's bottom above the screen's, leaving a hard white seam under the
 *  leaf accents. So the cover maths is done here: the artwork always fills the
 *  screen, and because we know its offset and scale we also know exactly where
 *  the photograph and the white sheet land. */
const HERO_W = 941;
const HERO_H = 1671;

/** The artwork is a fixed composition, so text cannot be allowed to grow without
 *  bound: a device with a large system font size pushed the cards into the
 *  photograph and the sign-in block off the white sheet. Scaling still applies,
 *  capped, so the screen stays readable without falling apart. */
const MAX_FONT_SCALE = 1.15;

/** Roughly the height of the sign-in stack (button, divider, skip, terms).
 *  Used only to decide whether it still clears the bottom of the screen. */
const SIGNIN_STACK_H = 150;

/* Both constants below were measured off login-hero.png rather than eyeballed.
 *
 * The white sheet's top edge is a dome, not a straight line -- sampled across
 * the artwork it starts at 0.745 dead centre but only 0.764 at 10%/90% and
 * 0.777 at the extreme edges. The sign-in button spans nearly the full width,
 * so its ENDS are what must clear the photograph; anchoring to the centre peak
 * is what left the button overlapping the crate on a real device. */
const WHITE_TOP = 0.765;

/** The photograph starts at 0.495 mid-frame and 0.538 toward the edges; this
 *  leaves a little margin under the cards. */
const PHOTO_TOP = 0.48;

interface Feature {
  icon: ImageSourcePropType;
  title: string;
  body: string;
  tint: string;
  /** The heart sits in a white disc in the design; the other two do not. */
  disc?: boolean;
}

const FEATURES: Feature[] = [
  {
    icon: require('../../assets/images/veg.png'),
    title: 'Daily Rythu\nBazar Rates',
    body: 'Get latest vegetable\n& fruit prices',
    tint: 'rgba(234,246,234,0.9)',
  },
  {
    icon: require('../../assets/images/market-update.png'),
    title: 'Market\nUpdates',
    body: 'Find nearby markets,\ntimings & more',
    tint: 'rgba(253,244,227,0.9)',
  },
  {
    icon: require('../../assets/images/your-fav.png'),
    title: 'Your\nFavourites',
    body: 'Save your favourite\nitems and track prices',
    tint: 'rgba(234,241,251,0.9)',
    disc: true,
  },
];

export default function GetStarted() {
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,         setError]         = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const pendingAction = useSelector(selectPendingAction);
  const auth = useSelector(selectAuth);

  // Cover: scale until both axes are filled, then centre the overflow.
  const scale   = Math.max(screenW / HERO_W, screenH / HERO_H);
  const heroW   = HERO_W * scale;
  const heroH   = HERO_H * scale;
  const offsetX = (screenW - heroW) / 2;
  const offsetY = (screenH - heroH) / 2;

  const photoTop = offsetY + heroH * PHOTO_TOP;
  const whiteTop = offsetY + heroH * WHITE_TOP;

  // Normally the sign-in stack sits just below the white sheet. On a short
  // screen with a three-button navigation bar there isn't room for it there, so
  // it slides up rather than running off the bottom -- overlapping the curve a
  // little is far less bad than losing the terms line off screen.
  const signInTop = Math.min(
    whiteTop + Spacing.md,
    screenH - insets.bottom - Spacing.sm - SIGNIN_STACK_H,
  );

  // On a short screen the stack has to sit above the artwork's own white sheet,
  // which would put the button back on the photograph. Extend the sheet upward
  // with a matching white panel in that case only, so taller screens keep the
  // artwork's leaf accents untouched.
  const needsPanel = signInTop < whiteTop;

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

      <View style={styles.heroClip} pointerEvents="none">
        <Image
          source={require('../../assets/images/login-hero.png')}
          style={{ position: 'absolute', left: offsetX, top: offsetY, width: heroW, height: heroH }}
        />
      </View>

      {/* Everything above the photograph */}
      <View
        style={[
          styles.top,
          { paddingTop: insets.top + Spacing.sm, height: photoTop },
        ]}
      >
        <Animated.View entering={FadeInDown.delay(60).duration(420)} style={styles.brandWrap}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.tagline} maxFontSizeMultiplier={MAX_FONT_SCALE}>FRESH MARKETS   BRIGHTER TOMORROW</Text>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(140).duration(420)} style={styles.heading} maxFontSizeMultiplier={MAX_FONT_SCALE}>
          Your Local Market Companion
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(220).duration(420)} style={styles.cardsRow}>
          {FEATURES.map(f => (
            <View key={f.title} style={[styles.card, { backgroundColor: f.tint }]}>
              {f.disc
                ? <View style={styles.disc}>
                    <Image source={f.icon} style={styles.discIcon} resizeMode="contain" />
                  </View>
                : <Image source={f.icon} style={styles.cardIcon} resizeMode="contain" />
              }
              <Text style={styles.cardTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>{f.title}</Text>
              <Text style={styles.cardBody} maxFontSizeMultiplier={MAX_FONT_SCALE}>{f.body}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {needsPanel && (
        <View
          pointerEvents="none"
          style={[styles.signInPanel, { top: signInTop - Spacing.md }]}
        />
      )}

      {/* Anchored to the white sheet painted in the artwork */}
      <Animated.View
        entering={FadeInDown.delay(300).duration(420)}
        style={[
          styles.bottom,
          { top: signInTop, paddingBottom: insets.bottom + Spacing.sm },
        ]}
      >
        {!!error && <Text style={styles.errorText} maxFontSizeMultiplier={MAX_FONT_SCALE}>{error}</Text>}

        <Pressable
          style={[styles.googleBtn, googleLoading && styles.googleBtnDisabled]}
          onPress={handleGooglePress}
          disabled={googleLoading}
        >
          {googleLoading
            ? <ActivityIndicator size="small" color={Colors.textMuted} />
            : <>
                <GoogleIcon size={24} />
                <Text style={styles.googleText} maxFontSizeMultiplier={MAX_FONT_SCALE}>Continue with Google</Text>
              </>
          }
        </Pressable>

        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText} maxFontSizeMultiplier={MAX_FONT_SCALE}>OR</Text>
          <View style={styles.orLine} />
        </View>

        <Pressable onPress={handleSkip} hitSlop={12}>
          <Text style={styles.skipText} maxFontSizeMultiplier={MAX_FONT_SCALE}>Skip for now</Text>
        </Pressable>

        <Text style={styles.terms} maxFontSizeMultiplier={MAX_FONT_SCALE}>
          By continuing, you agree to our{'\n'}
          <Text style={styles.link} onPress={() => openLink(TERMS_URL)}>Terms of Service</Text>
          {' and '}
          <Text style={styles.link} onPress={() => openLink(PRIVACY_URL)}>Privacy Policy</Text>
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },

  heroClip: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },

  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
  },

  brandWrap: { alignItems: 'center' },
  logo: {
    width: 170,
    height: 80,
  },
  tagline: {
    fontFamily: FontFamily.semiBold,
    fontSize: 9.5,
    letterSpacing: 1.4,
    color: Colors.primaryDark,
    marginTop: 2,
  },

  heading: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    color: Colors.primaryDark,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },

  cardsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  card: {
    flex: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  cardIcon: {
    width: 50,
    height: 34,
    marginBottom: 6,
  },
  disc: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    // The heart fills only the middle ~32% x 60% of your-fav.png; the rest is
    // transparent padding. Sizing the image to the padding made the heart tiny,
    // so it is sized to the artwork instead and the disc clips what spills out.
    overflow: 'hidden',
  },
  discIcon: {
    width: 62,
    height: 41,
  },
  cardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    lineHeight: 17,
    color: Colors.primaryDark,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 2,
  },
  cardBody: {
    fontFamily: FontFamily.regular,
    fontSize: 10.5,
    lineHeight: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  signInPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44,
  },

  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: Spacing.sm,
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
    minHeight: 52,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
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
    width: '84%',
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderStrong,
    opacity: 0.35,
  },
  orText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },

  skipText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.primaryAccent,
  },

  terms: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  link: {
    fontFamily: FontFamily.medium,
    color: Colors.primaryAccent,
    textDecorationLine: 'underline',
  },
});
