import { create } from 'zustand';
import { Currency, Rates, fetchRates, convert, FALLBACK_RATES } from '@/lib/currency';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Roommate = {
  id: string;
  name: string;
  email: string;
  avatar: string; // initials or emoji
  color: string;
  preferredCurrency: Currency; // how this person sees their balances
  // Payment handles — public identifiers only, NO bank/card data ever stored.
  bizumPhone?: string;  // Spanish instant payments
  paypalMe?: string;    // paypal.me/<handle>
  revolutTag?: string;  // revolut.me/<handle>
  photo?: string;       // profile picture (local URI)
};

export type Expense = {
  id: string;
  title: string;
  amount: number;
  currency: Currency; // what it was actually paid in
  paidBy: string; // roommate id
  splitWith: string[]; // roommate ids (including payer)
  category: 'food' | 'groceries' | 'utilities' | 'rent' | 'other';
  date: string;
  settled: boolean;
  photo?: string; // receipt / item photo (local URI)
};

export type ShoppingItem = {
  id: string;
  name: string;
  quantity: string;
  addedBy: string;
  checked: boolean;
  checkedBy?: string;
};

export type ShoppingList = {
  id: string;
  name: string;
  items: ShoppingItem[];
  createdBy: string;
  createdAt: string;
};

export type FoodOrderItem = {
  id: string;
  name: string;
  price: number;
  orderedBy: string;
};

export type FoodOrder = {
  id: string;
  platform: 'UberEats' | 'DoorDash' | 'Other';
  restaurant: string;
  items: FoodOrderItem[];
  deliveryFee: number;
  tip: number;
  currency: Currency;
  date: string;
  settled: boolean;
};

export type Chore = {
  id: string;
  title: string;
  assignedTo: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
  recurring: 'none' | 'daily' | 'weekly' | 'biweekly';
};

export type Bill = {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  dueDay: number;        // day of month (1–31)
  category: 'rent' | 'utilities' | 'other';
  splitWith: string[];   // roommate ids
  reminderEnabled: boolean;
  notificationId?: string; // scheduled local notification handle
};

export type GuestPeriod = {
  hostId: string;        // the roommate hosting the guest
  guestName: string;
  startDate: string;     // YYYY-MM-DD
  endDate: string;       // YYYY-MM-DD
};

export type HouseNote = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  photo?: string; // optional picture on the board (local URI)
};

export type AlbumPhoto = {
  id: string;
  uri: string;
  caption: string;
  addedBy: string;
  addedAt: string;
};

export type CurrentUser = Roommate & { isLoggedIn: boolean };

// ─── Mock seed data ───────────────────────────────────────────────────────────

const ROOMMATES: Roommate[] = [
  { id: 'u1', name: 'Beatriz', email: 'beatriz@example.com', avatar: 'B', color: '#4DA3FF', preferredCurrency: 'EUR', bizumPhone: '+34 600 111 222', paypalMe: 'beatrizl', revolutTag: 'beatrizl' },
  { id: 'u2', name: 'Sofia',   email: 'sofia@example.com',   avatar: 'S', color: '#2BB673', preferredCurrency: 'EUR', bizumPhone: '+34 600 333 444', paypalMe: 'sofiag' },
  { id: 'u3', name: 'Maria',   email: 'maria@example.com',   avatar: 'M', color: '#FF8FA3', preferredCurrency: 'USD', paypalMe: 'mariar', revolutTag: 'mariar' },
];

const EXPENSES: Expense[] = [
  { id: 'e1', title: 'Netflix',     amount: 15.99, currency: 'EUR', paidBy: 'u1', splitWith: ['u1','u2','u3'], category: 'other',     date: '2026-06-01', settled: false },
  { id: 'e2', title: 'Electricity', amount: 90.00, currency: 'EUR', paidBy: 'u2', splitWith: ['u1','u2','u3'], category: 'utilities', date: '2026-06-03', settled: false },
  { id: 'e3', title: 'Whole Foods', amount: 62.40, currency: 'USD', paidBy: 'u3', splitWith: ['u1','u2','u3'], category: 'groceries', date: '2026-06-05', settled: false },
  { id: 'e4', title: 'Pizza night', amount: 30.00, currency: 'GBP', paidBy: 'u1', splitWith: ['u1','u2'],      category: 'food',      date: '2026-06-07', settled: false },
  // older, already-settled expenses — hidden on the free tier (3-month history cap)
  { id: 'e5', title: 'Winter heating', amount: 120.00, currency: 'EUR', paidBy: 'u2', splitWith: ['u1','u2','u3'], category: 'utilities', date: '2026-01-15', settled: true },
  { id: 'e6', title: 'IKEA shelf',     amount: 45.00,  currency: 'EUR', paidBy: 'u1', splitWith: ['u1','u2','u3'], category: 'other',     date: '2026-02-02', settled: true },
];

