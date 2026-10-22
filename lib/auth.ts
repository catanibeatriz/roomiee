import { supabase, isSupabaseConfigured } from './supabase';

const NOT_CONFIGURED = 'The app is not connected to its database yet.';

function friendly(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'Wrong email or password.';
  if (/already registered|already exists/i.test(message)) return 'An account with this email already exists — try logging in.';
  if (/password should be at least/i.test(message)) return 'Your password needs at least 6 characters.';
  if (/unable to validate email|invalid email/i.test(message)) return 'Please enter a valid email address.';
  return message;
}

export async function signUp(email: string, password: string): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return NOT_CONFIGURED;
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
  if (error) return friendly(error.message);
  // With "Confirm email" off, Supabase signs the user in straight away.
  if (!data.session) return 'Account created, but email confirmation is still switched on in Supabase.';
  return null;
}

export async function signIn(email: string, password: string): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return NOT_CONFIGURED;
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return error ? friendly(error.message) : null;
}

export async function signOut() {
  await supabase?.auth.signOut();
}
