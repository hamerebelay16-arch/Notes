import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { Note } from '@/types/note';
import { formatRelativeDate } from '@/utils/format-date';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface NoteCardProps {
  note: Note;
  onPress: () => void;
  onTagPress?: (tag: string) => void;
}

export function NoteCard({ note, onPress, onTagPress }: NoteCardProps) {
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
          borderColor: note.isArchived ? theme.border : theme.border,
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
          {note.tags.slice(0, 4).map((tag) =>
            onTagPress ? (
              <Pressable
                key={tag}
                onPress={() => onTagPress(tag)}
                style={[styles.tag, { backgroundColor: theme.tintMuted }]}>
                <Text style={[styles.tagLabel, { color: theme.tint }]} numberOfLines={1}>
                  {tag}
                </Text>
              </Pressable>
            ) : (
              <View key={tag} style={[styles.tag, { backgroundColor: theme.tintMuted }]}>
                <Text style={[styles.tagLabel, { color: theme.tint }]} numberOfLines={1}>
                  {tag}
                </Text>
              </View>
            )
          )}
          {note.tags.length > 4 && (
            <Text style={[styles.moreTags, { color: theme.textSecondary }]}>
              +{note.tags.length - 4}
            </Text>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={[styles.date, { color: theme.textSecondary }]}>
          {formatRelativeDate(note.updatedAt)}
        </Text>
      </View>
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
    gap: Spacing.sm + 2,
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
  preview: {
    fontSize: 15,
    lineHeight: 22,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  tag: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    maxWidth: 110,
  },
  tagLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  moreTags: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    marginTop: 2,
  },
  date: {
    fontSize: 13,
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
