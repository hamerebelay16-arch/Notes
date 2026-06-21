import { Platform } from 'react-native';

const tintColorLight = '#6366F1';
const tintColorDark = '#818CF8';

export const Colors = {
  light: {
    text: '#111827',
    textSecondary: '#6B7280',
    background: '#F5F4F0',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    border: '#E8E6E1',
    tint: tintColorLight,
    tintMuted: '#EEF2FF',
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
    danger: '#EF4444',
    dangerMuted: '#FEE2E2',
    voice: '#F59E0B',
    voiceMuted: '#FEF3C7',
    fab: '#6366F1',
    fabShadow: '#6366F1',
    placeholder: '#9CA3AF',
  },
  dark: {
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    background: '#0C0C0F',
    surface: '#16161D',
    surfaceElevated: '#1E1E28',
    border: '#2A2A35',
    tint: tintColorDark,
    tintMuted: '#1E1B4B',
    icon: '#9CA3AF',
    tabIconDefault: '#6B7280',
    tabIconSelected: tintColorDark,
    danger: '#F87171',
    dangerMuted: '#450A0A',
    voice: '#FBBF24',
    voiceMuted: '#422006',
    fab: '#6366F1',
    fabShadow: '#6366F1',
    placeholder: '#6B7280',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  fab: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
};
