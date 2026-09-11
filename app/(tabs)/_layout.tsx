import { Tabs, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useSelector, useDispatch } from 'react-redux';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Shadow, Spacing } from '../../constants/spacing';
import { useCart } from '../../hooks/useCart';
import { AppDispatch } from '../../store';
import { selectIsGuest, setPendingAction } from '../../store/authSlice';
import { TabIcon } from '../../components/TabIcon';
import FloatingCart from '../../components/ui/FloatingCart';

const TABS = [
  { name: 'home',    label: 'Home' },
  { name: 'price',   label: 'Price' },
  { name: 'markets', label: 'Markets' },
  { name: 'shop',    label: 'Shop' },
  { name: 'profile', label: 'Profile' },
] as const;

/* ── Tab bar ─────────────────────────────────────────────── */
function TabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { count } = useCart();
  const isGuest = useSelector(selectIsGuest);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  return (
    <View>
      <View style={[styles.tabBar, { paddingBottom: insets.bottom || Spacing.sm }]}>
        {state.routes.map((route: any, idx: number) => {
          const tab = TABS.find(t => t.name === route.name);
          if (!tab) return null;
          const focused = state.index === idx;

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (tab.name === 'profile' && isGuest) {
              dispatch(setPendingAction({ type: 'VIEW_PROFILE', returnTo: '/(tabs)/profile' }));
              router.push('/(auth)/otp-number');
              return;
            }
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tabItem}>
              <View style={styles.iconWrap}>
                <TabIcon
                  name={tab.name}
                  size={24}
                  color={focused ? Colors.primary : Colors.textMuted}
                />
                {tab.name === 'shop' && count > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.floatingCartWrap} pointerEvents="box-none">
        <FloatingCart />
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs tabBar={props => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="home" />
        <Tabs.Screen name="price" />
        <Tabs.Screen name="markets" />
        <Tabs.Screen name="shop" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingCartWrap: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    paddingTop: Spacing.sm,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadow.md,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4, right: -8,
    backgroundColor: Colors.danger,
    borderRadius: 999,
    minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    color: Colors.textInverse,
  },
  tabLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  tabLabelActive: {
    color: Colors.primary,
  },
});
