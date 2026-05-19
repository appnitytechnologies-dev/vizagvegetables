# 🥦 Vizag Vegetables — Claude Code Master Prompt

---

## HOW TO USE THIS PROMPT

1. Open Claude Code in VS Code (`Ctrl + Shift + P` → "Claude Code")
2. Paste this ENTIRE file as your first message
3. Also attach all design screenshots (splash, home, price, shop, cart etc.)
4. Say: **"Read the spec and all images fully. Then start Step 1."**
5. Go step by step — confirm each step before saying "Next"

---

## CONTEXT

You are building **Vizag Vegetables** — a production-grade React Native mobile app
for Vizag's Rythu Bazar vegetable market. This is a real app, not a tutorial project.

The design is inspired by **Blinkit / Swiggy / Zepto** — modern Indian grocery apps.
Every screen must look premium, polished, and pixel-perfect.

---

## TECH STACK (STRICT — do not deviate)

```
Framework:        React Native + Expo SDK 54
Router:           Expo Router (file-based, already installed)
State:            Redux Toolkit (cart + favourites)
Styling:          React Native StyleSheet only (NO NativeWind, NO styled-components)
Font:             DM Sans via @expo-google-fonts/dm-sans
Icons:            @expo/vector-icons (Ionicons + MaterialCommunityIcons)
Animations:       react-native-reanimated (already in Expo SDK 54)
Gestures:         react-native-gesture-handler (already in Expo SDK 54)
Images:           expo-image (better performance than Image)
Storage:          @react-native-async-storage/async-storage
Data:             Dummy data only — NO API calls, NO fetch, NO axios yet
Payments:         Razorpay — placeholder UI only, wire later
```

**Install these before starting:**
```bash
npx expo install expo-image
npx expo install @react-native-async-storage/async-storage
npm install @reduxjs/toolkit react-redux
npx expo install @expo-google-fonts/dm-sans expo-font
npm install @expo/vector-icons
```

---

## MODERN STYLING RULES (VERY IMPORTANT)

This app must look like a **2025 premium Indian grocery app**.
Follow every rule below strictly:

### Typography
```typescript
// Use DM Sans everywhere
fontFamily: 'DMSans_400Regular'   // body text
fontFamily: 'DMSans_500Medium'    // labels, buttons
fontFamily: 'DMSans_700Bold'      // headings, prices
letterSpacing: -0.3               // tight tracking on headings
```

### Spacing System (use ONLY these values)
```typescript
export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  xxxl: 32,
};
```

### Border Radius System
```typescript
export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  full: 999,  // pills and circles
};
```

### Shadows (iOS + Android)
```typescript
export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};
```

### Modern UI Patterns to use
- **Sticky headers** with blur effect on scroll
- **Skeleton loading** placeholders (gray animated shimmer)
- **Haptic feedback** on button press (`expo-haptics`)
- **Spring animations** via `react-native-reanimated` on cards, buttons
- **FlatList with getItemLayout** for performance (not ScrollView for lists)
- **KeyboardAvoidingView** on all input screens
- **SafeAreaView** on every screen
- **StatusBar** — white content on green headers, dark on white screens

### Card Style (standard across app)
```typescript
card: {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 12,
  ...Shadow.sm,
}
```

### Green CTA Button (standard)
```typescript
button: {
  backgroundColor: '#2E7D32',
  borderRadius: 999,       // full pill shape
  paddingVertical: 16,
  paddingHorizontal: 24,
  alignItems: 'center',
}
buttonText: {
  color: '#FFFFFF',
  fontFamily: 'DMSans_600SemiBold',
  fontSize: 16,
  letterSpacing: 0.2,
}
```

---

## COLOR SYSTEM

