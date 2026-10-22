// Backend smoke test — mirrors what the class grading bot checks:
// sign-up, saving an item, wrong password rejected, data kept across sessions,
// a second user can't see it, and nothing is readable without logging in.
// Usage: node --env-file=.env.local scripts/check-backend.mjs
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const fresh = () => createClient(url, key, { auth: { persistSession: false } });

let failed = 0;
const check = (ok, label, extra = '') => {
  console.log(`${ok ? '✅' : '❌'} ${label}${extra ? ` — ${extra}` : ''}`);
  if (!ok) failed++;
};

const tag = Date.now().toString(36);
const password = `Test-${randomUUID().slice(0, 12)}`;
const userA = `roomiee.check.a.${tag}@gmail.com`;
const userB = `roomiee.check.b.${tag}@gmail.com`;
const itemText = `QA-${tag} backend check`;

// 1. Sign up user A (should be logged in immediately — no email confirmation)
const a = fresh();
const su = await a.auth.signUp({ email: userA, password });
check(!su.error && !!su.data.session, 'Sign-up logs the user in straight away', su.error?.message);
const uidA = su.data.user?.id;

// 2. Profile auto-created by the trigger
const prof = await a.from('profiles').select('id,name').eq('id', uidA).maybeSingle();
check(!!prof.data, 'Profile row created on sign-up', prof.error?.message);

// 3. First login creates a house + membership (what the app does)
const houseId = randomUUID();
const h = await a.from('houses').insert({ id: houseId, created_by: uidA });
const m = await a.from('house_members').insert({ house_id: houseId, user_id: uidA });
check(!h.error && !m.error, 'House created for the new user', h.error?.message || m.error?.message);

// 4. Save the core item
const ins = await a.from('expenses').insert({ house_id: houseId, title: itemText, paid_by: uidA, split_with: [uidA] });
check(!ins.error, 'Expense saved to the database', ins.error?.message);
await a.auth.signOut();

// 5. Wrong password is rejected (fresh client = different browser)
const a2 = fresh();
const bad = await a2.auth.signInWithPassword({ email: userA, password: password + 'x' });
check(!!bad.error, 'Wrong password is rejected', bad.error ? bad.error.message : 'login succeeded!');

// 6. Right password → item still there
const good = await a2.auth.signInWithPassword({ email: userA, password });
const mine = await a2.from('expenses').select('title').eq('title', itemText);
check(!good.error && mine.data?.length === 1, 'Logging back in from another session shows the expense', good.error?.message || mine.error?.message);

// 7. Second user cannot see it
const b = fresh();
await b.auth.signUp({ email: userB, password });
const theirs = await b.from('expenses').select('title').eq('title', itemText);
const theirHouses = await b.from('houses').select('id').eq('id', houseId);
const theirProfiles = await b.from('profiles').select('id').eq('id', uidA);
check((theirs.data?.length ?? 0) === 0, "Second user can't see the first user's expense");
check((theirHouses.data?.length ?? 0) === 0, "Second user can't see the first user's house");
check((theirProfiles.data?.length ?? 0) === 0, "Second user can't see the first user's profile");

// 8. Nobody can read anything without logging in
const anon = fresh();
for (const t of ['expenses', 'houses', 'profiles', 'house_members', 'bills', 'album_photos', 'shopping_items']) {
  const r = await anon.from(t).select('*').limit(1);
  check((r.data?.length ?? 0) === 0, `Logged-out visitor reads nothing from ${t}`, r.error?.message);
}

// 9. Invite codes: user B can join A's house only with the code
const code = (await a2.from('houses').select('invite_code').eq('id', houseId).single()).data?.invite_code;
const wrong = await b.rpc('join_house', { code: 'NOPE00' });
check(!!wrong.error, 'A wrong invite code is refused');
const join = await b.rpc('join_house', { code });
const shared = await b.from('expenses').select('title').eq('title', itemText);
check(!join.error && shared.data?.length === 1, 'With the right invite code, a roommate sees the house expenses', join.error?.message);

console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll checks passed 🎉');
console.log(`Test accounts created: ${userA}, ${userB}`);
process.exit(failed ? 1 : 0);
