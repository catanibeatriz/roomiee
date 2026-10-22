import { create } from 'zustand';
import { Alert } from 'react-native';
import uuid from 'react-native-uuid';
import { Currency, Rates, fetchRates, convert, FALLBACK_RATES } from '@/lib/currency';
import { supabase } from '@/lib/supabase';
import { AvatarColors } from '@/lib/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Roommate = {
  id: string;
  name: string;
  email: string;
  avatar: string; // initial shown when there's no photo
  color: string;
  preferredCurrency: Currency; // how this person sees their balances
  // Payment handles — public identifiers only, NO bank/card data ever stored.
  bizumPhone?: string;  // Spanish instant payments
  paypalMe?: string;    // paypal.me/<handle>
  revolutTag?: string;  // revolut.me/<handle>
  photo?: string;       // profile picture (data URL)
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
  photo?: string; // receipt / item photo (data URL)
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
  notificationId?: string; // scheduled local notification (this device only)
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
  photo?: string; // optional picture on the board (data URL)
};

export type AlbumPhoto = {
  id: string;
  uri: string;
  caption: string;
  addedBy: string;
  addedAt: string;
};

export type CurrentUser = Roommate & { isLoggedIn: boolean };

// ─── Row ↔ app mapping ───────────────────────────────────────────────────────

const today = () => new Date().toISOString().slice(0, 10);
const newId = () => uuid.v4() as string;
const num = (v: unknown) => Number(v ?? 0);

function toRoommate(p: any): Roommate {
  return {
    id: p.id,
    name: p.name,
    email: p.email ?? '',
    avatar: (p.name?.[0] ?? '?').toUpperCase(),
    color: p.color,
    preferredCurrency: p.preferred_currency,
    bizumPhone: p.bizum_phone ?? undefined,
    paypalMe: p.paypal_me ?? undefined,
    revolutTag: p.revolut_tag ?? undefined,
    photo: p.photo ?? undefined,
  };
}

const toExpense = (r: any): Expense => ({
  id: r.id, title: r.title, amount: num(r.amount), currency: r.currency, paidBy: r.paid_by,
  splitWith: r.split_with ?? [], category: r.category, date: r.date, settled: r.settled,
  photo: r.photo ?? undefined,
});

const toChore = (r: any): Chore => ({
  id: r.id, title: r.title, assignedTo: r.assigned_to, dueDate: r.due_date ?? today(),
  completed: r.completed, completedAt: r.completed_at ?? undefined, recurring: r.recurring,
});

const toFood = (r: any): FoodOrder => ({
  id: r.id, platform: r.platform, restaurant: r.restaurant, items: r.items ?? [],
  deliveryFee: num(r.delivery_fee), tip: num(r.tip), currency: r.currency, date: r.date, settled: r.settled,
});

const toNote = (r: any): HouseNote => ({
  id: r.id, title: r.title, body: r.body, pinned: r.pinned, createdBy: r.created_by,
  createdAt: r.created_at, updatedAt: r.updated_at, photo: r.photo ?? undefined,
});

const toBill = (r: any): Bill => ({
  id: r.id, name: r.name, amount: num(r.amount), currency: r.currency, dueDay: r.due_day,
  category: r.category, splitWith: r.split_with ?? [], reminderEnabled: r.reminder_enabled,
});

const toPhoto = (r: any): AlbumPhoto => ({
  id: r.id, uri: r.uri, caption: r.caption, addedBy: r.added_by, addedAt: r.added_at,
});

const EMPTY_USER: CurrentUser = {
  id: '', name: '', email: '', avatar: '?', color: AvatarColors[0], preferredCurrency: 'EUR', isLoggedIn: false,
};

// ─── Store ────────────────────────────────────────────────────────────────────

