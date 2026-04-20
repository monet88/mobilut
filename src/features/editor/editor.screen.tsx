import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';

import { PreviewCanvas } from '@adapters/skia/preview-canvas';
import type { AdjustmentParams } from '@core/edit-session/edit-state';
import { ExportImageScreen } from '@features/export-image';
import { FramingPanel } from '@features/framing-toolkit';
import { PresetBrowser, usePresetBrowser } from '@features/preset-browser';
import { BottomSheet, SafeAreaView } from '@ui/layout';
import { Button, IconButton, Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

import { AdjustmentPanel } from './components/adjustment-panel';
import { CropOverlay } from './components/crop-overlay';
import { RotateControls } from './components/rotate-controls';
import { ModificationLogSheet } from './modification-log-sheet';
import { ToolSheet, type EditorSheetKey } from './tool-sheet';
import { useEditorSession } from './use-editor-session';

interface EditorScreenProps {
  readonly assetId: string;
  readonly assetUri?: string;
  readonly assetWidth?: number;
  readonly assetHeight?: number;
}

type ActiveSheet = EditorSheetKey | 'tools' | null;

export function EditorScreen({
  assetId,
  assetUri = '',
  assetWidth = 1080,
  assetHeight = 1080,
}: EditorScreenProps): React.JSX.Element {
  const router = useRouter();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { editState, history, isLoading, isSavingDraft, canUndo, canRedo, undo, redo, dispatch } =
    useEditorSession(assetId, assetUri, assetWidth, assetHeight);
  const {
    presets,
    categories,
    selectedCategory,
    setSelectedCategory,
    selectedPresetId,
    setSelectedPresetId,
    isLoading: isLoadingPresets,
  } = usePresetBrowser();
  const [activeSheet, setActiveSheet] = React.useState<ActiveSheet>(null);

  const previewWidth = Math.max(220, Math.min(windowWidth - spacing.lg * 2, 420));
  const previewHeight = Math.max(
    220,
    Math.min(windowHeight * 0.52, Math.round(previewWidth / getAspectRatio(editState))),
  );
  const hasAsset = editState.assetUri.length > 0;

  React.useEffect(() => {
    setSelectedPresetId(editState.selectedPresetId);
  }, [editState.selectedPresetId, setSelectedPresetId]);

  const handleSelectPreset = React.useCallback(
    (presetId: string) => {
      setSelectedPresetId(presetId);
      dispatch({ type: 'SELECT_PRESET', presetId });
    },
    [dispatch, setSelectedPresetId],
  );

  const handleAdjustmentChange = React.useCallback(
    (adjustments: Partial<AdjustmentParams>) => {
      dispatch({ type: 'SET_ADJUSTMENTS', adjustments });
    },
    [dispatch],
  );

  const openSheet = React.useCallback((sheet: ActiveSheet) => {
    setActiveSheet(sheet);
  }, []);

  const closeSheet = React.useCallback(() => {
    setActiveSheet(null);
  }, []);

  const handleSelectTool = React.useCallback((sheet: EditorSheetKey) => {
    setActiveSheet(sheet);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton accessibilityLabel="Close editor" icon="✕" onPress={() => router.back()} />
        <View style={styles.headerStatus}>
          <Text variant="heading">Editor</Text>
          <Text variant="caption" style={styles.statusText}>
            {isLoading ? 'Hydrating draft…' : isSavingDraft ? 'Saving draft…' : 'Saved locally'}
          </Text>
        </View>
        <Button label="Export" onPress={() => openSheet('export')} />
      </View>

      <View style={styles.previewSection}>
        <View style={styles.previewCard}>
          {hasAsset && !isLoading ? (
            <PreviewCanvas imageUri={editState.assetUri} width={previewWidth} height={previewHeight} />
          ) : (
            <View style={[styles.placeholder, { width: previewWidth, height: previewHeight }]}>
              <Text variant="body" style={styles.placeholderText}>
                Waiting for draft hydration…
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.toolbar}>
        <Button label="Tools" onPress={() => openSheet('tools')} variant="secondary" />
        <Button label="Crop" onPress={() => openSheet('crop')} variant="secondary" />
        <Button label="Adjust" onPress={() => openSheet('adjust')} variant="secondary" />
        <Button label="LUT" onPress={() => openSheet('lut')} variant="secondary" />
        <Button label="Log" onPress={() => openSheet('log')} variant="secondary" />
        <Button label="Undo" onPress={undo} disabled={!canUndo} variant="secondary" />
        <Button label="Redo" onPress={redo} disabled={!canRedo} variant="secondary" />
      </View>

      <ToolSheet
        visible={activeSheet === 'tools'}
        onClose={closeSheet}
        onSelectTool={handleSelectTool}
      />

      <BottomSheet visible={activeSheet === 'crop'} title="Crop" onClose={closeSheet}>
        <View style={styles.sheetContent}>
          <CropOverlay
            crop={editState.crop}
            onChangeCrop={(crop) => dispatch({ type: 'SET_CROP', crop })}
          />
          <RotateControls
            rotation={editState.rotation}
            onRotateClockwise={() => dispatch({ type: 'ROTATE_CW' })}
            onRotateCounterClockwise={() => dispatch({ type: 'ROTATE_CCW' })}
          />
        </View>
      </BottomSheet>

      <BottomSheet visible={activeSheet === 'adjust'} title="Adjust" onClose={closeSheet}>
        <AdjustmentPanel
          adjustments={editState.adjustments}
          onChangeAdjustments={handleAdjustmentChange}
        />
      </BottomSheet>

      <BottomSheet visible={activeSheet === 'lut'} title="LUT" onClose={closeSheet}>
        <PresetBrowser
          presets={presets}
          categories={categories}
          selectedCategory={selectedCategory}
          selectedPresetId={selectedPresetId}
          isLoading={isLoadingPresets}
          onSelectCategory={setSelectedCategory}
          onSelectPreset={handleSelectPreset}
        />
      </BottomSheet>

      <ModificationLogSheet
        visible={activeSheet === 'log'}
        states={[...history.past, history.present]}
        onClose={closeSheet}
      />

      <BottomSheet visible={activeSheet === 'frame'} title="Frame" onClose={closeSheet}>
        <FramingPanel framing={editState.framing} dispatch={dispatch} />
      </BottomSheet>

      <BottomSheet visible={activeSheet === 'export'} title="Export" onClose={closeSheet}>
        <ExportImageScreen editState={editState} />
      </BottomSheet>
    </SafeAreaView>
  );
}

function getAspectRatio(editState: { assetWidth: number; assetHeight: number }): number {
  if (editState.assetHeight <= 0) {
    return 1;
  }

  return editState.assetWidth / editState.assetHeight;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerStatus: {
    flex: 1,
    gap: spacing.xs,
  },
  statusText: {
    color: colors.secondary,
  },
  previewSection: {
    flex: 1,
    justifyContent: 'center',
  },
  previewCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    minHeight: 320,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderCurve: 'continuous',
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
  },
  placeholderText: {
    color: colors.secondary,
    textAlign: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  sheetContent: {
    gap: spacing.md,
  },
});
