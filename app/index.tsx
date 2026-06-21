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
import { NoteSection } from '@/components/notes/note-section';
import { Fab } from '@/components/ui/fab';
import { SearchBar } from '@/components/ui/search-bar';
import { Spacing } from '@/constants/theme';
import { useNotes } from '@/context/notes-context';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { Note } from '@/types/note';
import {
  getPinnedNotes,
  getRecentNotes,
  getSearchResults,
  isActiveNote,
} from '@/utils/note-filters';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { notes, loading, refreshNotes } = useNotes();
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      refreshNotes();
    }, [refreshNotes])
  );

  const isSearching = searchQuery.trim().length > 0;
  const activeNotes = useMemo(() => notes.filter(isActiveNote), [notes]);

  const pinnedNotes = useMemo(() => getPinnedNotes(notes), [notes]);
  const recentNotes = useMemo(() => getRecentNotes(notes), [notes]);
  const searchResults = useMemo(
    () => getSearchResults(notes, searchQuery),
    [notes, searchQuery]
  );

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

  const showEmpty = !loading && activeNotes.length === 0 && !isSearching;
  const showNoResults = !loading && isSearching && searchResults.length === 0;

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

        {!loading && activeNotes.length > 0 && (
          <Text style={[styles.count, { color: theme.textSecondary }]}>
            {activeNotes.length} {activeNotes.length === 1 ? 'note' : 'notes'}
          </Text>
        )}

        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      ) : showEmpty ? (
        <EmptyNotes />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {isSearching ? (
            <>
              <NoteSection
                title={`Results (${searchResults.length})`}
                notes={searchResults}
                onNotePress={handleNotePress}
              />
              {showNoResults && (
                <View style={styles.noResults}>
                  <Text style={[styles.noResultsText, { color: theme.textSecondary }]}>
                    No notes match &ldquo;{searchQuery.trim()}&rdquo;
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              <NoteSection title="Pinned" notes={pinnedNotes} onNotePress={handleNotePress} />
              <NoteSection title="Recent" notes={recentNotes} onNotePress={handleNotePress} />
            </>
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
    gap: Spacing.sm,
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
  count: {
    fontSize: 15,
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
  noResults: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
