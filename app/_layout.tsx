import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { useFonts } from 'expo-font';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from '@expo-google-fonts/roboto';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from '../lib/notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store, persistor, AppDispatch } from '../store';
import { loadToken, decodeToken, api, imgUrl } from '../lib/api';
import { loginSuccess, setAvatarUrl, selectAuth } from '../store/authSlice';
import { setFavourites } from '../store/favouritesSlice';
import { addToCart, clearCart, selectCartItems, CartItem } from '../store/cartSlice';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

SplashScreen.preventAutoHideAsync();

/** Rehydrates auth state and favourites from AsyncStorage on every app launch */
function AuthLoader() {
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    (async () => {
      try {
        const token = await loadToken();
        if (!token) return;
        const payload = decodeToken(token);
        if (!payload) return;
        const name =
          (await AsyncStorage.getItem('user_name')) ||
          `User ${payload.phone.slice(-4)}`;
        dispatch(loginSuccess({ token, id: payload.id, phone: payload.phone, name }));
        // Restore saved avatar URL (stored locally after upload)
        const savedAvatar = await AsyncStorage.getItem('user_avatar');
        if (savedAvatar) dispatch(setAvatarUrl(imgUrl(savedAvatar)));
        // Load favourites from API (non-fatal if it fails)
        try {
          const ids = await api.get<string[]>('/api/favorites');
          dispatch(setFavourites(ids));
        } catch {}
        // Load cart from API
        try {
          const items = await api.get<CartItem[]>('/api/cart');
          if (items.length > 0) {
            dispatch(clearCart());
            items.forEach(item => dispatch(addToCart(item)));
          }
        } catch {}
      } catch {
        // expired / corrupt token — stay logged out
      }
    })();
  }, [dispatch]);
  return null;
}

/** Watches cart state and debounces PUT /api/cart after any change */
function CartSyncer() {
  const { isLoggedIn } = useSelector(selectAuth);
  const items = useSelector(selectCartItems);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      api.put('/api/cart', { items }).catch(() => {});
    }, 600);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [items, isLoggedIn]);

  return null;
}

/** Requests permission, registers Expo push token, and handles notification taps */
function PushRegistrar() {
  const { isLoggedIn } = useSelector(selectAuth);

  // Notification tap → navigate to the relevant screen
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, any>;
      if (data?.type === 'order' && data.orderId) {
        router.push({ pathname: '/order-tracking', params: { id: data.orderId } } as any);
      } else if (data?.type === 'price_drop') {
        router.push('/saved-favourites' as any);
      }
    });
    return () => sub.remove();
  }, []);

  // Register push token whenever user logs in
  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      if (!Device.isDevice) return; // push tokens don't work on simulators

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Vizag Vegetables',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3AA655',
        });
      }

      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      const projectId = Constants.easConfig?.projectId
        ?? (Constants.expoConfig?.extra as any)?.eas?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );
      await api.post('/api/push-tokens', { token: tokenData.data, platform: 'expo' });
    })().catch(() => {});
  }, [isLoggedIn]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <Provider store={store}>
      <PersistGate persistor={persistor} loading={null}>
        <>
          <AuthLoader />
          <CartSyncer />
          <PushRegistrar />
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="shop-details" options={{ presentation: 'card' }} />
            <Stack.Screen name="market-detail" options={{ presentation: 'card' }} />
            <Stack.Screen name="cart" options={{ presentation: 'card' }} />
            <Stack.Screen name="checkout-address" options={{ presentation: 'card' }} />
            <Stack.Screen name="checkout-payment" options={{ presentation: 'card' }} />
            <Stack.Screen name="order-success" options={{ presentation: 'card' }} />
            <Stack.Screen name="order-tracking" options={{ presentation: 'card' }} />
            <Stack.Screen name="notifications" options={{ presentation: 'card' }} />
            <Stack.Screen name="my-orders" options={{ presentation: 'card' }} />
            <Stack.Screen name="saved-favourites" options={{ presentation: 'card' }} />
            <Stack.Screen name="addresses" options={{ presentation: 'card' }} />
            <Stack.Screen name="support" options={{ presentation: 'card' }} />
            <Stack.Screen name="about-us" options={{ presentation: 'card' }} />
            <Stack.Screen name="edit-profile" options={{ presentation: 'card' }} />
            <Stack.Screen name="razorpay-checkout" options={{ presentation: 'fullScreenModal' }} />
          </Stack>
        </>
      </PersistGate>
    </Provider>
  );
}
