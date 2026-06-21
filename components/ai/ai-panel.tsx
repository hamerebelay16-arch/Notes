import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { generateNoteTitle, summarizeNote } from '@/lib/ai/gemini-service';
import { isGeminiConfigured } from '@/lib/ai/config';
import {
  DEFAULT_WHISPER_MODEL,
  WHISPER_MODEL_OPTIONS,
  type WhisperModelName,
} from '@/lib/ai/config';
import {
  getTranscriptionUnavailableMessage,
  isTranscriptionAvailable,
  transcribeAudioFile,
  type TranscriptionProgress,
} from '@/lib/ai/transcription-service';
import { useAppTheme } from '@/hooks/use-app-theme';

interface AiPanelProps {
  body: string;
  transcript?: string;
  audioUri?: string;
  summary?: string;
  keyPoints?: string[];
  onTranscriptChange: (transcript: string) => void;
  onSummaryChange: (summary: string, keyPoints: string[]) => void;
  onTitleGenerated: (title: string) => void;
}

export function AiPanel({
  body,
  transcript,
  audioUri,
  summary,
  keyPoints,
  onTranscriptChange,
  onSummaryChange,
  onTitleGenerated,
}: AiPanelProps) {
  const theme = useAppTheme();
  const [expanded, setExpanded] = useState(false);
  const [whisperModel, setWhisperModel] = useState<WhisperModelName>(DEFAULT_WHISPER_MODEL);
  const [transcribing, setTranscribing] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [generatingTitle, setGeneratingTitle] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState<TranscriptionProgress | null>(
    null
  );
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const hasContent = Boolean(body.trim() || transcript?.trim());
  const geminiReady = isGeminiConfigured();

  const handleTranscribe = async () => {
    if (!audioUri) {
      Alert.alert('No recording', 'Record a voice note first, then tap Transcribe.');
      return;
    }

    if (!isTranscriptionAvailable()) {
      Alert.alert('Unavailable', getTranscriptionUnavailableMessage());
      return;
    }

    setTranscribing(true);
    setAiMessage(null);
    setTranscriptionProgress({ status: 'idle', message: 'Starting…' });

    try {
      const result = await transcribeAudioFile(audioUri, whisperModel, setTranscriptionProgress);
      onTranscriptChange(result);
      setAiMessage('Transcript saved to this note.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Transcription failed. Please try again.';
      setTranscriptionProgress({ status: 'error', message });
      Alert.alert('Transcription failed', message);
    } finally {
      setTranscribing(false);
    }
  };

  const handleSummarize = async () => {
    if (!hasContent) {
      Alert.alert('Nothing to summarize', 'Add text or transcribe your voice note first.');
      return;
    }

    setSummarizing(true);
    setAiMessage(null);

    try {
      const result = await summarizeNote(body, transcript);
      onSummaryChange(result.summary, result.keyPoints);
      setAiMessage(
        result.source === 'gemini'
          ? 'Summary generated with Gemini.'
          : 'Summary generated offline (add EXPO_PUBLIC_GEMINI_API_KEY for AI summaries).'
      );
    } catch {
      Alert.alert(
        'Summarization failed',
        'Could not summarize this note. Your note content is unchanged.'
      );
    } finally {
      setSummarizing(false);
    }
  };

  const handleGenerateTitle = async () => {
    if (!hasContent) {
      Alert.alert('Nothing to analyze', 'Add text or transcribe your voice note first.');
      return;
    }

    setGeneratingTitle(true);
    setAiMessage(null);

    try {
      const result = await generateNoteTitle(body, transcript);
      onTitleGenerated(result.title);
      setAiMessage(
        result.source === 'gemini'
          ? 'Title suggestion applied — edit it anytime.'
          : 'Title suggested from your note (add EXPO_PUBLIC_GEMINI_API_KEY for smarter titles).'
      );
    } catch {
      Alert.alert(
        'Title generation failed',
        'Could not generate a title. You can still edit the title manually.'
      );
    } finally {
      setGeneratingTitle(false);
    }
  };

  const cycleModel = () => {
    const currentIndex = WHISPER_MODEL_OPTIONS.findIndex((option) => option.value === whisperModel);
    const next = WHISPER_MODEL_OPTIONS[(currentIndex + 1) % WHISPER_MODEL_OPTIONS.length];
    setWhisperModel(next.value);
  };

  const selectedModel = WHISPER_MODEL_OPTIONS.find((option) => option.value === whisperModel);

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      <Pressable
        onPress={() => setExpanded((value) => !value)}
        style={styles.header}
        accessibilityRole="button"
        accessibilityState={{ expanded }}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconCircle, { backgroundColor: theme.tintMuted }]}>
            <Ionicons name="sparkles" size={18} color={theme.tint} />
          </View>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>AI Assistant</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Optional · offline transcription & online summaries
            </Text>
          </View>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.textSecondary}
        />
      </Pressable>

      {expanded && (
        <View style={styles.body}>
          <View style={styles.actions}>
            <AiActionButton
              icon="text"
              label={transcribing ? 'Transcribing…' : 'Transcribe'}
              description="Offline · on-device"
              disabled={transcribing || !audioUri || !isTranscriptionAvailable()}
              loading={transcribing}
              onPress={handleTranscribe}
            />
            <AiActionButton
              icon="reader-outline"
              label={summarizing ? 'Summarizing…' : 'Summarize'}
              description={geminiReady ? 'Gemini AI' : 'Offline fallback'}
              disabled={summarizing || !hasContent}
              loading={summarizing}
              onPress={handleSummarize}
            />
            <AiActionButton
              icon="create-outline"
              label={generatingTitle ? 'Generating…' : 'Generate Title'}
              description={geminiReady ? 'Gemini AI' : 'Offline fallback'}
              disabled={generatingTitle || !hasContent}
              loading={generatingTitle}
              onPress={handleGenerateTitle}
            />
          </View>

          {isTranscriptionAvailable() && (
            <Pressable
              onPress={cycleModel}
              style={[styles.modelPicker, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.modelLabel, { color: theme.textSecondary }]}>Whisper model</Text>
              <Text style={[styles.modelValue, { color: theme.text }]}>
                {selectedModel?.label} · {selectedModel?.size}
              </Text>
            </Pressable>
          )}

          {transcriptionProgress && transcribing && (
            <View style={[styles.statusBox, { backgroundColor: theme.tintMuted }]}>
              <ActivityIndicator size="small" color={theme.tint} />
              <Text style={[styles.statusText, { color: theme.tint }]}>
                {transcriptionProgress.message}
              </Text>
            </View>
          )}

          {aiMessage && (
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>{aiMessage}</Text>
          )}

          {transcript?.trim() ? (
            <View style={[styles.resultBlock, { borderColor: theme.border }]}>
              <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>Transcript</Text>
              <Text style={[styles.resultText, { color: theme.text }]}>{transcript}</Text>
            </View>
          ) : null}

          {summary?.trim() ? (
            <View style={[styles.resultBlock, { borderColor: theme.border }]}>
              <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>Summary</Text>
              <Text style={[styles.resultText, { color: theme.text }]}>{summary}</Text>
              {keyPoints && keyPoints.length > 0 && (
                <View style={styles.keyPoints}>
                  {keyPoints.map((point) => (
                    <View key={point} style={styles.keyPointRow}>
                      <Text style={[styles.bullet, { color: theme.tint }]}>•</Text>
                      <Text style={[styles.keyPointText, { color: theme.text }]}>{point}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : null}

          {Platform.OS === 'web' && (
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              AI voice transcription runs on iOS and Android devices with a native build.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

interface AiActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
}

function AiActionButton({
  icon,
  label,
  description,
  disabled,
  loading,
  onPress,
}: AiActionButtonProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionButton,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={theme.tint} />
      ) : (
        <Ionicons name={icon} size={18} color={theme.tint} />
      )}
      <Text style={[styles.actionLabel, { color: theme.text }]}>{label}</Text>
      <Text style={[styles.actionDescription, { color: theme.textSecondary }]}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  body: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  actions: {
    gap: Spacing.sm,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 4,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  actionDescription: {
    fontSize: 12,
    fontWeight: '500',
  },
  modelPicker: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 4,
  },
  modelLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  modelValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  statusText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  resultBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  resultText: {
    fontSize: 15,
    lineHeight: 22,
  },
  keyPoints: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  keyPointRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  bullet: {
    fontSize: 16,
    lineHeight: 22,
  },
  keyPointText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  hint: {
    fontSize: 12,
    lineHeight: 18,
  },
});
