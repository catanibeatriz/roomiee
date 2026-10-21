import { TouchableOpacity, Text, StyleSheet, ViewStyle, StyleProp, ActivityIndicator } from 'react-native';
import { Colors, Radius, Shadow } from '@/lib/theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

export default function Button({ label, onPress, variant = 'primary', loading, style, disabled }: Props) {
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const isDanger = variant === 'danger';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btn,
        isOutline && styles.outline,
        isGhost && styles.ghost,
        isDanger && styles.danger,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      activeOpacity={0.75}
    >
      {loading
        ? <ActivityIndicator color={isOutline || isGhost ? Colors.primary : '#fff'} />
        : <Text style={[styles.label, (isOutline || isGhost) && styles.labelAlt, isDanger && styles.labelDanger]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn:        { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 15, paddingHorizontal: 24, alignItems: 'center', ...Shadow.sm, shadowColor: Colors.primary, shadowOpacity: 0.25 },
  outline:    { backgroundColor: Colors.mist, borderWidth: 0, shadowOpacity: 0 },
  ghost:      { backgroundColor: 'transparent', shadowOpacity: 0 },
  danger:     { backgroundColor: Colors.danger },
  disabled:   { opacity: 0.5 },
  label:      { color: '#fff', fontWeight: '700', fontSize: 15 },
  labelAlt:   { color: Colors.primary },
  labelDanger:{ color: '#fff' },
});
