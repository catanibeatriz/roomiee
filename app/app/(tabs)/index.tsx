import { ScrollView, View, Text, StyleSheet, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore, computeBalances } from '@/store';
import { convert, formatMoney } from '@/lib/currency';
import { pickPhoto } from '@/lib/photos';
import { Colors, Radius, Shadow, Pastel, PastelName } from '@/lib/theme';
import Avatar from '@/components/Avatar';
import Card from '@/components/Card';
import Logo from '@/components/Logo';
import QuickExpense from '@/components/QuickExpense';
import InviteCard from '@/components/InviteCard';

const QUICK: { label: string; emoji: string; route: string; tone: PastelName }[] = [
  { label: 'Expense',   emoji: '💸', route: '/app/expenses', tone: 'sky' },
  { label: 'Bills',     emoji: '🧾', route: '/app/bills',           tone: 'butter' },
  { label: 'Settle up', emoji: '🤝', route: '/app/settle',          tone: 'mint' },
  { label: 'Shopping',  emoji: '🛒', route: '/app/shopping', tone: 'peach' },
  { label: 'Food',      emoji: '🍜', route: '/app/food',     tone: 'rose' },
  { label: 'Chores',    emoji: '🧽', route: '/app/chores',   tone: 'lavender' },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning ☀️';
  if (h < 19) return 'Good afternoon 🌤️';
  return 'Good evening 🌙';
}

