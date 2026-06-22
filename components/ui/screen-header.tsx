import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface ActionItem {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: ActionItem;
  secondaryAction?: ActionItem;
  editToggle?: { editing: boolean; onPress: () => void };
}

export function ScreenHeader({ title, onBack, rightAction, secondaryAction, editToggle }: ScreenHeaderProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.sm,
          backgroundColor: theme.background,
          borderBottomColor: theme.border,
        },
      ]}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={theme.tint} />
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.rightActions}>
          {editToggle && (
            <Pressable onPress={editToggle.onPress} style={styles.actionBtn} hitSlop={8}>
              <Ionicons
                name={editToggle.editing ? 'eye-outline' : 'create-outline'}
                size={22}
                color={theme.tint}
              />
            </Pressable>
          )}
          {secondaryAction && (
            <Pressable
              onPress={secondaryAction.onPress}
              disabled={secondaryAction.disabled}
              style={[styles.actionBtn, secondaryAction.disabled && styles.disabled]}
              hitSlop={8}>
              {secondaryAction.icon ? (
                <Ionicons
                  name={secondaryAction.icon}
                  size={22}
                  color={secondaryAction.destructive ? theme.danger : theme.tint}
                />
              ) : (
                <Text
                  style={[
                    styles.actionLabel,
                    { color: secondaryAction.destructive ? theme.danger : theme.tint },
                  ]}>
                  {secondaryAction.label}
                </Text>
              )}
            </Pressable>
          )}

          {rightAction ? (
            <Pressable
              onPress={rightAction.onPress}
              disabled={rightAction.disabled}
              style={[styles.actionBtn, rightAction.disabled && styles.disabled]}>
              {rightAction.icon ? (
                <Ionicons
                  name={rightAction.icon}
                  size={22}
                  color={rightAction.destructive ? theme.danger : theme.tint}
                />
              ) : (
                <Text
                  style={[
                    styles.actionLabel,
                    { color: rightAction.destructive ? theme.danger : theme.tint },
                  ]}>
                  {rightAction.label}
                </Text>
              )}
            </Pressable>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: 40,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionBtn: {
    minWidth: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: Spacing.sm,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.4,
  },
});
