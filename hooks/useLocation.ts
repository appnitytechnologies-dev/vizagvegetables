import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'CUSTOM_LOCATION';

type LocationState = {
  locationText: string;
  loading: boolean;
  isCustom: boolean;
  setCustomLocation: (text: string) => Promise<void>;
  resetToGPS: () => Promise<void>;
};

const formatAddress = (place: Location.LocationGeocodedAddress): string => {
  const parts = [
    place.district || place.subregion,
    place.city || place.region,
  ].filter(Boolean) as string[];

  if (parts.length > 0) return parts.join(', ');
  return place.name ?? '';
};

export const useLocation = (): LocationState => {
  const [locationText, setLocationText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCustom, setIsCustom] = useState(false);
  const [gpsRevision, setGpsRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);

      // Use saved custom location if present
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        if (!cancelled) {
          setLocationText(saved);
          setIsCustom(true);
          setLoading(false);
        }
        return;
      }

      // Otherwise try GPS
      setIsCustom(false);
      let status: string;
      try {
        const result = await Location.requestForegroundPermissionsAsync();
        status = result.status;
      } catch {
        if (!cancelled) { setLocationText('Visakhapatnam'); setLoading(false); }
        return;
      }

      if (status !== 'granted') {
        if (!cancelled) { setLocationText('Visakhapatnam'); setLoading(false); }
        return;
      }

      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const results = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        if (!cancelled) {
          setLocationText(results.length > 0 ? formatAddress(results[0]) : 'Visakhapatnam');
        }
      } catch {
        if (!cancelled) setLocationText('Visakhapatnam');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [gpsRevision]);

  const setCustomLocation = async (text: string) => {
    const trimmed = text.trim();
    await AsyncStorage.setItem(STORAGE_KEY, trimmed);
    setLocationText(trimmed);
    setIsCustom(true);
    setLoading(false);
  };

  const resetToGPS = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setIsCustom(false);
    setGpsRevision(r => r + 1);
  };

  return { locationText, loading, isCustom, setCustomLocation, resetToGPS };
};
