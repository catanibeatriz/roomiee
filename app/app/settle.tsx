import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore, computeBalances, computeSettlements } from '@/store';
import { formatMoney } from '@/lib/currency';
import { PAY_META, availableMethods, pay } from '@/lib/payments';
import { Colors, Radius, Shadow } from '@/lib/theme';
import Card from '@/components/Card';
import Avatar from '@/components/Avatar';

export default function SettleScreen() {
  const { currentUser, roommates, expenses, baseCurrency, rates } = useStore();
  const balances = computeBalances(expenses, roommates, baseCurrency, rates);
  const settlements = computeSettlements(balances);

  const iOwe   = settlements.filter((s) => s.from === currentUser.id);
  const owedMe = settlements.filter((s) => s.to === currentUser.id);
  const byId = (id: string) => roommates.find((r) => r.id === id)!;

  const allSettled = iOwe.length === 0 && owedMe.length === 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settle up</Text>
        <View style={{ width: 40 }} />
      </View>

      {allSettled && (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyText}>Everyone's square!</Text>
          <Text style={styles.emptySub}>No debts to settle right now.</Text>
        </View>
      )}

      {/* What I owe — payable */}
      {iOwe.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>You owe</Text>
          {iOwe.map((s) => {
            const creditor = byId(s.to);
            const methods = availableMethods(creditor);
            return (
              <Card key={s.to} style={styles.payCard}>
                <View style={styles.payTop}>
                  <View style={styles.payLeft}>
                    <Avatar roommate={creditor} size={44} />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.payName}>{creditor.name}</Text>
                      <Text style={styles.paySub}>pay in {baseCurrency}</Text>
                    </View>
                  </View>
                  <Text style={styles.payAmount}>{formatMoney(s.amount, baseCurrency)}</Text>
                </View>

                {methods.length > 0 ? (
                  <View style={styles.methodRow}>
                    {methods.map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={styles.methodBtn}
                        onPress={() => pay(m, creditor, s.amount, baseCurrency)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.methodEmoji}>{PAY_META[m].emoji}</Text>
                        <Text style={styles.methodLabel}>{PAY_META[m].label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noMethods}>{creditor.name} hasn't added a payment method yet.</Text>
                )}
              </Card>
            );
          })}
        </>
      )}

      {/* What I'm owed — informational */}
      {owedMe.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Owed to you</Text>
          {owedMe.map((s) => {
            const debtor = byId(s.from);
            return (
              <Card key={s.from} style={styles.owedCard}>
                <View style={styles.payLeft}>
                  <Avatar roommate={debtor} size={40} />
                  <Text style={styles.owedName}>{debtor.name}</Text>
                </View>
                <Text style={[styles.payAmount, { color: Colors.success }]}>
                  +{formatMoney(s.amount, baseCurrency)}
                </Text>
              </Card>
            );
          })}
          <Text style={styles.hint}>They'll see these in their own “You owe” list.</Text>
        </>
      )}

      <View style={styles.safetyNote}>
        <Ionicons name="shield-checkmark-outline" size={16} color={Colors.textSub} />
        <Text style={styles.safetyText}>
          Roomiee never holds your money — payments open directly in Bizum, PayPal or Revolut.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 20 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginBottom: 20 },
  backBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title:        { fontSize: 22, fontWeight: '800', color: Colors.text },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  empty:        { alignItems: 'center', marginTop: 60 },
  emptyEmoji:   { fontSize: 56, marginBottom: 12 },
  emptyText:    { fontSize: 20, fontWeight: '800', color: Colors.text },
  emptySub:     { fontSize: 14, color: Colors.textSub, marginTop: 4 },
  payCard:      { marginBottom: 12 },
  payTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payLeft:      { flexDirection: 'row', alignItems: 'center' },
  payName:      { fontSize: 16, fontWeight: '700', color: Colors.text },
  paySub:       { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  payAmount:    { fontSize: 20, fontWeight: '800', color: Colors.danger },
  methodRow:    { flexDirection: 'row', gap: 8, marginTop: 14, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 14 },
  methodBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.mist, borderRadius: Radius.md, paddingVertical: 12 },
  methodEmoji:  { fontSize: 16 },
  methodLabel:  { fontSize: 14, fontWeight: '700', color: Colors.primary },
  noMethods:    { fontSize: 13, color: Colors.textSub, marginTop: 12, fontStyle: 'italic' },
  owedCard:     { marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  owedName:     { fontSize: 15, fontWeight: '600', color: Colors.text, marginLeft: 12 },
  hint:         { fontSize: 12, color: Colors.textSub, marginTop: 8 },
  safetyNote:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 32, paddingHorizontal: 4 },
  safetyText:   { flex: 1, fontSize: 12, color: Colors.textSub, lineHeight: 17 },
});
