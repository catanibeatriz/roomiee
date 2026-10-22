import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore, Expense } from '@/store';
import { convert, formatMoney } from '@/lib/currency';
import { Colors, Radius } from '@/lib/theme';
import Card from '@/components/Card';
import Avatar from '@/components/Avatar';

const CAT_EMOJI: Record<Expense['category'], string> = { food: '🍔', groceries: '🛒', utilities: '⚡', rent: '🏠', other: '📦' };

export default function InsightsScreen() {
  const { isPro, expenses, roommates, baseCurrency, rates } = useStore();

  // ── Gating: non-Pro users see the locked state ──
  if (!isPro) {
    return (
      <View style={styles.screen}>
        <Header />
        <View style={styles.locked}>
          <Ionicons name="lock-closed" size={48} color={Colors.primary} />
          <Text style={styles.lockedTitle}>Insights is a Pro feature</Text>
          <Text style={styles.lockedSub}>See where your house spends, by category and by person.</Text>
          <TouchableOpacity style={styles.unlockBtn} onPress={() => router.push('/app/paywall')}>
            <Text style={styles.unlockText}>Unlock with Roomiee Pro</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Analytics (all amounts converted to base currency) ──
  const inBase = (e: Expense) => convert(e.amount, e.currency, baseCurrency, rates);
  const total = expenses.reduce((s, e) => s + inBase(e), 0);

  const byCategory: Record<string, number> = {};
  expenses.forEach((e) => { byCategory[e.category] = (byCategory[e.category] ?? 0) + inBase(e); });
  const categories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  const byPerson: Record<string, number> = {};
  expenses.forEach((e) => { byPerson[e.paidBy] = (byPerson[e.paidBy] ?? 0) + inBase(e); });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <Header />

      <Card style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total tracked</Text>
        <Text style={styles.totalAmount}>{formatMoney(total, baseCurrency)}</Text>
        <Text style={styles.totalSub}>{expenses.length} expenses</Text>
      </Card>

      <Text style={styles.sectionTitle}>By category</Text>
      <Card>
        {categories.map(([cat, amt], i) => {
          const pct = total > 0 ? (amt / total) * 100 : 0;
          return (
            <View key={cat} style={[styles.barRow, i < categories.length - 1 && styles.rowGap]}>
              <View style={styles.barTop}>
                <Text style={styles.barLabel}>{CAT_EMOJI[cat as Expense['category']]} {cat}</Text>
                <Text style={styles.barAmount}>{formatMoney(amt, baseCurrency)}</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${pct}%` }]} />
              </View>
            </View>
          );
        })}
      </Card>

      <Text style={styles.sectionTitle}>Who paid</Text>
      <Card>
        {roommates.map((r, i) => (
          <View key={r.id} style={[styles.personRow, i < roommates.length - 1 && styles.personBorder]}>
            <View style={styles.personLeft}>
              <Avatar roommate={r} size={36} />
              <Text style={styles.personName}>{r.name}</Text>
            </View>
            <Text style={styles.personAmount}>{formatMoney(byPerson[r.id] ?? 0, baseCurrency)}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={26} color={Colors.text} />
      </TouchableOpacity>
      <Text style={styles.title}>Insights</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 20 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginBottom: 20 },
  backBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title:        { fontSize: 22, fontWeight: '800', color: Colors.text },
  locked:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  lockedTitle:  { fontSize: 19, fontWeight: '800', color: Colors.text, marginTop: 16 },
  lockedSub:    { fontSize: 14, color: Colors.textSub, marginTop: 6, textAlign: 'center', paddingHorizontal: 30 },
  unlockBtn:    { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 24, paddingVertical: 14, marginTop: 24 },
  unlockText:   { color: '#fff', fontWeight: '700', fontSize: 15 },
  totalCard:    { alignItems: 'center', paddingVertical: 22, marginBottom: 20 },
  totalLabel:   { fontSize: 13, color: Colors.textSub, fontWeight: '600' },
  totalAmount:  { fontSize: 34, fontWeight: '800', color: Colors.text, marginVertical: 2 },
  totalSub:     { fontSize: 12, color: Colors.textSub },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12, marginTop: 4 },
  barRow:       {},
  rowGap:       { marginBottom: 16 },
  barTop:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  barLabel:     { fontSize: 14, fontWeight: '600', color: Colors.text, textTransform: 'capitalize' },
  barAmount:    { fontSize: 14, fontWeight: '700', color: Colors.text },
  barTrack:     { height: 8, borderRadius: 4, backgroundColor: Colors.mist, overflow: 'hidden' },
  barFill:      { height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  personRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  personBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  personLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  personName:   { fontSize: 15, fontWeight: '600', color: Colors.text },
  personAmount: { fontSize: 15, fontWeight: '700', color: Colors.text },
});
