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
import type { AudioRecording } from '@/types/note';

interface AudioRecorderProps {
  recordings: AudioRecording[];
  onRecorded: (uri: string, durationMs: number) => void;
  onClear: (recordingId: string) => void;
}

export function AudioRecorderSection({
  recordings = [],
  onRecorded,
  onClear,
}: AudioRecorderProps) {
  const theme = useAppTheme();
  const [ready, setReady] = useState(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);

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
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Voice Notes</Text>

      {recordings.length > 0 && (
        <View style={styles.recordingsList}>
          {recordings.map((rec) => (
            <AudioPlayRow
              key={rec.id}
              recording={rec}
              onDelete={() => onClear(rec.id)}
            />
          ))}
        </View>
      )}

      {/* Record button or active recording UI */}
      <View style={styles.row}>
        {recorderState.isRecording ? (
          <View style={styles.recordingActiveRow}>
            <View style={[styles.pulse, { backgroundColor: theme.danger }]} />
            <Text style={[styles.recordingText, { color: theme.danger }]}>
              Recording ({formatDuration(recorderState.durationMillis)})
            </Text>
            <Pressable
              onPress={handleToggleRecord}
              style={[styles.stopBtn, { backgroundColor: theme.danger }]}>
              <Ionicons name="stop" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={handleToggleRecord}
            disabled={!ready}
            style={[
              styles.recordBtn,
              {
                backgroundColor: theme.tint,
              },
            ]}>
            <Ionicons name="radio-button-on" size={18} color="#FFFFFF" />
            <Text style={styles.recordLabel}>Record voice note</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function AudioPlayRow({
  recording,
  onDelete,
}: {
  recording: AudioRecording;
  onDelete: () => void;
}) {
  const theme = useAppTheme();
  const player = useAudioPlayer(recording.uri);
  const playerStatus = useAudioPlayerStatus(player);

  const handlePlayPause = () => {
    if (playerStatus.playing) {
      player.pause();
    } else {
      if (playerStatus.currentTime >= playerStatus.duration && playerStatus.duration > 0) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const formattedDate = new Date(recording.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.playRow, { borderBottomColor: theme.border }]}>
      <View style={[styles.iconCircleSmall, { backgroundColor: theme.voiceMuted }]}>
        <Ionicons name="mic" size={16} color={theme.voice} />
      </View>
      <View style={styles.playMeta}>
        <Text style={[styles.playLabel, { color: theme.text }]} numberOfLines={1}>
          {formattedDate}
        </Text>
        <Text style={[styles.playDuration, { color: theme.textSecondary }]}>
          {formatDuration(recording.durationMs ?? playerStatus.duration * 1000)}
        </Text>
      </View>
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
          onPress={onDelete}
          style={[styles.actionBtn, { backgroundColor: theme.dangerMuted }]}>
          <Ionicons name="trash-outline" size={18} color={theme.danger} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  recordingsList: {
    gap: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconCircleSmall: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playMeta: {
    flex: 1,
    gap: 2,
  },
  playLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  playDuration: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    width: 36,
    height: 36,
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
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  recordLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  recordingActiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
  recordingText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  stopBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
