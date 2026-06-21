import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface TagFilterBarProps {
  tags: string[];
  selected: string | null;
  onSelect: (tag: string | null) => void;
}

export function TagFilterBar({ tags, selected, onSelect }: TagFilterBarProps) {
  const theme = useAppTheme();

  if (tags.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Pressable
        onPress={() => onSelect(null)}
        style={[
          styles.chip,
          {
            backgroundColor: selected === null ? theme.tintMuted : theme.surface,
            borderColor: selected === null ? theme.tint : theme.border,
          },
        ]}>
        <Text
          style={[
            styles.chipLabel,
            { color: selected === null ? theme.tint : theme.textSecondary },
          ]}>
          All tags
        </Text>
      </Pressable>

      {tags.map((tag) => {
        const isSelected = selected === tag;
        return (
          <Pressable
            key={tag}
            onPress={() => onSelect(isSelected ? null : tag)}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? theme.tintMuted : theme.surface,
                borderColor: isSelected ? theme.tint : theme.border,
              },
            ]}>
            <Text
              style={[
                styles.chipLabel,
                { color: isSelected ? theme.tint : theme.textSecondary },
              ]}
              numberOfLines={1}>
              {tag}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    maxWidth: 140,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
