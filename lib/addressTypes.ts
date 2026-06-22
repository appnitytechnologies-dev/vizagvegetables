/* Shared address types, constants and helpers
   Used by: app/addresses.tsx, app/checkout-address.tsx */

export interface UserAddress {
  id:         string;
  label:      'Home' | 'Office' | 'Other';
  name:       string;
  phone:      string;
  house_no:   string;
  area:       string;
  landmark?:  string | null;
  city:       string;
  state:      string;
  pincode:    string;
  is_default: boolean;
}

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Chandigarh', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
  'Andaman and Nicobar Islands', 'Dadra and Nagar Haveli and Daman and Diu',
  'Lakshadweep', 'Puducherry',
];

export function formatAddress(a: UserAddress): string {
  const parts = [a.house_no, a.area];
  if (a.landmark) parts.push(a.landmark);
  parts.push(`${a.city}, ${a.state} – ${a.pincode}`);
  return parts.join(', ');
}
