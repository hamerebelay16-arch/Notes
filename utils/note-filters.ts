import type { Note } from '@/types/note';

export function isActiveNote(note: Note): boolean {
  return !note.isArchived;
}

export function matchesSearch(note: Note, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;
  return (
    note.title.toLowerCase().includes(trimmed) || note.body.toLowerCase().includes(trimmed)
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
  return sortNotesByRecent(
    notes.filter((note) => isActiveNote(note) && !note.isPinned)
  );
}

export function getSearchResults(notes: Note[], query: string): Note[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return sortNotesByRecent(notes.filter((note) => isActiveNote(note) && matchesSearch(note, trimmed)));
}
