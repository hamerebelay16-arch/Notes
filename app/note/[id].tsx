import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AudioRecorderSection } from '@/components/audio/audio-recorder';
import { AiPanel } from '@/components/ai/ai-panel';
import { TitleSuggestionModal } from '@/components/ai/title-suggestion-modal';
import { SingleTagPicker } from '@/components/notes/single-tag-picker';
import { TagInputModal } from '@/components/ui/tag-input-modal';
import { ScreenHeader } from '@/components/ui/screen-header';
import { FormattingToolbar } from '@/components/ui/formatting-toolbar';
import { Spacing } from '@/constants/theme';
import { useNotes } from '@/context/notes-context';
import { useAppTheme } from '@/hooks/use-app-theme';
import { deleteAudioFile, persistRecording } from '@/lib/storage/audio-storage';
import { suggestTitleAfterSave } from '@/lib/ai/title-on-save';
import { getNoteById } from '@/lib/storage/notes-storage';
import { insertFormatting } from '@/utils/formatting';
import type { AudioRecording } from '@/types/note';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const { updateNote, deleteNote } = useNotes();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [bodySelection, setBodySelection] = useState({ start: 0, end: 0 });
  const bodyInputRef = useRef<TextInput>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [audioRecordings, setAudioRecordings] = useState<AudioRecording[]>([]);
  const [transcript, setTranscript] = useState<string | undefined>();
  const [summary, setSummary] = useState<string | undefined>();
  const [keyPoints, setKeyPoints] = useState<string[] | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [titleSuggestion, setTitleSuggestion] = useState<string | null>(null);
  const [showTitleSuggestion, setShowTitleSuggestion] = useState(false);
  const [tagModalVisible, setTagModalVisible] = useState(false);

  const originalRef = useRef({ title: '', body: '', tag: null as string | null });

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
      setTag(note.tags[0] ?? null);
      setAudioRecordings(note.audioRecordings ?? []);
      setTranscript(note.transcript);
      setSummary(note.summary);
      setKeyPoints(note.keyPoints);
      originalRef.current = { title: note.title, body: note.body, tag: note.tags[0] ?? null };
      setLoading(false);
    })();
  }, [id, router]);

  const hasUnsavedChanges = () => {
    const orig = originalRef.current;
    return title !== orig.title || body !== orig.body || tag !== orig.tag;
  };

  const handleBack = () => {
    if (hasUnsavedChanges()) {
      Alert.alert('Unsaved changes', 'Do you want to save before leaving?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        { text: 'Save', onPress: handleSave },
      ]);
    } else {
      router.back();
    }
  };

  const handleTagAction = () => setTagModalVisible(true);

  const handleApplyFormatting = (type: 'bold' | 'italic' | 'underline' | 'checklist' | 'bullet') => {
    const { nextText, nextSelection } = insertFormatting(body, bodySelection, type);
    setBody(nextText);
    setBodySelection(nextSelection);
    setTimeout(() => bodyInputRef.current?.focus(), 50);
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const savedTitle = title.trim() || 'Untitled';
      await updateNote(id, {
        title: savedTitle,
        body: body.trim(),
        tags: tag ? [tag] : [],
        audioRecordings,
        transcript: transcript?.trim() || undefined,
        summary: summary?.trim() || undefined,
        keyPoints: keyPoints?.length ? keyPoints : undefined,
      });
      originalRef.current = { title: savedTitle, body: body.trim(), tag };
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
    if (id) await updateNote(id, { title: nextTitle.trim() });
    setShowTitleSuggestion(false);
    setTitleSuggestion(null);
    router.replace('/');
  };

  const handleKeepCurrentTitle = () => {
    setShowTitleSuggestion(false);
    setTitleSuggestion(null);
    router.replace('/');
  };

  const handleDelete = () => {
    Alert.alert('Delete note', 'Are you sure you want to delete this?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!id) return;
          audioRecordings.forEach((rec) => deleteAudioFile(id, rec.id));
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
    const recordingId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const permanentUri = await persistRecording(uri, id, recordingId);
    const newRecording: AudioRecording = {
      id: recordingId,
      uri: permanentUri,
      durationMs,
      createdAt: new Date().toISOString(),
    };
    const updated = [...audioRecordings, newRecording];
    setAudioRecordings(updated);
    await updateNote(id, { audioRecordings: updated });
  };

  const handleClearAudio = async (recordingId: string) => {
    if (!id) return;
    deleteAudioFile(id, recordingId);
    const updated = audioRecordings.filter((rec) => rec.id !== recordingId);
    setAudioRecordings(updated);
    await updateNote(id, { audioRecordings: updated });
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
        onBack={handleBack}
        tagAction={{ onPress: handleTagAction }}
        secondaryAction={{ icon: 'trash-outline', onPress: handleDelete, destructive: true }}
        rightAction={{ label: saving ? '…' : 'Save', onPress: handleSave, disabled: saving }}
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
          />

          <TextInput
            ref={bodyInputRef}
            value={body}
            onChangeText={setBody}
            selection={bodySelection}
            onSelectionChange={(e) => setBodySelection(e.nativeEvent.selection)}
            placeholder="Start writing…"
            placeholderTextColor={theme.placeholder}
            style={[styles.bodyInput, { color: theme.text }]}
            multiline
            textAlignVertical="top"
          />

          <SingleTagPicker tag={tag} onChange={setTag} />

          <AudioRecorderSection
            recordings={audioRecordings}
            onRecorded={handleRecorded}
            onClear={handleClearAudio}
          />

          <AiPanel
            body={body}
            transcript={transcript}
            audioUri={audioRecordings[0]?.uri}
            summary={summary}
            keyPoints={keyPoints}
            onTranscriptChange={setTranscript}
            onSummaryChange={(nextSummary, nextKeyPoints) => {
              setSummary(nextSummary);
              setKeyPoints(nextKeyPoints);
            }}
            onTitleGenerated={setTitle}
          />
        </ScrollView>
        <FormattingToolbar onApply={handleApplyFormatting} />
      </KeyboardAvoidingView>

      <TitleSuggestionModal
        visible={showTitleSuggestion}
        suggestedTitle={titleSuggestion ?? ''}
        onAccept={handleAcceptSuggestedTitle}
        onKeepCurrent={handleKeepCurrentTitle}
        onDismiss={handleKeepCurrentTitle}
      />

      <TagInputModal
        visible={tagModalVisible}
        initialValue={tag ?? ''}
        onConfirm={(val) => { setTag(val); setTagModalVisible(false); }}
        onDismiss={() => setTagModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
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
