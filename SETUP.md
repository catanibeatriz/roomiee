# Roomie — Setup Guide

## 1. Install Node.js

Go to https://nodejs.org and download the LTS version (v20+). Install it and restart your terminal.

Verify: `node -v` should print something like `v20.x.x`

## 2. Install dependencies

```bash
cd ~/roommate-app
npm install
```

## 3. Run the app

```bash
npm start
```

This opens Expo Dev Tools in your browser.

- **On your phone**: Download the **Expo Go** app (iOS/Android), scan the QR code.
- **On iOS Simulator**: Press `i` in the terminal (requires Xcode).
- **On Android Emulator**: Press `a` (requires Android Studio).

## 4. Connect real backend (when ready)

Create a free Supabase project at https://supabase.com, then:

1. Copy `.env.example` to `.env.local`
2. Fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Run the SQL migrations in `supabase/migrations/` (coming next)

---

## Features

| Screen | What you can do |
|--------|----------------|
| Home | See your balance, quick actions, roommate balances, daily nudges |
| Expenses | Log expenses, split evenly or select who, settle up |
| Shopping | Create lists, add items with quantities, check them off |
| Food | Log UberEats/DoorDash orders, per-item split + delivery fee |
| Chores | Assign tasks, set recurring schedule, mark complete |
| Board | Pinned house notes, WiFi password, house rules, landlord info |
