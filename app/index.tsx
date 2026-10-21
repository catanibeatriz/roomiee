import { Redirect } from 'expo-router';
import { useStore } from '@/store';

export default function Index() {
  const isLoggedIn = useStore((s) => s.currentUser.isLoggedIn);
  return <Redirect href={isLoggedIn ? '/(tabs)' : '/(auth)/login'} />;
}
