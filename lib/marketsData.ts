import { ApiMarket } from './api';
import { haversineKm } from '../utils/distance';

export type UserLocation = { lat: number; lng: number } | null;

export const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Fallback data (shown instantly, replaced by the API response) ──
export const FALLBACK_RYTHU: ApiMarket[] = [
  { id: 1, category_id: 1, category_name: 'Rythu Bazar', category_slug: 'rythu-bazar', name: 'MVP Rythu Bazar',       area: 'MVP Colony',    address: 'MVP Colony, Sector 4, Visakhapatnam, AP 530017', lat: 17.7333, lng: 83.3167, distance_km: 1.2, rating: 4.3, reviews_count: 128, vendors_count: 45, opens: '6:00 AM', closes: '1:00 PM', open_hour: 6,   close_hour: 13,   days: 'Mon–Sat', holiday: 'Tuesday', day_of_week: null, bg_color: '#D4EDDA', facilities: ['Parking','Restrooms','ATM Nearby','Bus Stop'], is_active: true },
  { id: 2, category_id: 1, category_name: 'Rythu Bazar', category_slug: 'rythu-bazar', name: 'Jagadamba Rythu Bazar', area: 'Jagadamba',     address: 'Jagadamba Centre, Visakhapatnam, AP 530002',      lat: 17.7229, lng: 83.3012, distance_km: 2.8, rating: 4.3, reviews_count: 96,  vendors_count: 62, opens: '5:30 AM', closes: '1:00 PM', open_hour: 5.5, close_hour: 13,   days: 'Daily',   holiday: 'None',    day_of_week: null, bg_color: '#FFF3CD', facilities: ['Parking','Restrooms','ATM Nearby','Bus Stop'], is_active: true },
  { id: 3, category_id: 1, category_name: 'Rythu Bazar', category_slug: 'rythu-bazar', name: 'Gajuwaka Rythu Bazar',  area: 'Gajuwaka',      address: 'Gajuwaka, Visakhapatnam, AP 530026',              lat: 17.6807, lng: 83.2122, distance_km: 4.5, rating: 4.3, reviews_count: 74,  vendors_count: 38, opens: '6:00 AM', closes: '1:00 PM', open_hour: 6,   close_hour: 13,   days: 'Mon–Sat', holiday: 'Sunday',  day_of_week: null, bg_color: '#D1ECF1', facilities: ['Parking','Restrooms','Bus Stop'],               is_active: true },
  { id: 4, category_id: 1, category_name: 'Rythu Bazar', category_slug: 'rythu-bazar', name: 'Dwaraka Nagar Bazar',   area: 'Dwaraka Nagar', address: 'Dwaraka Nagar, Visakhapatnam, AP 530016',         lat: 17.7269, lng: 83.3013, distance_km: 3.1, rating: 4.1, reviews_count: 55,  vendors_count: 28, opens: '6:30 AM', closes: '12:30 PM', open_hour: 6.5, close_hour: 12.5, days: 'Daily',   holiday: 'Monday',  day_of_week: null, bg_color: '#F8D7DA', facilities: ['Parking','ATM Nearby'],                         is_active: true },
  { id: 14, category_id: 1, category_name: 'Rythu Bazar', category_slug: 'rythu-bazar', name: 'MVP Colony Shandha',   area: 'MVP Colony',    address: 'MVP Colony, Visakhapatnam, AP 530017',            lat: 17.7350, lng: 83.3200, distance_km: 1.4, rating: 4.5, reviews_count: 186, vendors_count: 40, opens: '6:00 AM', closes: '1:00 PM', open_hour: 6,   close_hour: 13,   days: 'Daily',   holiday: 'None',    day_of_week: null, bg_color: '#D4EDDA', facilities: ['Parking','Restrooms'],                          is_active: true },
  { id: 15, category_id: 1, category_name: 'Rythu Bazar', category_slug: 'rythu-bazar', name: 'Madhurawada Rythu Bazar', area: 'Gopalapatnam', address: 'Madhurawada, Visakhapatnam, AP 530048',        lat: 17.8010, lng: 83.3760, distance_km: 14,  rating: 4.2, reviews_count: 120, vendors_count: 30, opens: '6:00 AM', closes: '1:00 PM', open_hour: 6,   close_hour: 13,   days: 'Daily',   holiday: 'None',    day_of_week: null, bg_color: '#FFF3CD', facilities: ['Parking'],                                      is_active: true },
];

