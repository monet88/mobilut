import { ScrollView, Text, View } from 'react-native';

export default function ImportRoute() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 24, gap: 16 }}
    >
      <View style={{ gap: 8 }}>
        <Text selectable style={{ fontSize: 28, fontWeight: '700' }}>
          Import
        </Text>
        <Text selectable style={{ fontSize: 16, lineHeight: 22 }}>
          Placeholder import route for future image and LUT ingestion flows.
        </Text>
      </View>
    </ScrollView>
  );
}
