import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider, useDispatch } from 'react-redux';
import { useFonts } from 'expo-font';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store, AppDispatch } from '../store';
import { loadToken, decodeToken, api } from '../lib/api';
import { loginSuccess } from '../store/authSlice';
import { setFavourites } from '../store/favouritesSlice';

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
        // Load favourites from API (non-fatal if it fails)
        try {
          const ids = await api.get<string[]>('/api/favorites');
          dispatch(setFavourites(ids));
        } catch {
          // Network issue or token expired — favourites stay empty
        }
      } catch {
        // expired / corrupt token — stay logged out
      }
    })();
  }, [dispatch]);
  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <Provider store={store}>
      <AuthLoader />
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
      </Stack>
    </Provider>
  );
}