export const FALLBACK_LOCAL: ApiMarket[] = [
  { id: 5,  category_id: 2, category_name: 'Local Market', category_slug: 'local-market', name: 'Scindia Market',     area: 'Beach Road',  address: 'Scindia, Beach Road, Visakhapatnam', lat: 17.7218, lng: 83.3360, distance_km: 1.2,  rating: 4.3, reviews_count: 0, vendors_count: 30, opens: '7:00 AM', closes: '4:00 PM',  open_hour: 7, close_hour: 16, days: null, holiday: null, day_of_week: 'Sun', bg_color: '#D4EDDA', facilities: [], is_active: true },
  { id: 6,  category_id: 2, category_name: 'Local Market', category_slug: 'local-market', name: 'Duvvada Market',     area: 'Duvvada',     address: 'Duvvada, Visakhapatnam',             lat: 17.7569, lng: 83.2272, distance_km: 7.0,  rating: 4.5, reviews_count: 0, vendors_count: 40, opens: '7:00 AM', closes: '4:00 PM',  open_hour: 7, close_hour: 16, days: null, holiday: null, day_of_week: 'Sun', bg_color: '#FFF3CD', facilities: [], is_active: true },
  { id: 7,  category_id: 2, category_name: 'Local Market', category_slug: 'local-market', name: 'Sri Haripuram',      area: 'Haripuram',   address: 'Sri Haripuram, Visakhapatnam',       lat: 17.7820, lng: 83.3680, distance_km: 5.2,  rating: 4.1, reviews_count: 0, vendors_count: 22, opens: '6:00 AM', closes: '1:00 PM',  open_hour: 6, close_hour: 13, days: null, holiday: null, day_of_week: 'Sun', bg_color: '#D1ECF1', facilities: [], is_active: true },
  { id: 8,  category_id: 2, category_name: 'Local Market', category_slug: 'local-market', name: 'RK Beach Shandha',   area: 'Beach Road',  address: 'RK Beach, Visakhapatnam',            lat: 17.7264, lng: 83.3259, distance_km: 2.1,  rating: 4.4, reviews_count: 0, vendors_count: 25, opens: '6:00 AM', closes: '12:00 PM', open_hour: 6, close_hour: 12, days: null, holiday: null, day_of_week: 'Mon', bg_color: '#F8D7DA', facilities: [], is_active: true },
  { id: 9,  category_id: 2, category_name: 'Local Market', category_slug: 'local-market', name: 'Pendurthi Shandha',  area: 'Pendurthi',   address: 'Pendurthi, Visakhapatnam',           lat: 17.8290, lng: 83.2280, distance_km: 9.0,  rating: 4.0, reviews_count: 0, vendors_count: 35, opens: '6:00 AM', closes: '1:00 PM',  open_hour: 6, close_hour: 13, days: null, holiday: null, day_of_week: 'Tue', bg_color: '#D4EDDA', facilities: [], is_active: true },
  { id: 10, category_id: 2, category_name: 'Local Market', category_slug: 'local-market', name: 'Bheemli Shandha',    area: 'Bheemli',     address: 'Bheemli Beach, Visakhapatnam',       lat: 17.8937, lng: 83.4556, distance_km: 22.0, rating: 4.2, reviews_count: 0, vendors_count: 20, opens: '6:00 AM', closes: '1:00 PM',  open_hour: 6, close_hour: 13, days: null, holiday: null, day_of_week: 'Wed', bg_color: '#FFF3CD', facilities: [], is_active: true },
  { id: 11, category_id: 2, category_name: 'Local Market', category_slug: 'local-market', name: 'Simhachalam Shandha',area: 'Simhachalam', address: 'Simhachalam, Visakhapatnam',         lat: 17.7750, lng: 83.2880, distance_km: 12.0, rating: 4.3, reviews_count: 0, vendors_count: 28, opens: '6:00 AM', closes: '1:00 PM',  open_hour: 6, close_hour: 13, days: null, holiday: null, day_of_week: 'Thu', bg_color: '#D1ECF1', facilities: [], is_active: true },
  { id: 12, category_id: 2, category_name: 'Local Market', category_slug: 'local-market', name: 'Gajuwaka Shandha',   area: 'Gajuwaka',    address: 'Gajuwaka, Visakhapatnam',            lat: 17.6807, lng: 83.2122, distance_km: 4.5,  rating: 4.1, reviews_count: 0, vendors_count: 32, opens: '6:00 AM', closes: '1:00 PM',  open_hour: 6, close_hour: 13, days: null, holiday: null, day_of_week: 'Fri', bg_color: '#F8D7DA', facilities: [], is_active: true },
  { id: 13, category_id: 2, category_name: 'Local Market', category_slug: 'local-market', name: 'MVP Colony Shandha', area: 'MVP Colony',  address: 'MVP Colony, Visakhapatnam',          lat: 17.7333, lng: 83.3167, distance_km: 1.5,  rating: 4.5, reviews_count: 0, vendors_count: 45, opens: '6:00 AM', closes: '1:00 PM',  open_hour: 6, close_hour: 13, days: null, holiday: null, day_of_week: 'Sat', bg_color: '#D4EDDA', facilities: [], is_active: true },
];

export function isOpenNow(openHour: number | null, closeHour: number | null) {
  if (openHour == null || closeHour == null) return false;
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  return h >= openHour && h < closeHour;
}

export function sortByDistance(markets: ApiMarket[], userLocation: UserLocation) {
  if (!userLocation) return markets;
  return [...markets].sort((a, b) => {
    const da = a.lat && a.lng ? haversineKm(userLocation.lat, userLocation.lng, a.lat, a.lng) : 999;
    const db = b.lat && b.lng ? haversineKm(userLocation.lat, userLocation.lng, b.lat, b.lng) : 999;
    return da - db;
  });
}
