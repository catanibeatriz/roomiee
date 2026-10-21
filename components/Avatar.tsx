import { View, Text, Image, StyleSheet } from 'react-native';
import { Roommate } from '@/store';
import { Colors } from '@/lib/theme';

type Props = { roommate: Roommate; size?: number; ring?: boolean };

export default function Avatar({ roommate, size = 36, ring = false }: Props) {
  const circle = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View style={[circle, styles.wrap, ring && styles.ring, { backgroundColor: roommate.color }]}>
      {roommate.photo ? (
        <Image source={{ uri: roommate.photo }} style={circle} />
      ) : (
        <Text style={[styles.text, { fontSize: size * 0.42 }]}>{roommate.avatar}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ring: { borderWidth: 2.5, borderColor: Colors.white },
  text: { color: '#fff', fontWeight: '800' },
});
