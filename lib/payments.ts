import { Linking, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Currency, formatMoney } from './currency';

// ─── Settle-up deep links ────────────────────────────────────────────────────
// IMPORTANT: Roomiee NEVER touches money. We only open already-licensed payment
// apps pre-filled with the amount. No custody = no money-transmitter licensing.

export type PayMethod = 'bizum' | 'paypal' | 'revolut';

export const PAY_META: Record<PayMethod, { label: string; emoji: string; color: string }> = {
  bizum:   { label: 'Bizum',   emoji: '🇪🇸', color: '#00C1D4' },
  paypal:  { label: 'PayPal',  emoji: '🅿️', color: '#003087' },
  revolut: { label: 'Revolut', emoji: '💳', color: '#1A1A1A' },
};

async function open(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Could not open app', 'Make sure the payment app is installed.');
  }
}

export async function payWithPayPal(handle: string, amount: number, currency: Currency) {
  // paypal.me supports an amount + 3-letter currency suffix
  await open(`https://paypal.me/${handle}/${amount.toFixed(2)}${currency}`);
}

export async function payWithRevolut(handle: string, amount: number, currency: Currency) {
  await open(`https://revolut.me/${handle}?amount=${amount.toFixed(2)}&currency=${currency}`);
}

export async function payWithBizum(phone: string, amount: number, currency: Currency) {
  // Bizum has no public deep-link scheme (it runs inside each bank's app), so we
  // copy the details and guide the user. This is the honest, compliant approach.
  await Clipboard.setStringAsync(`${formatMoney(amount, currency)} → ${phone}`);
  Alert.alert(
    'Bizum',
    `Details copied!\n\nOpen your bank app → Bizum → send ${formatMoney(amount, currency)} to ${phone}.`,
    [{ text: 'Got it' }],
  );
}

/** Which methods a recipient can actually receive money on. */
export function availableMethods(r: { bizumPhone?: string; paypalMe?: string; revolutTag?: string }): PayMethod[] {
  const methods: PayMethod[] = [];
  if (r.bizumPhone) methods.push('bizum');
  if (r.paypalMe) methods.push('paypal');
  if (r.revolutTag) methods.push('revolut');
  return methods;
}

export function pay(
  method: PayMethod,
  recipient: { bizumPhone?: string; paypalMe?: string; revolutTag?: string },
  amount: number,
  currency: Currency,
) {
  if (method === 'bizum' && recipient.bizumPhone) return payWithBizum(recipient.bizumPhone, amount, currency);
  if (method === 'paypal' && recipient.paypalMe) return payWithPayPal(recipient.paypalMe, amount, currency);
  if (method === 'revolut' && recipient.revolutTag) return payWithRevolut(recipient.revolutTag, amount, currency);
}