const SHOPPING_LISTS: ShoppingList[] = [
  {
    id: 'sl1',
    name: 'Weekly Groceries',
    createdBy: 'u1',
    createdAt: '2026-06-08',
    items: [
      { id: 'si1', name: 'Oat milk',      quantity: '2x',  addedBy: 'u1', checked: false },
      { id: 'si2', name: 'Avocados',      quantity: '4x',  addedBy: 'u2', checked: true, checkedBy: 'u2' },
      { id: 'si3', name: 'Pasta',         quantity: '2x',  addedBy: 'u1', checked: false },
      { id: 'si4', name: 'Tomato sauce',  quantity: '1x',  addedBy: 'u3', checked: false },
      { id: 'si5', name: 'Greek yogurt',  quantity: '1 tub', addedBy: 'u2', checked: false },
    ],
  },
];

const FOOD_ORDERS: FoodOrder[] = [
  {
    id: 'fo1',
    platform: 'UberEats',
    restaurant: 'Chipotle',
    items: [
      { id: 'foi1', name: 'Burrito Bowl',   price: 13.50, orderedBy: 'u1' },
      { id: 'foi2', name: 'Chicken Tacos',  price: 11.00, orderedBy: 'u2' },
      { id: 'foi3', name: 'Veggie Burrito', price: 10.50, orderedBy: 'u3' },
    ],
    deliveryFee: 3.99,
    tip: 4.00,
    currency: 'EUR',
    date: '2026-06-08',
    settled: false,
  },
];

const CHORES: Chore[] = [
  { id: 'c1', title: 'Vacuum living room', assignedTo: 'u1', dueDate: '2026-06-10', completed: false, recurring: 'weekly' },
  { id: 'c2', title: 'Clean bathroom',     assignedTo: 'u2', dueDate: '2026-06-09', completed: false, recurring: 'weekly' },
  { id: 'c3', title: 'Take out trash',     assignedTo: 'u3', dueDate: '2026-06-09', completed: true,  completedAt: '2026-06-08', recurring: 'biweekly' },
  { id: 'c4', title: 'Do the dishes',      assignedTo: 'u1', dueDate: '2026-06-09', completed: false, recurring: 'daily' },
];

const BILLS: Bill[] = [
  { id: 'b1', name: 'Rent',        amount: 1200, currency: 'EUR', dueDay: 1,  category: 'rent',      splitWith: ['u1','u2','u3'], reminderEnabled: true },
  { id: 'b2', name: 'Electricity', amount: 90,   currency: 'EUR', dueDay: 5,  category: 'utilities', splitWith: ['u1','u2','u3'], reminderEnabled: true },
  { id: 'b3', name: 'Internet',    amount: 45,   currency: 'EUR', dueDay: 10, category: 'utilities', splitWith: ['u1','u2','u3'], reminderEnabled: false },
  { id: 'b4', name: 'Water',       amount: 35,   currency: 'EUR', dueDay: 15, category: 'utilities', splitWith: ['u1','u2','u3'], reminderEnabled: false },
];

const HOUSE_NOTES: HouseNote[] = [
  { id: 'hn1', title: 'WiFi password', body: 'Network: HomeBase_5G\nPassword: sunshine2024!', pinned: true,  createdBy: 'u1', createdAt: '2026-05-01', updatedAt: '2026-05-01' },
  { id: 'hn2', title: 'House rules',   body: '• Quiet hours: 11pm–8am\n• Clean kitchen after cooking\n• No guests past midnight on weekdays\n• Label your food in the fridge', pinned: true,  createdBy: 'u2', createdAt: '2026-05-01', updatedAt: '2026-05-15' },
  { id: 'hn3', title: 'Landlord contact', body: 'Mr. Johnson: (555) 123-4567\nEmail: johnson@realty.com\nEmergency maintenance: (555) 999-0000', pinned: false, createdBy: 'u1', createdAt: '2026-05-02', updatedAt: '2026-05-02' },
];

