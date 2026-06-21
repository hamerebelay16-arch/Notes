import Constants from 'expo-constants';

export type WhisperModelName = 'tiny.en' | 'base.en' | 'small.en' | 'medium.en' | 'large-v2' | 'large-v3';

export const DEFAULT_WHISPER_MODEL: WhisperModelName = 'tiny.en';

export const WHISPER_MODEL_OPTIONS: { label: string; value: WhisperModelName; size: string }[] = [
  { label: 'Tiny (fast)', value: 'tiny.en', size: '39 MB' },
  { label: 'Base', value: 'base.en', size: '74 MB' },
  { label: 'Small', value: 'small.en', size: '244 MB' },
  { label: 'Medium', value: 'medium.en', size: '769 MB' },
  { label: 'Large v2', value: 'large-v2', size: '1.5 GB' },
  { label: 'Large v3', value: 'large-v3', size: '1.5 GB' },
];

export const GEMINI_MODEL = 'gemini-2.0-flash';

export function getGeminiApiKey(): string | undefined {
  return (
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ??
    (Constants.expoConfig?.extra as { geminiApiKey?: string } | undefined)?.geminiApiKey
  );
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey()?.trim());
}
