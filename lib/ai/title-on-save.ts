import { generateNoteTitle } from '@/lib/ai/gemini-service';

export function shouldSuggestTitle(title: string): boolean {
  const normalized = title.trim().toLowerCase();
  return !normalized || normalized === 'untitled';
}

export async function suggestTitleAfterSave(
  body: string,
  transcript: string | undefined,
  currentTitle: string
): Promise<string | null> {
  if (!shouldSuggestTitle(currentTitle)) {
    return null;
  }

  const content = body.trim() || transcript?.trim();
  if (!content) {
    return null;
  }

  try {
    const result = await generateNoteTitle(body, transcript);
    if (!result.title || result.title.toLowerCase() === 'untitled') {
      return null;
    }
    return result.title;
  } catch {
    return null;
  }
}
