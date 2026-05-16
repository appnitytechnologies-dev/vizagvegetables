export interface Product {
  id: string;
  name: string;
  te: string;
  emoji: string;
  cat: 'vegetables' | 'fruits' | 'leafy' | 'combos';
  price: number;
  orig: number;
  weight: string;
  eta: string;
  discount: number;
  tags: string[];
  description?: string;
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Fresh Tomatoes',
    te: 'తాజా టొమాటో',
    emoji: '🍅',
    cat: 'vegetables',
    price: 32,
    orig: 40,
    weight: '1kg',
    eta: '45 min',
    discount: 20,
    tags: ['Farm Fresh'],
    description: 'Farm fresh tomatoes sourced directly from Rythu Bazar. Rich in lycopene and antioxidants. Perfect for curries, salads, and chutneys.',
  },
  {
    id: '2',
    name: 'Organic Onions',
    te: 'సేంద్రీయ ఉల్లి',
    emoji: '🧅',
    cat: 'vegetables',
    price: 35,
    orig: 45,
    weight: '1kg',
    eta: '45 min',
    discount: 22,
    tags: ['Organic'],
    description: 'Organically grown onions from local Vizag farms. Essential for every Indian kitchen. Strong flavour, long shelf life.',
  },
  {
    id: '3',
    name: 'Baby Spinach',
    te: 'పాలకూర',
    emoji: '🌿',
    cat: 'leafy',
    price: 25,
    orig: 30,
    weight: '1 bunch',
    eta: '45 min',
    discount: 17,
    tags: ['Fresh'],
    description: 'Tender baby spinach leaves picked fresh every morning. High in iron, vitamins A and C. Great for palak paneer and salads.',
  },
  {
    id: '4',
    name: 'Alphonso Mangoes',
    te: 'మామిడి',
    emoji: '🥭',
    cat: 'fruits',
    price: 299,
    orig: 350,
    weight: '1kg',
    eta: '45 min',
    discount: 15,
    tags: ['Premium'],
    description: 'Premium Alphonso mangoes — king of mangoes. Sweet, aromatic, and buttery. Seasonal delight straight from the farm.',
  },
  {
    id: '5',
    name: 'Green Capsicum',
    te: 'క్యాప్సికం',
    emoji: '🫑',
    cat: 'vegetables',
    price: 55,
    orig: 65,
    weight: '500g',
    eta: '45 min',
    discount: 15,
    tags: ['Farm Fresh'],
    description: 'Crisp and fresh green capsicums. Low in calories, high in vitamin C. Perfect for stir-fries, salads, and stuffed recipes.',
  },
  {
    id: '6',
    name: 'Curry Leaves',
    te: 'కరివేపాకు',
    emoji: '🌿',
    cat: 'leafy',
    price: 10,
    orig: 15,
    weight: '1 bunch',
    eta: '45 min',
    discount: 33,
    tags: ['Fresh'],
    description: 'Freshly plucked curry leaves. Essential tempering ingredient in South Indian cooking. Strong aroma, rich flavour.',
  },
  {
    id: '7',
    name: 'Mixed Veggie Box',
    te: 'మిక్స్డ్ వెజ్',
    emoji: '🥗',
    cat: 'combos',
    price: 199,
    orig: 250,
    weight: '2kg',
    eta: '45 min',
    discount: 20,
    tags: ['Combo', 'Value'],
    description: 'Handpicked assortment of fresh seasonal vegetables — tomatoes, onions, carrots, beans, and more. Best value combo.',
  },
  {
    id: '8',
    name: 'Banana Bunch',
    te: 'అరటిపళ్ళు',
    emoji: '🍌',
    cat: 'fruits',
    price: 45,
    orig: 60,
    weight: '1 bunch',
    eta: '45 min',
    discount: 25,
    tags: ['Fresh'],
    description: 'Fresh ripe bananas — Robusta variety. Natural energy booster, rich in potassium. Great for breakfast and smoothies.',
  },
];
