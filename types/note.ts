export interface Note {
  id: string;
  title: string;
  body: string;
  audioUri?: string;
  audioDurationMs?: number;
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateNoteInput = Pick<Note, 'title' | 'body'> & {
  audioUri?: string;
  audioDurationMs?: number;
  tags?: string[];
};

export type UpdateNoteInput = Partial<CreateNoteInput> & {
  isPinned?: boolean;
  isArchived?: boolean;
};
