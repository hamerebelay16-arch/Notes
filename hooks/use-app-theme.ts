import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useAppTheme() {
  const scheme = useColorScheme() ?? 'light';
  return Colors[scheme];
}

export function useIsDark() {
  return (useColorScheme() ?? 'light') === 'dark';
}
