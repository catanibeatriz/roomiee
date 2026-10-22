import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Redirect, Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store';
import { signOut } from '@/lib/auth';
import { Colors, Radius } from '@/lib/theme';
import Logo from '@/components/Logo';

// Everything under /app is for logged-in users only.
export default function AppLayout() {
  const authReady = useStore((s) => s.authReady);
  const userId = useStore((s) => s.userId);
  const loaded = useStore((s) => s.loaded);
  const houseName = useStore((s) => s.houseName);
  const insets = useSafeAreaInsets();

  if (authReady && !userId) return <Redirect href="/login" />;

  async function logout() {
    await signOut();
    router.replace('/');
  }

  return (
    <View style={styles.page}>
      <View style={styles.column}>
        <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
          <View style={styles.brand}>
            <Logo size={26} variant="mark" />
            <Text style={styles.house} numberOfLines={1}>{houseName}</Text>
          </View>
          <TouchableOpacity testID="logout" style={styles.logout} onPress={logout} accessibilityRole="button">
            <Ionicons name="log-out-outline" size={16} color={Colors.primary} />
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </View>

        {!authReady || !loaded ? (
          <View style={styles.loading}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.loadingText}>Opening your house…</Text>
          </View>
        ) : (
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page:        { flex: 1, backgroundColor: Colors.bg, alignItems: 'center' },
  // On a laptop the app stays phone-width and centred instead of stretching.
  column:      { flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 560 : undefined },
  bar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 8, backgroundColor: Colors.bg },
  brand:       { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  house:       { fontSize: 14, fontWeight: '700', color: Colors.textSub, flexShrink: 1 },
  logout:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.mist, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 7 },
  logoutText:  { fontSize: 13, fontWeight: '700', color: Colors.primary },
  loading:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '600', color: Colors.textSub },
});
