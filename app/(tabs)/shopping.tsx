import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput,
  Modal, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore, ShoppingList } from '@/store';
import { FREE_LIMITS } from '@/lib/pro';
import { Colors, Radius, Shadow } from '@/lib/theme';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function ShoppingScreen() {
  const { shoppingLists, currentUser, addShoppingList, addShoppingItem, toggleShoppingItem, deleteShoppingItem, isPro } = useStore();
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(shoppingLists[0] ?? null);
  const [showNewList, setShowNewList] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1x');

  // keep selectedList in sync after state changes
  const liveList = shoppingLists.find((l) => l.id === selectedList?.id) ?? null;

  // Free tier is capped at one shopping list
  const atListLimit = !isPro && shoppingLists.length >= FREE_LIMITS.shoppingLists;

  function handleNewList() {
    if (atListLimit) { router.push('/paywall'); return; }
    setShowNewList(true);
  }

  function createList() {
    if (!newListName.trim()) return;
    addShoppingList(newListName.trim());
    setNewListName('');
    setShowNewList(false);
    setSelectedList(shoppingLists[0]);
  }

  function createItem() {
    if (!liveList || !newItemName.trim()) return;
    addShoppingItem(liveList.id, { name: newItemName.trim(), quantity: newItemQty.trim(), addedBy: currentUser.id, checked: false });
    setNewItemName(''); setNewItemQty('1x');
    setShowAddItem(false);
  }

  const unchecked = liveList?.items.filter((i) => !i.checked) ?? [];
  const checked   = liveList?.items.filter((i) =>  i.checked) ?? [];

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Shopping</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleNewList}>
          <Ionicons name={atListLimit ? 'lock-closed' : 'add'} size={atListLimit ? 18 : 24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* List tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabs}>
        {shoppingLists.map((l) => (
          <TouchableOpacity key={l.id} onPress={() => setSelectedList(l)}
            style={[styles.tab, liveList?.id === l.id && styles.tabActive]}>
            <Text style={[styles.tabText, liveList?.id === l.id && styles.tabTextActive]}>{l.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {!liveList ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyText}>No lists yet. Create one!</Text>
        </View>
      ) : (
        <FlatList
          data={[...unchecked, ...checked]}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListHeaderComponent={
            <TouchableOpacity style={styles.addItemBtn} onPress={() => setShowAddItem(true)}>
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.addItemText}>Add item</Text>
            </TouchableOpacity>
          }
          ListEmptyComponent={<Text style={styles.emptyText}>List is empty</Text>}
          renderItem={({ item }) => (
            <View style={[styles.itemRow, item.checked && styles.itemChecked]}>
              <TouchableOpacity onPress={() => toggleShoppingItem(liveList.id, item.id)} style={styles.itemCheck}>
                <Ionicons
                  name={item.checked ? 'checkmark-circle' : 'ellipse-outline'}
                  size={26} color={item.checked ? Colors.success : Colors.border}
                />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>{item.name}</Text>
                <Text style={styles.itemQty}>{item.quantity}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteShoppingItem(liveList.id, item.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* New list modal */}
      <Modal visible={showNewList} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New list</Text>
            <TouchableOpacity onPress={() => setShowNewList(false)}><Ionicons name="close" size={24} color={Colors.text} /></TouchableOpacity>
          </View>
          <TextInput style={styles.input} value={newListName} onChangeText={setNewListName} placeholder="List name" placeholderTextColor={Colors.textSub} autoFocus />
          <Button label="Create list" onPress={createList} style={{ marginTop: 20 }} disabled={!newListName.trim()} />
        </KeyboardAvoidingView>
      </Modal>

      {/* Add item modal */}
      <Modal visible={showAddItem} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add item</Text>
            <TouchableOpacity onPress={() => setShowAddItem(false)}><Ionicons name="close" size={24} color={Colors.text} /></TouchableOpacity>
          </View>
          <Text style={styles.fieldLabel}>Item name</Text>
          <TextInput style={styles.input} value={newItemName} onChangeText={setNewItemName} placeholder="e.g. Oat milk" placeholderTextColor={Colors.textSub} autoFocus />
          <Text style={styles.fieldLabel}>Quantity</Text>
          <TextInput style={styles.input} value={newItemQty} onChangeText={setNewItemQty} placeholder="e.g. 2x" placeholderTextColor={Colors.textSub} />
          <Button label="Add to list" onPress={createItem} style={{ marginTop: 20 }} disabled={!newItemName.trim()} />
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 20 },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, marginBottom: 16 },
  pageTitle:   { fontSize: 28, fontWeight: '800', color: Colors.text },
  addBtn:      { backgroundColor: Colors.primary, borderRadius: Radius.full, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  tabsScroll:  { flexGrow: 0, marginBottom: 16 },
  tabs:        { flexDirection: 'row', gap: 8, paddingRight: 20 },
  tab:         { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 8 },
  tabActive:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText:     { fontSize: 14, fontWeight: '600', color: Colors.textSub },
  tabTextActive:{ color: '#fff' },
  emptyState:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji:  { fontSize: 48, marginBottom: 12 },
  emptyText:   { color: Colors.textSub, fontSize: 15, textAlign: 'center', marginTop: 12 },
  addItemBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 4 },
  addItemText: { color: Colors.primary, fontWeight: '600', fontSize: 15 },
  itemRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  itemChecked: { opacity: 0.5 },
  itemCheck:   { padding: 2 },
  itemName:    { fontSize: 15, fontWeight: '600', color: Colors.text },
  itemNameChecked: { textDecorationLine: 'line-through', color: Colors.textSub },
  itemQty:     { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  deleteBtn:   { padding: 6 },
  // Modal
  modal:       { flex: 1, backgroundColor: Colors.bg, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle:  { fontSize: 22, fontWeight: '800', color: Colors.text },
  fieldLabel:  { fontSize: 13, fontWeight: '600', color: Colors.textSub, marginBottom: 6, marginTop: 16 },
  input:       { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.sm, padding: 14, fontSize: 15, color: Colors.text, backgroundColor: Colors.card },
});
