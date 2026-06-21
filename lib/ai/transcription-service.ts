import { Platform } from 'react-native';

import {
  DEFAULT_WHISPER_MODEL,
  type WhisperModelName,
} from '@/lib/ai/config';

export type TranscriptionStatus =
  | 'idle'
  | 'downloading'
  | 'processing'
  | 'complete'
  | 'error';

export interface TranscriptionProgress {
  status: TranscriptionStatus;
  message: string;
  percentage?: number;
}

type WhisperServiceClass = new (options: {
  modelName: WhisperModelName;
  enableVAD: boolean;
  language: string;
  enableGPUAcceleration: boolean;
}) => {
  initialize: (
    onDownloadProgress?: (progress: {
      modelName: string;
      downloaded: number;
      total: number;
      percentage: number;
      isComplete: boolean;
    }) => void
  ) => Promise<void>;
  transcribeFile: (filePath: string) => Promise<string>;
  dispose: () => Promise<void>;
  isReady: () => boolean;
};

let whisperServiceInstance: InstanceType<WhisperServiceClass> | null = null;
let activeModel: WhisperModelName | null = null;

function isNativePlatform(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

async function loadWhisperService(): Promise<WhisperServiceClass | null> {
  if (!isNativePlatform()) return null;

  try {
    const module = await import('react-native-audio-agent');
    return module.WhisperService as WhisperServiceClass;
  } catch {
    return null;
  }
}

export function isTranscriptionAvailable(): boolean {
  return isNativePlatform();
}

export function getTranscriptionUnavailableMessage(): string {
  if (Platform.OS === 'web') {
    return 'Offline transcription is available on iOS and Android devices only.';
  }
  return 'Offline transcription requires a development build with react-native-audio-agent installed.';
}

async function getOrCreateWhisperService(
  modelName: WhisperModelName,
  onProgress?: (progress: TranscriptionProgress) => void
): Promise<InstanceType<WhisperServiceClass>> {
  const WhisperService = await loadWhisperService();
  if (!WhisperService) {
    throw new Error(getTranscriptionUnavailableMessage());
  }

  if (whisperServiceInstance && activeModel === modelName && whisperServiceInstance.isReady()) {
    return whisperServiceInstance;
  }

  if (whisperServiceInstance) {
    await whisperServiceInstance.dispose();
    whisperServiceInstance = null;
    activeModel = null;
  }

  onProgress?.({
    status: 'downloading',
    message: `Preparing ${modelName} model…`,
    percentage: 0,
  });

  const service = new WhisperService({
    modelName,
    enableVAD: false,
    language: 'en',
    enableGPUAcceleration: true,
  });

  await service.initialize((download) => {
    onProgress?.({
      status: 'downloading',
      message: download.isComplete
        ? 'Model ready. Starting transcription…'
        : `Downloading model… ${Math.round(download.percentage)}%`,
      percentage: download.percentage,
    });
  });

  whisperServiceInstance = service;
  activeModel = modelName;
  return service;
}

export async function transcribeAudioFile(
  audioUri: string,
  modelName: WhisperModelName = DEFAULT_WHISPER_MODEL,
  onProgress?: (progress: TranscriptionProgress) => void
): Promise<string> {
  if (!audioUri?.trim()) {
    throw new Error('Record audio before transcribing.');
  }

  if (!isNativePlatform()) {
    throw new Error(getTranscriptionUnavailableMessage());
  }

  onProgress?.({ status: 'processing', message: 'Transcribing audio…' });

  const service = await getOrCreateWhisperService(modelName, onProgress);
  const filePath = audioUri.startsWith('file://') ? audioUri : `file://${audioUri}`;
  const transcript = (await service.transcribeFile(filePath)).trim();

  if (!transcript) {
    throw new Error('No speech detected in the recording.');
  }

  onProgress?.({ status: 'complete', message: 'Transcription complete.' });
  return transcript;
}

export async function disposeTranscriptionService(): Promise<void> {
  if (whisperServiceInstance) {
    await whisperServiceInstance.dispose();
    whisperServiceInstance = null;
    activeModel = null;
  }
}
