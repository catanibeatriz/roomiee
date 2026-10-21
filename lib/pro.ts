// Roomiee Pro — the feature catalog and pricing shown on the paywall.

// Free-tier caps. Pro lifts all of these.
export const FREE_LIMITS = {
  shoppingLists: 1,
  roommates: 4,
  historyMonths: 3,
};

/** ISO date (YYYY-MM-DD) cutoff: expenses older than this are Pro-only. */
export function historyCutoff(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - FREE_LIMITS.historyMonths);
  return d.toISOString().slice(0, 10);
}

export const PRO_FEATURES = [
  { emoji: '📊', title: 'Spending analytics',  desc: 'Monthly reports & insights by category and person.' },
  { emoji: '💱', title: 'Multi-currency',      desc: 'Live FX so every roommate sees balances in their currency.' },
  { emoji: '📸', title: 'Receipt scanning',    desc: 'Snap a receipt — items split automatically.' },
  { emoji: '🗂️', title: 'Unlimited history',   desc: 'Keep every expense forever (free keeps 3 months).' },
  { emoji: '🔁', title: 'Smart chore rotation', desc: 'Auto-rotating schedules with reminders.' },
  { emoji: '🏠', title: 'Unlimited everything', desc: 'No caps on roommates or shopping lists.' },
];

export type Plan = 'monthly' | 'yearly' | 'lifetime';

export const PLANS: { id: Plan; label: string; price: string; sub: string; badge?: string }[] = [
  { id: 'yearly',   label: 'Yearly',   price: '€29.99', sub: '€2.50/mo · best value', badge: 'SAVE 37%' },
  { id: 'monthly',  label: 'Monthly',  price: '€3.99',  sub: 'per house, per month' },
  { id: 'lifetime', label: 'Lifetime', price: '€34.99', sub: 'one-time, forever' },
];

// Per-house pricing → split across roommates this is the effective cost each.
export function perPersonHint(plan: Plan, roommateCount: number): string {
  const n = Math.max(roommateCount, 1);
  if (plan === 'monthly')  return `≈ €${(3.99 / n).toFixed(2)}/mo each`;
  if (plan === 'yearly')   return `≈ €${(29.99 / 12 / n).toFixed(2)}/mo each`;
  return `≈ €${(34.99 / n).toFixed(2)} each, once`;
}
