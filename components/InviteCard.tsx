import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useStore } from '@/store';
import { Colors, Radius, Pastel } from '@/lib/theme';

/** Shown while you're the only person in your house: invite roommates or join theirs. */
export default function InviteCard() {
  const { inviteCode, joinHouse } = useStore();
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [joining, setJoining] = useState(false);

  async function share() {
    const message = `Join my flat on Roomiee! Sign up and enter the invite code ${inviteCode}`;
    if (Platform.OS === 'web') {
      await Clipboard.setStringAsync(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      Share.share({ message });
    }
  }

  async function join() {
    if (!code.trim()) return;
    setJoining(true);
    const ok = await joinHouse(code);
    setJoining(false);
    if (ok) setCode('');
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>👋 Bring your roommates</Text>
      <Text style={styles.text}>Share your invite code so everyone splits costs in the same flat.</Text>
      <View style={styles.codeRow}>
        <Text style={styles.code}>{inviteCode}</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={share}>
          <Text style={styles.shareText}>{copied ? 'Copied ✓' : Platform.OS === 'web' ? 'Copy code' : 'Share'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.or}>Got a code from a roommate?</Text>
      <View style={styles.joinRow}>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          placeholder="ABC123"
          placeholderTextColor={Colors.textSub}
          autoCapitalize="characters"
          maxLength={6}
        />
        <TouchableOpacity style={[styles.joinBtn, (!code.trim() || joining) && { opacity: 0.55 }]} onPress={join} disabled={joining}>
          <Text style={styles.joinText}>{joining ? 'Joining…' : 'Join flat'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card:      { backgroundColor: Pastel.lavender.bg, borderRadius: Radius.xl, padding: 18, marginBottom: 16 },
  title:     { fontSize: 16, fontWeight: '800', color: Colors.text },
  text:      { fontSize: 13, color: Colors.textSub, marginTop: 4, fontWeight: '500' },
  codeRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  code:      { flex: 1, fontSize: 24, fontWeight: '800', letterSpacing: 4, color: Pastel.lavender.ink, backgroundColor: Colors.card, borderRadius: Radius.md, paddingVertical: 10, textAlign: 'center' },
  shareBtn:  { backgroundColor: Pastel.lavender.ink, borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 12 },
  shareText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  or:        { fontSize: 12, color: Colors.textSub, fontWeight: '700', marginTop: 14, marginBottom: 6 },
  joinRow:   { flexDirection: 'row', gap: 8 },
  input:     { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, fontWeight: '700', letterSpacing: 2, color: Colors.text },
  joinBtn:   { backgroundColor: Colors.card, borderRadius: Radius.full, paddingHorizontal: 16, justifyContent: 'center', borderWidth: 1.5, borderColor: Pastel.lavender.ink },
  joinText:  { color: Pastel.lavender.ink, fontWeight: '800', fontSize: 14 },
});
