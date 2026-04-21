import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import type { LibraryPhotoAsset } from '@adapters/expo/media-library';
import { SafeAreaView } from '@ui/layout';
import { ErrorBanner } from '@ui/feedback';
import { PresetBrowser, usePresetBrowser } from '@features/preset-browser';
import { Slider, Text } from '@ui/primitives';
import { BatchThumbnailStrip } from './batch-thumbnail-strip';
import { BatchPreview } from './batch-preview';
import { BatchPhotoPicker } from './batch-photo-picker';
import { useBatchSession } from './use-batch-session';
import { colors, spacing } from '@theme/tokens';

interface BatchScreenProps {
  readonly onClose: () => void;
}

export function BatchScreen({ onClose }: BatchScreenProps): React.JSX.Element {
  const {
    session,
    selectedPhoto,
    addPhotos,
    removePhoto,
    selectPhotoById,
    applyLut,
    startExport,
    navigatePrev,
    navigateNext,
    hasPrev,
    hasNext,
  } = useBatchSession();

  const [showPicker, setShowPicker] = useState(session.workspace.photos.length === 0);
  const [intensity, setIntensity] = useState(1);
  const {
    presets,
    categories,
    selectedCategory,
    setSelectedCategory,
    selectedPresetId,
    setSelectedPresetId,
    isLoading: arePresetsLoading,
  } = usePresetBrowser();

  const handleBack = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleExport = useCallback(() => {
    void startExport('jpeg');
  }, [startExport]);

  const handlePhotosSelected = useCallback(
    (assets: readonly LibraryPhotoAsset[]) => {
      const selections = assets.map((a) => ({
        id: a.id,
        uri: a.uri,
        width: a.width,
        height: a.height,
      }));
      void addPhotos(selections);
    },
    [addPhotos],
  );

  const handleIntensityChange = useCallback(
    (value: number) => {
      setIntensity(value);
      if (selectedPresetId) {
        applyLut(selectedPresetId, value);
      }
    },
    [applyLut, selectedPresetId],
  );

  const handleSelectPreset = useCallback(
    (presetId: string) => {
      setSelectedPresetId(presetId);
      applyLut(presetId, intensity);
    },
    [applyLut, intensity, setSelectedPresetId],
  );

  const handleClearPreset = useCallback(() => {
    setSelectedPresetId(null);
    setIntensity(1);
    applyLut(null, 1);
  }, [applyLut, setSelectedPresetId]);

  const batchError = session.error?.message ?? null;

  const handleClosePicker = useCallback(() => {
    setShowPicker(false);
  }, []);

  if (session.state === 'exporting') {
    const progress = session.exportProgress;
    const progressPercentage: `${number}%` = `${Math.round(
      ((progress?.completed ?? 0) / (progress?.total ?? 1)) * 100,
    )}%`;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.exportOverlay}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.exportText}>
            {`Exporting ${progress?.completed ?? 0} of ${progress?.total ?? 0}...`}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: progressPercentage,
                },
              ]}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable
          onPress={handleBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>
        <Text style={styles.title}>BATCH PROCESS</Text>
        <Pressable
          style={[
            styles.exportButton,
            session.workspace.photos.length === 0 && styles.exportButtonDisabled,
          ]}
          onPress={handleExport}
          disabled={session.workspace.photos.length === 0}
          accessibilityRole="button"
          accessibilityLabel="Export all photos"
        >
          <Text style={styles.exportButtonText}>EXPORT</Text>
        </Pressable>
      </View>

      {batchError ? <ErrorBanner message={batchError} /> : null}

      <BatchThumbnailStrip
        photos={session.workspace.photos}
        selectedId={session.workspace.selectedPhotoId}
        onSelect={selectPhotoById}
        onAdd={() => setShowPicker(true)}
        onRemove={removePhoto}
      />

      <BatchPreview
        photo={selectedPhoto}
        onPrev={navigatePrev}
        onNext={navigateNext}
        hasPrev={hasPrev}
        hasNext={hasNext}
      />

      <View style={styles.controls}>
        <View style={styles.intensityRow}>
          <Pressable
            onPress={handleClearPreset}
            style={styles.clearBtn}
            accessibilityRole="button"
            accessibilityLabel="Clear LUT"
          >
            <Text style={styles.clearBtnText}>✕</Text>
          </Pressable>
          <Text style={styles.intensityLabel}>{`${Math.round(intensity * 100)}%`}</Text>
          <Slider
            value={intensity}
            minimumValue={0}
            maximumValue={1}
            onValueChange={handleIntensityChange}
          />
        </View>
        <PresetBrowser
          presets={presets}
          categories={categories}
          selectedCategory={selectedCategory}
          selectedPresetId={selectedPresetId}
          isLoading={arePresetsLoading}
          onSelectCategory={setSelectedCategory}
          onSelectPreset={handleSelectPreset}
        />
      </View>

      <BatchPhotoPicker
        visible={showPicker}
        currentCount={session.workspace.photos.length}
        onSelect={handlePhotosSelected}
        onClose={handleClosePicker}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  backBtnText: { color: colors.primary, fontSize: 20 },
  title: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  exportButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
  },
  exportButtonDisabled: { opacity: 0.5 },
  exportButtonText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  controls: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  intensityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  clearBtn: { padding: spacing.xs },
  clearBtnText: { color: colors.secondary, fontSize: 16 },
  intensityLabel: { color: colors.primary, width: 50, textAlign: 'center', fontSize: 12 },
  exportOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportText: { color: colors.primary, marginTop: spacing.md, fontSize: 16 },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 2,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.accent },
});