type Store = {
  // Session & loading
  loaded: boolean;              // house data loaded for the signed-in user
  houseId: string | null;
  inviteCode: string;
  loadHouse: (userId: string) => Promise<void>;
  joinHouse: (code: string) => Promise<boolean>;
  reset: () => void;

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
  addBill: (bill: Omit<Bill, 'id'>) => Promise<void>;
  removeBill: (id: string) => Promise<void>;
  setBillReminder: (id: string, enabled: boolean, notificationId?: string) => Promise<void>;

  // Guest mode (Pro)
  setGuestPeriod: (g: GuestPeriod | null) => Promise<void>;

  // Currency
  baseCurrency: Currency;       // the house's roll-up currency
  rates: Rates;                 // EUR-based exchange rates
  ratesUpdatedAt: string | null;
  loadRates: () => Promise<void>;
  setBaseCurrency: (c: Currency) => Promise<void>;
  setPreferredCurrency: (userId: string, c: Currency) => Promise<void>;
  setPaymentHandles: (userId: string, handles: Pick<Roommate, 'bizumPhone' | 'paypalMe' | 'revolutTag'>) => Promise<void>;
  setProfileName: (name: string) => Promise<void>;

  // Roomiee Pro (per house). Stored on houses.is_pro; in production RevenueCat sets it.
  isPro: boolean;
  setPro: (v: boolean) => Promise<void>;

  // Photos — house identity, profile pictures and a shared album
  houseName: string;
  houseCover: string | null;
  album: AlbumPhoto[];
  setHouseName: (name: string) => Promise<void>;
  setHouseCover: (uri: string | null) => Promise<void>;
  setProfilePhoto: (userId: string, uri: string | undefined) => Promise<void>;
  addAlbumPhoto: (uri: string, caption: string) => Promise<void>;
  removeAlbumPhoto: (id: string) => Promise<void>;

  // Expenses
  addExpense: (e: Omit<Expense, 'id'>) => Promise<boolean>;
  settleExpense: (id: string) => Promise<void>;

  // Shopping
  addShoppingList: (name: string) => Promise<void>;
  addShoppingItem: (listId: string, item: Omit<ShoppingItem, 'id'>) => Promise<void>;
  toggleShoppingItem: (listId: string, itemId: string) => Promise<void>;
  deleteShoppingItem: (listId: string, itemId: string) => Promise<void>;

  // Food orders
  addFoodOrder: (order: Omit<FoodOrder, 'id'>) => Promise<void>;
  settleFoodOrder: (id: string) => Promise<void>;

  // Chores
  addChore: (chore: Omit<Chore, 'id'>) => Promise<void>;
  toggleChore: (id: string) => Promise<void>;

  // House notes
  addHouseNote: (note: Omit<HouseNote, 'id'>) => Promise<void>;
  updateHouseNote: (id: string, title: string, body: string, photo?: string) => Promise<void>;
  togglePinNote: (id: string) => Promise<void>;
  deleteHouseNote: (id: string) => Promise<void>;
};

const HOUSE_DEFAULTS = {
  loaded: false,
  houseId: null,
  inviteCode: '',
  currentUser: EMPTY_USER,
  roommates: [],
  expenses: [],
  shoppingLists: [],
  foodOrders: [],
  chores: [],
  houseNotes: [],
  bills: [],
  guestPeriod: null,
  baseCurrency: 'EUR' as Currency,
  isPro: false,
  houseName: 'My flat',
  houseCover: null,
  album: [],
};