export default function HomeScreen() {
  const {
    currentUser, roommates, expenses, chores, shoppingLists, baseCurrency, rates,
    houseName, houseCover, setHouseCover, album,
  } = useStore();
  const balances = computeBalances(expenses, roommates, baseCurrency, rates);

  // Show balances in the current user's preferred currency
  const myCur = currentUser.preferredCurrency;
  const myBalance = convert(balances[currentUser.id] ?? 0, baseCurrency, myCur, rates);
  const owed = myBalance >= 0;

  const myChores = chores.filter((c) => !c.completed && c.assignedTo === currentUser.id);
  const pendingItems = shoppingLists.flatMap((l) => l.items.filter((i) => !i.checked)).length;

  async function changeCover() {
    const uri = await pickPhoto({ title: 'House cover photo' });
    if (uri) setHouseCover(uri);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.name}>Hi, {currentUser.name}!</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/app/settings')}>
            <Ionicons name="settings-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/app/settings')}>
            <Avatar roommate={currentUser} size={44} ring />
          </TouchableOpacity>
        </View>
      </View>

      {/* Core feature: add an expense */}
      <QuickExpense />

      {roommates.length <= 1 && <InviteCard />}

      {/* House card with cover photo */}
      <View style={styles.houseCard}>
        {houseCover ? (
          <ImageBackground source={{ uri: houseCover }} style={styles.cover} imageStyle={styles.coverImg}>
            <View style={styles.coverShade} />
          </ImageBackground>
        ) : (
          <View style={[styles.cover, styles.coverEmpty]}>
            <Logo size={56} variant="mark" />
            <Text style={styles.coverHint}>Add a photo of your home</Text>
          </View>
        )}
        <TouchableOpacity style={styles.coverBtn} onPress={changeCover}>
          <Ionicons name="camera" size={16} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.houseInfo}>
          <View>
            <Text style={styles.houseName}>{houseName} 🏡</Text>
            <Text style={styles.houseSub}>{roommates.length} roommates</Text>
          </View>
          <View style={styles.stack}>
            {roommates.slice(0, 4).map((r, i) => (
              <View key={r.id} style={{ marginLeft: i === 0 ? 0 : -10 }}>
                <Avatar roommate={r} size={32} ring />
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Balance */}
      <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/app/settle')}>
        <View style={[styles.balance, { backgroundColor: owed ? Pastel.mint.bg : Pastel.rose.bg }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.balanceLabel, { color: owed ? Pastel.mint.ink : Pastel.rose.ink }]}>
              {owed ? 'You are owed' : 'You owe'}
            </Text>
            <Text style={styles.balanceAmount}>{formatMoney(Math.abs(myBalance), myCur)}</Text>
            <Text style={styles.balanceSub}>Tap to settle up →</Text>
          </View>
          <Text style={styles.balanceEmoji}>{owed ? '🥳' : '🫶'}</Text>
        </View>
      </TouchableOpacity>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Quick actions</Text>
      <View style={styles.quickGrid}>
        {QUICK.map((q) => (
          <TouchableOpacity key={q.label} style={styles.quickTile} onPress={() => router.push(q.route as any)} activeOpacity={0.8}>
            <View style={[styles.quickIcon, { backgroundColor: Pastel[q.tone].bg }]}>
              <Text style={styles.quickEmoji}>{q.emoji}</Text>
            </View>
            <Text style={styles.quickLabel}>{q.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Album preview */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>House album</Text>
        <TouchableOpacity onPress={() => router.push('/app/notes')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.albumRow}>
        <TouchableOpacity style={styles.albumAdd} onPress={() => router.push('/app/notes')}>
          <Ionicons name="add" size={26} color={Colors.primary} />
          <Text style={styles.albumAddText}>Add photo</Text>
        </TouchableOpacity>
        {album.slice(0, 8).map((p) => (
          <Image key={p.id} source={{ uri: p.uri }} style={styles.albumThumb} />
        ))}
      </ScrollView>

      {/* Nudges */}
      <Text style={styles.sectionTitle}>Today</Text>
      <View style={styles.nudgeRow}>
        {myChores.length > 0 && (
          <TouchableOpacity style={[styles.nudge, { backgroundColor: Pastel.lavender.bg }]} onPress={() => router.push('/app/chores')}>
            <Text style={styles.nudgeEmoji}>🧽</Text>
            <Text style={styles.nudgeText}>{myChores.length} chore{myChores.length !== 1 ? 's' : ''} for you</Text>
            <Ionicons name="chevron-forward" size={16} color={Pastel.lavender.ink} />
          </TouchableOpacity>
        )}
        {pendingItems > 0 && (
          <TouchableOpacity style={[styles.nudge, { backgroundColor: Pastel.peach.bg }]} onPress={() => router.push('/app/shopping')}>
            <Text style={styles.nudgeEmoji}>🛒</Text>
            <Text style={styles.nudgeText}>{pendingItems} item{pendingItems !== 1 ? 's' : ''} to buy</Text>
            <Ionicons name="chevron-forward" size={16} color={Pastel.peach.ink} />
          </TouchableOpacity>
        )}
        {myChores.length === 0 && pendingItems === 0 && (
          <View style={[styles.nudge, { backgroundColor: Pastel.mint.bg }]}>
            <Text style={styles.nudgeEmoji}>🌿</Text>
            <Text style={styles.nudgeText}>All caught up — enjoy your day!</Text>
          </View>
        )}
      </View>

      {/* Roommate balances */}
      <Text style={styles.sectionTitle}>Roommates</Text>
      <Card style={{ paddingVertical: 6 }}>
        {roommates.map((r, i) => {
          // Each roommate's balance shown in MY currency, for easy comparison
          const bal = convert(balances[r.id] ?? 0, baseCurrency, myCur, rates);
          return (
            <View key={r.id} style={[styles.roommateRow, i < roommates.length - 1 && styles.rowBorder]}>
              <View style={styles.roommateLeft}>
                <Avatar roommate={r} size={42} />
                <Text style={styles.roommateName}>{r.name}{r.id === currentUser.id ? ' (you)' : ''}</Text>
              </View>
              <View style={[styles.balPill, { backgroundColor: bal >= 0 ? Pastel.mint.bg : Pastel.rose.bg }]}>
                <Text style={[styles.balPillText, { color: bal >= 0 ? Pastel.mint.ink : Pastel.rose.ink }]}>
                  {bal >= 0 ? '+' : '-'}{formatMoney(Math.abs(bal), myCur)}
                </Text>
              </View>
            </View>
          );
        })}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 20 },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginBottom: 18 },
  headerRight:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn:       { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  greeting:      { fontSize: 14, color: Colors.textSub, fontWeight: '600' },
  name:          { fontSize: 26, fontWeight: '800', color: Colors.text, marginTop: 2, letterSpacing: -0.5 },

  houseCard:     { backgroundColor: Colors.card, borderRadius: Radius.xl, marginBottom: 16, overflow: 'hidden', ...Shadow.md },
  cover:         { height: 150, justifyContent: 'flex-end' },
  coverImg:      { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl },
  coverShade:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(27,42,74,0.08)' },
  coverEmpty:    { backgroundColor: Colors.mist, alignItems: 'center', justifyContent: 'center', gap: 8 },
  coverHint:     { fontSize: 13, fontWeight: '600', color: Colors.primary },
  coverBtn:      { position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  houseInfo:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  houseName:     { fontSize: 18, fontWeight: '800', color: Colors.text },
  houseSub:      { fontSize: 12, color: Colors.textSub, marginTop: 2, fontWeight: '600' },
  stack:         { flexDirection: 'row' },

  balance:       { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.xl, padding: 20, marginBottom: 24 },
  balanceLabel:  { fontSize: 13, fontWeight: '700' },
  balanceAmount: { fontSize: 34, fontWeight: '800', color: Colors.text, marginVertical: 2, letterSpacing: -0.5 },
  balanceSub:    { fontSize: 12, color: Colors.textSub, fontWeight: '600' },
  balanceEmoji:  { fontSize: 44 },

  sectionRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sectionTitle:  { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  seeAll:        { fontSize: 13, fontWeight: '700', color: Colors.primary },

  quickGrid:     { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, marginBottom: 24 },
  quickTile:     { width: '31%', backgroundColor: Colors.card, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  quickIcon:     { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickEmoji:    { fontSize: 24 },
  quickLabel:    { fontSize: 12.5, fontWeight: '700', color: Colors.text },

  albumRow:      { gap: 10, paddingRight: 20, marginBottom: 24 },
  albumAdd:      { width: 96, height: 96, borderRadius: Radius.lg, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.soft, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  albumAddText:  { fontSize: 11, fontWeight: '700', color: Colors.primary, marginTop: 2 },
  albumThumb:    { width: 96, height: 96, borderRadius: Radius.lg },

  nudgeRow:      { gap: 10, marginBottom: 24 },
  nudge:         { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: Radius.lg, padding: 14 },
  nudgeEmoji:    { fontSize: 22 },
  nudgeText:     { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.text },

  roommateRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  rowBorder:     { borderBottomWidth: 1, borderBottomColor: Colors.border },
  roommateLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roommateName:  { fontSize: 15, fontWeight: '700', color: Colors.text },
  balPill:       { borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  balPillText:   { fontSize: 13, fontWeight: '800' },
});
