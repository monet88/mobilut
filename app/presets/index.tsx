import { ScrollView, Text, View } from 'react-native';

export default function PresetsRoute() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 24, gap: 16 }}
    >
      <View style={{ gap: 8 }}>
        <Text selectable style={{ fontSize: 28, fontWeight: '700' }}>
          Presets
        </Text>
        <Text selectable style={{ fontSize: 16, lineHeight: 22 }}>
          Placeholder preset browser route for the bundled LUT catalog.
        </Text>
      </View>
    </ScrollView>
  );
}
