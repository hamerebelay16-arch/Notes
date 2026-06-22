import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { NoteFilter } from '@/utils/note-filters';

const FILTERS: { key: NoteFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'All', icon: 'layers-outline' },
];

interface FilterTabsProps {
  value: NoteFilter;
  onChange: (filter: NoteFilter) => void;
  counts: Record<NoteFilter, number>;
}

export function FilterTabs({ value, onChange, counts }: FilterTabsProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      {FILTERS.map((filter) => {
        const isActive = value === filter.key;
        return (
          <Pressable
            key={filter.key}
            onPress={() => onChange(filter.key)}
            style={[
              styles.tab,
              {
                backgroundColor: isActive ? theme.tintMuted : theme.surface,
                borderColor: isActive ? theme.tint : theme.border,
              },
            ]}>
            <Ionicons
              name={filter.icon}
              size={14}
              color={isActive ? theme.tint : theme.textSecondary}
            />
            <Text
              style={[
                styles.label,
                { color: isActive ? theme.tint : theme.textSecondary },
              ]}>
              {filter.label}
            </Text>
            {counts[filter.key] > 0 && (
              <View style={[styles.badge, { backgroundColor: isActive ? theme.tint : theme.border }]}>
                <Text style={[styles.badgeText, { color: isActive ? '#FFFFFF' : theme.textSecondary }]}>
                  {counts[filter.key]}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
