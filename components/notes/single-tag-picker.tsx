import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { TagInputModal } from '@/components/ui/tag-input-modal';

interface SingleTagPickerProps {
  tag: string | null;
  onChange: (tag: string | null) => void;
}

export function SingleTagPicker({ tag, onChange }: SingleTagPickerProps) {
  const theme = useAppTheme();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      {tag ? (
        <Pressable
          onPress={() => setModalVisible(true)}
          style={[styles.chip, { backgroundColor: theme.tintMuted, borderColor: theme.tint }]}>
          <Text style={[styles.chipLabel, { color: theme.tint }]} numberOfLines={1}>
            {tag}
          </Text>
          <Pressable onPress={() => onChange(null)} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={theme.tint} />
          </Pressable>
        </Pressable>
      ) : null}

      <TagInputModal
        visible={modalVisible}
        initialValue={tag ?? ''}
        onConfirm={(val) => {
          onChange(val);
          setModalVisible(false);
        }}
        onDismiss={() => setModalVisible(false)}
      />
    </>
  );
}

export function useTagModal() {
  const [visible, setVisible] = useState(false);
  const open = () => setVisible(true);
  const close = () => setVisible(false);
  return { visible, open, close };
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    alignSelf: 'flex-start',
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