```typescript
// constants/colors.ts — copy this EXACTLY

export const Colors = {
  // Brand greens
  primary:        '#2E7D32',
  primaryDark:    '#1B5E20',
  primaryAccent:  '#16A34A',
  primaryLight:   '#E8F5E9',
  primaryPale:    '#F1F8F1',

  // Backgrounds
  background:     '#F5F7F0',  // app bg (very light green-gray)
  surface:        '#FFFFFF',  // cards
  surfaceAlt:     '#F8FAF8',  // subtle alt surface

  // Text
  textPrimary:    '#0F172A',  // headings
  textSecondary:  '#475569',  // body
  textMuted:      '#94A3B8',  // placeholders
  textInverse:    '#FFFFFF',  // on green bg

  // Semantic
  danger:         '#E53935',  // price up, errors
  dangerLight:    '#FFEBEE',
  success:        '#2E7D32',  // price down
  successLight:   '#E8F5E9',
  warning:        '#F59E0B',
  warningLight:   '#FFFBEB',

  // UI
  border:         'rgba(0,0,0,0.08)',
  borderStrong:   'rgba(0,0,0,0.15)',
  overlay:        'rgba(0,0,0,0.4)',
  shimmer:        '#E8ECEB',  // skeleton loading color
};
```

---

## PROJECT STRUCTURE

```
VizagVegetables/
├── app/
│   ├── _layout.tsx                  ← root layout + font loading + Redux Provider
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── splash.tsx
│   │   ├── get-started.tsx
│   │   ├── otp-number.tsx
│   │   └── otp-verify.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx              ← custom tab bar
│   │   ├── home.tsx
│   │   ├── price.tsx
│   │   ├── markets.tsx
│   │   ├── shop.tsx
│   │   └── profile.tsx
│   ├── shop-details.tsx
│   ├── market-detail.tsx
│   ├── cart.tsx
│   ├── checkout-address.tsx
│   ├── checkout-payment.tsx
│   ├── order-success.tsx
│   └── order-tracking.tsx
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx               ← reusable green CTA button
│   │   ├── Input.tsx                ← reusable text input
│   │   ├── Badge.tsx                ← price change badge ↑↓
│   │   ├── Chip.tsx                 ← filter chip
│   │   ├── Skeleton.tsx             ← shimmer loading placeholder
│   │   └── Divider.tsx
│   ├── ProductCard.tsx
│   ├── PriceCard.tsx
│   ├── PriceRow.tsx
│   ├── CartItem.tsx
│   ├── MarketCard.tsx
│   ├── RateBazarCard.tsx
│   ├── StepperBar.tsx               ← cart checkout 1→2→3
│   ├── CartFAB.tsx                  ← floating cart button
│   ├── CategoryChips.tsx
│   └── Header.tsx
│
├── constants/
│   ├── colors.ts
│   ├── typography.ts                ← font sizes + weights
│   ├── spacing.ts                   ← spacing + radius + shadow
│   └── data.ts                      ← re-exports all dummy data
│
├── store/
│   ├── index.ts
│   ├── cartSlice.ts
│   └── favouritesSlice.ts
│
├── hooks/
│   ├── useCart.ts                   ← cart selector shortcuts
│   └── useFavourites.ts             ← favourites selector shortcuts
│
├── dummy-data/
│   ├── products.ts
│   ├── marketRates.ts
│   ├── markets.ts
│   └── user.ts
│
└── assets/
    └── images/
        ├── logo.png
        ├── onboarding-1.png
        ├── onboarding-2.png
        ├── banner-1.png
        ├── banner-2.png
        ├── banner-3.png
        ├── products/
        │   └── (product images here)
        └── markets/
            └── (market images here)
```

---

## ALL SCREENS — FULL SPEC

---

