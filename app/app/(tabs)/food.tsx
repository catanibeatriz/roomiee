import { useState } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore, FoodOrder, Roommate, computeFoodOrderSplit } from '@/store';
import { formatMoney } from '@/lib/currency';
import { Colors, Radius } from '@/lib/theme';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Avatar from '@/components/Avatar';

const PLATFORMS: FoodOrder['platform'][] = ['UberEats', 'DoorDash', 'Other'];

export default function FoodScreen() {
  const { foodOrders, roommates, currentUser, addFoodOrder, settleFoodOrder, baseCurrency } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [platform, setPlatform] = useState<FoodOrder['platform']>('UberEats');
  const [restaurant, setRestaurant] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [tip, setTip] = useState('');
  const [items, setItems] = useState<{ name: string; price: string; orderedBy: string }[]>([
    { name: '', price: '', orderedBy: currentUser.id },
  ]);

  function addItem() {
    setItems((prev) => [...prev, { name: '', price: '', orderedBy: currentUser.id }]);
  }

  function updateItem(idx: number, field: 'name' | 'price' | 'orderedBy', value: string) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  function submit() {
    if (!restaurant || items.some((i) => !i.name || !i.price)) return;
    addFoodOrder({
      platform,
      restaurant,
      items: items.map((i) => ({ id: '', name: i.name, price: parseFloat(i.price), orderedBy: i.orderedBy })),
      deliveryFee: parseFloat(deliveryFee) || 0,
      tip: parseFloat(tip) || 0,
      currency: baseCurrency,
      date: new Date().toISOString().slice(0, 10),
      settled: false,
    });
    setRestaurant(''); setDeliveryFee(''); setTip('');
    setItems([{ name: '', price: '', orderedBy: currentUser.id }]);
    setShowAdd(false);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Food Orders</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {foodOrders.length === 0 && <Text style={styles.empty}>No food orders yet 🍔</Text>}
        {foodOrders.map((order) => (
          <FoodOrderCard key={order.id} order={order} roommates={roommates}
            onSettle={() => settleFoodOrder(order.id)} />
        ))}
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New food order</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}><Ionicons name="close" size={24} color={Colors.text} /></TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Platform</Text>
            <View style={styles.chipRow}>
              {PLATFORMS.map((p) => (
                <TouchableOpacity key={p} onPress={() => setPlatform(p)} style={[styles.chip, platform === p && styles.chipActive]}>
                  <Text style={[styles.chipText, platform === p && styles.chipTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Restaurant</Text>
            <TextInput style={styles.input} value={restaurant} onChangeText={setRestaurant} placeholder="e.g. Chipotle" placeholderTextColor={Colors.textSub} />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Delivery fee</Text>
                <TextInput style={styles.input} value={deliveryFee} onChangeText={setDeliveryFee} placeholder="0.00" placeholderTextColor={Colors.textSub} keyboardType="decimal-pad" />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Tip</Text>
                <TextInput style={styles.input} value={tip} onChangeText={setTip} placeholder="0.00" placeholderTextColor={Colors.textSub} keyboardType="decimal-pad" />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Items</Text>
            {items.map((item, idx) => (
              <View key={idx} style={styles.itemBlock}>
                <View style={styles.row}>
                  <TextInput style={[styles.input, { flex: 2 }]} value={item.name} onChangeText={(v) => updateItem(idx, 'name', v)} placeholder="Item name" placeholderTextColor={Colors.textSub} />
                  <View style={{ width: 8 }} />
                  <TextInput style={[styles.input, { flex: 1 }]} value={item.price} onChangeText={(v) => updateItem(idx, 'price', v)} placeholder="$0" placeholderTextColor={Colors.textSub} keyboardType="decimal-pad" />
                </View>
                <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Ordered by</Text>
                <View style={styles.chipRow}>
                  {roommates.map((r) => (
                    <TouchableOpacity key={r.id} onPress={() => updateItem(idx, 'orderedBy', r.id)}
                      style={[styles.chip, item.orderedBy === r.id && styles.chipActive]}>
                      <Text style={[styles.chipText, item.orderedBy === r.id && styles.chipTextActive]}>{r.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.addItemRow} onPress={addItem}>
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.addItemText}>Add another item</Text>
            </TouchableOpacity>

            <Button label="Log order" onPress={submit} style={{ marginTop: 24 }}
              disabled={!restaurant || items.some((i) => !i.name || !i.price)} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function FoodOrderCard({ order, roommates, onSettle }: {
  order: FoodOrder;
  roommates: Roommate[];
  onSettle: () => void;
}) {
  const splits = computeFoodOrderSplit(order);
  const total = order.items.reduce((s, i) => s + i.price, 0) + order.deliveryFee + order.tip;

  return (
    <Card style={[styles.orderCard, order.settled && { opacity: 0.5 }]}>
      <View style={styles.orderTop}>
        <View>
          <Text style={styles.orderRestaurant}>{order.restaurant}</Text>
          <Text style={styles.orderSub}>{order.platform} · {order.date}</Text>
        </View>
        <Text style={styles.orderTotal}>{formatMoney(total, order.currency)}</Text>
      </View>

      {order.items.map((item) => {
        const person = roommates.find((r) => r.id === item.orderedBy);
        return (
          <View key={item.id} style={styles.orderItem}>
            <Text style={styles.orderItemName}>{item.name}</Text>
            <Text style={styles.orderItemName}>{person?.name ?? '?'}</Text>
            <Text style={styles.orderItemPrice}>{formatMoney(item.price, order.currency)}</Text>
          </View>
        );
      })}

      <View style={[styles.orderItem, { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8, marginTop: 4 }]}>
        <Text style={styles.orderSub}>Delivery + tip</Text>
        <Text style={styles.orderSub} />
        <Text style={styles.orderSub}>{formatMoney(order.deliveryFee + order.tip, order.currency)}</Text>
      </View>

      <View style={styles.splitsRow}>
        {Object.entries(splits).map(([uid, amt]) => {
          const r = roommates.find((r) => r.id === uid);
          if (!r) return null;
          return (
            <View key={uid} style={styles.splitChip}>
              <Avatar roommate={r} size={24} />
              <Text style={styles.splitAmt}>{formatMoney(amt, order.currency)}</Text>
            </View>
          );
        })}
      </View>

      {!order.settled && (
        <TouchableOpacity style={styles.settleBtn} onPress={onSettle}>
          <Text style={styles.settleText}>Mark as settled</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 20 },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginBottom: 20 },
  pageTitle:   { fontSize: 28, fontWeight: '800', color: Colors.text },
  addBtn:      { backgroundColor: Colors.primary, borderRadius: Radius.full, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  empty:       { textAlign: 'center', color: Colors.textSub, marginTop: 40, fontSize: 16 },
  orderCard:   { marginBottom: 14 },
  orderTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderRestaurant: { fontSize: 17, fontWeight: '700', color: Colors.text },
  orderSub:    { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  orderTotal:  { fontSize: 20, fontWeight: '800', color: Colors.text },
  orderItem:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  orderItemName: { fontSize: 13, color: Colors.text, flex: 1 },
  orderItemPrice: { fontSize: 13, fontWeight: '600', color: Colors.text },
  splitsRow:   { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  splitChip:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.bg, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  splitAmt:    { fontSize: 13, fontWeight: '700', color: Colors.text },
  settleBtn:   { marginTop: 12, backgroundColor: Colors.success + '20', borderRadius: Radius.sm, padding: 12, alignItems: 'center' },
  settleText:  { fontSize: 14, fontWeight: '700', color: Colors.success },
  // Modal
  modal:       { flex: 1, backgroundColor: Colors.bg, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle:  { fontSize: 22, fontWeight: '800', color: Colors.text },
  fieldLabel:  { fontSize: 13, fontWeight: '600', color: Colors.textSub, marginBottom: 6, marginTop: 14 },
  input:       { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.sm, padding: 14, fontSize: 15, color: Colors.text, backgroundColor: Colors.card },
  row:         { flexDirection: 'row' },
  chipRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:        { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 6 },
  chipActive:  { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  chipText:    { fontSize: 13, color: Colors.textSub, fontWeight: '600' },
  chipTextActive: { color: Colors.primary },
  itemBlock:   { backgroundColor: Colors.card, borderRadius: Radius.md, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  addItemRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  addItemText: { color: Colors.primary, fontWeight: '600', fontSize: 15 },
});
