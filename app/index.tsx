import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyNotes } from '@/components/notes/empty-notes';
import { NoteSection } from '@/components/notes/note-section';
import { TagFilterBar } from '@/components/notes/tag-filter-bar';
import { Fab } from '@/components/ui/fab';
import { SearchBar } from '@/components/ui/search-bar';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeMode } from '@/context/theme-context';
import { useNotes } from '@/context/notes-context';
import { useCategories } from '@/context/categories-context';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { Note } from '@/types/note';
import {
  filterByCategory,
  getNotesForFilter,
  getPinnedNotes,
  getRecentNotes,
  getSearchResults,
  type NoteFilter,
} from '@/utils/note-filters';

const DRAWER_WIDTH = 260;

function CategoryInputModal({
  visible,
  onConfirm,
  onDismiss,
}: {
  visible: boolean;
  onConfirm: (val: string) => void;
  onDismiss: () => void;
}) {
  const theme = useAppTheme();
  const [value, setValue] = useState('');

  const handleConfirm = () => { Keyboard.dismiss(); onConfirm(value); setValue(''); };
  const handleDismiss = () => { Keyboard.dismiss(); onDismiss(); setValue(''); };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <Pressable style={modalStyles.overlay} onPress={handleDismiss}>
        <Pressable style={[modalStyles.dialog, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[modalStyles.title, { color: theme.text }]}>New Category</Text>
          <View style={[modalStyles.inputRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder="Category name…"
              placeholderTextColor={theme.placeholder}
              style={[modalStyles.input, { color: theme.text }]}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
              autoCapitalize="words"
            />
          </View>
          <View style={modalStyles.buttons}>
            <Pressable onPress={handleDismiss} style={[modalStyles.btn, { borderColor: theme.border }]}>
              <Text style={[modalStyles.btnLabel, { color: theme.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleConfirm} style={[modalStyles.btn, modalStyles.btnPrimary, { backgroundColor: theme.tint }]}>
              <Text style={[modalStyles.btnLabel, { color: '#fff' }]}>Add</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  dialog: { width: '100%', maxWidth: 340, borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg, gap: Spacing.md },
  title: { fontSize: 18, fontWeight: '700' },
  inputRow: { flexDirection: 'row', borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  input: { flex: 1, fontSize: 16, padding: 0 },
  buttons: { flexDirection: 'row', gap: Spacing.sm },
  btn: { flex: 1, borderWidth: 1, borderRadius: Radius.md, paddingVertical: Spacing.sm + 2, alignItems: 'center' },
  btnPrimary: { borderWidth: 0 },
  btnLabel: { fontSize: 15, fontWeight: '600' },
});

export default function HomeScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { setMode, isDark } = useThemeMode();
  const insets = useSafeAreaInsets();
  const { notes, loading, refreshNotes } = useNotes();
  const { categories, createCategory } = useCategories();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<NoteFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [addCategoryVisible, setAddCategoryVisible] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  useFocusEffect(
    useCallback(() => {
      refreshNotes();
    }, [refreshNotes])
  );

  const openDrawer = () => {
    setDrawerOpen(true);
    setDrawerVisible(true);
    Animated.spring(drawerAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const closeDrawer = (cb?: () => void) => {
    cb?.();
    setDrawerOpen(false);
    Animated.spring(drawerAnim, { toValue: -DRAWER_WIDTH, useNativeDriver: true, damping: 20, stiffness: 200 }).start(() => {
      setDrawerVisible(false);
    });
  };

  const isSearching = searchQuery.trim().length > 0;

  const baseForFilter = useMemo(() => getNotesForFilter(notes, filter), [notes, filter]);
  const categoryFiltered = useMemo(() => filterByCategory(baseForFilter, selectedCategory), [baseForFilter, selectedCategory]);

  const displayNotes = useMemo(() => {
    if (!isSearching) return categoryFiltered;
    return getSearchResults(categoryFiltered, searchQuery);
  }, [categoryFiltered, searchQuery, isSearching]);

  const pinnedNotes = useMemo(
    () => (filter === 'all' && !selectedCategory && !isSearching ? getPinnedNotes(notes) : []),
    [notes, filter, selectedCategory, isSearching]
  );

  const recentNotes = useMemo(
    () => (filter === 'all' && !selectedCategory && !isSearching ? getRecentNotes(notes) : []),
    [notes, filter, selectedCategory, isSearching]
  );

  const showSectionedView = filter === 'all' && !selectedCategory && !isSearching && displayNotes.length > 0;

  const handleCreate = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/note/new');
  };

  const handleNotePress = (note: Note) => {
    router.push({ pathname: '/note/[id]', params: { id: note.id } });
  };

  const emptyVariant = useMemo(() => {
    if (isSearching) return 'search' as const;
    if (selectedCategory) return 'tag' as const;
    return filter;
  }, [isSearching, selectedCategory, filter]);

  const showEmpty = !loading && displayNotes.length === 0;
  const hasAnyNotes = notes.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {drawerVisible && (
        <Pressable
          style={styles.drawerOverlay}
          onPress={() => closeDrawer()}
          pointerEvents={drawerOpen ? 'auto' : 'none'}
        />
      )}

      <Animated.View
        style={[
          styles.drawer,
          {
            backgroundColor: theme.surface,
            borderRightColor: theme.border,
            paddingTop: insets.top + Spacing.lg,
            transform: [{ translateX: drawerAnim }],
          },
        ]}
        pointerEvents={drawerVisible ? 'auto' : 'none'}>
        <Text style={[styles.drawerTitle, { color: theme.text }]}>MindSpace</Text>
        <DrawerItem icon="layers-outline" label="All Notes" onPress={() => closeDrawer(() => setFilter('all'))} />
        <DrawerItem icon="archive-outline" label="Archive" onPress={() => closeDrawer(() => setFilter('archived'))} />
        <DrawerItem icon="folder-outline" label="Categories" onPress={() => closeDrawer(() => router.push('/categories'))} />
        <View style={[styles.drawerDivider, { borderColor: theme.border }]} />
        <DrawerItem
          icon={isDark ? 'sunny-outline' : 'moon-outline'}
          label={isDark ? 'Light Mode' : 'Dark Mode'}
          onPress={() => { setMode(isDark ? 'light' : 'dark'); closeDrawer(); }}
        />
      </Animated.View>

      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.headerTop}>
          <Pressable onPress={openDrawer} hitSlop={8} style={styles.menuBtn}>
            <Ionicons name="menu-outline" size={26} color={theme.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.text }]}>MindSpace</Text>
            <Text style={[styles.motto, { color: theme.textSecondary }]}>
              Clear your mind. Keep your ideas.
            </Text>
          </View>
        </View>

        {(hasAnyNotes || isSearching) && (
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        )}

        {(categories.length > 0 || hasAnyNotes) && (
          <TagFilterBar
            tags={categories.map((c) => c.name)}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            onAddCategoryPress={() => setAddCategoryVisible(true)}
          />
        )}
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      ) : showEmpty ? (
        <EmptyNotes variant={emptyVariant} query={searchQuery} tag={selectedCategory ?? undefined} />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {isSearching ? (
            <NoteSection
              title={`Results (${displayNotes.length})`}
              notes={displayNotes}
              onNotePress={handleNotePress}
            />
          ) : showSectionedView ? (
            <View style={{ gap: Spacing.xl }}>
              {pinnedNotes.length > 0 && (
                <NoteSection title="Pinned" notes={pinnedNotes} onNotePress={handleNotePress} />
              )}
              {recentNotes.length > 0 && (
                <NoteSection title="Recent" notes={recentNotes} onNotePress={handleNotePress} />
              )}
            </View>
          ) : (
            <NoteSection
              title={filter === 'archived' ? 'Archived' : selectedCategory ?? 'Notes'}
              notes={displayNotes}
              onNotePress={handleNotePress}
            />
          )}
        </ScrollView>
      )}

      <Fab onPress={handleCreate} />

      <CategoryInputModal
        visible={addCategoryVisible}
        onConfirm={async (val) => {
          if (val.trim()) await createCategory(val.trim());
          setAddCategoryVisible(false);
        }}
        onDismiss={() => setAddCategoryVisible(false)}
      />
    </View>
  );
}

function DrawerItem({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.drawerItem, { opacity: pressed ? 0.6 : 1 }]}>
      <Ionicons name={icon} size={20} color={theme.tint} />
      <Text style={[styles.drawerItemLabel, { color: theme.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  drawerOverlay: {
    position: 'absolute', top: 0, bottom: 0, left: DRAWER_WIDTH, right: 0,
    backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 10,
  },
  drawer: {
    position: 'absolute', top: 0, left: 0, bottom: 0, width: DRAWER_WIDTH,
    zIndex: 20, borderRightWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.lg, gap: Spacing.xs,
  },
  drawerTitle: { fontSize: 22, fontWeight: '800', marginBottom: Spacing.md },
  drawerItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderRadius: Radius.md },
  drawerItemLabel: { fontSize: 16, fontWeight: '600' },
  drawerDivider: { borderTopWidth: StyleSheet.hairlineWidth, marginVertical: Spacing.sm },
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, gap: Spacing.md },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  menuBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, gap: 2 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  motto: { fontSize: 13, fontWeight: '500' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.xl },
});
