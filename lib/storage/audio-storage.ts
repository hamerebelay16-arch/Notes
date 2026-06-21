import { Directory, File, Paths } from 'expo-file-system';

const AUDIO_DIR = new Directory(Paths.document, 'audio');

export async function ensureAudioDirectory(): Promise<void> {
  if (!AUDIO_DIR.exists) {
    AUDIO_DIR.create({ intermediates: true, idempotent: true });
  }
}

export async function persistRecording(tempUri: string, noteId: string): Promise<string> {
  await ensureAudioDirectory();
  const destination = new File(AUDIO_DIR, `${noteId}.m4a`);
  const source = new File(tempUri);

  if (destination.exists) {
    destination.delete();
  }

  source.copy(destination);
  return destination.uri;
}

export function deleteAudioFile(noteId: string): void {
  const file = new File(AUDIO_DIR, `${noteId}.m4a`);
  if (file.exists) {
    file.delete();
  }
}
