import { ScrollView, View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/store';
import { Colors, Radius, Shadow, Pastel, PastelName } from '@/lib/theme';
import Logo from '@/components/Logo';

const STEPS: { emoji: string; title: string; text: string; tone: PastelName }[] = [
  { emoji: '🧾', title: 'Log what you paid', text: 'Rent, groceries, Uber Eats — add it in seconds, in any currency.', tone: 'sky' },
  { emoji: '⚖️', title: 'See who owes whom', text: 'Roomiee does the maths and keeps a running balance for the flat.', tone: 'mint' },
  { emoji: '🤝', title: 'Settle up in one tap', text: 'Pay back with Bizum, PayPal or Revolut. No awkward chats.', tone: 'peach' },
];

export default function Landing() {
  const userId = useStore((s) => s.userId);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 820;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <View style={styles.wrap}>
        {/* Nav */}
        <View style={styles.nav}>
          <View style={styles.brand}>
            <Logo size={34} variant="icon" />
            <Text style={styles.wordmark}>Roomiee<Text style={{ color: Colors.primary }}>.app</Text></Text>
          </View>
          <TouchableOpacity onPress={() => router.push(userId ? '/app' : '/login')}>
            <Text style={styles.navLink}>{userId ? 'Open app' : 'Log in'}</Text>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={[styles.hero, wide && styles.heroWide]}>
          <View style={[styles.heroText, wide && { flex: 1 }]}>
            <Text style={styles.kicker}>For university students sharing a flat</Text>
            <Text style={[styles.h1, wide && { fontSize: 48 }]}>
              Split flat expenses with your roommates — without the awkward money talk.
            </Text>
            <Text style={styles.sub}>
              Roomiee keeps track of who paid for what, shows everyone's balance, and lets you
              settle up with Bizum in one tap.
            </Text>
            <TouchableOpacity style={styles.cta} onPress={() => router.push(userId ? '/app' : '/signup')} activeOpacity={0.85}>
              <Text style={styles.ctaText}>{userId ? 'Open my flat' : 'Sign up free'}</Text>
            </TouchableOpacity>
            <Text style={styles.ctaNote}>Free · takes 20 seconds · just an email and a password</Text>
          </View>

          {/* Mini preview of the app */}
          <View style={[styles.preview, wide && { flex: 0.8 }]}>
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>You are owed</Text>
              <Text style={styles.previewAmount}>€42.50</Text>
              <Text style={styles.previewSub}>Sofia owes you €27.10 · Maria owes you €15.40</Text>
            </View>
            {[
              ['🛒', 'Mercadona groceries', '€38.60'],
              ['⚡', 'Electricity — October', '€90.00'],
              ['🍜', 'Uber Eats Friday', '€34.00'],
            ].map(([e, t, a]) => (
              <View key={t} style={styles.previewRow}>
                <Text style={styles.previewEmoji}>{e}</Text>
                <Text style={styles.previewTitle}>{t}</Text>
                <Text style={styles.previewMoney}>{a}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* How it works */}
        <Text style={styles.h2}>How it works</Text>
        <View style={[styles.steps, wide && { flexDirection: 'row' }]}>
          {STEPS.map((s) => (
            <View key={s.title} style={[styles.step, wide && { flex: 1 }]}>
              <View style={[styles.stepIcon, { backgroundColor: Pastel[s.tone].bg }]}>
                <Text style={{ fontSize: 24 }}>{s.emoji}</Text>
              </View>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepText}>{s.text}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Your data is private to your flat. Roomiee never holds your money. Made at IE University, Madrid 💙
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: Colors.bg },
  content:       { paddingHorizontal: 20, paddingBottom: 48, alignItems: 'center' },
  wrap:          { width: '100%', maxWidth: 1040 },

  nav:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  brand:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmark:      { fontSize: 22, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  navLink:       { fontSize: 15, fontWeight: '700', color: Colors.primary },

  hero:          { gap: 28, marginBottom: 40 },
  heroWide:      { flexDirection: 'row', alignItems: 'center', gap: 48 },
  heroText:      {},
  kicker:        { alignSelf: 'flex-start', backgroundColor: Colors.mist, color: Colors.primary, fontWeight: '800', fontSize: 13, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6, overflow: 'hidden', marginBottom: 14 },
  h1:            { fontSize: 34, lineHeight: 1.12 * 34, fontWeight: '800', color: Colors.text, letterSpacing: -1 },
  sub:           { fontSize: 17, lineHeight: 25, color: Colors.textSub, marginTop: 14, fontWeight: '500' },
  cta:           { alignSelf: 'flex-start', backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 30, paddingVertical: 16, marginTop: 24, ...Shadow.md, shadowColor: Colors.primary, shadowOpacity: 0.35 },
  ctaText:       { color: '#fff', fontSize: 17, fontWeight: '800' },
  ctaNote:       { fontSize: 13, color: Colors.textSub, marginTop: 10, fontWeight: '600' },

  preview:       { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: 16, gap: 8, borderWidth: 1, borderColor: Colors.border, ...Shadow.md },
  previewCard:   { backgroundColor: Pastel.mint.bg, borderRadius: Radius.lg, padding: 16, marginBottom: 4 },
  previewLabel:  { fontSize: 13, fontWeight: '700', color: Pastel.mint.ink },
  previewAmount: { fontSize: 30, fontWeight: '800', color: Colors.text },
  previewSub:    { fontSize: 12, color: Colors.textSub, fontWeight: '600', marginTop: 2 },
  previewRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 4 },
  previewEmoji:  { fontSize: 20 },
  previewTitle:  { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.text },
  previewMoney:  { fontSize: 14, fontWeight: '800', color: Colors.text },

  h2:            { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 16 },
  steps:         { gap: 14 },
  step:          { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 18, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  stepIcon:      { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  stepTitle:     { fontSize: 16, fontWeight: '800', color: Colors.text },
  stepText:      { fontSize: 14, lineHeight: 20, color: Colors.textSub, marginTop: 4 },

  footer:        { fontSize: 13, color: Colors.textSub, textAlign: 'center', marginTop: 36, fontWeight: '600' },
});
