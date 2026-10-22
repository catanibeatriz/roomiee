import { ColorValue, View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow } from '@/lib/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// Active tab sits inside a soft blue bubble.
function icon(name: IconName, focusedName: IconName) {
  return ({ color, focused }: { color: ColorValue; focused: boolean }) => (
    <View style={[styles.bubble, focused && styles.bubbleActive]}>
      <Ionicons name={focused ? focusedName : name} size={22} color={color as string} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSub,
        tabBarStyle: styles.bar,
        tabBarItemStyle: { paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '700', marginTop: 2 },
      }}
    >
      <Tabs.Screen name="index"    options={{ title: 'Home',     tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen name="expenses" options={{ title: 'Expenses', tabBarIcon: icon('wallet-outline', 'wallet') }} />
      <Tabs.Screen name="shopping" options={{ title: 'Shopping', tabBarIcon: icon('basket-outline', 'basket') }} />
      <Tabs.Screen name="food"     options={{ title: 'Food',     tabBarIcon: icon('fast-food-outline', 'fast-food') }} />
      <Tabs.Screen name="chores"   options={{ title: 'Chores',   tabBarIcon: icon('sparkles-outline', 'sparkles') }} />
      <Tabs.Screen name="notes"    options={{ title: 'Board',    tabBarIcon: icon('images-outline', 'images') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.card,
    borderTopWidth: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: 88,
    paddingBottom: 22,
    ...Shadow.md,
  },
  bubble:       { width: 44, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  bubbleActive: { backgroundColor: Colors.mist },
});
