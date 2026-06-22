import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import {
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
import { CategoryPicker } from '@/components/notes/category-picker';
import { ScreenHeader } from '@/components/ui/screen-header';
import { MarkdownBody } from '@/components/ui/markdown-body';
import { Spacing } from '@/constants/theme';
import { useNotes } from '@/context/notes-context';
import { useAppTheme } from '@/hooks/use-app-theme';
import { suggestTitleAfterSave } from '@/lib/ai/title-on-save';
import { persistRecording } from '@/lib/storage/audio-storage';

export default function NewNoteScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { createNote, updateNote } = useNotes();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const bodyInputRef = useRef<TextInput>(null);
  const [editing, setEditing] = useState(true);
  const [category, setCategory] = useState<string | null>(null);
  const [pendingAudios, setPendingAudios] = useState<{ id: string; uri: string; durationMs: number; createdAt: string }[]>([]);
  const [transcript, setTranscript] = useState<string | undefined>();
  const [summary, setSummary] = useState<string | undefined>();
  const [keyPoints, setKeyPoints] = useState<string[] | undefined>();
  const [saving, setSaving] = useState(false);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);
  const [titleSuggestion, setTitleSuggestion] = useState<string | null>(null);
  const [showTitleSuggestion, setShowTitleSuggestion] = useState(false);

  const hasContent = () => Boolean(title.trim() || body.trim() || pendingAudios.length > 0);

  const handleBack = () => {
    if (hasContent()) {
      Alert.alert('Unsaved changes', 'Do you want to save before leaving?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        { text: 'Save', onPress: handleSave },
      ]);
    } else {
      router.back();
    }
  };

  const handleSave = async () => {
    if (!title.trim() && !body.trim() && pendingAudios.length === 0) {
      Alert.alert('Empty note', 'Add a title, some text, or a voice recording.');
      return;
    }

    setSaving(true);
    try {
      const savedTitle = title.trim() || 'Untitled';
      const note = await createNote({
        title: savedTitle,
        body: body.trim(),
        category: category ?? undefined,
        transcript: transcript?.trim() || undefined,
        summary: summary?.trim() || undefined,
        keyPoints: keyPoints?.length ? keyPoints : undefined,
      });

      if (pendingAudios.length > 0) {
        const persisted = await Promise.all(
          pendingAudios.map(async (audio) => {
            const permanentUri = await persistRecording(audio.uri, note.id, audio.id);
            return { id: audio.id, uri: permanentUri, durationMs: audio.durationMs, createdAt: audio.createdAt };
          })
        );
        await updateNote(note.id, { audioRecordings: persisted });
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
    if (savedNoteId) await updateNote(savedNoteId, { title: nextTitle.trim() });
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
        onBack={handleBack}
        editToggle={{ editing, onPress: () => setEditing((v) => !v) }}
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
            returnKeyType="next"
            editable={editing}
          />

          {editing ? (
            <TextInput
              ref={bodyInputRef}
              value={body}
              onChangeText={setBody}
              placeholder="Start writing…"
              placeholderTextColor={theme.placeholder}
              style={[styles.bodyInput, { color: theme.text }]}
              multiline
              textAlignVertical="top"
            />
          ) : (
            <Pressable onPress={() => setEditing(true)} style={styles.bodyReadView}>
              {body.trim() ? (
                <MarkdownBody fontSize={17}>{body}</MarkdownBody>
              ) : (
                <Text style={{ color: theme.placeholder, fontSize: 17 }}>Start writing…</Text>
              )}
            </Pressable>
          )}

          <CategoryPicker category={category} onChange={setCategory} />

          <AudioRecorderSection
            recordings={pendingAudios}
            onRecorded={(uri, durationMs) => {
              const newAudio = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                uri,
                durationMs,
                createdAt: new Date().toISOString(),
              };
              setPendingAudios((prev) => [...prev, newAudio]);
            }}
            onClear={(audioId) => setPendingAudios((prev) => prev.filter((a) => a.id !== audioId))}
          />

          <AiPanel
            body={body}
            transcript={transcript}
            audioUri={pendingAudios[0]?.uri}
            summary={summary}
            keyPoints={keyPoints}
            onTranscriptChange={setTranscript}
            onSummaryChange={(nextSummary, nextKeyPoints) => {
              setSummary(nextSummary);
              setKeyPoints(nextKeyPoints);
            }}
            onTitleGenerated={setTitle}
            onReplaceBody={(text) => { setBody(text); setEditing(false); }}
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
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xl },
  titleInput: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5, padding: 0 },
  bodyInput: { fontSize: 17, lineHeight: 26, minHeight: 200, padding: 0 },
  bodyReadView: { minHeight: 200 },
});
