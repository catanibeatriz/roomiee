import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '@/lib/theme';
import { useStore } from '@/store';
import { setupNotifications } from '@/lib/notifications';

export default function RootLayout() {
  const loadRates = useStore((s) => s.loadRates);

  // Fetch live exchange rates + set up local notifications once on launch
  useEffect(() => {
    loadRates();
    setupNotifications();
  }, [loadRates]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }} />
    </GestureHandlerRootView>
  );
}
