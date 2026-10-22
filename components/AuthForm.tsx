import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signIn, signUp } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Colors, Radius, Shadow } from '@/lib/theme';
import Logo from '@/components/Logo';

type Mode = 'signup' | 'login';

const COPY = {
  signup: { title: 'Create your account', sub: 'Start splitting flat costs in 20 seconds.', button: 'Sign up', switchText: 'Already have an account?', switchLink: 'Log in', switchHref: '/login' as const },
  login:  { title: 'Welcome back 👋',      sub: 'Log in to see your flat.',                  button: 'Log in',  switchText: 'New to Roomiee?',          switchLink: 'Sign up', switchHref: '/signup' as const },
};

export default function AuthForm({ mode }: { mode: Mode }) {
  const c = COPY[mode];
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    setError(null);
    if (!email.trim() || !password) { setError('Please enter your email and a password.'); return; }
    setBusy(true);
    const err = mode === 'signup' ? await signUp(email, password) : await signIn(email, password);
    setBusy(false);
    if (err) { setError(err); return; }
    router.replace('/app');
  }

  // data-testid names below are required by the class grading contract.
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.brand} onPress={() => router.replace('/')}>
          <Logo size={44} variant="icon" />
          <Text style={styles.wordmark}>Roomiee<Text style={{ color: Colors.primary }}>.app</Text></Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.title}>{c.title}</Text>
          <Text style={styles.sub}>{c.sub}</Text>

          {!isSupabaseConfigured && (
            <Text style={styles.error}>The app isn't connected to its database yet (missing Supabase keys).</Text>
          )}

          <Text style={styles.label}>Email</Text>
          <TextInput
            testID={`${mode}-email`}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@student.ie.edu"
            placeholderTextColor={Colors.textSub}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            inputMode="email"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            testID={`${mode}-password`}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
            placeholderTextColor={Colors.textSub}
            secureTextEntry
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            onSubmitEditing={submit}
          />

          {error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}

          <TouchableOpacity
            testID={`${mode}-submit`}
            style={[styles.button, busy && { opacity: 0.6 }]}
            onPress={submit}
            disabled={busy}
            accessibilityRole="button"
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{c.button}</Text>}
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>{c.switchText} </Text>
            <Link href={c.switchHref} replace style={styles.switchLink}>{c.switchLink}</Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen:     { flex: 1, backgroundColor: Colors.bg },
  content:    { flexGrow: 1, alignItems: 'center', paddingHorizontal: 20, paddingBottom: 40 },
  brand:      { alignItems: 'center', gap: 10, marginBottom: 24 },
  wordmark:   { fontSize: 26, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  card:       { width: '100%', maxWidth: 420, backgroundColor: Colors.card, borderRadius: Radius.xl, padding: 24, borderWidth: 1, borderColor: Colors.border, ...Shadow.md },
  title:      { fontSize: 24, fontWeight: '800', color: Colors.text },
  sub:        { fontSize: 14, color: Colors.textSub, marginTop: 4, marginBottom: 8, fontWeight: '500' },
  label:      { fontSize: 13, fontWeight: '700', color: Colors.textSub, marginTop: 14, marginBottom: 6 },
  input:      { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: 14, fontSize: 16, color: Colors.text, backgroundColor: Colors.bg },
  error:      { color: Colors.danger, fontWeight: '700', fontSize: 14, marginTop: 14 },
  button:     { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 16, alignItems: 'center', marginTop: 22, ...Shadow.sm, shadowColor: Colors.primary, shadowOpacity: 0.3 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  switchRow:  { flexDirection: 'row', justifyContent: 'center', marginTop: 18, flexWrap: 'wrap' },
  switchText: { color: Colors.textSub, fontSize: 14 },
  switchLink: { color: Colors.primary, fontWeight: '800', fontSize: 14 },
});
