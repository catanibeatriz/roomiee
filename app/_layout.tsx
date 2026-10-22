import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '@/lib/theme';
import { useStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { setupNotifications } from '@/lib/notifications';

export default function RootLayout() {
  const loadRates = useStore((s) => s.loadRates);
  const setAuth = useStore((s) => s.setAuth);

  useEffect(() => {
    loadRates();
    if (Platform.OS !== 'web') setupNotifications();

    if (!supabase) { setAuth(null); return; }

    // Restore a saved session, then follow every login / logout.
    supabase.auth.getSession().then(({ data }) => setAuth(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth(session?.user.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadRates, setAuth]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }} />
    </GestureHandlerRootView>
  );
}
