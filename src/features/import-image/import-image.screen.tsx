import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import type { ImageAsset } from '@core/image-pipeline/image-asset';
import { ErrorBanner, LoadingOverlay } from '@ui/feedback';
import { Button, Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

import { useImportImage } from './use-import-image';

interface ImportImageScreenProps {
  readonly onImageSelected?: (asset: ImageAsset) => void;
}

export function ImportImageScreen({ onImageSelected }: ImportImageScreenProps): React.JSX.Element {
  const router = useRouter();
  const { isLoading, error, pickImage } = useImportImage();

  const handlePick = async (): Promise<void> => {
    const asset = await pickImage();

    if (!asset) {
      return;
    }

    if (onImageSelected) {
      onImageSelected(asset);
      return;
    }

    router.push(`/editor/${asset.id}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="heading" style={styles.title}>
          Import Photo
        </Text>
        <Text variant="body" style={styles.subtitle}>
          Choose a photo from your library to start a new editor session.
        </Text>

        {error ? <ErrorBanner message={error.message} onRetry={handlePick} /> : null}

        <Button
          label="Choose from Library"
          onPress={handlePick}
          disabled={isLoading}
          loading={isLoading}
        />
      </View>

      <LoadingOverlay visible={isLoading} message="Importing photo…" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  content: {
    width: '100%',
    gap: spacing.md,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: colors.secondary,
  },
});
