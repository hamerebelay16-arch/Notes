import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { Note } from '@/types/note';
import { formatRelativeDate } from '@/utils/format-date';

interface NoteCardProps {
  note: Note;
  onPress: () => void;
}

export function NoteCard({ note, onPress }: NoteCardProps) {
  const theme = useAppTheme();
  const preview = note.body.trim() || (note.audioUri ? 'Voice note' : 'No content');
  const hasAudio = Boolean(note.audioUri);
  const hasTags = note.tags.length > 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        Shadow.card,
        pressed && styles.pressed,
      ]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {note.title.trim() || 'Untitled'}
        </Text>
        <View style={styles.badges}>
          {note.isPinned && <Ionicons name="pin" size={14} color={theme.tint} />}
          {hasAudio && (
            <View style={[styles.badge, { backgroundColor: theme.voiceMuted }]}>
              <Ionicons name="mic" size={12} color={theme.voice} />
            </View>
          )}
        </View>
      </View>

      <Text style={[styles.preview, { color: theme.textSecondary }]} numberOfLines={2}>
        {preview}
      </Text>

      {hasTags && (
        <View style={styles.tags}>
          {note.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: theme.tintMuted }]}>
              <Text style={[styles.tagLabel, { color: theme.tint }]} numberOfLines={1}>
                {tag}
              </Text>
            </View>
          ))}
          {note.tags.length > 3 && (
            <Text style={[styles.moreTags, { color: theme.textSecondary }]}>
              +{note.tags.length - 3}
            </Text>
          )}
        </View>
      )}

      <Text style={[styles.date, { color: theme.textSecondary }]}>
        {formatRelativeDate(note.updatedAt)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  badge: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    fontSize: 15,
    lineHeight: 22,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  tag: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    maxWidth: 120,
  },
  tagLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  moreTags: {
    fontSize: 12,
    fontWeight: '500',
  },
  date: {
    fontSize: 13,
    fontWeight: '500',
  },
});
