import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface FormattingToolbarProps {
  onApply: (type: 'bold' | 'italic' | 'underline' | 'checklist' | 'bullet') => void;
}

export function FormattingToolbar({ onApply }: FormattingToolbarProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Pressable
          onPress={() => onApply('bold')}
          style={({ pressed }) => [styles.btn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, opacity: pressed ? 0.7 : 1 }]}>
          <Text style={[styles.btnText, { color: theme.text, fontWeight: '700' }]}>B</Text>
        </Pressable>

        <Pressable
          onPress={() => onApply('italic')}
          style={({ pressed }) => [styles.btn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, opacity: pressed ? 0.7 : 1 }]}>
          <Text style={[styles.btnText, { color: theme.text, fontStyle: 'italic', fontWeight: '700' }]}>I</Text>
        </Pressable>

        <Pressable
          onPress={() => onApply('underline')}
          style={({ pressed }) => [styles.btn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, opacity: pressed ? 0.7 : 1 }]}>
          <Text style={[styles.btnText, { color: theme.text, textDecorationLine: 'underline', fontWeight: '700' }]}>U</Text>
        </Pressable>

        <View style={[styles.divider, { borderColor: theme.border }]} />

        <Pressable
          onPress={() => onApply('checklist')}
          style={({ pressed }) => [styles.btn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, opacity: pressed ? 0.7 : 1 }]}>
          <Ionicons name="checkbox-outline" size={18} color={theme.tint} />
        </Pressable>

        <Pressable
          onPress={() => onApply('bullet')}
          style={({ pressed }) => [styles.btn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, opacity: pressed ? 0.7 : 1 }]}>
          <Ionicons name="list-outline" size={18} color={theme.tint} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
  },
  scrollContent: {
    gap: Spacing.sm,
    flexDirection: 'row',
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 16,
  },
  divider: {
    borderLeftWidth: 1,
    height: 24,
    alignSelf: 'center',
    marginHorizontal: Spacing.xs,
  },
});
