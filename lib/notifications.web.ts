// Stub — expo-notifications is native-only; all exports are no-ops for the web build

export const setNotificationHandler = (_handler: any) => {};

export const getExpoPushTokenAsync = async (_opts?: any): Promise<{ data: string }> =>
  ({ data: '' });

export const requestPermissionsAsync = async (): Promise<{ status: string }> =>
  ({ status: 'denied' });

export const setNotificationChannelAsync = async (_id: string, _channel: any) => null;

export const addNotificationResponseReceivedListener = (_cb: any) =>
  ({ remove: () => {} });

export const addNotificationReceivedListener = (_cb: any) =>
  ({ remove: () => {} });

export const AndroidImportance = { MAX: 5, HIGH: 4, DEFAULT: 3, LOW: 2, MIN: 1, NONE: 0 };
