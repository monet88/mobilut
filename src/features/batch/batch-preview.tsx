import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@ui/primitives';
import type { BatchPhoto } from '@core/batch';
import { colors } from '@theme/tokens';

interface BatchPreviewProps {
  readonly photo: BatchPhoto | null;
  readonly onPrev: () => void;
  readonly onNext: () => void;
  readonly hasPrev: boolean;
  readonly hasNext: boolean;
}

export function BatchPreview({
  photo,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: BatchPreviewProps): React.JSX.Element {
  if (!photo) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholder} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: photo.uri }} style={styles.image} resizeMode="contain" />

      <Pressable
        style={[styles.navButton, styles.navLeft, !hasPrev && styles.navDisabled]}
        onPress={onPrev}
        disabled={!hasPrev}
        accessibilityRole="button"
        accessibilityLabel="Previous photo"
      >
        <Text style={styles.navText}>‹</Text>
      </Pressable>

      <Pressable
        style={[styles.navButton, styles.navRight, !hasNext && styles.navDisabled]}
        onPress={onNext}
        disabled={!hasNext}
        accessibilityRole="button"
        accessibilityLabel="Next photo"
      >
        <Text style={styles.navText}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: { width: '100%', height: '100%' },
  placeholder: {
    width: 200,
    height: 200,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 24,
  },
  navLeft: { left: 8 },
  navRight: { right: 8 },
  navDisabled: { opacity: 0.3 },
  navText: { color: colors.primary, fontSize: 32 },
});
