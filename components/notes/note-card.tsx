import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useNotes } from '@/context/notes-context';
import { useCategories } from '@/context/categories-context';
import type { Note } from '@/types/note';
import { formatRelativeDate } from '@/utils/format-date';
import { useState } from 'react';
import { MarkdownBody } from '@/components/ui/markdown-body';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface NoteCardProps {
  note: Note;
  onPress: () => void;
  onTagPress?: (tag: string) => void;
  onDeleted?: () => void;
}

export function NoteCard({ note: initialNote, onPress, onTagPress, onDeleted }: NoteCardProps) {
  const theme = useAppTheme();
  const { pinNote, unpinNote, archiveNote, unarchiveNote, deleteNote, getNote, updateNote } = useNotes();
  const { categories } = useCategories();
  const [menuVisible, setMenuVisible] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);

  // Use live note from context so pin state updates immediately
  const note = getNote(initialNote.id) ?? initialNote;

  const handleLongPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setMenuVisible(true);
  };

  const handlePin = async () => {
    setMenuVisible(false);
    if (note.isPinned) {
      await unpinNote(note.id);
    } else {
      await pinNote(note.id);
    }
  };

  const handleArchive = async () => {
    setMenuVisible(false);
    if (note.isArchived) {
      await unarchiveNote(note.id);
    } else {
      await archiveNote(note.id);
    }
  };

  const handleDelete = () => {
    setMenuVisible(false);
    Alert.alert('Delete note', 'Are you sure you want to delete this?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteNote(note.id);
          onDeleted?.();
        },
      },
    ]);
  };

  const handleShare = async () => {
    setMenuVisible(false);
    const text = [note.title, note.body].filter(Boolean).join('\n\n');
    try {
      await Share.share({ message: text, title: note.title });
    } catch {
      // user cancelled or error — do nothing
    }
  };

  const handleCategorySelect = async (categoryName: string | null) => {
    setCategoryMenuVisible(false);
    await updateNote(note.id, { category: categoryName ?? undefined });
  };

  const hasRecordings = Boolean(note.audioUri || (note.audioRecordings && note.audioRecordings.length > 0));

  return (
    <>
      <Pressable
        onPress={onPress}
        onLongPress={handleLongPress}
        delayLongPress={400}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            opacity: note.isArchived ? 0.85 : 1,
          },
          Shadow.card,
          pressed && styles.pressed,
        ]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {note.title.trim() || 'Untitled'}
          </Text>
          <View style={styles.badges}>
            {note.isArchived && (
              <View style={[styles.badge, { backgroundColor: theme.tintMuted }]}>
                <Ionicons name="archive" size={11} color={theme.textSecondary} />
              </View>
            )}
            {note.isPinned && !note.isArchived && (
              <Ionicons name="pin" size={14} color={theme.tint} />
            )}
            {hasRecordings && (
              <View style={[styles.badge, { backgroundColor: theme.voiceMuted }]}>
                <Ionicons name="mic" size={12} color={theme.voice} />
              </View>
            )}
          </View>
        </View>

        {note.body.trim().length > 0 && (
          <View style={styles.bodyPreview} pointerEvents="none">
            <MarkdownBody fontSize={13} numberOfLines={2}>
              {note.body.trim().slice(0, 120)}
            </MarkdownBody>
          </View>
        )}

        <Text style={[styles.date, { color: theme.textSecondary }]}>
          {formatRelativeDate(note.updatedAt)}
        </Text>
      </Pressable>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menu, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.menuTitle, { color: theme.textSecondary }]} numberOfLines={1}>
              {note.title || 'Untitled'}
            </Text>
            <MenuOption
              icon={note.isPinned ? 'pin' : 'pin-outline'}
              label={note.isPinned ? 'Unpin' : 'Pin'}
              onPress={handlePin}
            />
            <MenuOption
              icon={note.isArchived ? 'archive' : 'archive-outline'}
              label={note.isArchived ? 'Unarchive' : 'Archive'}
              onPress={handleArchive}
            />
            <MenuOption icon="share-outline" label="Share" onPress={handleShare} />
            <MenuOption icon="folder-outline" label="Category" onPress={() => { setMenuVisible(false); setCategoryMenuVisible(true); }} />
            <MenuOption icon="trash-outline" label="Delete" onPress={handleDelete} destructive />
          </View>
        </Pressable>
      </Modal>
      <Modal
        visible={categoryMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryMenuVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setCategoryMenuVisible(false)}>
          <View style={[styles.menu, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.menuTitle, { color: theme.textSecondary }]}>Move to Category</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              <MenuOption
                icon="add-circle-outline"
                label="Create new category"
                onPress={() => {
                  setCategoryMenuVisible(false);
                  Alert.prompt(
                    'New Category',
                    'Enter a name for the new category',
                    async (name) => {
                      if (name?.trim()) {
                        await updateNote(note.id, { category: name.trim() });
                      }
                    }
                  );
                }}
              />
              <MenuOption
                icon="close-circle-outline"
                label="No Category"
                onPress={() => handleCategorySelect(null)}
              />
              {categories.map((cat) => (
                <MenuOption
                  key={cat.id}
                  icon={note.category === cat.name ? 'checkmark-circle' : 'folder-outline'}
                  label={cat.name}
                  onPress={() => handleCategorySelect(cat.name)}
                />
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function MenuOption({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuOption, { opacity: pressed ? 0.7 : 1 }]}>
      <Ionicons name={icon} size={20} color={destructive ? theme.danger : theme.text} />
      <Text style={[styles.menuOptionLabel, { color: destructive ? theme.danger : theme.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

interface ActionChipProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active?: boolean;
  onPress: () => void;
}

export function ActionChip({ label, icon, active = false, onPress }: ActionChipProps) {
  const theme = useAppTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.92, { damping: 12, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[
        styles.actionChip,
        animatedStyle,
        {
          backgroundColor: active ? theme.tintMuted : theme.surface,
          borderColor: active ? theme.tint : theme.border,
        },
      ]}>
      <Ionicons name={icon} size={16} color={active ? theme.tint : theme.textSecondary} />
      <Text style={[styles.actionLabel, { color: active ? theme.tint : theme.textSecondary }]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    gap: Spacing.xs,
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
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyPreview: {
    overflow: 'hidden',
    maxHeight: 44,
  },
  date: {
    fontSize: 13,
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  menu: {
    width: '100%',
    maxWidth: 320,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    paddingVertical: Spacing.sm,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  menuOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
