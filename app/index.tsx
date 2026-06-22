import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
import { TagInputModal } from '@/components/ui/tag-input-modal';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { Note } from '@/types/note';
import {
  filterByTag,
  getAllUsedTags,
  getArchivedNotes,
  getNotesForFilter,
  getPinnedNotes,
  getRecentNotes,
  getSearchResults,
  isActiveNote,
  type NoteFilter,
} from '@/utils/note-filters';

const DRAWER_WIDTH = 260;

export default function HomeScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { mode, setMode, isDark } = useThemeMode();
  const insets = useSafeAreaInsets();
  const { notes, loading, refreshNotes } = useNotes();
  const { categories, createCategory } = useCategories();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<NoteFilter>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addCategoryVisible, setAddCategoryVisible] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  useFocusEffect(
    useCallback(() => {
      refreshNotes();
    }, [refreshNotes])
  );

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.spring(drawerAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const closeDrawer = (cb?: () => void) => {
    cb?.();
    Animated.spring(drawerAnim, {
      toValue: -DRAWER_WIDTH,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start(() => {
      setDrawerOpen(false);
    });
  };

  const isSearching = searchQuery.trim().length > 0;

  const baseForFilter = useMemo(() => getNotesForFilter(notes, filter), [notes, filter]);
  const availableTags = useMemo(() => getAllUsedTags(baseForFilter), [baseForFilter]);
  
  const combinedTags = useMemo(() => {
    const categoryNames = categories.map((c) => c.name);
    const tagsSet = new Set([...categoryNames, ...availableTags]);
    return [...tagsSet].sort((a, b) => a.localeCompare(b));
  }, [categories, availableTags]);

  const tagFiltered = useMemo(() => filterByTag(baseForFilter, selectedTag), [baseForFilter, selectedTag]);
  
  const displayNotes = useMemo(() => {
    if (!isSearching) return tagFiltered;
    return getSearchResults(tagFiltered, searchQuery);
  }, [tagFiltered, searchQuery, isSearching]);

  const pinnedNotes = useMemo(
    () => (filter === 'all' && !selectedTag && !isSearching ? getPinnedNotes(notes) : []),
    [notes, filter, selectedTag, isSearching]
  );

  const recentNotes = useMemo(
    () => (filter === 'all' && !selectedTag && !isSearching ? getRecentNotes(notes) : []),
    [notes, filter, selectedTag, isSearching]
  );

  const showSectionedView =
    filter === 'all' && !selectedTag && !isSearching && displayNotes.length > 0;

  const handleCreate = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/note/new');
  };

  const handleNotePress = (note: Note) => {
    router.push({ pathname: '/note/[id]', params: { id: note.id } });
  };

  const handleTagPress = (tag: string) => setSelectedTag(tag);

  const emptyVariant = useMemo(() => {
    if (isSearching) return 'search' as const;
    if (selectedTag) return 'tag' as const;
    return filter;
  }, [isSearching, selectedTag, filter]);

  const showEmpty = !loading && displayNotes.length === 0;
  const hasAnyNotes = notes.length > 0;

  const cycleTheme = () => {
    setMode(isDark ? 'light' : 'dark');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Overlay — only captures taps outside the drawer */}
      {drawerOpen && (
        <Pressable style={styles.drawerOverlay} onPress={() => closeDrawer()} />
      )}

      {/* Slide Drawer */}
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
        pointerEvents={drawerOpen ? 'auto' : 'none'}>
        <Text style={[styles.drawerTitle, { color: theme.text }]}>MindSpace</Text>

        <DrawerItem
          icon="layers-outline"
          label="All Notes"
          onPress={() => closeDrawer(() => setFilter('all'))}
        />
        <DrawerItem
          icon="archive-outline"
          label="Archive"
          onPress={() => closeDrawer(() => setFilter('archived'))}
        />
        <DrawerItem
          icon="folder-outline"
          label="Categories"
          onPress={() => closeDrawer(() => router.push('/categories'))}
        />

        <View style={[styles.drawerDivider, { borderColor: theme.border }]} />

        <DrawerItem
          icon={isDark ? 'sunny-outline' : 'moon-outline'}
          label={isDark ? 'Light Mode' : 'Dark Mode'}
          onPress={() => { cycleTheme(); closeDrawer(); }}
        />
      </Animated.View>

      {/* Main Content */}
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

        {(combinedTags.length > 0 || hasAnyNotes) && (
          <TagFilterBar
            tags={combinedTags}
            selected={selectedTag}
            onSelect={setSelectedTag}
            onAddCategoryPress={() => setAddCategoryVisible(true)}
          />
        )}
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      ) : showEmpty ? (
        <EmptyNotes variant={emptyVariant} query={searchQuery} tag={selectedTag ?? undefined} />
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
              onTagPress={handleTagPress}
            />
          ) : showSectionedView ? (
            <View style={{ gap: Spacing.xl }}>
              {pinnedNotes.length > 0 && (
                <NoteSection
                  title="Pinned"
                  notes={pinnedNotes}
                  onNotePress={handleNotePress}
                  onTagPress={handleTagPress}
                />
              )}
              {recentNotes.length > 0 && (
                <NoteSection
                  title="Recent"
                  notes={recentNotes}
                  onNotePress={handleNotePress}
                  onTagPress={handleTagPress}
                />
              )}
            </View>
          ) : (
            <NoteSection
              title={filter === 'archived' ? 'Archived' : selectedTag ? `Tag: ${selectedTag}` : 'Notes'}
              notes={displayNotes}
              onNotePress={handleNotePress}
              onTagPress={handleTagPress}
            />
          )}
        </ScrollView>
      )}

      <Fab onPress={handleCreate} />

      <TagInputModal
        visible={addCategoryVisible}
        onConfirm={async (val) => {
          if (val && val.trim()) {
            await createCategory(val.trim());
          }
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
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: DRAWER_WIDTH,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 10,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    zIndex: 20,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  drawerTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: Spacing.md,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  drawerItemLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  drawerDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginVertical: Spacing.sm,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: 2 },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  motto: {
    fontSize: 13,
    fontWeight: '500',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.xl,
  },
});
