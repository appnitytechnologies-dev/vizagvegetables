import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'user_token';

/* ── In-memory token (sync access during session) ─────────── */
let _token: string | null = null;

export const getToken  = () => _token;

export const setToken  = async (token: string) => {
  _token = token;
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = async () => {
  _token = null;
  await AsyncStorage.removeItem(TOKEN_KEY);
};

/** Call once on app start to rehydrate from AsyncStorage */
export const loadToken = async (): Promise<string | null> => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  _token = token;
  return token;
};

export const decodeToken = (token: string): { id: string; phone: string; role: string } | null => {
  try { return JSON.parse(atob(token.split('.')[1])); }
  catch { return null; }
};

/* ── Fetch wrapper ────────────────────────────────────────── */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

export const api = {
  get:    <T>(path: string)                => request<T>(path, { method: 'GET' }),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: <T>(path: string)               => request<T>(path, { method: 'DELETE' }),
};

/** Upload a local file URI via multipart/form-data POST.
 *  Handles both React Native (file:// / content://) and Expo Web (blob:) URIs.
 */
export const uploadFile = async <T = any>(
  path: string,
  fieldName: string,
  uri: string,
  type = 'image/jpeg',
  name = 'upload.jpg',
): Promise<T> => {
  const token = getToken();
  const formData = new FormData();

  if (uri.startsWith('blob:') || uri.startsWith('data:')) {
    // Expo Web: fetch the blob and wrap in a File object
    const blobRes = await fetch(uri);
    const blob    = await blobRes.blob();
    formData.append(fieldName, new File([blob], name, { type }));
  } else {
    // React Native (iOS / Android): native fetch handles { uri } natively
    formData.append(fieldName, { uri, type, name } as any);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Upload failed');
  }
  return res.json();
};

/* ── Shared types ─────────────────────────────────────────── */
export interface ApiProduct {
  id:             string;
  name:           string;
  telugu_name:    string | null;
  emoji:          string | null;
  description:    string | null;
  price:          number;
  previous_price: number;
  unit:           string;
  category_id:    string;
  category_name:  string;
  stock_quantity: number;
  image_url:      string | null;
  is_active:      boolean;
}

export interface ApiCategory {
  id:   string;
  name: string;
}

export interface ApiOrderItem {
  product_id: string;
  name:       string;
  unit:       string;
  quantity:   number;
  unit_price: number;
  image_url:  string | null;
}

export interface ApiOrder {
  id:               string;
  total_amount:     number;
  delivery_address: string;
  delivery_slot:    string;
  payment_method:   string;
  status:           string;
  created_at:       string;
  items:            ApiOrderItem[];
}

/** Returns full image URL — handles relative /uploads/... paths */
export function imgUrl(image_url: string | null | undefined): string | null {
  if (!image_url) return null;
  if (image_url.startsWith('http')) return image_url;
  return `${BASE_URL}${image_url}`;
}

/* ── Market types ─────────────────────────────────────────── */
export interface ApiMarketCategory {
  id:          number;
  name:        string;   // 'Rythu Bazar' | 'Local Market'
  slug:        string;   // 'rythu-bazar' | 'local-market'
  description: string | null;
}

export interface ApiMarket {
  id:             number;
  category_id:    number;
  category_name:  string;
  category_slug:  string;
  name:           string;
  area:           string;
  address:        string | null;
  lat:            number | null;
  lng:            number | null;
  distance_km:    number | null;
  rating:         number;
  reviews_count:  number;
  vendors_count:  number;
  opens:          string | null;  // '6:00 AM'
  closes:         string | null;  // '1:00 PM'
  open_hour:      number | null;
  close_hour:     number | null;
  days:           string | null;  // 'Mon–Sat' | 'Daily'
  holiday:        string | null;  // 'Tuesday' | 'None'
  day_of_week:    string | null;  // 'Sun' | 'Mon' … for local markets
  bg_color:       string;
  facilities:     string[];
  is_active:      boolean;
  image_folder?:  string;
  images?:        string[];
}

export const marketApi = {
  getCategories: () =>
    api.get<ApiMarketCategory[]>('/api/markets/categories'),

  getAll: (params?: { type?: string; day?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.type)   qs.set('type',   params.type);
    if (params?.day)    qs.set('day',    params.day);
    if (params?.search) qs.set('search', params.search);
    const q = qs.toString();
    return api.get<ApiMarket[]>(`/api/markets${q ? `?${q}` : ''}`);
  },

  getById: (id: number | string) =>
    api.get<ApiMarket>(`/api/markets/${id}`),
};
