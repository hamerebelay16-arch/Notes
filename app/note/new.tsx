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
import { AiPanel } from '@/components/ai/ai-panel';
import { TitleSuggestionModal } from '@/components/ai/title-suggestion-modal';
import { TagPicker } from '@/components/notes/tag-picker';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
import { useNotes } from '@/context/notes-context';
import { useAppTheme } from '@/hooks/use-app-theme';
import { suggestTitleAfterSave } from '@/lib/ai/title-on-save';
import { persistRecording } from '@/lib/storage/audio-storage';

export default function NewNoteScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { createNote, updateNote } = useNotes();
  const { categories } = useCategories();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [pendingAudio, setPendingAudio] = useState<{ uri: string; durationMs: number } | null>(
    null
  );
  const [transcript, setTranscript] = useState<string | undefined>();
  const [summary, setSummary] = useState<string | undefined>();
  const [keyPoints, setKeyPoints] = useState<string[] | undefined>();
  const [saving, setSaving] = useState(false);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);
  const [titleSuggestion, setTitleSuggestion] = useState<string | null>(null);
  const [showTitleSuggestion, setShowTitleSuggestion] = useState(false);

  const categoryNames = useMemo(() => categories.map((c) => c.name), [categories]);

  const handleSave = async () => {
    if (!title.trim() && !body.trim() && !pendingAudio) {
      Alert.alert('Empty note', 'Add a title, some text, or a voice recording.');
      return;
    }

    setSaving(true);
    try {
      const savedTitle = title.trim() || 'Untitled';
      const note = await createNote({
        title: savedTitle,
        body: body.trim(),
        tags,
        transcript: transcript?.trim() || undefined,
        summary: summary?.trim() || undefined,
        keyPoints: keyPoints?.length ? keyPoints : undefined,
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

      const suggested = await suggestTitleAfterSave(body, transcript, savedTitle);
      if (suggested) {
        setSavedNoteId(note.id);
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
    if (savedNoteId) {
      await updateNote(savedNoteId, { title: nextTitle.trim() });
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

          <TagPicker tags={tags} suggestions={categoryNames} onChange={setTags} />

          <AudioRecorderSection
            audioUri={pendingAudio?.uri}
            durationMs={pendingAudio?.durationMs}
            onRecorded={(uri, durationMs) => setPendingAudio({ uri, durationMs })}
            onClear={() => {
              setPendingAudio(null);
              setTranscript(undefined);
            }}
          />

          <AiPanel
            body={body}
            transcript={transcript}
            audioUri={pendingAudio?.uri}
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
