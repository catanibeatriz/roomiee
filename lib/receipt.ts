import { Currency } from './currency';
import { pickPhoto } from './photos';
import { Expense } from '@/store';

// ─── Receipt scanning (Pro feature) ──────────────────────────────────────────

export type ScannedReceipt = {
  merchant: string;
  total: number;
  currency: Currency;
  category: Expense['category'];
  items: { name: string; price: number }[];
};

/** Photograph or pick a receipt; returns it as a storable data URL. */
export function captureReceipt(): Promise<string | null> {
  return pickPhoto({ title: 'Scan a receipt' });
}

// Realistic Madrid-area receipts for the demo. Swap `scanReceipt` for a real
// OCR call (Claude vision / Veryfi / Google Vision) when you add an API key —
// the rest of the app doesn't change.
const SAMPLES: ScannedReceipt[] = [
  {
    merchant: 'Mercadona', total: 38.6, currency: 'EUR', category: 'groceries',
    items: [
      { name: 'Leche entera x6', price: 5.4 },
      { name: 'Pechuga de pollo', price: 7.8 },
      { name: 'Pan de molde', price: 1.9 },
      { name: 'Tomates 1kg', price: 2.5 },
      { name: 'Detergente', price: 8.0 },
      { name: 'Yogur natural x4', price: 2.6 },
      { name: 'Aceite de oliva', price: 10.4 },
    ],
  },
  {
    merchant: 'Carrefour Express', total: 24.15, currency: 'EUR', category: 'groceries',
    items: [
      { name: 'Pasta x2', price: 2.3 },
      { name: 'Salsa de tomate', price: 1.85 },
      { name: 'Queso rallado', price: 3.2 },
      { name: 'Cerveza x6', price: 6.5 },
      { name: 'Papel higiénico x12', price: 7.9 },
      { name: 'Agua 1.5L x6', price: 2.4 },
    ],
  },
  {
    merchant: 'Día Supermercado', total: 17.45, currency: 'EUR', category: 'groceries',
    items: [
      { name: 'Huevos x12', price: 2.6 },
      { name: 'Plátanos 1kg', price: 1.95 },
      { name: 'Café molido', price: 4.5 },
      { name: 'Galletas', price: 2.1 },
      { name: 'Zumo de naranja', price: 2.3 },
      { name: 'Mantequilla', price: 4.0 },
    ],
  },
];

/** Analyze a receipt image → structured expense data. */
export async function scanReceipt(_imageUri: string): Promise<ScannedReceipt> {
  // TODO (real OCR): POST the image to your vision endpoint and map the JSON.
  // e.g. const res = await fetch(OCR_URL, { method:'POST', body: form });
  await new Promise((r) => setTimeout(r, 1600)); // simulate analysis
  return SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
}
