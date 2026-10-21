import { supabase, isSupabaseConfigured } from './supabase';

// Thin auth wrapper. When Supabase isn't configured yet, these no-op so the
// mock-data demo keeps working unchanged.

export async function signUp(email: string, password: string, name: string) {
  if (!isSupabaseConfigured || !supabase) throw new Error('Backend not configured');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw error;
  return data.user;
}

export async function signIn(email: string, password: string) {
  if (!isSupabaseConfigured || !supabase) throw new Error('Backend not configured');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// Apple requires in-app account deletion. Wire to an Edge Function in production
// (client can't delete its own auth row directly).
export async function deleteAccount() {
  if (!supabase) return;
  await supabase.functions.invoke('delete-account');
  await signOut();
}
