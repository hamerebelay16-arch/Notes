import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useCategories } from '@/context/categories-context';

interface TagInputModalProps {
  visible: boolean;
  initialValue?: string;
  onConfirm: (tag: string | null) => void;
  onDismiss: () => void;
}

export function TagInputModal({ visible, initialValue = '', onConfirm, onDismiss }: TagInputModalProps) {
  const theme = useAppTheme();
  const { categories } = useCategories();
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible]);

  const handleConfirm = () => {
    Keyboard.dismiss();
    onConfirm(value.trim() || null);
  };

  const handleDismiss = () => {
    Keyboard.dismiss();
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}>
      <Pressable style={styles.overlay} onPress={handleDismiss}>
        <Pressable style={[styles.dialog, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Add Tag</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Enter a tag for this note
          </Text>

          <View style={[styles.inputRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <Ionicons name="pricetag-outline" size={16} color={theme.textSecondary} />
            <TextInput
              ref={inputRef}
              value={value}
              onChangeText={setValue}
              placeholder="e.g. work, ideas…"
              placeholderTextColor={theme.placeholder}
              style={[styles.input, { color: theme.text }]}
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {value.length > 0 && (
              <Pressable onPress={() => setValue('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
              </Pressable>
            )}
          </View>

          {categories.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={[styles.suggestionsLabel, { color: theme.textSecondary }]}>
                Quick Categories:
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsList}>
                {categories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => setValue(cat.name)}
                    style={[
                      styles.suggestionChip,
                      {
                        backgroundColor: value === cat.name ? theme.tintMuted : theme.surfaceElevated,
                        borderColor: value === cat.name ? theme.tint : theme.border,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.suggestionLabel,
                        { color: value === cat.name ? theme.tint : theme.textSecondary },
                      ]}>
                      {cat.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.buttons}>
            <Pressable
              onPress={handleDismiss}
              style={[styles.btn, { borderColor: theme.border }]}>
              <Text style={[styles.btnLabel, { color: theme.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              style={[styles.btn, styles.btnPrimary, { backgroundColor: theme.tint }]}>
              <Text style={[styles.btnLabel, { color: '#fff' }]}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: -Spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  suggestionsContainer: {
    gap: Spacing.xs,
  },
  suggestionsLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionsList: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingVertical: 2,
  },
  suggestionChip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  suggestionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  btn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
  },
  btnPrimary: {
    borderWidth: 0,
  },
  btnLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
