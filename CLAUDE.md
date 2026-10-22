## Grading contract — EdTech Challenge (never remove or break this)
An automated bot grades this app on its public Vercel URL, acting like a stranger.

### Pages
- `/` public landing page (no login needed): what the app does, who it is for, and one button to sign up.
- `/signup` sign-up with email + password. `/login` login with email + password.
- `/app` the main feature, only for logged-in users.
- After sign-up and after login, send the user to `/app`.
- No email confirmation, no CAPTCHA, no "Google only" login, no mandatory onboarding before `/app`.

### data-testid attributes (exact names, do not translate)
- Sign-up form: `signup-email`, `signup-password`, `signup-submit`
- Login form: `login-email`, `login-password`, `login-submit`
- `logout`: the logout button, visible on every page of a logged-in user
- On `/app`:
  - `core-input`: a TEXT field of the main feature (type="text" or a textarea, e.g. the title or description, never a number or date picker). The bot types a short text like "QA-7F3K2A grading bot test"
  - `core-submit`: the button that saves it
  - `core-item`: EVERY saved item in the list, showing the text typed in `core-input`
- Typing only in `core-input` and clicking `core-submit` must save a new item. Any other field needs a valid default value.

### Data and security
- Use Supabase Auth (email + password) and save all data in Supabase tables, never only in the browser (no localStorage for user data).
- Row Level Security ON for every table, with policies based on `auth.uid()`. Nobody can read anything without logging in.
- Only the Supabase URL and the publishable (anon) key may reach the browser. Never put the secret/service_role key or any AI API key in the frontend or in GitHub.
- Keep keys in `.env.local` (listed in `.gitignore`) and in Vercel environment variables.

---

## Project notes (Roomiee)

**One-liner:** Roomiee helps university students sharing a flat track and split every shared expense so they never argue about who owes what.

**Stack:** Expo (React Native + Expo Router) exported as a static web app, hosted on Vercel; Supabase for auth and data. React Native's `testID` renders as `data-testid` on the web.

**Where the contract lives in the code**
- `/` → `app/index.tsx` (landing) · `/signup`, `/login` → `app/signup.tsx`, `app/login.tsx` (`components/AuthForm.tsx`)
- `/app` → `app/app/` — `app/app/_layout.tsx` redirects logged-out visitors to `/login` and renders the `logout` button on every logged-in page
- Core feature → `components/QuickExpense.tsx` (`core-input`, `core-submit`, `core-item`), shown on the `/app` home screen; amount defaults to 0
- Data → `store/index.ts` (every action writes to Supabase) · schema + RLS → `supabase/schema.sql`

**Data model:** each user gets their own house on first login; data is private to a house (RLS via `is_house_member`). Roommates only share data after joining with the house's invite code (`join_house` RPC). Declared in Socratista as "Data shared between users: no".

**Env vars** (`.env.local` and Vercel): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Expo inlines them at build time — redeploy after changing them.

**Checks:** `node --env-file=.env.local scripts/check-backend.mjs` runs the bot's data/security checks against the real database (creates two throwaway test users).
