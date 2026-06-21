import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export function EmptyNotes() {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: theme.tintMuted }]}>
        <Ionicons name="document-text-outline" size={40} color={theme.tint} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>No notes yet</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Tap the + button to capture your first idea, thought, or voice memo.
      </Text>
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
