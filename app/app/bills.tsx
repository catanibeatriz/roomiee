import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Switch, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Alert } from '@/lib/alert';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore, Bill, GuestPeriod, Roommate, computeGuestImpact, daysBetween } from '@/store';
import { formatMoney, convert, Currency, Rates } from '@/lib/currency';
import { scheduleBillReminder, cancelReminder } from '@/lib/notifications';
import { Colors, Radius, Shadow } from '@/lib/theme';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Avatar from '@/components/Avatar';

export default function BillsScreen() {
  const {
    bills, roommates, baseCurrency, rates, isPro,
    addBill, removeBill, setBillReminder, guestPeriod, setGuestPeriod,
  } = useStore();

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('1');

  function submitBill() {
    if (!name.trim() || !amount) return;
    addBill({
      name: name.trim(), amount: parseFloat(amount), currency: baseCurrency,
      dueDay: Math.min(28, Math.max(1, parseInt(dueDay) || 1)),
      category: 'utilities', splitWith: roommates.map((r) => r.id), reminderEnabled: false,
    });
    setName(''); setAmount(''); setDueDay('1'); setShowAdd(false);
  }

  async function toggleReminder(bill: Bill, value: boolean) {
    if (value) {
      const id = await scheduleBillReminder(bill.name, bill.amount, bill.currency, bill.dueDay);
      if (!id) { Alert.alert('Notifications off', 'Enable notifications for Roomiee in Settings to get reminders.'); return; }
      setBillReminder(bill.id, true, id);
    } else {
      await cancelReminder(bill.notificationId);
      setBillReminder(bill.id, false, undefined);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Bills</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.backBtn}>
          <Ionicons name="add" size={26} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionSub}>Recurring bills with reminders before they're due.</Text>

      {bills.map((b) => {
        const perPerson = convert(b.amount, b.currency, baseCurrency, rates) / b.splitWith.length;
        return (
          <Card key={b.id} style={styles.billCard}>
            <View style={styles.billTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.billName}>{b.name}</Text>
                <Text style={styles.billSub}>Due the {b.dueDay}{ordinal(b.dueDay)} · {formatMoney(perPerson, baseCurrency)} each</Text>
              </View>
              <Text style={styles.billAmount}>{formatMoney(b.amount, b.currency)}</Text>
            </View>
            <View style={styles.billBottom}>
              <View style={styles.reminderLabel}>
                <Ionicons name="notifications-outline" size={16} color={Colors.textSub} />
                <Text style={styles.reminderText}>Remind me 2 days before</Text>
              </View>
              <Switch
                value={b.reminderEnabled}
                onValueChange={(v) => toggleReminder(b, v)}
                trackColor={{ true: Colors.primary, false: Colors.border }}
              />
            </View>
          </Card>
        );
      })}

      {/* ── Guest mode (Pro) ── */}
      <View style={styles.guestHeader}>
        <Text style={styles.sectionTitle}>Guest mode</Text>
        {!isPro && <View style={styles.proPill}><Text style={styles.proPillText}>PRO</Text></View>}
      </View>
      <Text style={styles.sectionSub}>
        Hosting a long-term guest? They share the bills fairly — the host covers a bit
        more, based on your utility history.
      </Text>

      {!isPro ? (
        <TouchableOpacity style={styles.lockedCard} onPress={() => router.push('/app/paywall')} activeOpacity={0.9}>
          <Ionicons name="lock-closed" size={18} color={Colors.primary} />
          <Text style={styles.lockedText}>Unlock fair guest-period billing with Roomiee Pro</Text>
        </TouchableOpacity>
      ) : (
        <GuestModeCard
          guestPeriod={guestPeriod}
          setGuestPeriod={setGuestPeriod}
          bills={bills}
          roommates={roommates}
          rates={rates}
          baseCurrency={baseCurrency}
        />
      )}

      {/* Add bill modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New bill</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}><Ionicons name="close" size={24} color={Colors.text} /></TouchableOpacity>
          </View>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Gas" placeholderTextColor={Colors.textSub} autoFocus />
          <Text style={styles.fieldLabel}>Amount ({baseCurrency})</Text>
          <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor={Colors.textSub} keyboardType="decimal-pad" />
          <Text style={styles.fieldLabel}>Due day of month</Text>
          <TextInput style={styles.input} value={dueDay} onChangeText={setDueDay} placeholder="1" placeholderTextColor={Colors.textSub} keyboardType="number-pad" />
          <Button label="Add bill" onPress={submitBill} style={{ marginTop: 20 }} disabled={!name.trim() || !amount} />
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

function GuestModeCard({ guestPeriod, setGuestPeriod, bills, roommates, rates, baseCurrency }: {
  guestPeriod: GuestPeriod | null;
  setGuestPeriod: (g: GuestPeriod | null) => void;
  bills: Bill[];
  roommates: Roommate[];
  rates: Rates;
  baseCurrency: Currency;
}) {
  const [hostId, setHostId] = useState(guestPeriod?.hostId ?? roommates[0]?.id ?? '');
  const [guestName, setGuestName] = useState(guestPeriod?.guestName ?? '');
  const [startDate, setStartDate] = useState(guestPeriod?.startDate ?? new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(guestPeriod?.endDate ?? '');

  if (guestPeriod) {
    const host = roommates.find((r) => r.id === guestPeriod.hostId);
    const impact = computeGuestImpact(bills, roommates, guestPeriod, rates, baseCurrency);
    return (
      <Card style={styles.activeGuest}>
        <View style={styles.activeTop}>
          {host && <Avatar roommate={host} size={40} />}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.activeName}>{host?.name} is hosting {guestPeriod.guestName}</Text>
            <Text style={styles.activeDates}>{guestPeriod.startDate} → {guestPeriod.endDate} · {impact.stayDays} days</Text>
          </View>
        </View>

        <View style={styles.impactBox}>
          <Text style={styles.impactLabel}>Extra the host pays this month</Text>
          <Text style={styles.impactAmount}>+{formatMoney(impact.hostSurcharge, baseCurrency)}</Text>
          <Text style={styles.impactCalc}>
            Based on {formatMoney(impact.monthlyUtilities, baseCurrency)}/mo utilities ÷ {roommates.length} ·
            {' '}{Math.round(impact.stayFraction * 100)}% of the month
          </Text>
        </View>

        <Button label="End guest period" variant="outline" onPress={() => setGuestPeriod(null)} style={{ marginTop: 12 }} />
      </Card>
    );
  }

  // Preview the impact as the form is filled
  const preview = guestName && endDate
    ? computeGuestImpact(bills, roommates, { hostId, guestName, startDate, endDate }, rates, baseCurrency)
    : null;

  return (
    <Card>
      <Text style={styles.fieldLabel}>Who's hosting?</Text>
      <View style={styles.hostRow}>
        {roommates.map((r) => (
          <TouchableOpacity key={r.id} onPress={() => setHostId(r.id)} style={[styles.hostChip, hostId === r.id && styles.hostChipActive]}>
            <Avatar roommate={r} size={22} />
            <Text style={[styles.hostName, hostId === r.id && { color: Colors.primary }]}>{r.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Guest name</Text>
      <TextInput style={styles.input} value={guestName} onChangeText={setGuestName} placeholder="e.g. Carlos" placeholderTextColor={Colors.textSub} />

      <View style={styles.dateRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>From</Text>
          <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textSub} />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>To</Text>
          <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textSub} />
        </View>
      </View>

      {preview && (
        <View style={styles.previewBox}>
          <Text style={styles.previewText}>
            {roommates.find((r) => r.id === hostId)?.name} would pay an extra{' '}
            <Text style={{ fontWeight: '800', color: Colors.primary }}>{formatMoney(preview.hostSurcharge, baseCurrency)}</Text>
            {' '}this month ({preview.stayDays} days).
          </Text>
        </View>
      )}

      <Button
        label="Start guest period"
        onPress={() => setGuestPeriod({ hostId, guestName: guestName.trim(), startDate, endDate })}
        style={{ marginTop: 16 }}
        disabled={!guestName.trim() || !endDate || daysBetween(startDate, endDate) <= 0}
      />
    </Card>
  );
}

function ordinal(n: number) {
  if (n >= 11 && n <= 13) return 'th';
  switch (n % 10) { case 1: return 'st'; case 2: return 'nd'; case 3: return 'rd'; default: return 'th'; }
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 20 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginBottom: 8 },
  backBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title:        { fontSize: 22, fontWeight: '800', color: Colors.text },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  sectionSub:   { fontSize: 13, color: Colors.textSub, marginBottom: 16, lineHeight: 18 },
  billCard:     { marginBottom: 12 },
  billTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billName:     { fontSize: 16, fontWeight: '700', color: Colors.text },
  billSub:      { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  billAmount:   { fontSize: 18, fontWeight: '800', color: Colors.text },
  billBottom:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12, marginTop: 12 },
  reminderLabel:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  reminderText: { fontSize: 13, color: Colors.textSub },
  guestHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 28, marginBottom: 4 },
  proPill:      { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  proPillText:  { fontSize: 10, fontWeight: '800', color: '#fff' },
  lockedCard:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.mist, borderRadius: Radius.md, padding: 16 },
  lockedText:   { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text },
  activeGuest:  {},
  activeTop:    { flexDirection: 'row', alignItems: 'center' },
  activeName:   { fontSize: 15, fontWeight: '700', color: Colors.text },
  activeDates:  { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  impactBox:    { backgroundColor: Colors.mist, borderRadius: Radius.md, padding: 16, alignItems: 'center', marginTop: 14 },
  impactLabel:  { fontSize: 12, color: Colors.textSub, fontWeight: '600' },
  impactAmount: { fontSize: 28, fontWeight: '800', color: Colors.primary, marginVertical: 2 },
  impactCalc:   { fontSize: 11, color: Colors.textSub, textAlign: 'center' },
  hostRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  hostChip:     { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 6 },
  hostChipActive:{ borderColor: Colors.primary, backgroundColor: Colors.primary + '12' },
  hostName:     { fontSize: 13, fontWeight: '600', color: Colors.textSub },
  dateRow:      { flexDirection: 'row' },
  previewBox:   { backgroundColor: Colors.mist, borderRadius: Radius.md, padding: 14, marginTop: 14 },
  previewText:  { fontSize: 13, color: Colors.text, lineHeight: 19 },
  fieldLabel:   { fontSize: 13, fontWeight: '600', color: Colors.textSub, marginBottom: 6, marginTop: 12 },
  input:        { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.sm, padding: 13, fontSize: 15, color: Colors.text, backgroundColor: Colors.bg },
  modal:        { flex: 1, backgroundColor: Colors.bg, padding: 24 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle:   { fontSize: 22, fontWeight: '800', color: Colors.text },
});
