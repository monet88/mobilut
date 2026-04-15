import React from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import type { ImageAsset } from '@core/image-pipeline/image-asset';
import { ImportImageScreen } from '@features/import-image';
import { colors } from '@theme/tokens';

export default function HomeScreen(): React.JSX.Element {
  const handleImageSelected = React.useCallback((asset: ImageAsset) => {
    router.push(`/editor/${asset.id}`);
  }, []);

  return (
    <View style={styles.container}>
      <ImportImageScreen onImageSelected={handleImageSelected} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
