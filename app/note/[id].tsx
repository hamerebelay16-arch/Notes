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
import { AiPanel } from '@/components/ai/ai-panel';
import { TitleSuggestionModal } from '@/components/ai/title-suggestion-modal';
import { ActionChip } from '@/components/notes/note-card';
import { TagPicker } from '@/components/notes/tag-picker';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
import { useNotes } from '@/context/notes-context';
import { useAppTheme } from '@/hooks/use-app-theme';
import { deleteAudioFile, persistRecording } from '@/lib/storage/audio-storage';
import { suggestTitleAfterSave } from '@/lib/ai/title-on-save';
import { getNoteById } from '@/lib/storage/notes-storage';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const { updateNote, deleteNote, pinNote, unpinNote, archiveNote, unarchiveNote } = useNotes();
  const { categories } = useCategories();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [audioUri, setAudioUri] = useState<string | undefined>();
  const [audioDurationMs, setAudioDurationMs] = useState<number | undefined>();
  const [transcript, setTranscript] = useState<string | undefined>();
  const [summary, setSummary] = useState<string | undefined>();
  const [keyPoints, setKeyPoints] = useState<string[] | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [titleSuggestion, setTitleSuggestion] = useState<string | null>(null);
  const [showTitleSuggestion, setShowTitleSuggestion] = useState(false);

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
      setTags(note.tags);
      setIsPinned(note.isPinned);
      setIsArchived(note.isArchived);
      setAudioUri(note.audioUri);
      setAudioDurationMs(note.audioDurationMs);
      setTranscript(note.transcript);
      setSummary(note.summary);
      setKeyPoints(note.keyPoints);
      setLoading(false);
    })();
  }, [id, router]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const savedTitle = title.trim() || 'Untitled';
      await updateNote(id, {
        title: savedTitle,
        body: body.trim(),
        tags,
        audioUri,
        audioDurationMs,
        transcript: transcript?.trim() || undefined,
        summary: summary?.trim() || undefined,
        keyPoints: keyPoints?.length ? keyPoints : undefined,
      });
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const suggested = await suggestTitleAfterSave(body, transcript, savedTitle);
      if (suggested) {
        setTitleSuggestion(suggested);
        setShowTitleSuggestion(true);
        return;
      }

      router.replace('/');
    } finally {
      setSaving(false);
    }
  };

  const handleAcceptSuggestedTitle = async (nextTitle: string) => {
    if (id) {
      await updateNote(id, { title: nextTitle.trim() });
    }
    setShowTitleSuggestion(false);
    setTitleSuggestion(null);
    router.replace('/');
  };

  const handleKeepCurrentTitle = () => {
    setShowTitleSuggestion(false);
    setTitleSuggestion(null);
    router.replace('/');
  };

  const handleTogglePin = async () => {
    if (!id || isArchived) return;
    if (isPinned) {
      await unpinNote(id);
      setIsPinned(false);
    } else {
      await pinNote(id);
      setIsPinned(true);
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

  const handleUnarchive = async () => {
    if (!id) return;
    await unarchiveNote(id);
    setIsArchived(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
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
    setTranscript(undefined);
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
        title={isArchived ? 'Archived' : 'Note'}
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
          {isArchived && (
            <View style={[styles.archivedBanner, { backgroundColor: theme.tintMuted }]}>
              <Text style={[styles.archivedText, { color: theme.tint }]}>
                This note is archived and hidden from your main list.
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            {!isArchived && (
              <ActionChip
                label={isPinned ? 'Pinned' : 'Pin'}
                icon={isPinned ? 'pin' : 'pin-outline'}
                active={isPinned}
                onPress={handleTogglePin}
              />
            )}

            {isArchived ? (
              <ActionChip
                label="Unarchive"
                icon="arrow-undo-outline"
                onPress={handleUnarchive}
              />
            ) : (
              <ActionChip label="Archive" icon="archive-outline" onPress={handleArchive} />
            )}
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

          <TagPicker tags={tags} suggestions={categoryNames} onChange={setTags} />

          <AudioRecorderSection
            audioUri={audioUri}
            durationMs={audioDurationMs}
            onRecorded={handleRecorded}
            onClear={handleClearAudio}
          />

          <AiPanel
            body={body}
            transcript={transcript}
            audioUri={audioUri}
            summary={summary}
            keyPoints={keyPoints}
            onTranscriptChange={setTranscript}
            onSummaryChange={(nextSummary, nextKeyPoints) => {
              setSummary(nextSummary);
              setKeyPoints(nextKeyPoints);
            }}
            onTitleGenerated={setTitle}
          />

          <Pressable onPress={handleDelete} style={[styles.deleteBtn, { borderColor: theme.border }]}>
            <Text style={[styles.deleteLabel, { color: theme.danger }]}>Delete note</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <TitleSuggestionModal
        visible={showTitleSuggestion}
        suggestedTitle={titleSuggestion ?? ''}
        onAccept={handleAcceptSuggestedTitle}
        onKeepCurrent={handleKeepCurrentTitle}
        onDismiss={handleKeepCurrentTitle}
      />
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
  archivedBanner: {
    borderRadius: 12,
    padding: Spacing.md,
  },
  archivedText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
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
