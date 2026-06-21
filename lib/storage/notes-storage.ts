import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CreateNoteInput, Note, UpdateNoteInput } from '@/types/note';

const STORAGE_KEY = '@mynotes/notes';

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Ensures older saved notes get default values for new fields. */
export function normalizeNote(raw: Record<string, unknown>): Note {
  return {
    id: raw.id as string,
    title: (raw.title as string) ?? '',
    body: (raw.body as string) ?? '',
    audioUri: raw.audioUri as string | undefined,
    audioDurationMs: raw.audioDurationMs as number | undefined,
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
    isPinned: Boolean(raw.isPinned),
    isArchived: Boolean(raw.isArchived),
    createdAt: raw.createdAt as string,
    updatedAt: raw.updatedAt as string,
  };
}

async function readNotes(): Promise<Note[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw) as Record<string, unknown>[];
  return parsed.map(normalizeNote);
}

async function writeNotes(notes: Note[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function sortByRecent(notes: Note[]): Note[] {
  return notes.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getAllNotes(): Promise<Note[]> {
  const notes = await readNotes();
  return sortByRecent(notes);
}

export async function getNoteById(id: string): Promise<Note | null> {
  const notes = await readNotes();
  return notes.find((note) => note.id === id) ?? null;
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const now = new Date().toISOString();
  const note: Note = {
    id: generateId(),
    title: input.title.trim(),
    body: input.body.trim(),
    audioUri: input.audioUri,
    audioDurationMs: input.audioDurationMs,
    tags: input.tags ?? [],
    isPinned: false,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  };

  const notes = await readNotes();
  notes.unshift(note);
  await writeNotes(notes);
  return note;
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<Note | null> {
  const notes = await readNotes();
  const index = notes.findIndex((note) => note.id === id);
  if (index === -1) return null;

  const updated: Note = {
    ...notes[index],
    ...input,
    title: input.title !== undefined ? input.title.trim() : notes[index].title,
    body: input.body !== undefined ? input.body.trim() : notes[index].body,
    updatedAt: new Date().toISOString(),
  };

  notes[index] = updated;
  await writeNotes(notes);
  return updated;
}

export async function deleteNote(id: string): Promise<void> {
  const notes = await readNotes();
  await writeNotes(notes.filter((note) => note.id !== id));
}

export async function pinNote(id: string): Promise<Note | null> {
  return updateNote(id, { isPinned: true });
}

export async function unpinNote(id: string): Promise<Note | null> {
  return updateNote(id, { isPinned: false });
}

export async function archiveNote(id: string): Promise<Note | null> {
  return updateNote(id, { isArchived: true, isPinned: false });
}

export async function unarchiveNote(id: string): Promise<Note | null> {
  return updateNote(id, { isArchived: false });
}

export async function updateNoteTags(id: string, tags: string[]): Promise<Note | null> {
  return updateNote(id, { tags });
}
