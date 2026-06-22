import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CreateNoteInput, Note, NoteAttachment, UpdateNoteInput, AudioRecording } from '@/types/note';

const STORAGE_KEY = '@mynotes/notes';

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Ensures older saved notes get default values for new fields. */
export function normalizeNote(raw: Record<string, unknown>): Note {
  let audioRecordings: AudioRecording[] = [];
  if (Array.isArray(raw.audioRecordings)) {
    audioRecordings = (raw.audioRecordings as any[]).map((r) => ({
      id: String(r.id),
      uri: String(r.uri),
      durationMs: Number(r.durationMs),
      createdAt: String(r.createdAt),
    }));
  } else if (raw.audioUri) {
    audioRecordings = [
      {
        id: 'default',
        uri: String(raw.audioUri),
        durationMs: Number(raw.audioDurationMs ?? 0),
        createdAt: (raw.createdAt as string) ?? new Date().toISOString(),
      },
    ];
  }

  return {
    id: raw.id as string,
    title: (raw.title as string) ?? '',
    body: (raw.body as string) ?? '',
    audioUri: raw.audioUri as string | undefined,
    audioDurationMs: raw.audioDurationMs as number | undefined,
    audioRecordings,
    transcript: raw.transcript as string | undefined,
    summary: raw.summary as string | undefined,
    keyPoints: Array.isArray(raw.keyPoints) ? (raw.keyPoints as string[]) : undefined,
    attachments: Array.isArray(raw.attachments)
      ? (raw.attachments as NoteAttachment[])
      : undefined,
    category: raw.category as string | undefined,
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
    audioRecordings: input.audioRecordings ?? [],
    transcript: input.transcript,
    summary: input.summary,
    keyPoints: input.keyPoints,
    attachments: input.attachments,
    category: input.category,
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
    body: input.body !== undefined ? input.body : notes[index].body,
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

