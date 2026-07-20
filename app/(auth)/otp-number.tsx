import { useState, useEffect } from 'react';
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
  Dimensions,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useDispatch, useSelector } from 'react-redux';
import { AntDesign } from '@expo/vector-icons';
import Svg, { Circle, Path, Rect, G, Ellipse } from 'react-native-svg';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';
import { AppDispatch } from '../../store';
import { loginSuccess, setGuest, selectPendingAction } from '../../store/authSlice';
import { clearFavourites } from '../../store/favouritesSlice';
import { api, setToken } from '../../lib/api';
import { finishLogin } from '../../lib/authFlow';

WebBrowser.maybeCompleteAuthSession();

const { width: SW, height: SH } = Dimensions.get('window');
// Green area height — illustration aspect ratio is 360:240 = 3:2
const ILLUS_SVG_H = Math.round((240 / 360) * SW);   // scales to fill width
const ILLUS_H     = Math.round(SH * 0.44);           // green section ~44% — matches target
const WAVE_H      = 52;                               // height of the dome wave transition

function GroceryIllustration() {
  return (
    <Svg
      width={SW}
      height={ILLUS_SVG_H}
      viewBox="0 0 360 240"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* ── glow circles ── */}
      <Circle cx="185" cy="120" r="110" fill="rgba(255,255,255,0.07)" />
      <Circle cx="185" cy="120" r="72"  fill="rgba(255,255,255,0.06)" />

      {/* ── ground shadow ── */}
      <Ellipse cx="185" cy="236" rx="160" ry="8" fill="rgba(0,0,0,0.14)" />

      {/* ══════════ MAN (center-left) ══════════ */}
      {/* Head */}
      <Circle cx="76" cy="68" r="24" fill="#FFD7B5" />
      {/* Hair */}
      <Path d="M52 64 Q54 40 76 38 Q98 40 100 64 Q88 50 76 50 Q64 52 52 64Z" fill="#3E2723" />
      {/* Ears */}
      <Circle cx="52" cy="70" r="6" fill="#FFBF9A" />
      <Circle cx="100" cy="70" r="6" fill="#FFBF9A" />

      {/* Man face */}
      <Circle cx="70" cy="65" r="3.5" fill="#3E2723" />
      <Circle cx="82" cy="65" r="3.5" fill="#3E2723" />
      <Circle cx="71.5" cy="63.5" r="1.3" fill="white" />
      <Circle cx="83.5" cy="63.5" r="1.3" fill="white" />
      <Circle cx="76" cy="73" r="1.8" fill="#FFBF9A" />
      <Path d="M71 78 Q76 83 81 78" stroke="#7D5C4A" strokeWidth="1.8" fill="none" strokeLinecap="round" />

      {/* Neck */}
      <Rect x="70" y="90" width="12" height="12" rx="4" fill="#FFD7B5" />

      {/* Orange messenger bag */}
      <Path d="M38 110 L38 154 Q44 162 54 158 L54 112Z" fill="#F57C00" />
      <Rect x="36" y="104" width="20" height="12" rx="6" fill="#E65100" />
      <Path d="M52 108 Q46 88 50 80" stroke="#E65100" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* White shirt body */}
      <Path d="M54 102 Q50 108 48 136 L50 160 L102 160 L104 136 Q102 108 98 102 Q88 96 76 96 Q64 96 54 102Z" fill="#F5F5F5" />
      {/* Left sleeve */}
      <Path d="M54 102 L36 122 L44 130 L54 116Z" fill="#F5F5F5" />
      {/* Right sleeve + arm reaching to cart */}
      <Path d="M98 102 L122 116 L126 108 L98 112Z" fill="#F5F5F5" />
      {/* Shirt shadow / fold */}
      <Path d="M68 108 Q76 114 84 108" stroke="#E0E0E0" strokeWidth="1.5" fill="none" />

      {/* Left forearm + hand */}
      <Path d="M36 122 L26 152" stroke="#FFD7B5" strokeWidth="12" strokeLinecap="round" fill="none" />
      <Circle cx="24" cy="156" r="8" fill="#FFD7B5" />

      {/* Right arm reaching to cart handle */}
      <Path d="M122 116 L152 120" stroke="#FFD7B5" strokeWidth="12" strokeLinecap="round" fill="none" />
      <Circle cx="154" cy="121" r="8" fill="#FFD7B5" />

      {/* Pants (navy blue) */}
      <Path d="M52 160 L42 234 L64 234 L76 192 L88 234 L110 234 L100 160Z" fill="#1A237E" />
      <Path d="M64 170 L56 216" stroke="#283593" strokeWidth="1.5" fill="none" />
      <Path d="M88 170 L96 216" stroke="#283593" strokeWidth="1.5" fill="none" />

      {/* Left shoe (red) */}
      <Ellipse cx="50" cy="236" rx="20" ry="8" fill="#C62828" />
      <Ellipse cx="46" cy="233" rx="15" ry="5" fill="#D32F2F" />
      {/* Right shoe (dark navy) */}
      <Ellipse cx="100" cy="236" rx="18" ry="8" fill="#1A237E" />
      <Ellipse cx="104" cy="233" rx="13" ry="5" fill="#283593" />

      {/* ══════════ SHOPPING CART ══════════ */}
      {/* Handle — vertical pole */}
      <Rect x="152" y="84" width="9" height="84" rx="4.5" fill="#78909C" />
      {/* Handle — horizontal grip */}
      <Rect x="152" y="84" width="82" height="9" rx="4.5" fill="#607D8B" />

      {/* Basket — slightly trapezoidal (wider at top = perspective) */}
      <Path d="M158 102 L154 188 L280 188 L276 102 Z"
        fill="rgba(215,232,245,0.82)" stroke="#90A4AE" strokeWidth="2" />

      {/* Wire grid — horizontal */}
      <Path d="M157 120 L279 120" stroke="#B0BEC5" strokeWidth="1.5" fill="none" />
      <Path d="M156 138 L280 138" stroke="#B0BEC5" strokeWidth="1.5" fill="none" />
      <Path d="M155 156 L280 156" stroke="#B0BEC5" strokeWidth="1.5" fill="none" />
      <Path d="M155 172 L280 172" stroke="#B0BEC5" strokeWidth="1.5" fill="none" />

      {/* Wire grid — vertical */}
      <Path d="M188 102 L186 188" stroke="#B0BEC5" strokeWidth="1.5" fill="none" />
      <Path d="M218 102 L218 188" stroke="#B0BEC5" strokeWidth="1.5" fill="none" />
      <Path d="M248 102 L250 188" stroke="#B0BEC5" strokeWidth="1.5" fill="none" />

      {/* Bottom bar */}
      <Rect x="152" y="184" width="130" height="10" rx="5" fill="#607D8B" />

      {/* Legs — slanted outward for cart look */}
      <Path d="M168 192 L158 228" stroke="#78909C" strokeWidth="7" strokeLinecap="round" fill="none" />
      <Path d="M266 192 L276 228" stroke="#78909C" strokeWidth="7" strokeLinecap="round" fill="none" />

      {/* Left wheel */}
      <Circle cx="162" cy="230" r="13" fill="#546E7A" />
      <Circle cx="162" cy="230" r="7"  fill="#78909C" />
      <Circle cx="162" cy="230" r="2.5" fill="#37474F" />
      {/* Right wheel */}
      <Circle cx="272" cy="230" r="13" fill="#546E7A" />
      <Circle cx="272" cy="230" r="7"  fill="#78909C" />
      <Circle cx="272" cy="230" r="2.5" fill="#37474F" />

      {/* ── Groceries (overflowing top of cart) ── */}
      {/* Tomato */}
      <G transform="translate(185, 98)">
        <Circle r="18" fill="#E53935" />
        <Rect x="-2" y="-21" width="4" height="9" rx="2" fill="#33691E" />
        <Path d="M-2 -18 Q-10 -26 -4 -16" fill="#558B2F" />
        <Path d="M2 -18 Q10 -26 4 -16" fill="#558B2F" />
        <Ellipse cx="-6" cy="-5" rx="4" ry="5.5" fill="rgba(255,255,255,0.28)" />
      </G>

      {/* Milk carton */}
      <G transform="translate(220, 88)">
        <Rect x="-12" y="-20" width="24" height="34" rx="4" fill="white" />
        <Rect x="-12" y="-20" width="24" height="10" rx="4" fill="#E53935" />
        <Path d="M-6 2 L6 2"  stroke="#43A047" strokeWidth="2" strokeLinecap="round" />
        <Path d="M-6 8 L6 8"  stroke="#43A047" strokeWidth="2" strokeLinecap="round" />
        <Path d="M-6 -4 L6 -4" stroke="#E53935" strokeWidth="1.5" strokeLinecap="round" />
      </G>

      {/* Carrot */}
      <G transform="translate(250, 92)">
        <Path d="M5 10 L-2 -34 L10 -34 L14 10 Z" fill="#FF8F00" />
        <Path d="M8 8 L5 -32 L8 -32" stroke="rgba(255,255,255,0.28)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <Path d="M0 -32 Q-8 -46 -2 -52" stroke="#558B2F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <Path d="M5 -34 Q5 -50 9 -54" stroke="#558B2F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <Path d="M9 -31 Q17 -44 13 -50" stroke="#558B2F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </G>

      {/* ── Baguette (diagonal, sticking out from cart) ── */}
      <G transform="translate(173, 105) rotate(-28)">
        <Rect x="-6" y="-52" width="12" height="82" rx="6" fill="#D4A853" />
        <Path d="M-4.5 -40 Q0 -38 4.5 -40" stroke="#B8863C" strokeWidth="2" fill="none" strokeLinecap="round" />
        <Path d="M-4.5 -22 Q0 -20 4.5 -22" stroke="#B8863C" strokeWidth="2" fill="none" strokeLinecap="round" />
        <Path d="M-4.5 -4 Q0 -2 4.5 -4" stroke="#B8863C" strokeWidth="2" fill="none" strokeLinecap="round" />
        <Path d="M-5 -50 Q0 -64 5 -50" fill="#B8863C" />
      </G>

      {/* ══════════ WOMAN (right) ══════════ */}
      {/* Head */}
      <Circle cx="308" cy="72" r="22" fill="#FFD7B5" />
      {/* Blonde hair top (dome) */}
      <Path d="M286 68 Q288 46 308 44 Q328 46 330 68 Q318 54 308 52 Q298 58 286 68Z" fill="#F9A825" />
      {/* Hair left side — thick flowing strands */}
      <Path d="M284 70 Q272 100 276 130" stroke="#F9A825" strokeWidth="14" strokeLinecap="round" fill="none" />
      <Path d="M286 72 Q278 102 282 128" stroke="#F9A825" strokeWidth="9"  strokeLinecap="round" fill="none" />
      {/* Hair right side */}
      <Path d="M330 70 Q340 98 336 126" stroke="#F9A825" strokeWidth="12" strokeLinecap="round" fill="none" />
      {/* Ears */}
      <Circle cx="286" cy="74" r="6" fill="#FFBF9A" />
      <Circle cx="330" cy="74" r="6" fill="#FFBF9A" />

      {/* Woman face */}
      <Circle cx="302" cy="69" r="3.2" fill="#3E2723" />
      <Circle cx="314" cy="69" r="3.2" fill="#3E2723" />
      <Circle cx="303.5" cy="67.5" r="1.2" fill="white" />
      <Circle cx="315.5" cy="67.5" r="1.2" fill="white" />
      <Circle cx="308" cy="77" r="1.8" fill="#FFBF9A" />
      <Path d="M303 82 Q308 87 313 82" stroke="#7D5C4A" strokeWidth="1.8" fill="none" strokeLinecap="round" />

      {/* Neck */}
      <Rect x="302" y="92" width="12" height="10" rx="4" fill="#FFD7B5" />

      {/* Green shirt */}
      <Path d="M288 104 Q284 110 282 142 L284 168 L332 168 L334 142 Q332 110 328 104 Q318 96 308 96 Q298 96 288 104Z" fill="#43A047" />
      {/* Left sleeve */}
      <Path d="M288 104 L272 122 L278 130 L288 118Z" fill="#43A047" />
      {/* Right sleeve */}
      <Path d="M328 104 L344 120 L338 128 L328 118Z" fill="#43A047" />
      {/* Shirt highlight */}
      <Path d="M300 108 Q308 114 316 108" stroke="rgba(255,255,255,0.30)" strokeWidth="1.5" fill="none" />

      {/* Blue backpack strap */}
      <Path d="M330 104 Q346 124 344 154" stroke="#1565C0" strokeWidth="7" strokeLinecap="round" fill="none" />
      <Rect x="336" y="124" width="18" height="36" rx="8" fill="#1976D2" />
      <Rect x="338" y="128" width="14" height="6" rx="3" fill="#1565C0" />

      {/* Left arm (down, holding bottle) */}
      <Path d="M272 122 L266 156" stroke="#FFD7B5" strokeWidth="12" strokeLinecap="round" fill="none" />
      <Circle cx="264" cy="160" r="8" fill="#FFD7B5" />
      {/* Bottle */}
      <Rect x="256" y="154" width="16" height="26" rx="6" fill="#B3E5FC" />
      <Rect x="259" y="150" width="10" height="8" rx="4" fill="#81D4FA" />

      {/* Right arm (slightly forward) */}
      <Path d="M344 120 L278 148" stroke="#FFD7B5" strokeWidth="12" strokeLinecap="round" fill="none" />
      <Circle cx="276" cy="150" r="8" fill="#FFD7B5" />

      {/* Skirt (gray) */}
      <Path d="M284 168 L278 236 L338 236 L332 168Z" fill="#90A4AE" />
      <Path d="M292 172 L286 232" stroke="#78909C" strokeWidth="1.5" fill="none" />
      <Path d="M308 170 L308 236" stroke="#78909C" strokeWidth="1.5" fill="none" />
      <Path d="M324 172 L330 232" stroke="#78909C" strokeWidth="1.5" fill="none" />

      {/* Woman shoes */}
      <Ellipse cx="286" cy="237" rx="16" ry="7" fill="#5D4037" />
      <Ellipse cx="332" cy="237" rx="16" ry="7" fill="#5D4037" />

      {/* ── Sparkle marks ── */}
      <Path d="M30 88 L30 76 M24 82 L36 82"
        stroke="rgba(255,255,255,0.60)" strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M354 64 L354 52 M348 58 L360 58"
        stroke="rgba(255,255,255,0.60)" strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M138 52 L138 42 M133 47 L143 47"
        stroke="rgba(255,255,255,0.50)" strokeWidth="2" strokeLinecap="round" />
      <Path d="M350 172 L350 164 M346 168 L354 168"
        stroke="rgba(255,255,255,0.40)" strokeWidth="2" strokeLinecap="round" />

    </Svg>
  );
}

