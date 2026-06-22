import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius, Shadow } from '../../constants/spacing';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    image: require('../../assets/images/grocery-illustration.png'),
    prefix: 'Vizag Vegetables is a solution for ',
    bold: 'Grocery Shopping',
    suffix: ' every you need',
  },
  {
    id: '2',
    image: require('../../assets/images/onboard-1.png'),
    prefix: 'Get your fresh groceries delivered ',
    bold: 'In No Time',
    suffix: ' right to your doorstep',
  },
  {
    id: '3',
    image: require('../../assets/images/onboard-2.png'),
    prefix: 'Shop for fresh vegetables ',
    bold: 'Online',
    suffix: " from Vizag's best local markets",
  },
];

export default function GetStarted() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideAreaHeight, setSlideAreaHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const handleListLayout = (e: { nativeEvent: { layout: { height: number } } }) => {
    setSlideAreaHeight(e.nativeEvent.layout.height);
  };

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(auth)/otp-number');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.brandTitle}>Vizag Vegetables</Text>
        <Text style={styles.brandIcon}>🥕</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onLayout={handleListLayout}
        style={styles.list}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.slide, { height: slideAreaHeight }]}>
            <View style={styles.illustrationArea}>
              <View style={styles.blob} />
              <Image
                source={item.image}
                style={styles.illustrationImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.bottom}>
              <Text style={styles.tagline}>
                {item.prefix}
                <Text style={styles.taglineBold}>{item.bold}</Text>
                {item.suffix}
              </Text>

              <Pressable style={styles.button} onPress={handleGetStarted}>
                <Text style={styles.buttonText}>Get Started</Text>
              </Pressable>

              <View style={styles.dotsRow}>
                {SLIDES.map((_, i) => (
                  <View key={i} style={[styles.dot, activeIndex === i && styles.dotActive]} />
                ))}
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  brandTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.textInverse,
  },
  brandIcon: {
    fontSize: 28,
  },

  list: {
    flex: 1,
  },
  slide: {
    width,
    flexDirection: 'column',
  },

  illustrationArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blob: {
    position: 'absolute',
    width: width * 1.05,
    height: width * 1.05,
    borderRadius: (width * 1.05) / 2,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  illustrationImage: {
    width: width * 0.85,
    height: width * 0.85,
  },

  bottom: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 40,
    alignItems: 'center',
    gap: Spacing.xl,
  },
  tagline: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.textInverse,
    textAlign: 'center',
    lineHeight: FontSize.md * 1.65,
  },
  taglineBold: {
    fontFamily: FontFamily.bold,
    color: Colors.textInverse,
  },

  button: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    paddingVertical: Spacing.lg,
    width: '100%',
    alignItems: 'center',
    ...Shadow.md,
  },
  buttonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.primaryDark,
  },

  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    width: 10,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
});
