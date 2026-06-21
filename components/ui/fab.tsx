import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Radius, Shadow } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface FabProps {
  onPress: () => void;
  style?: ViewStyle;
}

export function Fab({ onPress, style }: FabProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.wrapper, style]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.fab },
          Shadow.fab,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Create new note">
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 24,
    bottom: 32,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
});
