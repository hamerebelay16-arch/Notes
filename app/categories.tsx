import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenHeader } from '@/components/ui/screen-header';
import { Radius, Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
import { useAppTheme } from '@/hooks/use-app-theme';

export default function CategoriesScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { categories, createCategory, deleteCategory } = useCategories();
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;

    setAdding(true);
    try {
      const created = await createCategory(name);
      if (!created) {
        Alert.alert('Could not add', 'That category already exists or the name is invalid.');
        return;
      }
      setNewName('');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete category', `Remove "${name}"? Notes keep their tags.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteCategory(id),
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Categories" onBack={() => router.back()} />

      <View style={styles.content}>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          Create categories of interest, then tag notes when you write or edit them.
        </Text>

        <View
          style={[
            styles.addRow,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="New category…"
            placeholderTextColor={theme.placeholder}
            style={[styles.input, { color: theme.text }]}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
            editable={!adding}
          />
          <Pressable
            onPress={handleAdd}
            disabled={adding || !newName.trim()}
            style={[
              styles.addBtn,
              { backgroundColor: theme.tint },
              (adding || !newName.trim()) && styles.addBtnDisabled,
            ]}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No categories yet. Add one above to get started.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.row,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}>
              <View style={[styles.dot, { backgroundColor: theme.tintMuted }]}>
                <Ionicons name="pricetag" size={14} color={theme.tint} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.text }]}>{item.name}</Text>
              <Pressable onPress={() => handleDelete(item.id, item.name)} hitSlop={8}>
                <Ionicons name="trash-outline" size={20} color={theme.danger} />
              </Pressable>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.sm,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  list: {
    paddingBottom: Spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  empty: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
