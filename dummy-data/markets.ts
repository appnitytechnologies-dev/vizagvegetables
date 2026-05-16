export interface Market {
  id: string;
  name: string;
  area: string;
  km: number;
  vendors: number;
  open: boolean;
  opens: string;
  closes: string;
  days: string;
}

export interface Shandha {
  day: string;
  name: string;
  area: string;
}

export const markets: Market[] = [
  { id: '1', name: 'MVP Colony Rythu Bazar',  area: 'MVP Colony',    km: 1.2, vendors: 45, open: true,  opens: '6:00 AM', closes: '1:00 PM',  days: 'Mon–Sat' },
  { id: '2', name: 'Jagadamba Rythu Bazar',   area: 'Jagadamba',     km: 2.8, vendors: 62, open: true,  opens: '5:30 AM', closes: '12:00 PM', days: 'Daily'   },
  { id: '3', name: 'Gajuwaka Rythu Bazar',    area: 'Gajuwaka',      km: 4.5, vendors: 38, open: false, opens: '6:00 AM', closes: '1:00 PM',  days: 'Mon–Sat' },
  { id: '4', name: 'Dwaraka Nagar Bazar',     area: 'Dwaraka Nagar', km: 3.1, vendors: 28, open: true,  opens: '6:30 AM', closes: '12:30 PM', days: 'Daily'   },
];

export const weeklyShandhas: Shandha[] = [
  { day: 'Mon', name: 'RK Beach Shandha',      area: 'Beach Road'    },
  { day: 'Tue', name: 'Pendurthi Shandha',     area: 'Pendurthi'     },
  { day: 'Wed', name: 'Bheemli Shandha',       area: 'Bheemli'       },
  { day: 'Thu', name: 'Simhachalam Shandha',   area: 'Simhachalam'   },
  { day: 'Fri', name: 'Gajuwaka Shandha',      area: 'Gajuwaka'      },
  { day: 'Sat', name: 'MVP Colony Shandha',    area: 'MVP Colony'    },
  { day: 'Sun', name: 'Dwaraka Nagar Shandha', area: 'Dwaraka Nagar' },
];
