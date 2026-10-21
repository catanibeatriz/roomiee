import { useState } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store';
import { CURRENCIES, Currency } from '@/lib/currency';
import { FREE_LIMITS } from '@/lib/pro';
import { pickPhoto } from '@/lib/photos';
import { Colors, Radius, Shadow } from '@/lib/theme';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Avatar from '@/components/Avatar';

export default function SettingsScreen() {
  const {
    currentUser, baseCurrency, setBaseCurrency, setPreferredCurrency, setPaymentHandles,
    ratesUpdatedAt, loadRates, isPro,
    houseName, setHouseName, houseCover, setHouseCover, setProfilePhoto,
  } = useStore();

  async function changeProfilePhoto() {
    const uri = await pickPhoto({ square: true, title: 'Profile photo' });
    if (uri) setProfilePhoto(currentUser.id, uri);
  }

  async function changeCover() {
    const uri = await pickPhoto({ title: 'House cover photo' });
    if (uri) setHouseCover(uri);
  }

  const [bizum, setBizum] = useState(currentUser.bizumPhone ?? '');
  const [paypal, setPaypal] = useState(currentUser.paypalMe ?? '');
  const [revolut, setRevolut] = useState(currentUser.revolutTag ?? '');
  const [saved, setSaved] = useState(false);

  const { roommates } = useStore();

  function inviteRoommate() {
    // Free houses are capped; Pro lifts the limit.
    if (!isPro && roommates.length >= FREE_LIMITS.roommates) {
      router.push('/paywall');
      return;
    }
    // Real invite links arrive with the backend; here we preview the flow.
    Alert.alert('Invite a roommate', 'Share your house invite code:\n\nROOMIEE-7F3A\n\n(Live invite links arrive with the backend.)');
  }

  function saveHandles() {
    setPaymentHandles(currentUser.id, {
      bizumPhone: bizum.trim() || undefined,
      paypalMe: paypal.trim() || undefined,
      revolutTag: revolut.trim() || undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const updated = ratesUpdatedAt
    ? new Date(ratesUpdatedAt).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
    : 'never';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Profile */}
      <View style={styles.profile}>
        <TouchableOpacity onPress={changeProfilePhoto} activeOpacity={0.85}>
          <Avatar roommate={currentUser} size={96} ring />
          <View style={styles.cameraBadge}><Ionicons name="camera" size={15} color="#fff" /></View>
        </TouchableOpacity>
        <Text style={styles.profileName}>{currentUser.name}</Text>
        <Text style={styles.profileEmail}>{currentUser.email}</Text>
        {currentUser.photo && (
          <TouchableOpacity onPress={() => setProfilePhoto(currentUser.id, undefined)}>
            <Text style={styles.removeLink}>Remove photo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* House */}
      <Text style={styles.sectionTitle}>Your house</Text>
      <Card style={{ marginBottom: 24 }}>
        <Text style={styles.payLabel}>🏡 House name</Text>
        <TextInput style={styles.input} value={houseName} onChangeText={setHouseName} placeholder="e.g. Casa Malasaña" placeholderTextColor={Colors.textSub} />
        <Text style={styles.payLabel}>🖼️ Cover photo</Text>
        <TouchableOpacity onPress={changeCover} activeOpacity={0.85}>
          {houseCover ? (
            <Image source={{ uri: houseCover }} style={styles.coverPreview} />
          ) : (
            <View style={[styles.coverPreview, styles.coverEmpty]}>
              <Ionicons name="image-outline" size={24} color={Colors.primary} />
              <Text style={styles.coverEmptyText}>Add a cover photo</Text>
            </View>
          )}
        </TouchableOpacity>
        {houseCover && (
          <TouchableOpacity onPress={() => setHouseCover(null)}>
            <Text style={styles.removeLink}>Remove cover</Text>
          </TouchableOpacity>
        )}
      </Card>

      {/* Roomiee Pro */}
      {isPro ? (
        <View style={styles.proActive}>
          <Ionicons name="sparkles" size={18} color={Colors.primary} />
          <Text style={styles.proActiveText}>Roomiee Pro is active for your house ✨</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.proCard} onPress={() => router.push('/paywall')} activeOpacity={0.9}>
          <View style={{ flex: 1 }}>
            <Text style={styles.proTitle}>Upgrade to Roomiee Pro</Text>
            <Text style={styles.proSub}>Analytics, receipt scanning, multi-currency & more</Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Insights link */}
      <TouchableOpacity style={[styles.linkRow, { marginBottom: 10 }]} onPress={() => router.push('/insights')}>
        <Ionicons name="bar-chart-outline" size={20} color={Colors.primary} />
        <Text style={styles.linkText}>Spending insights</Text>
        {!isPro && <View style={styles.proPill}><Text style={styles.proPillText}>PRO</Text></View>}
        <Ionicons name="chevron-forward" size={18} color={Colors.textSub} style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>

      {/* Invite roommate */}
      <TouchableOpacity style={styles.linkRow} onPress={inviteRoommate}>
        <Ionicons name="person-add-outline" size={20} color={Colors.primary} />
        <Text style={styles.linkText}>Invite a roommate</Text>
        <Text style={styles.linkCount}>{roommates.length}{!isPro ? `/${FREE_LIMITS.roommates}` : ''}</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textSub} />
      </TouchableOpacity>

      {/* House base currency */}
      <Text style={styles.sectionTitle}>House currency</Text>
      <Text style={styles.sectionSub}>All shared balances roll up to this currency.</Text>
      <Card style={{ marginBottom: 24 }}>
        <CurrencyGrid selected={baseCurrency} onSelect={setBaseCurrency} />
      </Card>

      {/* My preferred currency — Pro: see balances converted to your own currency */}
      <Text style={styles.sectionTitle}>Your currency</Text>
      <Text style={styles.sectionSub}>See every balance converted to your own currency.</Text>
      {isPro ? (
        <Card style={{ marginBottom: 24 }}>
          <CurrencyGrid
            selected={currentUser.preferredCurrency}
            onSelect={(c) => setPreferredCurrency(currentUser.id, c)}
          />
        </Card>
      ) : (
        <TouchableOpacity style={styles.lockedCard} onPress={() => router.push('/paywall')} activeOpacity={0.9}>
          <Ionicons name="lock-closed" size={18} color={Colors.primary} />
          <Text style={styles.lockedCardText}>Personal currency conversion is a Pro feature</Text>
          <View style={styles.proPill}><Text style={styles.proPillText}>PRO</Text></View>
        </TouchableOpacity>
      )}

      {/* Payment methods */}
      <Text style={styles.sectionTitle}>Your payment methods</Text>
      <Text style={styles.sectionSub}>How roommates pay you back. Only public handles — never bank or card details.</Text>
      <Card style={{ marginBottom: 24 }}>
        <Text style={styles.payLabel}>🇪🇸 Bizum phone</Text>
        <TextInput style={styles.input} value={bizum} onChangeText={setBizum} placeholder="+34 600 000 000" placeholderTextColor={Colors.textSub} keyboardType="phone-pad" />

        <Text style={styles.payLabel}>🅿️ PayPal.me username</Text>
        <TextInput style={styles.input} value={paypal} onChangeText={setPaypal} placeholder="yourname" placeholderTextColor={Colors.textSub} autoCapitalize="none" />

        <Text style={styles.payLabel}>💳 Revolut tag</Text>
        <TextInput style={styles.input} value={revolut} onChangeText={setRevolut} placeholder="yourname" placeholderTextColor={Colors.textSub} autoCapitalize="none" />

        <Button label={saved ? 'Saved ✓' : 'Save payment methods'} onPress={saveHandles} style={{ marginTop: 16 }} />
      </Card>

      {/* Exchange rates */}
      <Text style={styles.sectionTitle}>Exchange rates</Text>
      <Card>
        <View style={styles.rateRow}>
          <View>
            <Text style={styles.rateLabel}>Live ECB rates</Text>
            <Text style={styles.rateSub}>Updated {updated}</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={loadRates}>
            <Ionicons name="refresh" size={16} color={Colors.primary} />
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Text style={styles.footer}>Roomiee.app — because a happy home starts with teamwork 💙</Text>
    </ScrollView>
  );
}

function CurrencyGrid({ selected, onSelect }: { selected: Currency; onSelect: (c: Currency) => void }) {
  return (
    <View style={styles.grid}>
      {CURRENCIES.map((c) => {
        const active = selected === c.code;
        return (
          <TouchableOpacity
            key={c.code}
            style={[styles.curChip, active && styles.curChipActive]}
            onPress={() => onSelect(c.code)}
            activeOpacity={0.8}
          >
            <Text style={styles.curFlag}>{c.flag}</Text>
            <Text style={[styles.curCode, active && styles.curCodeActive]}>{c.code}</Text>
            <Text style={[styles.curSymbol, active && styles.curCodeActive]}>{c.symbol}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 20 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, marginBottom: 20 },
  backBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title:        { fontSize: 22, fontWeight: '800', color: Colors.text },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  sectionSub:   { fontSize: 13, color: Colors.textSub, marginBottom: 12 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  curChip:      { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 9 },
  curChipActive:{ borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  curFlag:      { fontSize: 16 },
  curCode:      { fontSize: 14, fontWeight: '700', color: Colors.textSub },
  curCodeActive:{ color: Colors.primary },
  curSymbol:    { fontSize: 13, color: Colors.textSub },
  proCard:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: 18, marginBottom: 16 },
  proTitle:     { fontSize: 16, fontWeight: '800', color: '#fff' },
  proSub:       { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 3 },
  proActive:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary + '15', borderRadius: Radius.md, padding: 14, marginBottom: 16 },
  proActiveText:{ fontSize: 14, fontWeight: '600', color: Colors.primary },
  linkRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.card, borderRadius: Radius.md, padding: 16, marginBottom: 24, ...Shadow.sm },
  linkText:     { fontSize: 15, fontWeight: '600', color: Colors.text },
  linkCount:    { fontSize: 14, fontWeight: '600', color: Colors.textSub, marginLeft: 'auto', marginRight: 8 },
  lockedCard:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.mist, borderRadius: Radius.md, padding: 16, marginBottom: 24 },
  lockedCardText:{ flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text },
  proPill:      { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  proPillText:  { fontSize: 10, fontWeight: '800', color: '#fff' },
  profile:      { alignItems: 'center', marginBottom: 24 },
  cameraBadge:  { position: 'absolute', right: 0, bottom: 2, width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: Colors.bg },
  profileName:  { fontSize: 22, fontWeight: '800', color: Colors.text, marginTop: 12 },
  profileEmail: { fontSize: 13, color: Colors.textSub, marginTop: 2 },
  removeLink:   { fontSize: 13, fontWeight: '700', color: Colors.danger, marginTop: 8, textAlign: 'center' },
  coverPreview: { width: '100%', height: 140, borderRadius: Radius.md },
  coverEmpty:   { backgroundColor: Colors.mist, alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.soft },
  coverEmptyText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  payLabel:     { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6, marginTop: 12 },
  input:        { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.sm, padding: 13, fontSize: 15, color: Colors.text, backgroundColor: Colors.bg },
  rateRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rateLabel:    { fontSize: 15, fontWeight: '600', color: Colors.text },
  rateSub:      { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  refreshBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary + '15', borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 8 },
  refreshText:  { fontSize: 13, fontWeight: '700', color: Colors.primary },
  footer:       { fontSize: 12, color: Colors.textSub, textAlign: 'center', marginTop: 32 },
});
