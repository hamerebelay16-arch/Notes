import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { formatDuration } from '@/utils/format-date';

interface AudioRecorderProps {
  audioUri?: string;
  durationMs?: number;
  onRecorded: (uri: string, durationMs: number) => void;
  onClear: () => void;
}

export function AudioRecorderSection({
  audioUri,
  durationMs,
  onRecorded,
  onClear,
}: AudioRecorderProps) {
  const theme = useAppTheme();
  const [ready, setReady] = useState(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);
  const player = useAudioPlayer(audioUri ?? null);
  const playerStatus = useAudioPlayerStatus(player);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Microphone access', 'Enable microphone access to record voice notes.');
        return;
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
      setReady(true);
    })();
  }, []);

  const handleToggleRecord = async () => {
    if (!ready) return;

    if (recorderState.isRecording) {
      await recorder.stop();
      const uri = recorder.uri;
      if (uri) {
        onRecorded(uri, recorderState.durationMillis);
      }
      return;
    }

    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const handlePlayPause = () => {
    if (!audioUri) return;

    if (playerStatus.playing) {
      player.pause();
      return;
    }

    if (playerStatus.currentTime >= playerStatus.duration && playerStatus.duration > 0) {
      player.seekTo(0);
    }
    player.play();
  };

  const displayDuration = audioUri
    ? formatDuration(durationMs ?? playerStatus.duration * 1000)
    : formatDuration(recorderState.durationMillis);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
        <Ionicons name="mic-off-outline" size={20} color={theme.textSecondary} />
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          Voice recording is available on iOS and Android.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      <View style={styles.row}>
        <View style={[styles.iconCircle, { backgroundColor: theme.voiceMuted }]}>
          <Ionicons name="mic" size={20} color={theme.voice} />
        </View>
        <View style={styles.meta}>
          <Text style={[styles.label, { color: theme.text }]}>Voice note</Text>
          <Text style={[styles.duration, { color: theme.textSecondary }]}>{displayDuration}</Text>
        </View>

        {audioUri ? (
          <View style={styles.actions}>
            <Pressable
              onPress={handlePlayPause}
              style={[styles.actionBtn, { backgroundColor: theme.tintMuted }]}>
              <Ionicons
                name={playerStatus.playing ? 'pause' : 'play'}
                size={18}
                color={theme.tint}
              />
            </Pressable>
            <Pressable
              onPress={onClear}
              style={[styles.actionBtn, { backgroundColor: theme.dangerMuted }]}>
              <Ionicons name="trash-outline" size={18} color={theme.danger} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={handleToggleRecord}
            disabled={!ready}
            style={[
              styles.recordBtn,
              {
                backgroundColor: recorderState.isRecording ? theme.danger : theme.tint,
              },
            ]}>
            <Ionicons
              name={recorderState.isRecording ? 'stop' : 'radio-button-on'}
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.recordLabel}>
              {recorderState.isRecording ? 'Stop' : 'Record'}
            </Text>
          </Pressable>
        )}
      </View>

      {recorderState.isRecording && (
        <View style={styles.recordingRow}>
          <View style={[styles.pulse, { backgroundColor: theme.danger }]} />
          <Text style={[styles.recordingText, { color: theme.danger }]}>Recording…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  duration: {
    fontSize: 13,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  recordLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: 4,
  },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
  recordingText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
