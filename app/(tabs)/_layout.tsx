import { Tabs, usePathname, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSelector, useDispatch } from 'react-redux';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Shadow, Spacing } from '../../constants/spacing';
import CartFAB from '../../components/CartFAB';
import { useCart } from '../../hooks/useCart';
import { AppDispatch } from '../../store';
import { selectIsGuest, setPendingAction } from '../../store/authSlice';

const TABS = [
  { name: 'home',    label: 'Home',    icon: 'home-outline',         iconActive: 'home' },
  { name: 'price',   label: 'Price',   icon: 'bar-chart-outline',    iconActive: 'bar-chart' },
  { name: 'markets', label: 'Markets', icon: 'storefront-outline',   iconActive: 'storefront' },
  { name: 'shop',    label: 'Shop',    icon: 'cart-outline',         iconActive: 'cart' },
  { name: 'profile', label: 'Profile', icon: 'person-outline',       iconActive: 'person' },
] as const;

function TabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { count } = useCart();
  const isGuest = useSelector(selectIsGuest);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  return (
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
              <Ionicons
                name={(focused ? tab.iconActive : tab.icon) as any}
                size={22}
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
  );
}

export default function TabsLayout() {
  const pathname = usePathname();

  return (
    <View style={{ flex: 1 }}>
      <Tabs tabBar={props => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="home" />
        <Tabs.Screen name="price" />
        <Tabs.Screen name="markets" />
        <Tabs.Screen name="shop" />
        <Tabs.Screen name="profile" />
      </Tabs>
      {!pathname.endsWith('/shop') && <CartFAB />}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
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
    top: -4,
    right: -8,
    backgroundColor: Colors.danger,
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
