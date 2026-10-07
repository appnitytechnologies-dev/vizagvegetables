import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { UserLocation } from '../lib/marketsData';

/** Requests foreground location permission once and resolves the user's GPS
 *  coordinates, used to sort markets by real distance instead of the
 *  seed `distance_km` values. */
export function useUserGps(): UserLocation {
  const [loc, setLoc] = useState<UserLocation>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    })();
  }, []);

  return loc;
}
