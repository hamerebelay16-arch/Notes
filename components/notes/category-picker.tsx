import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useCategories } from '@/context/categories-context';

interface CategoryPickerProps {
  category: string | null;
  onChange: (category: string | null) => void;
}

export function CategoryPicker({ category, onChange }: CategoryPickerProps) {
  const theme = useAppTheme();
  const { categories, createCategory } = useCategories();
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  return (
    <>
      <Pressable
        onPress={() => setModalVisible(true)}
        style={[styles.chip, { backgroundColor: theme.tintMuted, borderColor: theme.tint }]}>
        <Ionicons name="folder-outline" size={14} color={theme.tint} />
        <Text style={[styles.chipLabel, { color: theme.tint }]} numberOfLines={1}>
          {category ?? 'No Category'}
        </Text>
        {category && (
          <Pressable onPress={() => onChange(null)} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={theme.tint} />
          </Pressable>
        )}
      </Pressable>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <View style={[styles.dialog, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>Pick a Category</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {creating ? (
                <View style={styles.createRow}>
                  <TextInput
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="Category name…"
                    placeholderTextColor={theme.placeholder}
                    style={[styles.createInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={async () => {
                      if (newName.trim()) {
                        await createCategory(newName.trim());
                        onChange(newName.trim());
                        setNewName('');
                        setCreating(false);
                        setModalVisible(false);
                      }
                    }}
                  />
                  <Pressable onPress={() => setCreating(false)} hitSlop={8}>
                    <Ionicons name="close" size={20} color={theme.textSecondary} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => setCreating(true)}
                  style={[styles.option, { borderBottomColor: theme.border }]}>
                  <Ionicons name="add-circle-outline" size={18} color={theme.tint} />
                  <Text style={[styles.optionLabel, { color: theme.tint, fontWeight: '600' }]}>Create new category</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => { onChange(null); setModalVisible(false); }}
                style={[styles.option, { borderBottomColor: theme.border }]}>
                <Text style={[styles.optionLabel, { color: theme.textSecondary }]}>No Category</Text>
                {!category && <Ionicons name="checkmark" size={18} color={theme.tint} />}
              </Pressable>
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => { onChange(cat.name); setModalVisible(false); }}
                  style={[styles.option, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.optionLabel, { color: theme.text }]}>{cat.name}</Text>
                  {category === cat.name && <Ionicons name="checkmark" size={18} color={theme.tint} />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    alignSelf: 'flex-start',
  },
  chipLabel: { fontSize: 14, fontWeight: '600' },
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
    maxHeight: 400,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  title: { fontSize: 18, fontWeight: '700' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionLabel: { fontSize: 16 },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'transparent',
  },
  createInput: {
    flex: 1,
    fontSize: 15,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
});
