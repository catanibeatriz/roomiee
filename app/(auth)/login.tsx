import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '@/store';
import { Colors, Radius } from '@/lib/theme';
import Button from '@/components/Button';
import Logo from '@/components/Logo';

export default function LoginScreen() {
  const login = useStore((s) => s.login);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  function handleLogin() {
    if (!name.trim() || !email.trim()) return;
    login(email.trim().toLowerCase(), name.trim());
    router.replace('/(tabs)');
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.hero}>
        <Logo size={88} variant="icon" />
        <View style={styles.wordmark}>
          <Text style={styles.title}>Roomiee</Text>
          <Text style={styles.titleApp}>.app</Text>
        </View>
        <Text style={styles.sub}>Because a happy home starts with teamwork.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Your name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Beatriz"
          placeholderTextColor={Colors.textSub}
          autoCapitalize="words"
        />

        <Text style={[styles.label, { marginTop: 16 }]}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={Colors.textSub}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Button label="Enter the house →" onPress={handleLogin} style={{ marginTop: 28 }} disabled={!name || !email} />

        <TouchableOpacity onPress={() => { setName('Beatriz'); setEmail('beatriz@example.com'); }} style={styles.demo}>
          <Text style={styles.demoText}>Use demo account</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', paddingHorizontal: 28 },
  hero:      { alignItems: 'center', marginBottom: 40 },
  wordmark:  { flexDirection: 'row', alignItems: 'flex-end', marginTop: 14 },
  title:     { fontSize: 38, fontWeight: '800', color: Colors.text, letterSpacing: -1.2 },
  titleApp:  { fontSize: 24, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  sub:       { fontSize: 15, color: Colors.textSub, marginTop: 8, textAlign: 'center' },
  form:      { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 24 },
  label:     { fontSize: 13, fontWeight: '600', color: Colors.textSub, marginBottom: 6 },
  input:     {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.bg,
  },
  demo:      { marginTop: 16, alignItems: 'center' },
  demoText:  { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});
