export interface Notification {
  id: string;
  type: 'price' | 'order' | 'offer';
  icon: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export const NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'price', icon: '📉', title: 'Price Drop!',       body: 'Tomato dropped to ₹18/kg — down ₹4 today.',        time: '7:00 AM',   read: false },
  { id: '2', type: 'price', icon: '📈', title: 'Price Alert',       body: 'Onion price up ₹5 — now ₹35/kg at Rythu Bazar.',   time: '7:05 AM',   read: false },
  { id: '3', type: 'order', icon: '🛵', title: 'Order Delivered',   body: 'Your order #VV2344 was delivered. Enjoy!',          time: 'Yesterday', read: false },
  { id: '4', type: 'offer', icon: '🎁', title: 'Weekend Special',   body: 'Get 20% off on all combos this Saturday.',          time: 'Yesterday', read: true  },
  { id: '5', type: 'price', icon: '📉', title: 'Mango Season Deal', body: 'Alphonso Mangoes now at ₹140/kg. Limited stock!',   time: '2 days ago', read: true  },
];
