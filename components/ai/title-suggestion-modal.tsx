import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface TitleSuggestionModalProps {
  visible: boolean;
  suggestedTitle: string;
  onAccept: (title: string) => void;
  onKeepCurrent: () => void;
  onDismiss: () => void;
}

export function TitleSuggestionModal({
  visible,
  suggestedTitle,
  onAccept,
  onKeepCurrent,
  onDismiss,
}: TitleSuggestionModalProps) {
  const theme = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Suggested title</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            AI generated a title from your note. Accept it or keep your current title.
          </Text>

          <TextInput
            value={suggestedTitle}
            editable={false}
            style={[
              styles.input,
              {
                color: theme.text,
                backgroundColor: theme.surfaceElevated,
                borderColor: theme.border,
              },
            ]}
          />

          <View style={styles.actions}>
            <Pressable
              onPress={() => onAccept(suggestedTitle)}
              style={[styles.primaryBtn, { backgroundColor: theme.tint }]}>
              <Text style={styles.primaryLabel}>Use this title</Text>
            </Pressable>
            <Pressable
              onPress={onKeepCurrent}
              style={[styles.secondaryBtn, { borderColor: theme.border }]}>
              <Text style={[styles.secondaryLabel, { color: theme.text }]}>Keep current</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  primaryBtn: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  secondaryLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
