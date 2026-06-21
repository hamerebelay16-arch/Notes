import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyNotes } from '@/components/notes/empty-notes';
import { FilterTabs } from '@/components/notes/filter-tabs';
import { NoteSection } from '@/components/notes/note-section';
import { TagFilterBar } from '@/components/notes/tag-filter-bar';
import { Fab } from '@/components/ui/fab';
import { SearchBar } from '@/components/ui/search-bar';
import { Spacing } from '@/constants/theme';
import { useNotes } from '@/context/notes-context';
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

export default function HomeScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { notes, loading, refreshNotes } = useNotes();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<NoteFilter>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshNotes();
    }, [refreshNotes])
  );

  const isSearching = searchQuery.trim().length > 0;

  const filterCounts = useMemo(
    () => ({
      all: notes.filter(isActiveNote).length,
      pinned: getPinnedNotes(notes).length,
      archived: getArchivedNotes(notes).length,
    }),
    [notes]
  );

  const baseForFilter = useMemo(() => getNotesForFilter(notes, filter), [notes, filter]);

  const availableTags = useMemo(() => getAllUsedTags(baseForFilter), [baseForFilter]);

  const tagFiltered = useMemo(
    () => filterByTag(baseForFilter, selectedTag),
    [baseForFilter, selectedTag]
  );

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
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/note/new');
  };

  const handleNotePress = (note: Note) => {
    router.push({ pathname: '/note/[id]', params: { id: note.id } });
  };

  const handleCategories = () => {
    router.push('/categories');
  };

  const handleFilterChange = (next: NoteFilter) => {
    setFilter(next);
    setSelectedTag(null);
  };

  const handleTagPress = (tag: string) => {
    setSelectedTag(tag);
    if (filter === 'archived') {
      // keep archived filter
    } else if (filter === 'pinned') {
      // keep pinned filter
    }
  };

  const emptyVariant = useMemo(() => {
    if (isSearching) return 'search' as const;
    if (selectedTag) return 'tag' as const;
    return filter;
  }, [isSearching, selectedTag, filter]);

  const showEmpty = !loading && displayNotes.length === 0;
  const hasAnyNotes = notes.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>Your notes</Text>
            <Text style={[styles.title, { color: theme.text }]}>myNotes</Text>
          </View>
          <Pressable
            onPress={handleCategories}
            style={[styles.categoriesBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            hitSlop={8}>
            <Ionicons name="pricetags-outline" size={20} color={theme.tint} />
          </Pressable>
        </View>

        {hasAnyNotes && (
          <FilterTabs value={filter} onChange={handleFilterChange} counts={filterCounts} />
        )}

        {(hasAnyNotes || isSearching) && (
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        )}

        {availableTags.length > 0 && (
          <TagFilterBar
            tags={availableTags}
            selected={selectedTag}
            onSelect={setSelectedTag}
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
            <>
              <NoteSection
                title="Pinned"
                notes={pinnedNotes}
                onNotePress={handleNotePress}
                onTagPress={handleTagPress}
              />
              <NoteSection
                title="Recent"
                notes={recentNotes}
                onNotePress={handleNotePress}
                onTagPress={handleTagPress}
              />
            </>
          ) : (
            <NoteSection
              title={
                filter === 'pinned'
                  ? 'Pinned'
                  : filter === 'archived'
                    ? 'Archived'
                    : selectedTag
                      ? `Tag: ${selectedTag}`
                      : 'Notes'
              }
              notes={displayNotes}
              onNotePress={handleNotePress}
              onTagPress={handleTagPress}
            />
          )}
        </ScrollView>
      )}

      <Fab onPress={handleCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  categoriesBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
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
