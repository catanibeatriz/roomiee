import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Modal, Image, TextInput, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { Alert } from '@/lib/alert';
import { Ionicons } from '@expo/vector-icons';
import { useStore, HouseNote, AlbumPhoto } from '@/store';
import { pickPhoto } from '@/lib/photos';
import { Colors, Radius, Shadow, Pastel, PastelName } from '@/lib/theme';
import Button from '@/components/Button';
import Avatar from '@/components/Avatar';

const NOTE_TONES: PastelName[] = ['butter', 'sky', 'rose', 'mint', 'lavender', 'peach'];

export default function BoardScreen() {
  const {
    houseNotes, currentUser, roommates, album,
    addHouseNote, updateHouseNote, togglePinNote, deleteHouseNote,
    addAlbumPhoto, removeAlbumPhoto,
  } = useStore();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<'album' | 'notes'>('album');

  // Album state
  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [viewing, setViewing] = useState<AlbumPhoto | null>(null);

  // Notes state
  const [editing, setEditing] = useState<HouseNote | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [notePhoto, setNotePhoto] = useState<string | undefined>();

  const tile = (width - 40 - 12) / 2;
  const today = () => new Date().toISOString().slice(0, 10);

  async function startAddPhoto() {
    const uri = await pickPhoto({ title: 'Add to the house album' });
    if (uri) { setCaption(''); setPendingUri(uri); }
  }

  function savePhoto() {
    if (!pendingUri) return;
    addAlbumPhoto(pendingUri, caption.trim());
    setPendingUri(null);
  }

  function openNewNote() {
    setEditing(null); setNoteTitle(''); setNoteBody(''); setNotePhoto(undefined); setShowNote(true);
  }

  function openEditNote(n: HouseNote) {
    setEditing(n); setNoteTitle(n.title); setNoteBody(n.body); setNotePhoto(n.photo); setShowNote(true);
  }

  function saveNote() {
    if (!noteTitle.trim()) return;
    if (editing) {
      updateHouseNote(editing.id, noteTitle.trim(), noteBody.trim(), notePhoto);
    } else {
      addHouseNote({
        title: noteTitle.trim(), body: noteBody.trim(), pinned: false, photo: notePhoto,
        createdBy: currentUser.id, createdAt: today(), updatedAt: today(),
      });
    }
    setShowNote(false);
  }

  const sortedNotes = [...houseNotes].sort((a, b) => Number(b.pinned) - Number(a.pinned));

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Board</Text>
        <TouchableOpacity style={styles.addBtn} onPress={tab === 'album' ? startAddPhoto : openNewNote}>
          <Ionicons name={tab === 'album' ? 'camera' : 'add'} size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Segmented control */}
      <View style={styles.segment}>
        {(['album', 'notes'] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.segBtn, tab === t && styles.segBtnActive]} onPress={() => setTab(t)}>
            <Text style={[styles.segText, tab === t && styles.segTextActive]}>
              {t === 'album' ? '📸 Album' : '📝 Notes'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {tab === 'album' ? (
          <View style={styles.grid}>
            <TouchableOpacity style={[styles.addTile, { width: tile, height: tile }]} onPress={startAddPhoto}>
              <View style={styles.addCircle}><Ionicons name="add" size={28} color={Colors.primary} /></View>
              <Text style={styles.addTileText}>Add a photo</Text>
              <Text style={styles.addTileSub}>memories, receipts, the fridge…</Text>
            </TouchableOpacity>
            {album.map((p) => (
              <TouchableOpacity key={p.id} onPress={() => setViewing(p)} activeOpacity={0.85}>
                <Image source={{ uri: p.uri }} style={[styles.photo, { width: tile, height: tile }]} />
                {!!p.caption && <Text style={[styles.photoCaption, { width: tile }]} numberOfLines={1}>{p.caption}</Text>}
              </TouchableOpacity>
            ))}
            {album.length === 0 && (
              <View style={[styles.emptyAlbum, { width: tile, height: tile }]}>
                <Text style={styles.emptyEmoji}>🏡</Text>
                <Text style={styles.emptyText}>Your house album is empty — add your first memory!</Text>
              </View>
            )}
          </View>
        ) : (
          <>
            {sortedNotes.map((n, i) => {
              const tone = Pastel[NOTE_TONES[i % NOTE_TONES.length]];
              const author = roommates.find((r) => r.id === n.createdBy);
              return (
                <View key={n.id} style={[styles.note, { backgroundColor: tone.bg }]}>
                  {n.photo && <Image source={{ uri: n.photo }} style={styles.notePhoto} />}
                  <View style={styles.noteTop}>
                    <Text style={styles.noteTitle}>{n.pinned ? '📌 ' : ''}{n.title}</Text>
                    <View style={styles.noteActions}>
                      <TouchableOpacity onPress={() => togglePinNote(n.id)} style={styles.noteIcon}>
                        <Ionicons name={n.pinned ? 'pin' : 'pin-outline'} size={17} color={tone.ink} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => openEditNote(n)} style={styles.noteIcon}>
                        <Ionicons name="pencil" size={16} color={tone.ink} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteHouseNote(n.id)} style={styles.noteIcon}>
                        <Ionicons name="trash-outline" size={17} color={tone.ink} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {!!n.body && <Text style={styles.noteBody}>{n.body}</Text>}
                  <View style={styles.noteFoot}>
                    {author && <Avatar roommate={author} size={20} />}
                    <Text style={styles.noteMeta}>Updated {n.updatedAt}</Text>
                  </View>
                </View>
              );
            })}
            {houseNotes.length === 0 && <Text style={styles.emptyText}>No notes yet 📝</Text>}
          </>
        )}
      </ScrollView>

      {/* Caption a new album photo */}
      <Modal visible={!!pendingUri} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New photo ✨</Text>
            <TouchableOpacity onPress={() => setPendingUri(null)}><Ionicons name="close" size={24} color={Colors.text} /></TouchableOpacity>
          </View>
          {pendingUri && <Image source={{ uri: pendingUri }} style={styles.preview} />}
          <Text style={styles.fieldLabel}>Caption (optional)</Text>
          <TextInput style={styles.input} value={caption} onChangeText={setCaption} placeholder="e.g. Sunday paella 🥘" placeholderTextColor={Colors.textSub} />
          <Button label="Add to album" onPress={savePhoto} style={{ marginTop: 20 }} />
        </KeyboardAvoidingView>
      </Modal>

      {/* Full-screen viewer */}
      <Modal visible={!!viewing} animationType="fade" transparent>
        <View style={styles.viewer}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setViewing(null)}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          {viewing && (
            <>
              <Image source={{ uri: viewing.uri }} style={styles.viewerImg} resizeMode="contain" />
              {!!viewing.caption && <Text style={styles.viewerCaption}>{viewing.caption}</Text>}
              <Text style={styles.viewerMeta}>
                Added by {roommates.find((r) => r.id === viewing.addedBy)?.name ?? 'someone'} · {viewing.addedAt}
              </Text>
              <TouchableOpacity
                style={styles.viewerDelete}
                onPress={() => Alert.alert('Remove photo?', undefined, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Remove', style: 'destructive', onPress: () => { removeAlbumPhoto(viewing.id); setViewing(null); } },
                ])}
              >
                <Ionicons name="trash-outline" size={16} color="#fff" />
                <Text style={styles.viewerDeleteText}>Remove</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>

      {/* Add / edit note */}
      <Modal visible={showNote} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editing ? 'Edit note' : 'New note'}</Text>
              <TouchableOpacity onPress={() => setShowNote(false)}><Ionicons name="close" size={24} color={Colors.text} /></TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput style={styles.input} value={noteTitle} onChangeText={setNoteTitle} placeholder="Note title" placeholderTextColor={Colors.textSub} />
            <Text style={styles.fieldLabel}>Content</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={noteBody} onChangeText={setNoteBody}
              placeholder="Write something..." placeholderTextColor={Colors.textSub}
              multiline textAlignVertical="top"
            />
            <Text style={styles.fieldLabel}>Photo</Text>
            {notePhoto ? (
              <View>
                <Image source={{ uri: notePhoto }} style={styles.preview} />
                <TouchableOpacity onPress={() => setNotePhoto(undefined)}>
                  <Text style={styles.removeLink}>Remove photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.photoPick} onPress={async () => {
                const uri = await pickPhoto({ title: 'Add a photo to this note' });
                if (uri) setNotePhoto(uri);
              }}>
                <Ionicons name="image-outline" size={20} color={Colors.primary} />
                <Text style={styles.photoPickText}>Add a photo</Text>
              </TouchableOpacity>
            )}
            <Button label="Save" onPress={saveNote} style={{ marginTop: 22 }} disabled={!noteTitle.trim()} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 20 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginBottom: 14 },
  pageTitle:    { fontSize: 30, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  addBtn:       { backgroundColor: Colors.primary, borderRadius: Radius.full, width: 46, height: 46, alignItems: 'center', justifyContent: 'center', ...Shadow.sm, shadowColor: Colors.primary, shadowOpacity: 0.3 },

  segment:      { flexDirection: 'row', backgroundColor: Colors.mist, borderRadius: Radius.full, padding: 4, marginBottom: 18 },
  segBtn:       { flex: 1, paddingVertical: 10, borderRadius: Radius.full, alignItems: 'center' },
  segBtnActive: { backgroundColor: Colors.card, ...Shadow.sm },
  segText:      { fontSize: 14, fontWeight: '700', color: Colors.textSub },
  segTextActive:{ color: Colors.text },

  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  addTile:      { borderRadius: Radius.lg, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.soft, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', padding: 10 },
  addCircle:    { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.mist, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  addTileText:  { fontSize: 14, fontWeight: '800', color: Colors.primary },
  addTileSub:   { fontSize: 11, color: Colors.textSub, marginTop: 2, textAlign: 'center' },
  photo:        { borderRadius: Radius.lg, backgroundColor: Colors.mist },
  photoCaption: { fontSize: 12, fontWeight: '600', color: Colors.text, marginTop: 6, paddingHorizontal: 4 },
  emptyAlbum:   { borderRadius: Radius.lg, backgroundColor: Pastel.butter.bg, alignItems: 'center', justifyContent: 'center', padding: 14 },
  emptyEmoji:   { fontSize: 36, marginBottom: 6 },
  emptyText:    { fontSize: 13, color: Colors.textSub, textAlign: 'center', fontWeight: '600' },

  note:         { borderRadius: Radius.lg, padding: 16, marginBottom: 12, overflow: 'hidden' },
  notePhoto:    { height: 150, borderRadius: Radius.md, marginBottom: 12 },
  noteTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  noteTitle:    { fontSize: 16, fontWeight: '800', color: Colors.text, flex: 1 },
  noteActions:  { flexDirection: 'row' },
  noteIcon:     { padding: 5 },
  noteBody:     { fontSize: 14, color: Colors.text, lineHeight: 21 },
  noteFoot:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  noteMeta:     { fontSize: 11, color: Colors.textSub, fontWeight: '600' },

  modal:        { flex: 1, backgroundColor: Colors.bg, padding: 24 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle:   { fontSize: 22, fontWeight: '800', color: Colors.text },
  preview:      { width: '100%', height: 220, borderRadius: Radius.lg, marginTop: 8 },
  fieldLabel:   { fontSize: 13, fontWeight: '700', color: Colors.textSub, marginBottom: 6, marginTop: 16 },
  input:        { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: 14, fontSize: 15, color: Colors.text, backgroundColor: Colors.card },
  textArea:     { height: 120, paddingTop: 12 },
  photoPick:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.soft, borderRadius: Radius.md, paddingVertical: 18, backgroundColor: Colors.card },
  photoPickText:{ fontSize: 14, fontWeight: '700', color: Colors.primary },
  removeLink:   { color: Colors.danger, fontWeight: '700', marginTop: 8, textAlign: 'center' },

  viewer:       { flex: 1, backgroundColor: 'rgba(15,22,40,0.94)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  viewerClose:  { position: 'absolute', top: 60, right: 20, padding: 6 },
  viewerImg:    { width: '100%', height: '60%' },
  viewerCaption:{ color: '#fff', fontSize: 17, fontWeight: '700', marginTop: 16, textAlign: 'center' },
  viewerMeta:   { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 6 },
  viewerDelete: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 24, backgroundColor: 'rgba(255,107,129,0.85)', borderRadius: Radius.full, paddingHorizontal: 18, paddingVertical: 10 },
  viewerDeleteText: { color: '#fff', fontWeight: '700' },
});
