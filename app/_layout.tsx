import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { CategoriesProvider } from '@/context/categories-context';
import { NotesProvider } from '@/context/notes-context';
import { ThemeProvider } from '@/context/theme-context';
import { useThemeMode } from '@/context/theme-context';

function AppStack() {
  const { isDark } = useThemeMode();
  return (
    <NavThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: 'transparent' },
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="note/new" />
        <Stack.Screen name="note/[id]" />
        <Stack.Screen name="categories" />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <NotesProvider>
        <CategoriesProvider>
          <AppStack />
        </CategoriesProvider>
      </NotesProvider>
    </ThemeProvider>
  );
}
