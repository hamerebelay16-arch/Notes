import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import * as notesStorage from '@/lib/storage/notes-storage';
import type { CreateNoteInput, Note, UpdateNoteInput } from '@/types/note';

interface NotesContextValue {
  notes: Note[];
  loading: boolean;
  refreshNotes: () => Promise<void>;
  createNote: (input: CreateNoteInput) => Promise<Note>;
  updateNote: (id: string, input: UpdateNoteInput) => Promise<Note | null>;
  deleteNote: (id: string) => Promise<void>;
  getNote: (id: string) => Note | undefined;
  pinNote: (id: string) => Promise<Note | null>;
  unpinNote: (id: string) => Promise<Note | null>;
  archiveNote: (id: string) => Promise<Note | null>;
  unarchiveNote: (id: string) => Promise<Note | null>;
  updateTags: (id: string, tags: string[]) => Promise<Note | null>;
}

const NotesContext = createContext<NotesContextValue | null>(null);

function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshNotes = useCallback(async () => {
    const loaded = await notesStorage.getAllNotes();
    setNotes(loaded);
  }, []);

  useEffect(() => {
    refreshNotes().finally(() => setLoading(false));
  }, [refreshNotes]);

  const applyNoteUpdate = useCallback((updated: Note) => {
    setNotes((current) =>
      sortNotes(current.map((note) => (note.id === updated.id ? updated : note)))
    );
  }, []);

  const applyNoteRemove = useCallback((id: string) => {
    setNotes((current) => current.filter((note) => note.id !== id));
  }, []);

  const applyNoteAdd = useCallback((note: Note) => {
    setNotes((current) => sortNotes([note, ...current]));
  }, []);

  const createNote = useCallback(
    async (input: CreateNoteInput) => {
      const note = await notesStorage.createNote(input);
      applyNoteAdd(note);
      return note;
    },
    [applyNoteAdd]
  );

  const updateNote = useCallback(
    async (id: string, input: UpdateNoteInput) => {
      const updated = await notesStorage.updateNote(id, input);
      if (updated) applyNoteUpdate(updated);
      return updated;
    },
    [applyNoteUpdate]
  );

  const deleteNote = useCallback(
    async (id: string) => {
      await notesStorage.deleteNote(id);
      applyNoteRemove(id);
    },
    [applyNoteRemove]
  );

  const pinNote = useCallback(
    async (id: string) => {
      const updated = await notesStorage.pinNote(id);
      if (updated) applyNoteUpdate(updated);
      return updated;
    },
    [applyNoteUpdate]
  );

  const unpinNote = useCallback(
    async (id: string) => {
      const updated = await notesStorage.unpinNote(id);
      if (updated) applyNoteUpdate(updated);
      return updated;
    },
    [applyNoteUpdate]
  );

  const archiveNote = useCallback(
    async (id: string) => {
      const updated = await notesStorage.archiveNote(id);
      if (updated) applyNoteUpdate(updated);
      return updated;
    },
    [applyNoteUpdate]
  );

  const unarchiveNote = useCallback(
    async (id: string) => {
      const updated = await notesStorage.unarchiveNote(id);
      if (updated) applyNoteUpdate(updated);
      return updated;
    },
    [applyNoteUpdate]
  );

  const updateTags = useCallback(
    async (id: string, tags: string[]) => {
      const updated = await notesStorage.updateNoteTags(id, tags);
      if (updated) applyNoteUpdate(updated);
      return updated;
    },
    [applyNoteUpdate]
  );

  const getNote = useCallback((id: string) => notes.find((note) => note.id === id), [notes]);

  const value = useMemo(
    () => ({
      notes,
      loading,
      refreshNotes,
      createNote,
      updateNote,
      deleteNote,
      getNote,
      pinNote,
      unpinNote,
      archiveNote,
      unarchiveNote,
      updateTags,
    }),
    [
      notes,
      loading,
      refreshNotes,
      createNote,
      updateNote,
      deleteNote,
      getNote,
      pinNote,
      unpinNote,
      archiveNote,
      unarchiveNote,
      updateTags,
    ]
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within NotesProvider');
  }
  return context;
}
