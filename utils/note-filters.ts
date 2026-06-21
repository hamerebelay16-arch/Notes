import type { Note } from '@/types/note';

export type NoteFilter = 'all' | 'pinned' | 'archived';

export function isActiveNote(note: Note): boolean {
  return !note.isArchived;
}

export function matchesSearch(note: Note, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;
  const inTags = note.tags.some((tag) => tag.toLowerCase().includes(trimmed));
  return (
    note.title.toLowerCase().includes(trimmed) ||
    note.body.toLowerCase().includes(trimmed) ||
    inTags
  );
}

export function sortNotesByRecent(notes: Note[]): Note[] {
  return [...notes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getPinnedNotes(notes: Note[]): Note[] {
  return sortNotesByRecent(notes.filter((note) => isActiveNote(note) && note.isPinned));
}

export function getRecentNotes(notes: Note[]): Note[] {
  return sortNotesByRecent(notes.filter((note) => isActiveNote(note) && !note.isPinned));
}

export function getArchivedNotes(notes: Note[]): Note[] {
  return sortNotesByRecent(notes.filter((note) => note.isArchived));
}

export function getNotesForFilter(notes: Note[], filter: NoteFilter): Note[] {
  switch (filter) {
    case 'pinned':
      return getPinnedNotes(notes);
    case 'archived':
      return getArchivedNotes(notes);
    default:
      return sortNotesByRecent(notes.filter(isActiveNote));
  }
}

export function filterByTag(notes: Note[], tag: string | null): Note[] {
  if (!tag) return notes;
  return notes.filter((note) => note.tags.includes(tag));
}

export function getAllUsedTags(notes: Note[]): string[] {
  const tagSet = new Set<string>();
  for (const note of notes) {
    for (const tag of note.tags) {
      tagSet.add(tag);
    }
  }
  return [...tagSet].sort((a, b) => a.localeCompare(b));
}

export function getSearchResults(notes: Note[], query: string): Note[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return sortNotesByRecent(notes.filter((note) => matchesSearch(note, trimmed)));
}

export function applyHomeFilters(
  notes: Note[],
  filter: NoteFilter,
  tag: string | null,
  query: string
): Note[] {
  const byStatus = getNotesForFilter(notes, filter);
  const byTag = filterByTag(byStatus, tag);
  if (!query.trim()) return byTag;
  return getSearchResults(byTag, query);
}
