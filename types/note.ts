export interface AudioRecording {
  id: string;
  uri: string;
  durationMs: number;
  createdAt: string;
}

export interface NoteAttachment {
  id: string;
  uri: string;
  type: 'image' | 'file';
  name: string;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  audioUri?: string;
  audioDurationMs?: number;
  audioRecordings?: AudioRecording[];
  /** Offline speech-to-text result from voice recording */
  transcript?: string;
  /** AI-generated short summary (3–5 lines) */
  summary?: string;
  /** AI-generated bullet key points */
  keyPoints?: string[];
  attachments?: NoteAttachment[];
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateNoteInput = Pick<Note, 'title' | 'body'> & {
  audioUri?: string;
  audioDurationMs?: number;
  audioRecordings?: AudioRecording[];
  transcript?: string;
  summary?: string;
  keyPoints?: string[];
  attachments?: NoteAttachment[];
  tags?: string[];
};

export type UpdateNoteInput = Partial<CreateNoteInput> & {
  isPinned?: boolean;
  isArchived?: boolean;
};
