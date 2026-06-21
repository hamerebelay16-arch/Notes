import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AudioRecorderSection } from '@/components/audio/audio-recorder';
import { CategoryPicker } from '@/components/notes/category-picker';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Radius, Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
import { useNotes } from '@/context/notes-context';
import { useAppTheme } from '@/hooks/use-app-theme';
import { deleteAudioFile, persistRecording } from '@/lib/storage/audio-storage';
import { getNoteById } from '@/lib/storage/notes-storage';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const { updateNote, deleteNote, pinNote, unpinNote, archiveNote } = useNotes();
  const { categories } = useCategories();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [audioUri, setAudioUri] = useState<string | undefined>();
  const [audioDurationMs, setAudioDurationMs] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const categoryNames = useMemo(() => categories.map((c) => c.name), [categories]);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const note = await getNoteById(id);
      if (!note) {
        Alert.alert('Note not found', 'This note may have been deleted.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }
      setTitle(note.title);
      setBody(note.body);
      setSelectedTags(note.tags);
      setIsPinned(note.isPinned);
      setAudioUri(note.audioUri);
      setAudioDurationMs(note.audioDurationMs);
      setLoading(false);
    })();
  }, [id, router]);

  const handleToggleTag = (name: string) => {
    setSelectedTags((current) =>
      current.includes(name) ? current.filter((t) => t !== name) : [...current, name]
    );
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updateNote(id, {
        title: title.trim() || 'Untitled',
        body: body.trim(),
        tags: selectedTags,
        audioUri,
        audioDurationMs,
      });
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.replace('/');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePin = async () => {
    if (!id) return;
    if (isPinned) {
      await unpinNote(id);
      setIsPinned(false);
    } else {
      await pinNote(id);
      setIsPinned(true);
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleArchive = () => {
    Alert.alert('Archive note', 'Archived notes are hidden from the home screen.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        onPress: async () => {
          if (!id) return;
          await archiveNote(id);
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          router.replace('/');
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete note', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!id) return;
          deleteAudioFile(id);
          await deleteNote(id);
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
          router.replace('/');
        },
      },
    ]);
  };

  const handleRecorded = async (uri: string, durationMs: number) => {
    if (!id) return;
    const permanentUri = await persistRecording(uri, id);
    setAudioUri(permanentUri);
    setAudioDurationMs(durationMs);
  };

  const handleClearAudio = () => {
    if (id) {
      deleteAudioFile(id);
    }
    setAudioUri(undefined);
    setAudioDurationMs(undefined);
  };

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Note"
        onBack={() => router.back()}
        rightAction={{ label: saving ? '…' : 'Save', onPress: handleSave, disabled: saving }}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.actions}>
            <Pressable
              onPress={handleTogglePin}
              style={[
                styles.actionChip,
                {
                  backgroundColor: isPinned ? theme.tintMuted : theme.surface,
                  borderColor: isPinned ? theme.tint : theme.border,
                },
              ]}>
              <Ionicons
                name={isPinned ? 'pin' : 'pin-outline'}
                size={16}
                color={isPinned ? theme.tint : theme.textSecondary}
              />
              <Text
                style={[
                  styles.actionLabel,
                  { color: isPinned ? theme.tint : theme.textSecondary },
                ]}>
                {isPinned ? 'Pinned' : 'Pin'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleArchive}
              style={[styles.actionChip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="archive-outline" size={16} color={theme.textSecondary} />
              <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>Archive</Text>
            </Pressable>
          </View>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={theme.placeholder}
            style={[styles.titleInput, { color: theme.text }]}
          />

          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Start writing…"
            placeholderTextColor={theme.placeholder}
            style={[styles.bodyInput, { color: theme.text }]}
            multiline
            textAlignVertical="top"
          />

          <CategoryPicker
            categories={categoryNames}
            selected={selectedTags}
            onToggle={handleToggleTag}
          />

          <AudioRecorderSection
            audioUri={audioUri}
            durationMs={audioDurationMs}
            onRecorded={handleRecorded}
            onClear={handleClearAudio}
          />

          <Pressable onPress={handleDelete} style={[styles.deleteBtn, { borderColor: theme.border }]}>
            <Text style={[styles.deleteLabel, { color: theme.danger }]}>Delete note</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  titleInput: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    padding: 0,
  },
  bodyInput: {
    fontSize: 17,
    lineHeight: 26,
    minHeight: 200,
    padding: 0,
  },
  deleteBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  deleteLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
