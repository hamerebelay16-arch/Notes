import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    destructive?: boolean;
  };
}

export function ScreenHeader({ title, onBack, rightAction }: ScreenHeaderProps) {
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

        {rightAction ? (
          <Pressable
            onPress={rightAction.onPress}
            disabled={rightAction.disabled}
            style={[styles.actionBtn, rightAction.disabled && styles.disabled]}>
            <Text
              style={[
                styles.actionLabel,
                {
                  color: rightAction.destructive ? theme.danger : theme.tint,
                },
              ]}>
              {rightAction.label}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
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
