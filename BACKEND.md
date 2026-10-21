# Connecting the Supabase backend

The app runs on mock data until you add Supabase credentials. Here's how to go live.

## 1. Create a Supabase project
1. Go to https://supabase.com → New project (free tier is fine)
2. Pick a region close to Madrid (e.g. `eu-west`)
3. Wait ~2 min for it to provision

## 2. Run the schema
1. In Supabase: **SQL Editor** → New query
2. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql)
3. Click **Run**. This creates all tables, row-level-security policies, and the
   auto-profile trigger.

## 3. Add your credentials
1. In Supabase: **Project Settings → API**
2. Copy the **Project URL** and the **anon public** key
3. In the app folder, create `.env.local`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://YOURPROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...your-anon-key
   ```
4. Restart Expo: `npm start -- --clear`

Once these are set, `isSupabaseConfigured` flips to `true` and the auth + data
layers (`lib/supabase.ts`, `lib/auth.ts`) become active.

## 4. What's already wired
- ✅ Auth client with session persistence (AsyncStorage)
- ✅ `signUp` / `signIn` / `signOut` / `getSession` helpers
- ✅ Full schema with per-house row-level security
- ✅ Auto-creates a profile row on signup

## 5. Still to do for full persistence
- Swap the Zustand mock reads/writes for Supabase queries (one module per
  entity), keeping Zustand as the in-memory cache + realtime layer.
- Add a `delete-account` Edge Function (Apple requirement).
- Enable Supabase **Realtime** on the per-house tables so roommates see live updates.

> Security note: the **anon key is safe to ship** in the app — row-level security
> is what protects data. Never ship the `service_role` key.