// ─── Store ────────────────────────────────────────────────────────────────────

type Store = {
  currentUser: CurrentUser;
  roommates: Roommate[];
  expenses: Expense[];
  shoppingLists: ShoppingList[];
  foodOrders: FoodOrder[];
  chores: Chore[];
  houseNotes: HouseNote[];
  bills: Bill[];
  guestPeriod: GuestPeriod | null;

  // Bills & reminders
  addBill: (bill: Omit<Bill, 'id'>) => void;
  removeBill: (id: string) => void;
  setBillReminder: (id: string, enabled: boolean, notificationId?: string) => void;

  // Guest mode (Pro)
  setGuestPeriod: (g: GuestPeriod | null) => void;

  // Currency
  baseCurrency: Currency;       // the house's roll-up currency
  rates: Rates;                 // EUR-based exchange rates
  ratesUpdatedAt: string | null;
  loadRates: () => Promise<void>;
  setBaseCurrency: (c: Currency) => void;
  setPreferredCurrency: (userId: string, c: Currency) => void;
  setPaymentHandles: (userId: string, handles: Pick<Roommate, 'bizumPhone' | 'paypalMe' | 'revolutTag'>) => void;

  // Roomiee Pro (per house). In production this is driven by RevenueCat /
  // houses.is_pro; here it's a local flag so the paywall + gating are demoable.
  isPro: boolean;
  setPro: (v: boolean) => void;

  // Photos — house identity, profile pictures and a shared album
  houseName: string;
  houseCover: string | null;
  album: AlbumPhoto[];
  setHouseName: (name: string) => void;
  setHouseCover: (uri: string | null) => void;
  setProfilePhoto: (userId: string, uri: string | undefined) => void;
  addAlbumPhoto: (uri: string, caption: string) => void;
  removeAlbumPhoto: (id: string) => void;

  // Auth
  login: (email: string, name: string) => void;
  logout: () => void;

  // Expenses
  addExpense: (e: Omit<Expense, 'id'>) => void;
  settleExpense: (id: string) => void;

  // Shopping
  addShoppingList: (name: string) => void;
  addShoppingItem: (listId: string, item: Omit<ShoppingItem, 'id'>) => void;
  toggleShoppingItem: (listId: string, itemId: string) => void;
  deleteShoppingItem: (listId: string, itemId: string) => void;

  // Food orders
  addFoodOrder: (order: Omit<FoodOrder, 'id'>) => void;
  settleFoodOrder: (id: string) => void;

  // Chores
  addChore: (chore: Omit<Chore, 'id'>) => void;
  toggleChore: (id: string) => void;

  // House notes
  addHouseNote: (note: Omit<HouseNote, 'id'>) => void;
  updateHouseNote: (id: string, title: string, body: string, photo?: string) => void;
  togglePinNote: (id: string) => void;
  deleteHouseNote: (id: string) => void;
};

const uid = () => Math.random().toString(36).slice(2, 10);

