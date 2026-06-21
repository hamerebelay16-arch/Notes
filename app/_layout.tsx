import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { CategoriesProvider } from '@/context/categories-context';
import { NotesProvider } from '@/context/notes-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <NotesProvider>
      <CategoriesProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
          <StatusBar style="auto" />
        </ThemeProvider>
      </CategoriesProvider>
    </NotesProvider>
  );
}
