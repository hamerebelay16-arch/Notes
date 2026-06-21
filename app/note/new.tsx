import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AudioRecorderSection } from '@/components/audio/audio-recorder';
import { CategoryPicker } from '@/components/notes/category-picker';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
import { useNotes } from '@/context/notes-context';
import { useAppTheme } from '@/hooks/use-app-theme';
import { persistRecording } from '@/lib/storage/audio-storage';

export default function NewNoteScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { createNote, updateNote } = useNotes();
  const { categories } = useCategories();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [pendingAudio, setPendingAudio] = useState<{ uri: string; durationMs: number } | null>(
    null
  );
  const [saving, setSaving] = useState(false);

  const categoryNames = useMemo(() => categories.map((c) => c.name), [categories]);

  const handleToggleTag = (name: string) => {
    setSelectedTags((current) =>
      current.includes(name) ? current.filter((t) => t !== name) : [...current, name]
    );
  };

  const handleSave = async () => {
    if (!title.trim() && !body.trim() && !pendingAudio) {
      Alert.alert('Empty note', 'Add a title, some text, or a voice recording.');
      return;
    }

    setSaving(true);
    try {
      const note = await createNote({
        title: title.trim() || 'Untitled',
        body: body.trim(),
        tags: selectedTags,
      });

      if (pendingAudio) {
        const permanentUri = await persistRecording(pendingAudio.uri, note.id);
        await updateNote(note.id, {
          audioUri: permanentUri,
          audioDurationMs: pendingAudio.durationMs,
        });
      }

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.replace('/');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="New Note"
        onBack={() => router.back()}
        rightAction={{ label: 'Save', onPress: handleSave, disabled: saving }}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={theme.placeholder}
            style={[styles.titleInput, { color: theme.text }]}
            returnKeyType="next"
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
            audioUri={pendingAudio?.uri}
            durationMs={pendingAudio?.durationMs}
            onRecorded={(uri, durationMs) => setPendingAudio({ uri, durationMs })}
            onClear={() => setPendingAudio(null)}
          />
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
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xl,
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
});