### SCREEN 1: Splash
**File**: `app/(auth)/splash.tsx`
- Full green bg (#2E7D32)
- VV logo centered with Reanimated fade+scale entrance animation
- "Vizag Vegetables" bold white, DM Sans 700
- "Daily Rythu Bazar Rates · Market Updates" — letter-spaced light white
- Feature pills row: "Daily Prices · Find Markets · Order Fresh"
- Auto-navigate after 2.8s using `setTimeout` + `router.replace`

---

### SCREEN 2: Get Started
**File**: `app/(auth)/get-started.tsx`
- Full green bg
- "Vizag Vegetables 🥕" white title
- Illustration image (onboarding-1.png) centered
- Bold tagline: "Vizag Vegetables is a solution for **Grocery Shopping** every you need"
- White pill "Get Started" button
- 3-dot page indicator
- Spring animation entrance on mount

---

### SCREEN 3: OTP Number
**File**: `app/(auth)/otp-number.tsx`
- Top: green curved background (use SVG or borderBottomRadius trick) + illustration
- Bottom white card:
  - Phone input: "+91" prefix | 10-digit | green border when focused
  - KeyboardAvoidingView wrapping bottom content
  - "Send OTP" green pill button
  - "Or login with" divider
  - Google button (white outlined, Google logo emoji or icon)
  - "Skip for now" green text link
- Input auto-validates: disable button until 10 digits entered

---

### SCREEN 4: OTP Verify
**File**: `app/(auth)/otp-verify.tsx`
- Back arrow circle button
- "Verify Code" heading
- Subtitle with masked phone number
- 4 OTP boxes: auto-focus next on input, light green bg (#E8F5E9), 56×56px each
- 30s countdown timer: "Resend Code (28s)" → becomes tappable at 0
- "Change number" link
- "Verify & Continue" green pill button
- Keyboard stays open automatically

---

### SCREEN 5: Home
**File**: `app/(tabs)/home.tsx`

Use `Animated.ScrollView` with sticky header.

**Header (green, with shadow on scroll)**:
- Row 1: 📍"Vizag, Gajuwaka.." | 🔔 bell (red dot badge)
- Row 2: "Hey Ravi Kumar 👋" | date right-aligned
- Search bar: white pill, placeholder "Search vegetables, fruits..."

**Sections** (each as a separate component):

1. `<BannerCarousel />` — 3 slides, auto-rotate 3.5s, spring swipe, dot indicators
2. `<RateBazarSection />` — horizontal FlatList of `<RateBazarCard />`
3. `<FavouritePriceSection />` — list rows, color-coded by price change
4. `<ShoppingListSection />` — 2-col FlatList of `<ProductCard />`
5. `<PriceTableSection />` — compact table rows

Each section has: bold title left + "See all >" green right

---

### SCREEN 6 & 7: Price (List + Grid)
**File**: `app/(tabs)/price.tsx`

**Header** (green gradient):
- "Today's Prices" + "రైతు బజార్ కూరగాయల ధరలు" Telugu subtitle
- "Updated 7:00 AM" + date
- Search bar

**Controls row**:
- Category chips: All | Vegetables | Fruits | Leafy | Flowers | Favorite
- Grid/List toggle button (right side)
- Telugu toggle chip (List view only)

**Grid View**: 2-col `FlatList` of `<PriceCard />`
**List View**: `FlatList` of `<PriceRow />` inside white card

**20 commodities** (full data in dummy-data/marketRates.ts):
Tomato, Onion, Potato, Capsicum, Carrot, Broccoli, Sweet Corn, Brinjal,
Cucumber, Spinach, Coriander, Fenugreek, Curry Leaves, Banana, Apple,
Grapes, Mango, Orange, Cherry Tomato, Bitter Gourd

---

### SCREEN 8: Markets
**File**: `app/(tabs)/markets.tsx`

- SVG mini-map (simple, hand-drawn style) with 4 location pins + "You" pin
- "Nearby Rythu Bazar" section — FlatList of `<MarketCard />`
- "Weekly Shandhas" section — day-indexed list

**MarketCard**:
- Image strip top
- OPEN (green) / CLOSED (red) chip
- Name + area
- Distance · Hours · Vendors count
- "Map" (outlined) + "Details" (filled) buttons

---

### SCREEN 9: Market Detail
**File**: `app/market-detail.tsx`

- Hero image full width + back button + OPEN/CLOSED chip
- Stats strip: Distance | Opens | Vendors
- 3 tabs: Today's Prices | About | Photos
- About: hours, days, facilities chips
- Photos: 3×3 grid

---

### SCREEN 10: Shop
**File**: `app/(tabs)/shop.tsx`

**Header** (green):
- "Shopping" title
- Search bar (green text)
- Cart icon circle — red badge count

**VV verified banner**: green tinted row "✓ All products by Vizag Vegetables"

**Filter chips**: All | Fruits | Vegetables | Leafy | Combos

**2-col FlatList** of `<ProductCard />`:
- Rounded image top
- VV badge (top left corner)
- Discount % badge (top right, red pill)
- Name + Telugu small
- Weight · ETA chip
- Price (bold) + orig (strikethrough gray)
- "Add" green button → morphs to [ − qty + ] stepper when added (Reanimated layout animation)

---

### SCREEN 11: Shop Details
**File**: `app/shop-details.tsx`

- Swipeable image gallery (react-native-reanimated) + dot indicators
- Back (←) + Share (↑) buttons top corners, white rounded square
- Bottom sheet (white, rounded top, slides up with Reanimated):
  - Name (28px bold) + unit subtitle
  - Price big (28px bold) + orig strikethrough
  - "Select Weight" chips row (1kg | 5kg | 10kg)
  - Divider
  - "Product Detail" section + description
  - Tags row: Farm Fresh · Pesticide-free
- Sticky bottom bar: [ − ] [ qty ] [ + ] + "Add to Cart" green pill

---

### SCREEN 12: Cart
**File**: `app/cart.tsx`

- "← My Cart (3)" header
- `<StepperBar step={1} />` — ①Cart ②Address ③Payment
- `FlatList` of `<CartItem />`:
  - Emoji tile (60×60 rounded) | name + unit | price green | 🗑 delete
  - [ − ] [ qty ] [ + ] with Reanimated qty change animation
  - Divider
- Empty state: cart illustration + "Your cart is empty" + "Shop Now" button
- Sticky bottom: "Go to Checkout — ₹240" green pill

**CartFAB** (`components/CartFAB.tsx`):
- Green circle 56×56, bottom-right, 80px above tab bar
- Cart icon + red badge count
- Reanimated scale-in when count goes from 0 → 1
- Scale-out when count = 0
- Renders inside `(tabs)/_layout.tsx`

---

### SCREEN 13: Checkout — Address
**File**: `app/checkout-address.tsx`

- `<StepperBar step={2} />`
- Saved addresses list:
  - 🏠 Home (default green border) — "123, Steel Plant Road, Gajuwaka"
  - 🏢 Office — "45, MVP Colony, Sector 7"
  - Selected address gets green border + green check
- Dashed border "➕ Add new address" button
- "Continue to Payment" green pill

---

### SCREEN 14: Checkout — Payment
**File**: `app/checkout-payment.tsx`

- `<StepperBar step={3} />`
- Payment method list (radio select):
  - 📱 UPI (Recommended) — UPI ID input field slides in
  - 💳 Credit/Debit Card
  - 🏦 Net Banking
  - 💵 Cash on Delivery
- Order summary card: subtotal + delivery + total
- "🔒 Secured by Razorpay · 256-bit SSL" footer
- "Place Order ₹240" green pill

---

### SCREEN 15: Order Success
**File**: `app/order-success.tsx`

- Reanimated green check circle — draws in with stroke animation
- "Order Placed! 🎉" heading
- "Arriving in 45–60 mins" ETA
- Order summary card: #VV2345 | method | total
- "Track Order" filled button
- "Back to Home" outlined button

---

### SCREEN 16: Order Tracking
**File**: `app/order-tracking.tsx`

- Map area (placeholder rectangle with dashed route line)
- 🛵 rider emoji moves along route with Reanimated `withTiming`
- ETA chip: "~12 min"
- Rider card: avatar | "Suresh K." | distance | 📞 call button
- 5-step vertical progress tracker:
  ✅ Order Placed → ✅ Confirmed → ✅ Packed → 🔵 Out for Delivery → ⬜ Delivered

---

### SCREEN 17: Profile
**File**: `app/(tabs)/profile.tsx`

- Green hero section: "RK" avatar circle + edit icon + name + phone
- Stats pill: "12 Orders · 8 Favourites · 2 Addresses"
- White cards (each with shadow):
  - MY ACCOUNT: My Orders (badge: 2) | Saved Favourites | Addresses
  - NOTIFICATIONS: 3 toggles with descriptions
  - MORE: Support | About Us
- Red "Log Out" button
- Footer text

---

## DUMMY DATA (complete)

```typescript
// dummy-data/user.ts
export const user = {
  name: 'Ravi Kumar', initials: 'RK',
  phone: '+91 98765 43210',
  orders: 12, favourites: 8,
  addresses: [
    { id: '1', label: 'Home',   default: true,  full: '123, Steel Plant Road, Gajuwaka, Vizag' },
    { id: '2', label: 'Office', default: false, full: '45, MVP Colony, Sector 7, Vizag' },
  ],
};

// dummy-data/products.ts
export const products = [
  { id:'1', name:'Fresh Tomatoes',   te:'తాజా టొమాటో',     emoji:'🍅', cat:'vegetables', price:32,  orig:40,  weight:'1kg',      eta:'45 min', discount:20, tags:['Farm Fresh'] },
  { id:'2', name:'Organic Onions',   te:'సేంద్రీయ ఉల్లి',  emoji:'🧅', cat:'vegetables', price:35,  orig:45,  weight:'1kg',      eta:'45 min', discount:22, tags:['Organic'] },
  { id:'3', name:'Baby Spinach',     te:'పాలకూర',           emoji:'🌿', cat:'leafy',      price:25,  orig:30,  weight:'1 bunch',  eta:'45 min', discount:17, tags:['Fresh'] },
  { id:'4', name:'Alphonso Mangoes', te:'మామిడి',           emoji:'🥭', cat:'fruits',     price:299, orig:350, weight:'1kg',      eta:'45 min', discount:15, tags:['Premium'] },
  { id:'5', name:'Green Capsicum',   te:'క్యాప్సికం',       emoji:'🫑', cat:'vegetables', price:55,  orig:65,  weight:'500g',     eta:'45 min', discount:15, tags:['Farm Fresh'] },
  { id:'6', name:'Curry Leaves',     te:'కరివేపాకు',        emoji:'🌿', cat:'leafy',      price:10,  orig:15,  weight:'1 bunch',  eta:'45 min', discount:33, tags:['Fresh'] },
  { id:'7', name:'Mixed Veggie Box', te:'మిక్స్డ్ వెజ్',    emoji:'🥗', cat:'combos',     price:199, orig:250, weight:'2kg',      eta:'45 min', discount:20, tags:['Combo','Value'] },
  { id:'8', name:'Banana Bunch',     te:'అరటిపళ్ళు',        emoji:'🍌', cat:'fruits',     price:45,  orig:60,  weight:'1 bunch',  eta:'45 min', discount:25, tags:['Fresh'] },
];

// dummy-data/marketRates.ts
export const marketRates = [
  { id:'1',  emoji:'🍅', name:'Tomato',       te:'టొమాటో',       cat:'vegetables', today:18,  prev:22,  chg:-4  },
  { id:'2',  emoji:'🧅', name:'Onion',        te:'ఉల్లిపాయ',    cat:'vegetables', today:35,  prev:30,  chg:+5  },
  { id:'3',  emoji:'🥔', name:'Potato',       te:'బంగాళదుంప',   cat:'vegetables', today:28,  prev:28,  chg:0   },
  { id:'4',  emoji:'🫑', name:'Capsicum',     te:'క్యాప్సికం',   cat:'vegetables', today:55,  prev:60,  chg:-5  },
  { id:'5',  emoji:'🥕', name:'Carrot',       te:'క్యారెట్',     cat:'vegetables', today:42,  prev:38,  chg:+4  },
  { id:'6',  emoji:'🥦', name:'Broccoli',     te:'బ్రొకోలీ',     cat:'vegetables', today:80,  prev:75,  chg:+5  },
  { id:'7',  emoji:'🌽', name:'Sweet Corn',   te:'మొక్కజొన్న',  cat:'vegetables', today:25,  prev:30,  chg:-5  },
  { id:'8',  emoji:'🍆', name:'Brinjal',      te:'వంకాయ',        cat:'vegetables', today:30,  prev:28,  chg:+2  },
  { id:'9',  emoji:'🥒', name:'Cucumber',     te:'దోసకాయ',       cat:'vegetables', today:22,  prev:20,  chg:+2  },
  { id:'10', emoji:'🌿', name:'Spinach',      te:'పాలకూర',       cat:'leafy',      today:10,  prev:12,  chg:-2  },
  { id:'11', emoji:'🌱', name:'Coriander',    te:'కొత్తిమీర',    cat:'leafy',      today:5,   prev:5,   chg:0   },
  { id:'12', emoji:'🌿', name:'Fenugreek',    te:'మెంతికూర',     cat:'leafy',      today:8,   prev:8,   chg:0   },
  { id:'13', emoji:'🍃', name:'Curry Leaves', te:'కరివేపాకు',    cat:'leafy',      today:3,   prev:4,   chg:-1  },
  { id:'14', emoji:'🍌', name:'Banana',       te:'అరటిపండు',     cat:'fruits',     today:40,  prev:45,  chg:-5  },
  { id:'15', emoji:'🍎', name:'Apple',        te:'ఆపిల్',        cat:'fruits',     today:180, prev:200, chg:-20 },
  { id:'16', emoji:'🍇', name:'Grapes',       te:'ద్రాక్ష',      cat:'fruits',     today:90,  prev:80,  chg:+10 },
  { id:'17', emoji:'🥭', name:'Mango',        te:'మామిడి',       cat:'fruits',     today:140, prev:160, chg:-20 },
  { id:'18', emoji:'🍊', name:'Orange',       te:'నారింజ',       cat:'fruits',     today:60,  prev:55,  chg:+5  },
  { id:'19', emoji:'😤', name:'Bitter Gourd', te:'కాకరకాయ',      cat:'vegetables', today:45,  prev:40,  chg:+5  },
  { id:'20', emoji:'🍅', name:'Cherry Tomato',te:'చెర్రీ టొమాటో', cat:'vegetables', today:80,  prev:75,  chg:+5  },
];

// dummy-data/markets.ts
export const markets = [
  { id:'1', name:'MVP Colony Rythu Bazar',  area:'MVP Colony',    km:1.2, vendors:45, open:true,  opens:'6:00 AM', closes:'1:00 PM',  days:'Mon–Sat' },
  { id:'2', name:'Jagadamba Rythu Bazar',   area:'Jagadamba',     km:2.8, vendors:62, open:true,  opens:'5:30 AM', closes:'12:00 PM', days:'Daily'   },
  { id:'3', name:'Gajuwaka Rythu Bazar',    area:'Gajuwaka',      km:4.5, vendors:38, open:false, opens:'6:00 AM', closes:'1:00 PM',  days:'Mon–Sat' },
  { id:'4', name:'Dwaraka Nagar Bazar',     area:'Dwaraka Nagar', km:3.1, vendors:28, open:true,  opens:'6:30 AM', closes:'12:30 PM', days:'Daily'   },
];

export const weeklyShandhas = [
  { day:'Mon', name:'RK Beach Shandha',     area:'Beach Road'    },
  { day:'Tue', name:'Pendurthi Shandha',    area:'Pendurthi'     },
  { day:'Wed', name:'Bheemli Shandha',      area:'Bheemli'       },
  { day:'Thu', name:'Simhachalam Shandha',  area:'Simhachalam'   },
  { day:'Fri', name:'Gajuwaka Shandha',     area:'Gajuwaka'      },
  { day:'Sat', name:'MVP Colony Shandha',   area:'MVP Colony'    },
  { day:'Sun', name:'Dwaraka Nagar Shandha',area:'Dwaraka Nagar' },
];
```

---

## REDUX STORE

```typescript
// store/cartSlice.ts
interface CartItem {
  id: string; name: string; te: string; emoji: string;
  price: number; weight: string; quantity: number;
}
// Actions: addToCart(product) | removeFromCart(id) | increaseQty(id) | decreaseQty(id) | clearCart()
// Selectors: selectCartItems | selectCartCount | selectCartTotal

// store/favouritesSlice.ts
// State: string[] — array of favourite item IDs
// Actions: toggleFavourite(id)
// Selector: selectFavouriteIds | selectIsFavourite(id)

// hooks/useCart.ts — shortcut hook
export const useCart = () => {
  const dispatch = useDispatch();
  const items = useSelector(selectCartItems);
  const count = useSelector(selectCartCount);
  const total = useSelector(selectCartTotal);
  const addItem = (product) => dispatch(addToCart(product));
  const removeItem = (id) => dispatch(removeFromCart(id));
  return { items, count, total, addItem, removeItem };
};
```

---

## NAVIGATION

```
Root _layout.tsx
  → Redux Provider + Font loading + StatusBar

(auth)/_layout.tsx  → Stack, no tab bar, no header
  splash → get-started → otp-number → otp-verify → (tabs)

(tabs)/_layout.tsx  → Custom tab bar component
  5 tabs: home | price | markets | shop | profile
  + CartFAB floating above tab bar

Stack screens (headerShown: false, slide up):
  shop-details, market-detail, cart,
  checkout-address, checkout-payment,
  order-success, order-tracking
```

---

## ANIMATION GUIDELINES

Use `react-native-reanimated` for:
- Screen mount: `FadeInDown` from `react-native-reanimated` entering prop
- Button press: `withSpring` scale 0.96 on press, 1.0 on release
- ADD → stepper morph: `withSpring` width animation
- CartFAB appear/disappear: `withSpring` scale
- OTP box focus: `withSpring` border color + scale
- Skeleton shimmer: `withRepeat(withTiming)` opacity loop

Use `expo-haptics` for:
- Every button press: `Haptics.impactAsync(ImpactFeedbackStyle.Light)`
- Add to cart: `Haptics.impactAsync(ImpactFeedbackStyle.Medium)`
- Order success: `Haptics.notificationAsync(NotificationFeedbackType.Success)`

---

## COMPONENT SPECS

### `<ChangeBadge chg={number} />`
- chg > 0: red pill "↑ ₹4" background #FFEBEE text #E53935
- chg < 0: green pill "↓ ₹4" background #E8F5E9 text #2E7D32
- chg = 0: gray "—" no pill

### `<CategoryChips categories={[]} active={''} onPress={} />`
- Horizontal ScrollView, no scroll indicator
- Active: green filled (#2E7D32 bg, white text)
- Inactive: white bg, gray border, dark text

### `<StepperBar step={1|2|3} />`
- 3 circles connected by lines
- Active + done: green filled circle, white number
- Upcoming: gray outlined circle, gray number
- Line: green between done steps, gray otherwise

### `<CartFAB />`
- Position: absolute, bottom: 80, right: 16
- 56×56 green circle, shadow
- Cart icon white + red badge top-right
- Reanimated scale-in on mount

### `<Skeleton width height borderRadius />`
- Gray (#E8ECEB) rectangle
- Opacity animates 1.0 → 0.4 → 1.0 loop

---

## BUILD ORDER

```
Step 1  → Install all packages (see Tech Stack above)
Step 2  → constants/ (colors.ts, typography.ts, spacing.ts)
Step 3  → dummy-data/ (all 4 files)
Step 4  → store/ (index, cartSlice, favouritesSlice)
Step 5  → hooks/ (useCart.ts, useFavourites.ts)
Step 6  → components/ui/ (Button, Input, Badge, Chip, Skeleton, Divider)
Step 7  → app/_layout.tsx (Redux Provider + fonts + StatusBar)
Step 8  → Splash Screen (with animation)
Step 9  → Get Started Screen
Step 10 → OTP Number Screen
Step 11 → OTP Verify Screen
Step 12 → (tabs)/_layout.tsx (custom tab bar + CartFAB)
Step 13 → Home Screen (all sections)
Step 14 → Price Screen (grid + list + toggle)
Step 15 → Markets Screen
Step 16 → Market Detail Screen
Step 17 → Shop Screen
Step 18 → Shop Details Screen
Step 19 → Cart Screen
Step 20 → Checkout Address Screen
Step 21 → Checkout Payment Screen
Step 22 → Order Success Screen
Step 23 → Order Tracking Screen
Step 24 → Profile Screen
Step 25 → Wire full navigation + test on Expo Go
```

---

## STRICT RULES FOR EVERY SCREEN

1. `SafeAreaView` wrapping every screen
2. `StatusBar` — white icons on green headers, dark on white
3. `KeyboardAvoidingView` on all screens with inputs
4. `FlatList` for all lists — never `ScrollView` + `.map()`
5. `getItemLayout` on FlatList when item height is fixed (performance)
6. All colors from `constants/colors.ts` — zero hardcoded hex
7. All spacing from `constants/spacing.ts` — zero magic numbers
8. All fonts from DM Sans family — zero system fonts
9. Every touch target minimum 44×44px (accessibility)
10. Loading states with `<Skeleton />` component
11. Empty states with illustration + message + CTA button
12. After EVERY step — tell me exactly what was created and what to check on Expo Go

---

*Vizag Vegetables — Fresh from Rythu Bazar to your door 🥦*
*Build it right. Build it once. Make Vizag proud.*