export const useStore = create<Store>((set) => ({
  currentUser: { ...ROOMMATES[0], isLoggedIn: true },
  roommates: ROOMMATES,
  expenses: EXPENSES,
  shoppingLists: SHOPPING_LISTS,
  foodOrders: FOOD_ORDERS,
  chores: CHORES,
  houseNotes: HOUSE_NOTES,
  bills: BILLS,
  guestPeriod: null,

  addBill: (bill) =>
    set((s) => ({ bills: [...s.bills, { ...bill, id: uid() }] })),

  removeBill: (id) =>
    set((s) => ({ bills: s.bills.filter((b) => b.id !== id) })),

  setBillReminder: (id, enabled, notificationId) =>
    set((s) => ({
      bills: s.bills.map((b) => b.id === id ? { ...b, reminderEnabled: enabled, notificationId } : b),
    })),

  setGuestPeriod: (g) => set({ guestPeriod: g }),

  baseCurrency: 'EUR',
  rates: FALLBACK_RATES,
  ratesUpdatedAt: null,

  isPro: false,
  setPro: (v) => set({ isPro: v }),

  houseName: 'Casa Malasaña',
  houseCover: null,
  album: [],
  setHouseName: (name) => set({ houseName: name }),
  setHouseCover: (uri) => set({ houseCover: uri }),
  setProfilePhoto: (userId, uri) =>
    set((s) => ({
      roommates: s.roommates.map((r) => r.id === userId ? { ...r, photo: uri } : r),
      currentUser: s.currentUser.id === userId ? { ...s.currentUser, photo: uri } : s.currentUser,
    })),
  addAlbumPhoto: (uri, caption) =>
    set((s) => ({
      album: [
        { id: uid(), uri, caption, addedBy: s.currentUser.id, addedAt: new Date().toISOString().slice(0, 10) },
        ...s.album,
      ],
    })),
  removeAlbumPhoto: (id) => set((s) => ({ album: s.album.filter((p) => p.id !== id) })),

  loadRates: async () => {
    const rates = await fetchRates();
    set({ rates, ratesUpdatedAt: new Date().toISOString() });
  },

  setBaseCurrency: (c) => set({ baseCurrency: c }),

  setPreferredCurrency: (userId, c) =>
    set((s) => ({
      roommates: s.roommates.map((r) => r.id === userId ? { ...r, preferredCurrency: c } : r),
      currentUser: s.currentUser.id === userId ? { ...s.currentUser, preferredCurrency: c } : s.currentUser,
    })),

  setPaymentHandles: (userId, handles) =>
    set((s) => ({
      roommates: s.roommates.map((r) => r.id === userId ? { ...r, ...handles } : r),
      currentUser: s.currentUser.id === userId ? { ...s.currentUser, ...handles } : s.currentUser,
    })),

  login: (email, name) =>
    set((s) => {
      const found = s.roommates.find((r) => r.email === email);
      if (found) return { currentUser: { ...found, isLoggedIn: true } };
      const newUser: Roommate = { id: uid(), name, email, avatar: name[0].toUpperCase(), color: '#4DA3FF', preferredCurrency: s.baseCurrency };
      return { currentUser: { ...newUser, isLoggedIn: true }, roommates: [...s.roommates, newUser] };
    }),

  logout: () =>
    set((s) => ({ currentUser: { ...s.currentUser, isLoggedIn: false } })),

  addExpense: (e) =>
    set((s) => ({ expenses: [{ ...e, id: uid() }, ...s.expenses] })),

  settleExpense: (id) =>
    set((s) => ({ expenses: s.expenses.map((e) => e.id === id ? { ...e, settled: true } : e) })),

  addShoppingList: (name) =>
    set((s) => ({
      shoppingLists: [
        { id: uid(), name, items: [], createdBy: s.currentUser.id, createdAt: new Date().toISOString().slice(0,10) },
        ...s.shoppingLists,
      ],
    })),

  addShoppingItem: (listId, item) =>
    set((s) => ({
      shoppingLists: s.shoppingLists.map((l) =>
        l.id === listId ? { ...l, items: [...l.items, { ...item, id: uid() }] } : l
      ),
    })),

  toggleShoppingItem: (listId, itemId) =>
    set((s) => ({
      shoppingLists: s.shoppingLists.map((l) =>
        l.id === listId
          ? {
              ...l,
              items: l.items.map((i) =>
                i.id === itemId ? { ...i, checked: !i.checked, checkedBy: !i.checked ? s.currentUser.id : undefined } : i
              ),
            }
          : l
      ),
    })),

  deleteShoppingItem: (listId, itemId) =>
    set((s) => ({
      shoppingLists: s.shoppingLists.map((l) =>
        l.id === listId ? { ...l, items: l.items.filter((i) => i.id !== itemId) } : l
      ),
    })),

  addFoodOrder: (order) =>
    set((s) => ({
      foodOrders: [
        // ensure every item has a unique id (the form sends them empty)
        { ...order, id: uid(), items: order.items.map((it) => ({ ...it, id: uid() })) },
        ...s.foodOrders,
      ],
    })),

  settleFoodOrder: (id) =>
    set((s) => ({ foodOrders: s.foodOrders.map((o) => o.id === id ? { ...o, settled: true } : o) })),

  addChore: (chore) =>
    set((s) => ({ chores: [{ ...chore, id: uid() }, ...s.chores] })),

  toggleChore: (id) =>
    set((s) => ({
      chores: s.chores.map((c) =>
        c.id === id ? { ...c, completed: !c.completed, completedAt: !c.completed ? new Date().toISOString().slice(0,10) : undefined } : c
      ),
    })),

  addHouseNote: (note) =>
    set((s) => ({ houseNotes: [{ ...note, id: uid() }, ...s.houseNotes] })),

  updateHouseNote: (id, title, body, photo) =>
    set((s) => ({
      houseNotes: s.houseNotes.map((n) =>
        n.id === id ? { ...n, title, body, photo, updatedAt: new Date().toISOString().slice(0,10) } : n
      ),
    })),

  togglePinNote: (id) =>
    set((s) => ({ houseNotes: s.houseNotes.map((n) => n.id === id ? { ...n, pinned: !n.pinned } : n) })),

  deleteHouseNote: (id) =>
    set((s) => ({ houseNotes: s.houseNotes.filter((n) => n.id !== id) })),
}));

