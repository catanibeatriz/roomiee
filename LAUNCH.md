# Roomiee.app — Launch & Monetization Roadmap

> Goal: side income from a roommate super-app. Beachhead market: IE University Madrid.

## 1. Freemium model

**Free forever** (protects the viral loop — roommates must join to split):
- Expense splitting · 1 shopping list · chores · house board
- Settle-up deep links (Bizum / PayPal / Revolut)
- Up to 4 roommates

**Roomiee Pro** — €3.99/mo or €29.99/yr **per house** (~€1.30/person):
- 📊 Spending analytics & monthly reports
- 📸 Receipt scanning → auto-itemize
- 💱 Multi-currency (the IE killer feature)
- 🗂️ Unlimited history (free = last 3 months)
- 🔁 Smart chore rotation + reminders
- 🏠 Unlimited roommates & shopping lists

Per-*house* pricing → one person upgrades, whole house benefits → social pressure sells it.
Optional one-time **€34.99 lifetime** unlock for commitment-averse students.

### Implementation
- **RevenueCat** wraps Apple IAP + Google Play Billing (free under $2.5k/mo).
- App asks RevenueCat "is this user Pro?" → gate features on a single `isPro` flag.
- Digital subscriptions MUST use store IAP (15% small-business rate). Stripe is NOT allowed for the subscription. (Bizum/PayPal settle-up is fine — that's peer-to-peer between roommates, not paying us.)

## 2. Pre-launch checklist

| Step | Status |
|---|---|
| Supabase backend (accounts + persistence) | ⬜ in progress |
| RevenueCat + paywall + Pro gating | ⬜ scaffolded |
| Real app icon + splash | ⬜ (icon designed ✓) |
| 5–6 store screenshots per platform | ⬜ |
| Privacy policy + data disclosure | ⬜ |
| In-app account deletion (Apple requirement) | ⬜ |

## 3. Accounts & costs

| Item | Cost |
|---|---|
| Apple Developer Program | $99 / year |
| Google Play Developer | $25 one-time |
| RevenueCat | Free to start |
| Supabase | Free tier |
| EAS Build (Expo) | Free tier |

**Minimum to launch: ~$125 + a Supabase project.**

## 4. Build & ship (Expo EAS)

```bash
eas build --platform all     # cloud-builds .ipa (iOS) + .aab (Android)
eas submit --platform all    # uploads to App Store + Play Console
```

Review times: Apple ~1–3 days · Google ~hours to 2 days.

## 5. Marketing — IE-first go-to-market

**Phase 1 — Own IE Madrid (weeks 1–8)**
- Seed 10–20 real student houses (yours + friends)
- IE WhatsApp / housing groups (one good share spreads fast)
- QR flyers in residences & campus boards
- Hook: *"Split rent, groceries & UberEats in any currency — settle with Bizum in one tap."*
- IG/TikTok clips of the multi-currency + Bizum settle moment

**Phase 2 — Other Madrid/Spain universities + Erasmus students**

**Phase 3 — B2B**: pitch student residences & co-living operators as a tenant perk (recurring per-unit revenue).

### Growth flywheel
1 student installs (free) → invites roommates (must join to split) → house tells other houses → power users hit a Pro feature → upgrade → revenue funds ads → more houses.

**Unfair advantage:** multi-currency + Bizum. Splitwise doesn't do Bizum; Spanish apps don't do multi-currency. Roomiee owns the international-in-Spain seam.