// Dome-shaped white wave that sits at the bottom of the green section
function WaveTransition() {
  // Organic S-curve: left side at 58%, peaks near 0 at 30% width, settles at 28% on right
  const d = [
    `M0 ${WAVE_H}`,
    `L0 ${Math.round(WAVE_H * 0.58)}`,
    `C${Math.round(SW * 0.28)} 0`,
    ` ${Math.round(SW * 0.68)} ${Math.round(WAVE_H * 0.82)}`,
    ` ${SW} ${Math.round(WAVE_H * 0.28)}`,
    `L${SW} ${WAVE_H}`,
    'Z',
  ].join(' ');
  return (
    <Svg
      width={SW}
      height={WAVE_H}
      viewBox={`0 0 ${SW} ${WAVE_H}`}
      style={{ position: 'absolute', bottom: 0 }}
    >
      <Path d={d} fill={Colors.surface} />
    </Svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * LEGACY: phone number + OTP login. Disabled — Google login is now the only
 * sign-in method (see OtpNumber below). Kept here for future re-enablement:
 *
 *   const [phone, setPhone] = useState('');
 *   const [loading, setLoading] = useState(false);
 *   const isValid = phone.length === 10;
 *
 *   const handleSendOtp = async () => {
 *     if (!isValid || loading) return;
 *     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
 *     setLoading(true);
 *     setError('');
 *     try {
 *       await api.post('/api/auth/send-otp', { phone });
 *       router.push({ pathname: '/(auth)/otp-verify', params: { phone } });
 *     } catch (e: any) {
 *       setError(e.message || 'Failed to send OTP. Please try again.');
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 * ───────────────────────────────────────────────────────────────────────── */

export default function OtpNumber() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,         setError]         = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const pendingAction = useSelector(selectPendingAction);

  const [, googleResponse, googlePrompt] = Google.useAuthRequest({
    // Android OAuth clients created after Google's 2022 policy change can't use
    // custom URI scheme redirects (the "Custom URI scheme is not enabled for
    // your Android client" error) -- the Web client ID isn't subject to that
    // restriction, so it's used here for Android too. The backend already
    // accepts logins issued under the Web client ID.
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId:     process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId:     process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes:          ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    if (googleResponse?.type !== 'success') return;
    const accessToken = googleResponse.authentication?.accessToken;
    if (!accessToken) return;
    (async () => {
      setGoogleLoading(true);
      setError('');
      try {
        const res = await api.post<{
          token: string;
          user: { id: string; phone: string; name: string };
          isNewUser: boolean;
          needsProfile: boolean;
        }>('/api/auth/google', { accessToken });

        await setToken(res.token);
        dispatch(loginSuccess({ token: res.token, id: res.user.id, phone: res.user.phone || '', name: res.user.name || '' }));

        if (res.needsProfile) {
          router.replace({ pathname: '/(auth)/complete-profile', params: { name: res.user.name || '' } });
        } else {
          await finishLogin(dispatch, pendingAction);
        }
      } catch (e: any) {
        setError(e.message || 'Google sign-in failed. Please try again.');
      } finally {
        setGoogleLoading(false);
      }
    })();
  }, [googleResponse]);

  const handleGooglePress = () => {
    const configured = [
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    ].some(id => id && !id.startsWith('REPLACE_ME'));

    if (!configured) {
      Alert.alert(
        'Not configured',
        'Google Sign-In is not set up yet.\n\nAdd your Google Client IDs to the .env file and configure the OAuth app in Google Cloud Console.',
        [{ text: 'OK' }]
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    googlePrompt();
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(setGuest());
    dispatch(clearFavourites());
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Green area + dome wave transition */}
      <View style={styles.greenTop}>
        <GroceryIllustration />
        <WaveTransition />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* White card — reliable border-radius on a real View */}
          <View style={styles.card}>

            {/* All form elements flow top-to-bottom with uniform gap */}
            <View style={styles.form}>

              {/* LEGACY phone input + Send OTP button removed — see the
                  commented-out block above OtpNumber for the original code. */}

              {!!error && <Text style={styles.errorText}>{error}</Text>}

              {/* Google — icon pinned left, text centered */}
              <Pressable
                style={[styles.googleBtn, (googleLoading) && styles.sendBtnDisabled]}
                onPress={handleGooglePress}
                disabled={googleLoading}
              >
                {googleLoading
                  ? <ActivityIndicator size="small" color={Colors.textMuted} />
                  : <>
                      <View style={styles.googleIconWrap}>
                        <AntDesign name="google" size={20} color="#4285F4" />
                      </View>
                      <Text style={styles.googleText}>Continue with Google</Text>
                    </>
                }
              </Pressable>

              {/* Skip — directly below Google, not pushed to bottom */}
              <Pressable onPress={handleSkip} hitSlop={10} style={styles.skipWrap}>
                <Text style={styles.skipText}>Skip for now</Text>
              </Pressable>

            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  flex: { flex: 1 },

  greenTop: {
    height: ILLUS_H,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },

  scrollContent: { flexGrow: 1 },

  card: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },

  form: {
    gap: Spacing.md,  // 12px between all elements
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,          // 12px — matches target input corners
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
  },
  prefix: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginRight: Spacing.md,
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
    color: Colors.danger,
    textAlign: 'center',
    marginTop: -Spacing.sm,
  },

  sendBtn: {
    backgroundColor: '#4CAF50',   // material green 500 — matches target bright green
    borderRadius: Radius.full,    // pill button
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.55 },
  sendBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.textInverse,
    letterSpacing: 0.2,
  },

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

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,          // 12px — same as input, matches target
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.18)',
    paddingVertical: 14,              // same height as input
    backgroundColor: Colors.surface,
  },
  googleIconWrap: {
    position: 'absolute',
    left: Spacing.lg,                 // G icon pinned to left, text stays centered
  },
  googleText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },

  skipWrap: { alignItems: 'center', paddingTop: Spacing.xs },
  skipText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: '#43A047',                 // bright green — clearly visible, matches target
  },
});
