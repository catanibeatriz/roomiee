# Roomiee 🏡

**Roomiee helps university students sharing a flat track and split every shared expense so they never argue about who owes what.**

Built for the IE University EdTech Challenge with Claude Code, Supabase, GitHub and Vercel.

## The problem
Students sharing a flat in Madrid pay for rent, groceries, utilities and food deliveries every week — usually from different cards, sometimes in different currencies. Keeping track in WhatsApp or a spreadsheet leads to forgotten debts and awkward "you still owe me" conversations.

## What it does
- **Add an expense in seconds** — type what you paid for, the amount, done. It's split with everyone in the flat.
- **See who owes whom** — a running balance per roommate, simplified into the fewest possible payments.
- **Settle up in one tap** — opens Bizum, PayPal or Revolut pre-filled. Roomiee never holds money.
- **Invite roommates with a code** — everyone in the flat shares one private space.
- Also: shopping lists, food orders, chores, recurring bills with reminders, a house photo album, multi-currency for international students, and a Roomiee Pro tier.

## Privacy & security
- Email + password accounts with Supabase Auth.
- All data lives in Supabase with **Row Level Security** on every table: you only see your own flat's data, and nothing is readable without logging in.
- Only the public Supabase URL and publishable key are in the app; secrets never touch the code or this repository.

## Run it locally
```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL + publishable key
npx expo start --web
```
Set up the database by running [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor.

## Deploy
Vercel builds the static web export (`vercel.json`): `npx expo export --platform web` → `dist/`. Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as Vercel environment variables.

## Tech
Expo SDK 57 (React Native + Expo Router, exported to web) · Supabase (Postgres, Auth, RLS) · Zustand · Vercel.
