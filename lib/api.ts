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
