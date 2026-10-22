import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useStore } from '@/store';
import { formatMoney, currencyMeta } from '@/lib/currency';
import { Colors, Radius, Shadow } from '@/lib/theme';
import Avatar from '@/components/Avatar';

const CAT_EMOJI = { food: '🍔', groceries: '🛒', utilities: '⚡', rent: '🏠', other: '📦' } as const;

/**
 * The app's core action: type what you paid for, optionally how much, tap Add.
 * The amount defaults to 0 and the cost is split with everyone in the house.
 * (core-input / core-submit / core-item are required by the class grading contract.)
 */
export default function QuickExpense() {
  const { expenses, roommates, currentUser, baseCurrency, addExpense } = useStore();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!title.trim() || busy) return;
    setBusy(true);
    const ok = await addExpense({
      title: title.trim(),
      amount: Math.max(0, parseFloat(amount.replace(',', '.')) || 0),
      currency: baseCurrency,
      paidBy: currentUser.id,
      splitWith: roommates.map((r) => r.id),
      category: 'other',
      date: new Date().toISOString().slice(0, 10),
      settled: false,
    });
    setBusy(false);
    if (ok) { setTitle(''); setAmount(''); }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Add an expense</Text>
      <Text style={styles.sub}>What did you pay for the flat? It's split with everyone.</Text>

      <View style={styles.row}>
        <TextInput
          testID="core-input"
          style={[styles.input, { flex: 1 }]}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Mercadona groceries"
          placeholderTextColor={Colors.textSub}
          onSubmitEditing={submit}
          returnKeyType="done"
        />
        <TextInput
          style={[styles.input, styles.amount]}
          value={amount}
          onChangeText={setAmount}
          placeholder={`${currencyMeta(baseCurrency).symbol}0`}
          placeholderTextColor={Colors.textSub}
          keyboardType="decimal-pad"
          inputMode="decimal"
          onSubmitEditing={submit}
          accessibilityLabel="Amount (optional)"
        />
      </View>

      <TouchableOpacity
        testID="core-submit"
        style={[styles.button, (!title.trim() || busy) && { opacity: 0.55 }]}
        onPress={submit}
        disabled={busy}
        accessibilityRole="button"
      >
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>＋ Add expense</Text>}
      </TouchableOpacity>

      {expenses.length === 0 ? (
        <Text style={styles.empty}>No expenses yet — add your first one above ✨</Text>
      ) : (
        <View style={styles.list}>
          {expenses.map((e) => {
            const payer = roommates.find((r) => r.id === e.paidBy);
            return (
              <View key={e.id} testID="core-item" style={[styles.item, e.settled && { opacity: 0.5 }]}>
                <Text style={styles.itemEmoji}>{CAT_EMOJI[e.category] ?? '📦'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle} numberOfLines={2}>{e.title}</Text>
                  <Text style={styles.itemMeta}>{payer ? `${payer.name} paid` : 'Paid'} · {e.date}{e.settled ? ' · settled' : ''}</Text>
                </View>
                {payer && <Avatar roommate={payer} size={24} />}
                <Text style={styles.itemAmount}>{formatMoney(e.amount, e.currency)}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card:       { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: Colors.border, ...Shadow.md },
  title:      { fontSize: 18, fontWeight: '800', color: Colors.text },
  sub:        { fontSize: 13, color: Colors.textSub, marginTop: 2, marginBottom: 12, fontWeight: '500' },
  row:        { flexDirection: 'row', gap: 8 },
  input:      { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text, backgroundColor: Colors.bg },
  amount:     { width: 84, textAlign: 'right' },
  button:     { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 13, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  empty:      { fontSize: 13, color: Colors.textSub, textAlign: 'center', marginTop: 14, fontWeight: '600' },
  list:       { marginTop: 12 },
  item:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  itemEmoji:  { fontSize: 20 },
  itemTitle:  { fontSize: 15, fontWeight: '700', color: Colors.text },
  itemMeta:   { fontSize: 12, color: Colors.textSub, marginTop: 1 },
  itemAmount: { fontSize: 14, fontWeight: '800', color: Colors.text, minWidth: 56, textAlign: 'right' },
});
