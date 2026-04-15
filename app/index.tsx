import { Link } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

export default function HomeRoute() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 24, gap: 16 }}
    >
      <View style={{ gap: 8 }}>
        <Text selectable style={{ fontSize: 28, fontWeight: '700' }}>
          LUT App
        </Text>
        <Text selectable style={{ fontSize: 16, lineHeight: 22 }}>
          Wave 0 scaffold is in place. Use these placeholder routes to validate Expo Router wiring.
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        <Link href="/import">Import</Link>
        <Link href="/export">Export</Link>
        <Link href="/presets">Presets</Link>
        <Link href="/settings">Settings</Link>
        <Link href="/editor/demo-asset">Open editor placeholder</Link>
      </View>
    </ScrollView>
  );
}
