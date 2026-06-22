import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/context/theme-context';

export function useAppTheme() {
  const { isDark } = useThemeMode();
  return Colors[isDark ? 'dark' : 'light'];
}

export function useIsDark() {
  return useThemeMode().isDark;
}
