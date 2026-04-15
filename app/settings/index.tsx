import { ScrollView, Text, View } from 'react-native';

export default function SettingsRoute() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 24, gap: 16 }}
    >
      <View style={{ gap: 8 }}>
        <Text selectable style={{ fontSize: 28, fontWeight: '700' }}>
          Settings
        </Text>
        <Text selectable style={{ fontSize: 16, lineHeight: 22 }}>
          Placeholder settings route for localization, diagnostics, and app preferences.
        </Text>
      </View>
    </ScrollView>
  );
}
