import { useEffect } from 'react';
import { Text, StyleSheet, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';

export default function SplashScreen() {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
    opacity.value = withTiming(1, { duration: 600 });
    textOpacity.value = withTiming(1, { duration: 900 });

    const timer = setTimeout(() => {
      router.replace('/(auth)/get-started');
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <Image
          source={require('../../assets/images/splash-icon.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={[styles.textWrap, textStyle]}>
        <Text style={styles.title}>YZAG Fresh</Text>
        <Text style={styles.subtitleLine}>Local. Fresh. Connected.</Text>
        <Text style={styles.subtitleLine}>Market Updates</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  logoImage: {
    width: 180,
    height: 160,
  },
  textWrap: {
    alignItems: 'center',
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xxl,
    color: Colors.textInverse,
    letterSpacing: -0.3,
    marginBottom: 56,
  },
  subtitleLine: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: '#93FFBA',
    letterSpacing: 2,
    textAlign: 'center',
    lineHeight: 22,
  },
});
