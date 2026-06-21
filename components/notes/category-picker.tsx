import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface CategoryPickerProps {
  categories: string[];
  selected: string[];
  onToggle: (name: string) => void;
}

export function CategoryPicker({ categories, selected, onToggle }: CategoryPickerProps) {
  const theme = useAppTheme();

  if (categories.length === 0) {
    return (
      <Text style={[styles.emptyHint, { color: theme.textSecondary }]}>
        No categories yet. Add some from the Categories screen on Home.
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>Categories</Text>
      <View style={styles.chips}>
        {categories.map((name) => {
          const isSelected = selected.includes(name);
          return (
            <Pressable
              key={name}
              onPress={() => onToggle(name)}
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
                ]}>
                {name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: 14,
    lineHeight: 20,
  },
});
