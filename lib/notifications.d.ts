// Type surface for the platform-split notifications module.
// Metro resolves notifications.native.ts / notifications.web.ts at build time;
// tsc has no concept of platform extensions, so it reads this instead.
export {
  setNotificationHandler,
  getExpoPushTokenAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
  addNotificationResponseReceivedListener,
  addNotificationReceivedListener,
  AndroidImportance,
} from 'expo-notifications';
