import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'LUT App' }} />
      <Stack.Screen name="editor/[assetId]" options={{ title: 'Editor', headerShown: false }} />
      <Stack.Screen name="import/index" options={{ title: 'Import' }} />
      <Stack.Screen name="export/index" options={{ title: 'Export' }} />
      <Stack.Screen name="presets/index" options={{ title: 'Presets' }} />
      <Stack.Screen name="settings/index" options={{ title: 'Settings' }} />
    </Stack>
  );
}