// ─── Derived helpers ──────────────────────────────────────────────────────────

// Balances are computed in the house BASE currency (each expense is converted
// from the currency it was paid in). Display layers then convert to each
// viewer's preferred currency.
export function computeBalances(
  expenses: Expense[],
  roommates: Roommate[],
  baseCurrency: Currency,
  rates: Rates,
) {
  const balances: Record<string, number> = {};
  roommates.forEach((r) => (balances[r.id] = 0));

  expenses
    .filter((e) => !e.settled)
    .forEach((e) => {
      const amountInBase = convert(e.amount, e.currency, baseCurrency, rates);
      const share = amountInBase / e.splitWith.length;
      e.splitWith.forEach((rid) => {
        if (rid !== e.paidBy) {
          balances[e.paidBy] += share;
          balances[rid] -= share;
        }
      });
    });

  return balances;
}

export function computeFoodOrderSplit(order: FoodOrder) {
  const extras = order.deliveryFee + order.tip;
  const total = order.items.reduce((s, i) => s + i.price, 0);
  const splits: Record<string, number> = {};
  order.items.forEach((item) => {
    const extraShare = (item.price / total) * extras;
    splits[item.orderedBy] = (splits[item.orderedBy] ?? 0) + item.price + extraShare;
  });
  return splits;
}

// ─── Guest mode ───────────────────────────────────────────────────────────────
// A long-term guest adds extra load (utilities, water…). We estimate the host's
// fair surcharge from the house's own historical utility average, scaled by how
// much of the month the guest stays.

export function daysBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.round(ms / 86_400_000) + 1);
}

export function computeGuestImpact(
  bills: Bill[],
  roommates: Roommate[],
  guest: GuestPeriod,
  rates: Rates,
  baseCurrency: Currency,
) {
  // Average monthly utilities (the cost a guest actually drives up), in base currency.
  const monthlyUtilities = bills
    .filter((b) => b.category === 'utilities')
    .reduce((sum, b) => sum + convert(b.amount, b.currency, baseCurrency, rates), 0);

  const perPerson = roommates.length > 0 ? monthlyUtilities / roommates.length : 0;
  const stayDays = daysBetween(guest.startDate, guest.endDate);
  const stayFraction = Math.min(stayDays / 30, 1); // share of the month

  // The host covers a guest's worth of utilities, prorated by length of stay.
  const hostSurcharge = perPerson * stayFraction;

  return { monthlyUtilities, perPerson, stayDays, stayFraction, hostSurcharge };
}

export type Settlement = { from: string; to: string; amount: number }; // amount in base currency

// Greedy debt simplification: turns net balances into the minimum set of
// "who pays whom" transfers. Amounts are in the house base currency.
export function computeSettlements(balances: Record<string, number>): Settlement[] {
  const EPS = 0.01;
  const creditors = Object.entries(balances)
    .filter(([, v]) => v > EPS)
    .map(([id, v]) => ({ id, amount: v }))
    .sort((a, b) => b.amount - a.amount);
  const debtors = Object.entries(balances)
    .filter(([, v]) => v < -EPS)
    .map(([id, v]) => ({ id, amount: -v }))
    .sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let ci = 0, di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const give = Math.min(creditors[ci].amount, debtors[di].amount);
    settlements.push({ from: debtors[di].id, to: creditors[ci].id, amount: give });
    creditors[ci].amount -= give;
    debtors[di].amount -= give;
    if (creditors[ci].amount < EPS) ci++;
    if (debtors[di].amount < EPS) di++;
  }
  return settlements;
}