export const useStore = create<Store>((set, get) => {
  /**
   * Run a database write after an optimistic UI update. If it fails, tell the
   * user and reload from the server so the screen never shows unsaved data.
   */
  async function save(write: PromiseLike<{ error: any }>): Promise<boolean> {
    const { error } = await write;
    if (!error) return true;
    console.warn('Save failed', error);
    Alert.alert("Couldn't save", error.message ?? 'Please check your connection and try again.');
    const uid = get().currentUser.id;
    if (uid) get().loadHouse(uid);
    return false;
  }

  const db = () => supabase!;
  const house = () => get().houseId!;
  const me = () => get().currentUser.id;

  return {
    ...HOUSE_DEFAULTS,
    rates: FALLBACK_RATES,
    ratesUpdatedAt: null,

    reset: () => set({ ...HOUSE_DEFAULTS }),

    // ── Load everything for the signed-in user (creating their house on first login)
    loadHouse: async (userId) => {
      if (!supabase) return;

      const { data: membership } = await db()
        .from('house_members').select('house_id').eq('user_id', userId).order('joined_at').limit(1);
      let houseId: string | undefined = membership?.[0]?.house_id;

      if (!houseId) {
        houseId = newId();
        const created = await db().from('houses').insert({ id: houseId, created_by: userId });
        if (created.error) { Alert.alert('Setup failed', created.error.message); return; }
        const joined = await db().from('house_members').insert({ house_id: houseId, user_id: userId });
        if (joined.error) { Alert.alert('Setup failed', joined.error.message); return; }
      }

      const [h, members, ex, lists, items, food, ch, notes, bl, photos] = await Promise.all([
        db().from('houses').select('*').eq('id', houseId).single(),
        db().from('house_members').select('profiles(*)').eq('house_id', houseId).order('joined_at'),
        db().from('expenses').select('*').eq('house_id', houseId).order('created_at', { ascending: false }),
        db().from('shopping_lists').select('*').eq('house_id', houseId).order('created_at', { ascending: false }),
        db().from('shopping_items').select('*, shopping_lists!inner(house_id)').eq('shopping_lists.house_id', houseId).order('created_at'),
        db().from('food_orders').select('*').eq('house_id', houseId).order('created_at', { ascending: false }),
        db().from('chores').select('*').eq('house_id', houseId).order('created_at', { ascending: false }),
        db().from('house_notes').select('*').eq('house_id', houseId).order('updated_at', { ascending: false }),
        db().from('bills').select('*').eq('house_id', houseId).order('due_day'),
        db().from('album_photos').select('*').eq('house_id', houseId).order('added_at', { ascending: false }),
      ]);

      const roommates: Roommate[] = (members.data ?? [])
        .map((m: any) => m.profiles).filter(Boolean)
        .map((p: any, i: number) => ({ ...toRoommate(p), color: p.color !== '#4DA3FF' ? p.color : AvatarColors[i % AvatarColors.length] }));
      const meRow = roommates.find((r) => r.id === userId);
      const prevReminders = new Map(get().bills.map((b) => [b.id, b.notificationId]));

      set({
        loaded: true,
        houseId,
        inviteCode: h.data?.invite_code ?? '',
        houseName: h.data?.name ?? 'My flat',
        houseCover: h.data?.cover ?? null,
        baseCurrency: h.data?.base_currency ?? 'EUR',
        isPro: !!h.data?.is_pro,
        guestPeriod: h.data?.guest_period ?? null,
        currentUser: meRow ? { ...meRow, isLoggedIn: true } : { ...EMPTY_USER, id: userId, isLoggedIn: true },
        roommates,
        expenses: (ex.data ?? []).map(toExpense),
        shoppingLists: (lists.data ?? []).map((l: any) => ({
          id: l.id, name: l.name, createdBy: l.created_by, createdAt: l.created_at?.slice(0, 10),
          items: (items.data ?? []).filter((i: any) => i.list_id === l.id).map((i: any) => ({
            id: i.id, name: i.name, quantity: i.quantity ?? '', addedBy: i.added_by,
            checked: i.checked, checkedBy: i.checked_by ?? undefined,
          })),
        })),
        foodOrders: (food.data ?? []).map(toFood),
        chores: (ch.data ?? []).map(toChore),
        houseNotes: (notes.data ?? []).map(toNote),
        bills: (bl.data ?? []).map((r: any) => ({ ...toBill(r), notificationId: prevReminders.get(r.id) })),
        album: (photos.data ?? []).map(toPhoto),
      });
    },

    joinHouse: async (code) => {
      const { error } = await db().rpc('join_house', { code });
      if (error) { Alert.alert("Couldn't join", 'That invite code was not found.'); return false; }
      // Leave the solo house created at sign-up so the new one becomes the only house.
      const old = get().houseId;
      if (old) await db().from('house_members').delete().eq('house_id', old).eq('user_id', me());
      await get().loadHouse(me());
      return true;
    },

    // ── Bills
    addBill: async (bill) => {
      const id = newId();
      set((s) => ({ bills: [...s.bills, { ...bill, id }].sort((a, b) => a.dueDay - b.dueDay) }));
      await save(db().from('bills').insert({
        id, house_id: house(), name: bill.name, amount: bill.amount, currency: bill.currency,
        due_day: bill.dueDay, category: bill.category, split_with: bill.splitWith, reminder_enabled: bill.reminderEnabled,
      }));
    },
    removeBill: async (id) => {
      set((s) => ({ bills: s.bills.filter((b) => b.id !== id) }));
      await save(db().from('bills').delete().eq('id', id));
    },
    setBillReminder: async (id, enabled, notificationId) => {
      set((s) => ({ bills: s.bills.map((b) => b.id === id ? { ...b, reminderEnabled: enabled, notificationId } : b) }));
      await save(db().from('bills').update({ reminder_enabled: enabled }).eq('id', id));
    },

    setGuestPeriod: async (g) => {
      set({ guestPeriod: g });
      await save(db().from('houses').update({ guest_period: g }).eq('id', house()));
    },

    // ── Currency & profile
    loadRates: async () => {
      const rates = await fetchRates();
      set({ rates, ratesUpdatedAt: new Date().toISOString() });
    },
    setBaseCurrency: async (c) => {
      set({ baseCurrency: c });
      await save(db().from('houses').update({ base_currency: c }).eq('id', house()));
    },
    setPreferredCurrency: async (userId, c) => {
      set((s) => ({
        roommates: s.roommates.map((r) => r.id === userId ? { ...r, preferredCurrency: c } : r),
        currentUser: s.currentUser.id === userId ? { ...s.currentUser, preferredCurrency: c } : s.currentUser,
      }));
      await save(db().from('profiles').update({ preferred_currency: c }).eq('id', userId));
    },
    setPaymentHandles: async (userId, handles) => {
      set((s) => ({
        roommates: s.roommates.map((r) => r.id === userId ? { ...r, ...handles } : r),
        currentUser: s.currentUser.id === userId ? { ...s.currentUser, ...handles } : s.currentUser,
      }));
      await save(db().from('profiles').update({
        bizum_phone: handles.bizumPhone ?? null, paypal_me: handles.paypalMe ?? null, revolut_tag: handles.revolutTag ?? null,
      }).eq('id', userId));
    },
    setProfileName: async (name) => {
      const avatar = (name[0] ?? '?').toUpperCase();
      set((s) => ({
        roommates: s.roommates.map((r) => r.id === s.currentUser.id ? { ...r, name, avatar } : r),
        currentUser: { ...s.currentUser, name, avatar },
      }));
      await save(db().from('profiles').update({ name }).eq('id', me()));
    },

    // ── Pro
    setPro: async (v) => {
      set({ isPro: v });
      await save(db().from('houses').update({ is_pro: v }).eq('id', house()));
    },

    // ── Photos & house identity
    setHouseName: async (name) => {
      set({ houseName: name });
      await save(db().from('houses').update({ name: name.trim() || 'My flat' }).eq('id', house()));
    },
    setHouseCover: async (uri) => {
      set({ houseCover: uri });
      await save(db().from('houses').update({ cover: uri }).eq('id', house()));
    },
    setProfilePhoto: async (userId, uri) => {
      set((s) => ({
        roommates: s.roommates.map((r) => r.id === userId ? { ...r, photo: uri } : r),
        currentUser: s.currentUser.id === userId ? { ...s.currentUser, photo: uri } : s.currentUser,
      }));
      await save(db().from('profiles').update({ photo: uri ?? null }).eq('id', userId));
    },
    addAlbumPhoto: async (uri, caption) => {
      const id = newId();
      set((s) => ({ album: [{ id, uri, caption, addedBy: me(), addedAt: today() }, ...s.album] }));
      await save(db().from('album_photos').insert({ id, house_id: house(), uri, caption, added_by: me() }));
    },
    removeAlbumPhoto: async (id) => {
      set((s) => ({ album: s.album.filter((p) => p.id !== id) }));
      await save(db().from('album_photos').delete().eq('id', id));
    },

    // ── Expenses
    addExpense: async (e) => {
      const id = newId();
      set((s) => ({ expenses: [{ ...e, id }, ...s.expenses] }));
      return save(db().from('expenses').insert({
        id, house_id: house(), title: e.title, amount: e.amount, currency: e.currency, paid_by: e.paidBy,
        split_with: e.splitWith, category: e.category, date: e.date, settled: e.settled, photo: e.photo ?? null,
      }));
    },
    settleExpense: async (id) => {
      set((s) => ({ expenses: s.expenses.map((e) => e.id === id ? { ...e, settled: true } : e) }));
      await save(db().from('expenses').update({ settled: true }).eq('id', id));
    },

    // ── Shopping
    addShoppingList: async (name) => {
      const id = newId();
      set((s) => ({ shoppingLists: [{ id, name, items: [], createdBy: me(), createdAt: today() }, ...s.shoppingLists] }));
      await save(db().from('shopping_lists').insert({ id, house_id: house(), name, created_by: me() }));
    },
    addShoppingItem: async (listId, item) => {
      const id = newId();
      set((s) => ({
        shoppingLists: s.shoppingLists.map((l) => l.id === listId ? { ...l, items: [...l.items, { ...item, id }] } : l),
      }));
      await save(db().from('shopping_items').insert({
        id, list_id: listId, name: item.name, quantity: item.quantity, added_by: item.addedBy, checked: item.checked,
      }));
    },
    toggleShoppingItem: async (listId, itemId) => {
      const item = get().shoppingLists.find((l) => l.id === listId)?.items.find((i) => i.id === itemId);
      if (!item) return;
      const checked = !item.checked;
      set((s) => ({
        shoppingLists: s.shoppingLists.map((l) => l.id === listId ? {
          ...l, items: l.items.map((i) => i.id === itemId ? { ...i, checked, checkedBy: checked ? me() : undefined } : i),
        } : l),
      }));
      await save(db().from('shopping_items').update({ checked, checked_by: checked ? me() : null }).eq('id', itemId));
    },
    deleteShoppingItem: async (listId, itemId) => {
      set((s) => ({
        shoppingLists: s.shoppingLists.map((l) => l.id === listId ? { ...l, items: l.items.filter((i) => i.id !== itemId) } : l),
      }));
      await save(db().from('shopping_items').delete().eq('id', itemId));
    },

    // ── Food orders
    addFoodOrder: async (order) => {
      const id = newId();
      const items = order.items.map((it) => ({ ...it, id: newId() }));
      set((s) => ({ foodOrders: [{ ...order, id, items }, ...s.foodOrders] }));
      await save(db().from('food_orders').insert({
        id, house_id: house(), platform: order.platform, restaurant: order.restaurant, items,
        delivery_fee: order.deliveryFee, tip: order.tip, currency: order.currency, date: order.date, settled: order.settled,
      }));
    },
    settleFoodOrder: async (id) => {
      set((s) => ({ foodOrders: s.foodOrders.map((o) => o.id === id ? { ...o, settled: true } : o) }));
      await save(db().from('food_orders').update({ settled: true }).eq('id', id));
    },

    // ── Chores
    addChore: async (chore) => {
      const id = newId();
      set((s) => ({ chores: [{ ...chore, id }, ...s.chores] }));
      await save(db().from('chores').insert({
        id, house_id: house(), title: chore.title, assigned_to: chore.assignedTo, due_date: chore.dueDate,
        completed: chore.completed, recurring: chore.recurring,
      }));
    },
    toggleChore: async (id) => {
      const c = get().chores.find((x) => x.id === id);
      if (!c) return;
      const completed = !c.completed;
      const completedAt = completed ? today() : undefined;
      set((s) => ({ chores: s.chores.map((x) => x.id === id ? { ...x, completed, completedAt } : x) }));
      await save(db().from('chores').update({ completed, completed_at: completedAt ?? null }).eq('id', id));
    },

    // ── House notes
    addHouseNote: async (note) => {
      const id = newId();
      set((s) => ({ houseNotes: [{ ...note, id }, ...s.houseNotes] }));
      await save(db().from('house_notes').insert({
        id, house_id: house(), title: note.title, body: note.body, pinned: note.pinned,
        photo: note.photo ?? null, created_by: note.createdBy,
      }));
    },
    updateHouseNote: async (id, title, body, photo) => {
      set((s) => ({
        houseNotes: s.houseNotes.map((n) => n.id === id ? { ...n, title, body, photo, updatedAt: today() } : n),
      }));
      await save(db().from('house_notes').update({ title, body, photo: photo ?? null, updated_at: today() }).eq('id', id));
    },
    togglePinNote: async (id) => {
      const n = get().houseNotes.find((x) => x.id === id);
      if (!n) return;
      set((s) => ({ houseNotes: s.houseNotes.map((x) => x.id === id ? { ...x, pinned: !x.pinned } : x) }));
      await save(db().from('house_notes').update({ pinned: !n.pinned }).eq('id', id));
    },
    deleteHouseNote: async (id) => {
      set((s) => ({ houseNotes: s.houseNotes.filter((n) => n.id !== id) }));
      await save(db().from('house_notes').delete().eq('id', id));
    },
  };
});

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
    .filter((e) => !e.settled && e.splitWith.length > 0)
    .forEach((e) => {
      const amountInBase = convert(e.amount, e.currency, baseCurrency, rates);
      const share = amountInBase / e.splitWith.length;
      e.splitWith.forEach((rid) => {
        if (rid !== e.paidBy && rid in balances && e.paidBy in balances) {
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
    const extraShare = total > 0 ? (item.price / total) * extras : 0;
    splits[item.orderedBy] = (splits[item.orderedBy] ?? 0) + item.price + extraShare;
  });
  return splits;
}

// ─── Guest mode ───────────────────────────────────────────────────────────────
// A long-term guest adds extra load (utilities, water…). We estimate the host's
// fair surcharge from the house's own utility bills, scaled by how much of the
// month the guest stays.

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
