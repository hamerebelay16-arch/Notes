import { StyleSheet, Text, View } from 'react-native';

import { NoteCard } from '@/components/notes/note-card';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { Note } from '@/types/note';

interface NoteSectionProps {
  title: string;
  notes: Note[];
  onNotePress: (note: Note) => void;
}

export function NoteSection({ title, notes, onNotePress }: NoteSectionProps) {
  const theme = useAppTheme();

  if (notes.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: theme.textSecondary }]}>{title}</Text>
      <View style={styles.notes}>
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} onPress={() => onNotePress(note)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.md,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  notes: {
    gap: Spacing.md,
  },
});
