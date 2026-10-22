import { useState } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Image,
} from 'react-native';
import { pickPhoto } from '@/lib/photos';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore, Expense, Roommate } from '@/store';
import { CURRENCIES, Currency, Rates, convert, formatMoney, currencyMeta } from '@/lib/currency';
import { historyCutoff } from '@/lib/pro';
import { captureReceipt, scanReceipt } from '@/lib/receipt';
import { Colors, Radius, Shadow } from '@/lib/theme';
import Avatar from '@/components/Avatar';
import Card from '@/components/Card';
import Button from '@/components/Button';

const CATEGORIES: Expense['category'][] = ['food', 'groceries', 'utilities', 'rent', 'other'];
const CAT_EMOJI: Record<Expense['category'], string> = { food: '🍔', groceries: '🛒', utilities: '⚡', rent: '🏠', other: '📦' };

export default function ExpensesScreen() {
  const { expenses, roommates, currentUser, addExpense, settleExpense, baseCurrency, rates, isPro } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [scanning, setScanning] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>(baseCurrency);
  const [category, setCategory] = useState<Expense['category']>('other');
  const [splitWith, setSplitWith] = useState<string[]>(roommates.map((r) => r.id));
  const [photo, setPhoto] = useState<string | undefined>();

  async function handleScanReceipt() {
    if (!isPro) { router.push('/app/paywall'); return; }
    const uri = await captureReceipt();
    if (!uri) return;
    setScanning(true);
    try {
      const r = await scanReceipt(uri);
      // Prefill the expense form from the scanned receipt
      setTitle(r.merchant);
      setAmount(r.total.toFixed(2));
      setCurrency(r.currency);
      setCategory(r.category);
      setSplitWith(roommates.map((rm) => rm.id));
      setPhoto(uri);
      setShowAdd(true);
    } finally {
      setScanning(false);
    }
  }

  function submit() {
    if (!title || !amount) return;
    addExpense({
      title,
      amount: parseFloat(amount),
      currency,
      paidBy: currentUser.id,
      splitWith,
      category,
      date: new Date().toISOString().slice(0, 10),
      settled: false,
      photo,
    });
    setTitle(''); setAmount(''); setCurrency(baseCurrency); setCategory('other'); setSplitWith(roommates.map((r) => r.id));
    setPhoto(undefined);
    setShowAdd(false);
  }

  // Free tier only shows the last 3 months of history
  const cutoff = historyCutoff();
  const visible = expenses.filter((e) => isPro || e.date >= cutoff);
  const hiddenCount = expenses.length - visible.length;

  const unsettled = visible.filter((e) => !e.settled);
  const settled   = visible.filter((e) => e.settled);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Expenses</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Scan receipt (Pro) */}
      <TouchableOpacity style={styles.scanBtn} onPress={handleScanReceipt} disabled={scanning} activeOpacity={0.85}>
        {scanning ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <>
            <Ionicons name="scan-outline" size={20} color={Colors.primary} />
            <Text style={styles.scanText}>Scan a receipt</Text>
            {!isPro && <View style={styles.scanPill}><Text style={styles.scanPillText}>PRO</Text></View>}
          </>
        )}
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {scanning && <Text style={styles.scanningHint}>📸 Reading your receipt…</Text>}
        {unsettled.length === 0 && <Text style={styles.empty}>No unsettled expenses 🎉</Text>}

        {unsettled.map((e) => <ExpenseRow key={e.id} expense={e} roommates={roommates} viewerCurrency={currentUser.preferredCurrency} rates={rates} onSettle={() => settleExpense(e.id)} />)}

        {settled.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Settled</Text>
            {settled.map((e) => <ExpenseRow key={e.id} expense={e} roommates={roommates} viewerCurrency={currentUser.preferredCurrency} rates={rates} settled />)}
          </>
        )}

        {hiddenCount > 0 && (
          <TouchableOpacity style={styles.historyLock} onPress={() => router.push('/app/paywall')} activeOpacity={0.85}>
            <Ionicons name="lock-closed" size={16} color={Colors.primary} />
            <Text style={styles.historyLockText}>
              {hiddenCount} older expense{hiddenCount !== 1 ? 's' : ''} hidden — unlock full history with Pro
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Add modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New expense</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Netflix" placeholderTextColor={Colors.textSub} />

            <Text style={styles.fieldLabel}>Amount</Text>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor={Colors.textSub} keyboardType="decimal-pad" />

            <Text style={styles.fieldLabel}>Currency</Text>
            {isPro ? (
              <>
                <View style={styles.chipRow}>
                  {CURRENCIES.map((c) => (
                    <TouchableOpacity key={c.code} onPress={() => setCurrency(c.code)}
                      style={[styles.chip, currency === c.code && styles.chipActive]}>
                      <Text style={[styles.chipText, currency === c.code && styles.chipTextActive]}>
                        {c.flag} {c.code}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {amount && currency !== baseCurrency ? (
                  <Text style={styles.convertHint}>
                    ≈ {formatMoney(convert(parseFloat(amount) || 0, currency, baseCurrency, rates), baseCurrency)} in house currency
                  </Text>
                ) : null}
              </>
            ) : (
              <View>
                <View style={[styles.chip, styles.chipActive, { alignSelf: 'flex-start' }]}>
                  <Text style={styles.chipTextActive}>
                    {currencyMeta(baseCurrency).flag} {baseCurrency}
                  </Text>
                </View>
                <TouchableOpacity style={styles.lockHint} onPress={() => router.push('/app/paywall')}>
                  <Ionicons name="lock-closed" size={13} color={Colors.primary} />
                  <Text style={styles.lockHintText}>Add expenses in other currencies with Roomiee Pro</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.fieldLabel}>Photo (optional)</Text>
            {photo ? (
              <View>
                <Image source={{ uri: photo }} style={styles.photoPreview} />
                <TouchableOpacity onPress={() => setPhoto(undefined)}>
                  <Text style={styles.removeLink}>Remove photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.photoPick} onPress={async () => {
                const uri = await pickPhoto({ title: 'Attach a photo' });
                if (uri) setPhoto(uri);
              }}>
                <Ionicons name="image-outline" size={20} color={Colors.primary} />
                <Text style={styles.photoPickText}>Attach a receipt or photo</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity key={c} onPress={() => setCategory(c)}
                  style={[styles.chip, category === c && styles.chipActive]}>
                  <Text style={[styles.chipText, category === c && styles.chipTextActive]}>
                    {CAT_EMOJI[c]} {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Split with</Text>
            {roommates.map((r) => (
              <TouchableOpacity key={r.id} style={styles.checkRow}
                onPress={() => setSplitWith((prev) =>
                  prev.includes(r.id) ? prev.filter((id) => id !== r.id) : [...prev, r.id]
                )}>
                <Avatar roommate={r} size={32} />
                <Text style={styles.checkName}>{r.name}</Text>
                <Ionicons
                  name={splitWith.includes(r.id) ? 'checkbox' : 'square-outline'}
                  size={22} color={splitWith.includes(r.id) ? Colors.primary : Colors.textSub}
                />
              </TouchableOpacity>
            ))}

            <Button label="Add expense" onPress={submit} style={{ marginTop: 24 }} disabled={!title || !amount || splitWith.length === 0} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function ExpenseRow({ expense: e, roommates, viewerCurrency, rates, onSettle, settled }: {
  expense: Expense; roommates: Roommate[];
  viewerCurrency: Currency; rates: Rates;
  onSettle?: () => void; settled?: boolean;
}) {
  const payer = roommates.find((r) => r.id === e.paidBy);
  // per-person share, shown in the viewer's currency
  const inViewer = convert(e.amount, e.currency, viewerCurrency, rates);
  const perPerson = inViewer / e.splitWith.length;
  const showConversion = e.currency !== viewerCurrency;
  return (
    <Card style={[styles.expenseCard, settled && { opacity: 0.5 }]}>
      <View style={styles.expenseTop}>
        <View style={styles.expenseLeft}>
          {e.photo ? (
            <Image source={{ uri: e.photo }} style={styles.thumb} />
          ) : (
            <View style={styles.catBubble}><Text style={styles.catEmoji}>{CAT_EMOJI[e.category]}</Text></View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.expenseTitle} numberOfLines={1}>{e.title}</Text>
            <Text style={styles.expenseSub}>{payer?.name} paid · {e.date}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.expenseAmount}>{formatMoney(e.amount, e.currency)}</Text>
          {showConversion && (
            <Text style={styles.expenseConv}>≈ {formatMoney(inViewer, viewerCurrency)}</Text>
          )}
        </View>
      </View>
      <View style={styles.expenseBottom}>
        <Text style={styles.perPerson}>{formatMoney(perPerson, viewerCurrency)} each · {e.splitWith.length} people</Text>
        {!settled && <TouchableOpacity onPress={onSettle} style={styles.settleBtn}><Text style={styles.settleText}>Settle</Text></TouchableOpacity>}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 20 },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginBottom: 20 },
  pageTitle:   { fontSize: 28, fontWeight: '800', color: Colors.text },
  addBtn:      { backgroundColor: Colors.primary, borderRadius: Radius.full, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sectionLabel:{ fontSize: 13, fontWeight: '600', color: Colors.textSub, marginBottom: 8 },
  empty:       { textAlign: 'center', color: Colors.textSub, marginTop: 40, fontSize: 16 },
  expenseCard: { marginBottom: 12 },
  expenseTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  expenseLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  catEmoji:    { fontSize: 22 },
  catBubble:   { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.mist, alignItems: 'center', justifyContent: 'center' },
  thumb:       { width: 46, height: 46, borderRadius: 14 },
  expenseTitle:{ fontSize: 15, fontWeight: '700', color: Colors.text },
  expenseSub:  { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  expenseAmount:{ fontSize: 20, fontWeight: '800', color: Colors.text },
  expenseConv: { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  convertHint: { fontSize: 12, color: Colors.primary, marginTop: 8, fontWeight: '600' },
  lockHint:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  lockHintText:{ fontSize: 12, color: Colors.primary, fontWeight: '600' },
  historyLock: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.mist, borderRadius: Radius.md, padding: 14, marginTop: 20 },
  historyLockText: { flex: 1, fontSize: 13, color: Colors.primary, fontWeight: '600' },
  scanBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed', borderRadius: Radius.md, paddingVertical: 14, marginBottom: 16 },
  scanText:    { fontSize: 15, fontWeight: '700', color: Colors.primary },
  scanPill:    { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  scanPillText:{ fontSize: 10, fontWeight: '800', color: '#fff' },
  scanningHint:{ textAlign: 'center', color: Colors.primary, fontWeight: '600', marginBottom: 12 },
  photoPreview:{ width: '100%', height: 180, borderRadius: Radius.lg },
  photoPick:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.soft, borderRadius: Radius.md, paddingVertical: 16, backgroundColor: Colors.card },
  photoPickText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  removeLink:  { color: Colors.danger, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  expenseBottom:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10 },
  perPerson:   { fontSize: 12, color: Colors.textSub },
  settleBtn:   { backgroundColor: Colors.success + '20', borderRadius: Radius.sm, paddingHorizontal: 14, paddingVertical: 6 },
  settleText:  { fontSize: 13, fontWeight: '700', color: Colors.success },
  // Modal
  modal:       { flex: 1, backgroundColor: Colors.bg, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle:  { fontSize: 22, fontWeight: '800', color: Colors.text },
  fieldLabel:  { fontSize: 13, fontWeight: '600', color: Colors.textSub, marginBottom: 6, marginTop: 16 },
  input:       { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.sm, padding: 14, fontSize: 15, color: Colors.text, backgroundColor: Colors.card },
  chipRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:        { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 6 },
  chipActive:  { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  chipText:    { fontSize: 13, color: Colors.textSub, fontWeight: '600' },
  chipTextActive:{ color: Colors.primary },
  checkRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  checkName:   { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500' },
});
