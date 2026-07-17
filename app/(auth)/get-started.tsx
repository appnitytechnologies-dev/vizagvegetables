import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { selectAuth } from '../../store/authSlice';
import PricesIllustration from '../../components/illustrations/PricesIllustration';
import MarketIllustration from '../../components/illustrations/MarketIllustration';
import DeliveryIllustration from '../../components/illustrations/DeliveryIllustration';

const { width, height: SCREEN_H } = Dimensions.get('window');
const AMBER = '#F59E0B';

interface Slide {
  id: string;
  eyebrow: string;
  titleBefore: string;
  titleHighlight: string;
  titleAfter: string;
  subtitle: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    eyebrow: 'EVERY MORNING, FRESH',
    titleBefore: 'Check ',
    titleHighlight: "today's Rythu Bazar",
    titleAfter: ' prices before you leave home',
    subtitle: 'ప్రతిరోజూ తాజా మార్కెట్ ధరలు',
  },
  {
    id: '2',
    eyebrow: 'ALWAYS CLOSE BY',
    titleBefore: 'Find the ',
    titleHighlight: 'nearest open market',
    titleAfter: ' around you in seconds',
    subtitle: 'మీ దగ్గర్లోని రైతు బజార్లు',
  },
  {
    id: '3',
    eyebrow: 'FARM TO YOUR DOOR',
    titleBefore: 'Order ',
    titleHighlight: 'fresh vegetables',
    titleAfter: ' and get them delivered fast',
    subtitle: 'ఇంటికే తాజా కూరగాయలు',
  },
];

function SlideIllustration({ id, size }: { id: string; size: number }) {
  if (id === '1') return <PricesIllustration size={size} />;
  if (id === '2') return <MarketIllustration size={size} />;
  return <DeliveryIllustration size={size} />;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function GetStarted() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [listHeight, setListHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const btnScale = useSharedValue(1);
  const auth = useSelector(selectAuth);

  // Safety net — a Google login started but never finished (phone still
  // missing) shouldn't silently sit "logged in" with a broken account.
  useEffect(() => {
    if (auth.isLoggedIn && !auth.phone) {
      router.replace('/(auth)/complete-profile' as any);
    }
  }, [auth.isLoggedIn, auth.phone]);

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const isLast = activeIndex === SLIDES.length - 1;

  // Illustration area = 56% of slide height; illustration SVG fills 90% of that
  const slideHeight = listHeight > 0 ? listHeight : SCREEN_H * 0.72;
  const illusAreaH  = slideHeight * 0.56;
  const illusSize   = Math.min(illusAreaH * 0.90, width * 0.84, 300);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const handleNext = () => {
    btnScale.value = withSpring(0.95, { damping: 10 }, () => {
      btnScale.value = withSpring(1, { damping: 12 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isLast) {
      flatListRef.current?.scrollToOffset({
        offset: (activeIndex + 1) * width,
        animated: true,
      });
    } else {
      router.push('/(auth)/otp-number');
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(auth)/otp-number');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* ── Header ── */}
      <Animated.View entering={FadeInDown.delay(80).duration(420)} style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEmoji}>🔥</Text>
          <Text style={styles.headerTitle}>YZAG Fresh</Text>
        </View>
        {!isLast && (
          <Pressable onPress={handleSkip} hitSlop={14}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
      </Animated.View>

      {/* ── Slides ── */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onLayout={e => setListHeight(e.nativeEvent.layout.height)}
        keyExtractor={item => item.id}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width, height: slideHeight }]}>

            {/* Illustration — fixed proportional height */}
            <View style={[styles.illustrationArea, { height: illusAreaH }]}>
              <SlideIllustration id={item.id} size={illusSize} />
            </View>

            {/* Text block */}
            <View style={styles.textBlock}>
              <Text style={styles.eyebrow}>{item.eyebrow}</Text>
              <Text style={styles.title}>
                {item.titleBefore}
                <Text style={styles.titleHighlight}>{item.titleHighlight}</Text>
                {item.titleAfter}
              </Text>
              <Text style={styles.teluguSubtitle}>{item.subtitle}</Text>
            </View>

          </View>
        )}
      />

      {/* ── Bottom: button + dots ── */}
      <Animated.View entering={FadeInDown.delay(220).duration(420)} style={styles.bottom}>
        <AnimatedPressable style={[styles.button, btnStyle]} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {isLast ? 'Get Started' : 'Next  →'}
          </Text>
        </AnimatedPressable>

        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, activeIndex === i && styles.dotActive]} />
          ))}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerEmoji: { fontSize: 20 },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textInverse,
  },
  skipText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.textInverse,
    opacity: 0.82,
  },

  list: { flex: 1 },
  slide: { flexDirection: 'column' },

  illustrationArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  textBlock: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Spacing.sm,
  },
  eyebrow: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 27,
    color: Colors.textInverse,
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.3,
    marginBottom: Spacing.sm,
  },
  titleHighlight: { color: AMBER },
  teluguSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.60)',
    textAlign: 'center',
  },

  bottom: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
    alignItems: 'center',
    gap: Spacing.lg,
  },
  button: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingVertical: Spacing.lg,
    width: '100%',
    alignItems: 'center',
    ...Shadow.md,
  },
  buttonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.primaryDark,
    letterSpacing: 0.2,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  dotActive: {
    width: 26,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.textInverse,
  },
});
