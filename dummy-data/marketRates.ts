export interface MarketRate {
  id: string;
  emoji: string;
  name: string;
  te: string;
  cat: 'vegetables' | 'fruits' | 'leafy' | 'flowers';
  today: number;
  prev: number;
  chg: number;
  unit?: string;
}

export const marketRates: MarketRate[] = [
  { id: '1',  emoji: '🍅', name: 'Tomato',       te: 'టొమాటో',        cat: 'vegetables', today: 18,  prev: 22,  chg: -4,  unit: 'kg' },
  { id: '2',  emoji: '🧅', name: 'Onion',        te: 'ఉల్లిపాయ',     cat: 'vegetables', today: 35,  prev: 30,  chg: +5,  unit: 'kg' },
  { id: '3',  emoji: '🥔', name: 'Potato',       te: 'బంగాళదుంప',    cat: 'vegetables', today: 28,  prev: 28,  chg: 0,   unit: 'kg' },
  { id: '4',  emoji: '🫑', name: 'Capsicum',     te: 'క్యాప్సికం',    cat: 'vegetables', today: 55,  prev: 60,  chg: -5,  unit: 'kg' },
  { id: '5',  emoji: '🥕', name: 'Carrot',       te: 'క్యారెట్',      cat: 'vegetables', today: 42,  prev: 38,  chg: +4,  unit: 'kg' },
  { id: '6',  emoji: '🥦', name: 'Broccoli',     te: 'బ్రొకోలీ',      cat: 'vegetables', today: 80,  prev: 75,  chg: +5,  unit: 'kg' },
  { id: '7',  emoji: '🌽', name: 'Sweet Corn',   te: 'మొక్కజొన్న',   cat: 'vegetables', today: 25,  prev: 30,  chg: -5,  unit: 'pc' },
  { id: '8',  emoji: '🍆', name: 'Brinjal',      te: 'వంకాయ',         cat: 'vegetables', today: 30,  prev: 28,  chg: +2,  unit: 'kg' },
  { id: '9',  emoji: '🥒', name: 'Cucumber',     te: 'దోసకాయ',        cat: 'vegetables', today: 22,  prev: 20,  chg: +2,  unit: 'kg' },
  { id: '10', emoji: '🌿', name: 'Spinach',      te: 'పాలకూర',        cat: 'leafy',      today: 10,  prev: 12,  chg: -2,  unit: 'bunch' },
  { id: '11', emoji: '🌱', name: 'Coriander',    te: 'కొత్తిమీర',     cat: 'leafy',      today: 5,   prev: 5,   chg: 0,   unit: 'bunch' },
  { id: '12', emoji: '🌿', name: 'Fenugreek',    te: 'మెంతికూర',      cat: 'leafy',      today: 8,   prev: 8,   chg: 0,   unit: 'bunch' },
  { id: '13', emoji: '🍃', name: 'Curry Leaves', te: 'కరివేపాకు',     cat: 'leafy',      today: 3,   prev: 4,   chg: -1,  unit: 'bunch' },
  { id: '14', emoji: '🍌', name: 'Banana',       te: 'అరటిపండు',      cat: 'fruits',     today: 40,  prev: 45,  chg: -5,  unit: 'doz' },
  { id: '15', emoji: '🍎', name: 'Apple',        te: 'ఆపిల్',         cat: 'fruits',     today: 180, prev: 200, chg: -20, unit: 'kg' },
  { id: '16', emoji: '🍇', name: 'Grapes',       te: 'ద్రాక్ష',       cat: 'fruits',     today: 90,  prev: 80,  chg: +10, unit: 'kg' },
  { id: '17', emoji: '🥭', name: 'Mango',        te: 'మామిడి',        cat: 'fruits',     today: 140, prev: 160, chg: -20, unit: 'kg' },
  { id: '18', emoji: '🍊', name: 'Orange',       te: 'నారింజ',        cat: 'fruits',     today: 60,  prev: 55,  chg: +5,  unit: 'kg' },
  { id: '19', emoji: '😤', name: 'Bitter Gourd',    te: 'కాకరకాయ',       cat: 'vegetables', today: 45,  prev: 40,  chg: +5,  unit: 'kg' },
  { id: '20', emoji: '🍅', name: 'Cherry Tomato',   te: 'చెర్రీ టొమాటో', cat: 'vegetables', today: 80,  prev: 75,  chg: +5,  unit: 'kg' },
  { id: '21', emoji: '🌸', name: 'Marigold',         te: 'బంతి పువ్వు',   cat: 'flowers',    today: 80,  prev: 70,  chg: +10, unit: 'kg' },
  { id: '22', emoji: '🌹', name: 'Rose',             te: 'గులాబి',         cat: 'flowers',    today: 120, prev: 100, chg: +20, unit: 'doz' },
  { id: '23', emoji: '🌺', name: 'Jasmine',          te: 'మల్లె',          cat: 'flowers',    today: 200, prev: 180, chg: +20, unit: 'kg' },
  { id: '24', emoji: '🌻', name: 'Sunflower',        te: 'సూర్యకాంతి',    cat: 'flowers',    today: 60,  prev: 65,  chg: -5,  unit: 'bunch' },
  { id: '25', emoji: '💐', name: 'Chrysanthemum',    te: 'చామంతి',         cat: 'flowers',    today: 45,  prev: 40,  chg: +5,  unit: 'bunch' },
];
