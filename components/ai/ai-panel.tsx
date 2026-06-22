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
  onReplaceBody?: (text: string) => void;
}

export function AiPanel({
  body,
  transcript,
  summary,
  keyPoints,
  onSummaryChange,
  onTitleGenerated,
  onReplaceBody,
}: AiPanelProps) {
  const theme = useAppTheme();
  const [expanded, setExpanded] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [generatingTitle, setGeneratingTitle] = useState(false);

  const hasContent = Boolean(body.trim() || transcript?.trim());

  const handleSummarize = async () => {
    if (!hasContent) {
      Alert.alert('Nothing to summarize', 'Add text first.');
      return;
    }

    setSummarizing(true);
    try {
      const result = await summarizeNote(body, transcript);
      onSummaryChange(result.summary, result.keyPoints);
    } catch {
      Alert.alert('Summarization failed', 'Could not summarize this note.');
    } finally {
      setSummarizing(false);
    }
  };

  const handleGenerateTitle = async () => {
    if (!hasContent) {
      Alert.alert('Nothing to analyze', 'Add text first.');
      return;
    }

    setGeneratingTitle(true);
    try {
      const result = await generateNoteTitle(body, transcript);
      onTitleGenerated(result.title);
    } catch {
      Alert.alert('Title generation failed', 'Could not generate a title.');
    } finally {
      setGeneratingTitle(false);
    }
  };

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
          <Text style={[styles.title, { color: theme.text }]}>AI Assistant</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.textSecondary}
        />
      </Pressable>

      {expanded && (
        <View style={styles.body}>
          <AiActionButton
            icon="reader-outline"
            label={summarizing ? 'Summarizing…' : 'Summarize'}
            disabled={summarizing || !hasContent}
            loading={summarizing}
            onPress={handleSummarize}
          />

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
              {onReplaceBody && (
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      'Replace note text',
                      'This will replace your current note body with the summary. Continue?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Replace', onPress: () => { onReplaceBody(summary.trim()); setExpanded(false); } },
                      ]
                    );
                  }}
                  style={({ pressed }) => [
                    styles.replaceBtn,
                    { backgroundColor: theme.tintMuted, borderColor: theme.tint, opacity: pressed ? 0.7 : 1 },
                  ]}>
                  <Ionicons name="swap-horizontal-outline" size={14} color={theme.tint} />
                  <Text style={[styles.replaceBtnLabel, { color: theme.tint }]}>Replace text with summary</Text>
                </Pressable>
              )}
            </View>
          ) : null}

          <AiActionButton
            icon="create-outline"
            label={generatingTitle ? 'Generating…' : 'Generate Title'}
            disabled={generatingTitle || !hasContent}
            loading={generatingTitle}
            onPress={handleGenerateTitle}
          />

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
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
}

function AiActionButton({ icon, label, disabled, loading, onPress }: AiActionButtonProps) {
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
  body: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '700',
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
  replaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.xs,
  },
  replaceBtnLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    lineHeight: 18,
  },
});
