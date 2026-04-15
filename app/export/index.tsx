import { ScrollView, Text, View } from 'react-native';

export default function ExportRoute() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 24, gap: 16 }}
    >
      <View style={{ gap: 8 }}>
        <Text selectable style={{ fontSize: 28, fontWeight: '700' }}>
          Export
        </Text>
        <Text selectable style={{ fontSize: 16, lineHeight: 22 }}>
          Placeholder export route for future full-resolution image and LUT output flows.
        </Text>
      </View>
    </ScrollView>
  );
}
