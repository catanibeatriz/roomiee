// ─── Multi-currency support ─────────────────────────────────────────────────
// Live ECB rates via Frankfurter (https://frankfurter.app) — free, no API key.
// Rates are stored relative to EUR (EUR = 1) and converted via cross-rate.

export const CURRENCIES = [
  { code: 'EUR', symbol: '€',  flag: '🇪🇺', name: 'Euro' },
  { code: 'USD', symbol: '$',  flag: '🇺🇸', name: 'US Dollar' },
  { code: 'GBP', symbol: '£',  flag: '🇬🇧', name: 'British Pound' },
  { code: 'BRL', symbol: 'R$', flag: '🇧🇷', name: 'Brazilian Real' },
  { code: 'CHF', symbol: 'Fr', flag: '🇨🇭', name: 'Swiss Franc' },
  { code: 'MXN', symbol: '$',  flag: '🇲🇽', name: 'Mexican Peso' },
  { code: 'JPY', symbol: '¥',  flag: '🇯🇵', name: 'Japanese Yen' },
] as const;

export type Currency = (typeof CURRENCIES)[number]['code'];

export type Rates = Record<string, number>;

// Offline fallback so the app always works (approximate, updated occasionally).
export const FALLBACK_RATES: Rates = {
  EUR: 1, USD: 1.08, GBP: 0.85, BRL: 5.4, CHF: 0.95, MXN: 18.5, JPY: 160,
};

/** Fetch latest EUR-based rates. Falls back gracefully if offline. */
export async function fetchRates(): Promise<Rates> {
  try {
    const symbols = CURRENCIES.map((c) => c.code).filter((c) => c !== 'EUR').join(',');
    const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=EUR&symbols=${symbols}`);
    if (!res.ok) throw new Error('rate fetch failed');
    const json = (await res.json()) as { rates: Rates };
    return { EUR: 1, ...json.rates };
  } catch {
    return FALLBACK_RATES;
  }
}

/** Convert an amount between currencies using EUR-based cross rates. */
export function convert(amount: number, from: Currency, to: Currency, rates: Rates): number {
  if (from === to) return amount;
  const r = rates ?? FALLBACK_RATES;
  if (!r[from] || !r[to]) return amount;
  const inEur = amount / r[from];
  return inEur * r[to];
}

/** Format an amount with the correct symbol and decimals. */
export function formatMoney(amount: number, currency: Currency): string {
  const meta = CURRENCIES.find((c) => c.code === currency);
  const symbol = meta?.symbol ?? '';
  const decimals = currency === 'JPY' ? 0 : 2;
  // Symbols that read better after the number
  if (currency === 'CHF') return `${amount.toFixed(decimals)} ${symbol}`;
  return `${symbol}${amount.toFixed(decimals)}`;
}

export function currencyMeta(code: Currency) {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}
