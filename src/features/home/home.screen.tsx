import React from 'react';
import { StyleSheet, View } from 'react-native';

import { createInitialEditState } from '@core/edit-session/edit-state';
import { useImportImage } from '@features/import-image';
import { addRecentItem, getRecentItems, saveDraft } from '@services/storage';
import { colors, spacing } from '@theme/tokens';
import { ErrorBanner, LoadingOverlay } from '@ui/feedback';
import { SafeAreaView } from '@ui/layout';
import { Button, IconButton, Text } from '@ui/primitives';

import { DraftGrid } from './draft-grid';
import { useDrafts } from './use-drafts';
import { HomeAdBanner } from './home-ad-banner';

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

interface HomeScreenProps {
  readonly onOpenBatch: () => void;
  readonly onOpenEditor: (assetId: string) => void;
  readonly onOpenSettings: () => void;
}

export function HomeScreen({
  onOpenBatch,
  onOpenEditor,
  onOpenSettings,
}: HomeScreenProps): React.JSX.Element {
  const { drafts, isLoading, error, refresh, remove } = useDrafts();
  const { isLoading: isPickingImage, error: importError, pickImage } = useImportImage();
  const [recentCount, setRecentCount] = React.useState(0);
  const [storageError, setStorageError] = React.useState<Error | null>(null);

  const loadRecentCount = React.useCallback(async () => {
    const items = await getRecentItems();
    setRecentCount(items.length);
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    void getRecentItems()
      .then((items) => {
        if (isMounted) {
          setRecentCount(items.length);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setStorageError(toError(err));
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddPhoto = React.useCallback(async () => {
    setStorageError(null);

    const asset = await pickImage();
    if (!asset) {
      return;
    }

    const now = Date.now();
    const editState = createInitialEditState(asset.id, asset.uri, asset.width, asset.height);

    try {
      await saveDraft({
        summary: {
          assetId: asset.id,
          assetUri: asset.uri,
          previewUri: asset.uri,
          createdAt: now,
          updatedAt: now,
        },
        history: {
          past: [],
          present: editState,
          future: [],
        },
      });
      await refresh();
    } catch (err) {
      setStorageError(toError(err));
      return;
    }

    try {
      await addRecentItem(asset);
      await loadRecentCount();
    } catch (err) {
      setStorageError(toError(err));
    }

    onOpenEditor(asset.id);
  }, [loadRecentCount, onOpenEditor, pickImage, refresh]);

  const handleBatchPress = React.useCallback(() => {
    onOpenBatch();
  }, [onOpenBatch]);

  const bannerError = error ?? storageError ?? importError;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="heading">Mobilut</Text>
        <IconButton icon="⚙️" accessibilityLabel="Open settings" onPress={onOpenSettings} />
      </View>

      {bannerError ? <ErrorBanner message={bannerError.message} /> : null}

      <Button label="Add New Photo" onPress={handleAddPhoto} loading={isPickingImage} />
      <Button label="Batch Process" onPress={handleBatchPress} />

      {drafts.length > 0 ? (
        <DraftGrid
          drafts={drafts}
          onDraftPress={onOpenEditor}
          onDeleteDraft={(assetId) => void remove(assetId)}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text variant="label">NO CONTENT FOUND.</Text>
          <Text variant="caption">Add a photo to start your first draft.</Text>
        </View>
      )}

      <View style={styles.statsRow}>
        <Text variant="caption">Collection: {recentCount}</Text>
        <Text variant="caption">Drafts: {drafts.length}</Text>
      </View>

      <HomeAdBanner />

      <LoadingOverlay visible={isLoading} message="Loading drafts…" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  emptyState: {
    gap: spacing.xs,
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
});
