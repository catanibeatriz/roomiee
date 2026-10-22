import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store';
import { PRO_FEATURES, PLANS, Plan, perPersonHint } from '@/lib/pro';
import { Colors, Radius, Shadow } from '@/lib/theme';
import Logo from '@/components/Logo';
import Button from '@/components/Button';

export default function PaywallScreen() {
  const { roommates, setPro } = useStore();
  const [plan, setPlan] = useState<Plan>('yearly');

  function subscribe() {
    // In production: trigger RevenueCat purchase, then set entitlement on success.
    setPro(true);
    router.back();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <TouchableOpacity onPress={() => router.back()} style={styles.close}>
        <Ionicons name="close" size={26} color={Colors.textSub} />
      </TouchableOpacity>

      <View style={styles.hero}>
        <Logo size={64} variant="icon" />
        <Text style={styles.title}>Roomiee <Text style={{ color: Colors.primary }}>Pro</Text></Text>
        <Text style={styles.sub}>Everything your house needs to run smoothly.</Text>
      </View>

      {/* Features */}
      <View style={styles.features}>
        {PRO_FEATURES.map((f) => (
          <View key={f.title} style={styles.featureRow}>
            <Text style={styles.featureEmoji}>{f.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          </View>
        ))}
      </View>

      {/* Plans */}
      <View style={styles.plans}>
        {PLANS.map((p) => {
          const active = plan === p.id;
          return (
            <TouchableOpacity key={p.id} style={[styles.plan, active && styles.planActive]} onPress={() => setPlan(p.id)} activeOpacity={0.85}>
              {p.badge && <View style={styles.planBadge}><Text style={styles.planBadgeText}>{p.badge}</Text></View>}
              <View style={styles.planLeft}>
                <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={22} color={active ? Colors.primary : Colors.textSub} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.planLabel}>{p.label}</Text>
                  <Text style={styles.planSub}>{p.sub}</Text>
                </View>
              </View>
              <Text style={styles.planPrice}>{p.price}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.perPerson}>{perPersonHint(plan, roommates.length)} — split across your house</Text>

      <Button label="Start 7-day free trial" onPress={subscribe} style={{ marginTop: 16 }} />
      <Text style={styles.fine}>
        One subscription covers your whole house. Cancel anytime. Billed through the App Store / Google Play.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 20 },
  close:        { alignSelf: 'flex-end', marginTop: 4, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  hero:         { alignItems: 'center', marginBottom: 24 },
  title:        { fontSize: 30, fontWeight: '800', color: Colors.text, marginTop: 12 },
  sub:          { fontSize: 14, color: Colors.textSub, marginTop: 4, textAlign: 'center' },
  features:     { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 16, ...Shadow.sm, marginBottom: 24 },
  featureRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  featureEmoji: { fontSize: 24 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  featureDesc:  { fontSize: 12, color: Colors.textSub, marginTop: 1 },
  plans:        { gap: 10 },
  plan:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: 16, backgroundColor: Colors.card },
  planActive:   { borderColor: Colors.primary, backgroundColor: Colors.primary + '0D' },
  planLeft:     { flexDirection: 'row', alignItems: 'center' },
  planLabel:    { fontSize: 15, fontWeight: '700', color: Colors.text },
  planSub:      { fontSize: 12, color: Colors.textSub, marginTop: 1 },
  planPrice:    { fontSize: 18, fontWeight: '800', color: Colors.text },
  planBadge:    { position: 'absolute', top: -9, right: 14, backgroundColor: Colors.success, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  planBadgeText:{ fontSize: 10, fontWeight: '800', color: '#fff' },
  perPerson:    { fontSize: 13, color: Colors.primary, fontWeight: '600', textAlign: 'center', marginTop: 14 },
  fine:         { fontSize: 11, color: Colors.textSub, textAlign: 'center', marginTop: 12, lineHeight: 16 },
});
