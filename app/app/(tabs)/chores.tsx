import { useState } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore, Chore } from '@/store';
import { Colors, Radius } from '@/lib/theme';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Avatar from '@/components/Avatar';

const RECURRING: Chore['recurring'][] = ['none', 'daily', 'weekly', 'biweekly'];

export default function ChoresScreen() {
  const { chores, roommates, currentUser, addChore, toggleChore } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [choreTitle, setChoreTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState(currentUser.id);
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [recurring, setRecurring] = useState<Chore['recurring']>('none');
  const [filter, setFilter] = useState<'all' | 'mine' | 'done'>('all');

  function submit() {
    if (!choreTitle.trim()) return;
    addChore({ title: choreTitle.trim(), assignedTo, dueDate, recurring, completed: false });
    setChoreTitle(''); setAssignedTo(currentUser.id); setRecurring('none');
    setShowAdd(false);
  }

  const filtered = chores.filter((c) => {
    if (filter === 'mine') return c.assignedTo === currentUser.id && !c.completed;
    if (filter === 'done') return c.completed;
    return !c.completed;
  });

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Chores</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['all', 'mine', 'done'] as const).map((f) => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.filterTab, filter === f && styles.filterTabActive]}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Pending' : f === 'mine' ? 'My chores' : 'Done'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {filtered.length === 0 && <Text style={styles.empty}>Nothing here 🎉</Text>}
        {filtered.map((chore) => {
          const assignee = roommates.find((r) => r.id === chore.assignedTo);
          const isOverdue = !chore.completed && chore.dueDate < new Date().toISOString().slice(0, 10);
          return (
            <TouchableOpacity key={chore.id} onPress={() => toggleChore(chore.id)} activeOpacity={0.85}>
              <Card style={[styles.choreCard, chore.completed && styles.choreCardDone]}>
                <View style={styles.choreLeft}>
                  <Ionicons
                    name={chore.completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={28} color={chore.completed ? Colors.success : Colors.border}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.choreTitle, chore.completed && styles.choreTitleDone]}>{chore.title}</Text>
                    <View style={styles.choreMeta}>
                      {assignee && <Avatar roommate={assignee} size={18} />}
                      <Text style={[styles.choreDate, isOverdue && { color: Colors.danger }]}>
                        {isOverdue ? '⚠️ ' : ''}{chore.dueDate}
                      </Text>
                      {chore.recurring !== 'none' && (
                        <View style={styles.recurBadge}>
                          <Text style={styles.recurText}>🔄 {chore.recurring}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New chore</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}><Ionicons name="close" size={24} color={Colors.text} /></TouchableOpacity>
          </View>
          <ScrollView>
            <Text style={styles.fieldLabel}>Task</Text>
            <TextInput style={styles.input} value={choreTitle} onChangeText={setChoreTitle} placeholder="e.g. Vacuum living room" placeholderTextColor={Colors.textSub} autoFocus />

            <Text style={styles.fieldLabel}>Due date</Text>
            <TextInput style={styles.input} value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textSub} />

            <Text style={styles.fieldLabel}>Recurring</Text>
            <View style={styles.chipRow}>
              {RECURRING.map((r) => (
                <TouchableOpacity key={r} onPress={() => setRecurring(r)} style={[styles.chip, recurring === r && styles.chipActive]}>
                  <Text style={[styles.chipText, recurring === r && styles.chipTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Assign to</Text>
            {roommates.map((r) => (
              <TouchableOpacity key={r.id} style={styles.checkRow} onPress={() => setAssignedTo(r.id)}>
                <Avatar roommate={r} size={32} />
                <Text style={styles.checkName}>{r.name}</Text>
                <Ionicons name={assignedTo === r.id ? 'radio-button-on' : 'radio-button-off'} size={22} color={assignedTo === r.id ? Colors.primary : Colors.textSub} />
              </TouchableOpacity>
            ))}

            <Button label="Add chore" onPress={submit} style={{ marginTop: 24 }} disabled={!choreTitle.trim()} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 20 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginBottom: 16 },
  pageTitle:    { fontSize: 28, fontWeight: '800', color: Colors.text },
  addBtn:       { backgroundColor: Colors.primary, borderRadius: Radius.full, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  filterRow:    { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterTab:    { flex: 1, paddingVertical: 10, borderRadius: Radius.md, backgroundColor: Colors.card, alignItems: 'center' },
  filterTabActive: { backgroundColor: Colors.primary },
  filterText:   { fontSize: 13, fontWeight: '600', color: Colors.textSub },
  filterTextActive: { color: '#fff' },
  empty:        { textAlign: 'center', color: Colors.textSub, marginTop: 40, fontSize: 16 },
  choreCard:    { marginBottom: 10 },
  choreCardDone:{ opacity: 0.5 },
  choreLeft:    { flexDirection: 'row', alignItems: 'center' },
  choreTitle:   { fontSize: 15, fontWeight: '600', color: Colors.text },
  choreTitleDone:{ textDecorationLine: 'line-through', color: Colors.textSub },
  choreMeta:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  choreDate:    { fontSize: 12, color: Colors.textSub },
  recurBadge:   { backgroundColor: Colors.primary + '15', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  recurText:    { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  // Modal
  modal:        { flex: 1, backgroundColor: Colors.bg, padding: 24 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle:   { fontSize: 22, fontWeight: '800', color: Colors.text },
  fieldLabel:   { fontSize: 13, fontWeight: '600', color: Colors.textSub, marginBottom: 6, marginTop: 14 },
  input:        { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.sm, padding: 14, fontSize: 15, color: Colors.text, backgroundColor: Colors.card },
  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:         { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 6 },
  chipActive:   { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  chipText:     { fontSize: 13, color: Colors.textSub, fontWeight: '600' },
  chipTextActive:{ color: Colors.primary },
  checkRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  checkName:    { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500' },
});
