import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { NoteFilter } from '@/utils/note-filters';

export type EmptyNotesVariant = 'all' | NoteFilter | 'search' | 'tag';

interface EmptyNotesProps {
  variant?: EmptyNotesVariant;
  query?: string;
  tag?: string;
}

const CONFIG: Record<
  EmptyNotesVariant,
  { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string }
> = {
  all: {
    icon: 'document-text-outline',
    title: 'No notes yet',
    subtitle: 'Tap the + button to capture your first idea, thought, or voice memo.',
  },
  pinned: {
    icon: 'pin-outline',
    title: 'No pinned notes',
    subtitle: 'Open a note and tap Pin to keep important notes at the top.',
  },
  archived: {
    icon: 'archive-outline',
    title: 'No archived notes',
    subtitle: 'Archived notes are stored here. Archive from any note detail screen.',
  },
  search: {
    icon: 'search-outline',
    title: 'No results',
    subtitle: 'Try a different search term or clear the search bar.',
  },
  tag: {
    icon: 'pricetag-outline',
    title: 'No notes with this tag',
    subtitle: 'Add this tag when creating or editing a note.',
  },
};

export function EmptyNotes({ variant = 'all', query, tag }: EmptyNotesProps) {
  const theme = useAppTheme();
  const config = CONFIG[variant];

  const subtitle =
    variant === 'search' && query
      ? `Nothing matches "${query.trim()}". Try another keyword.`
      : variant === 'tag' && tag
        ? `No notes tagged "${tag}". Add it from a note editor.`
        : config.subtitle;

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: theme.tintMuted }]}>
        <Ionicons name={config.icon} size={40} color={theme.tint} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{config.title}</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: 120,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});
