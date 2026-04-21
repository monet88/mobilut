import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';

import { PreviewCanvas } from '@adapters/skia/preview-canvas';
import { ExportImageScreen } from '@features/export-image';
import { BottomSheet, SafeAreaView } from '@ui/layout';
import { Button, IconButton, Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';
import {
  buildPreviewRequest,
  renderPreview,
  type PreviewRenderResult,
} from '@services/image/preview-render.service';
import type { BlendParams } from '@core/blend';
import type { ArtisticLookParams } from '@core/stylistic/artistic-look-model';
import type { SmartFilterParams } from '@core/stylistic/smart-filter-model';
import type { ProClarityParams } from '@core/stylistic/pro-clarity-model';

import { CropOverlay } from './components/crop-overlay';
import { RotateControls } from './components/rotate-controls';
import { ModificationLogSheet } from './modification-log-sheet';
import { useEditorSession } from './use-editor-session';
import { ArtisticLookSheet } from './artistic-look-sheet';
import { SmartFilterSheet } from './smart-filter-sheet';
import { ProClaritySheet } from './pro-clarity-sheet';
import { BlendSheet } from './blend-sheet';

interface EditorScreenProps {
  readonly assetId: string;
  readonly assetUri?: string;
  readonly assetWidth?: number;
  readonly assetHeight?: number;
}

type ActiveSheet = 'crop' | 'log' | 'export' | 'artistic-look' | 'smart-filter' | 'pro-clarity' | 'blend' | null;

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
  const [activeSheet, setActiveSheet] = React.useState<ActiveSheet>(null);
  const [previewResult, setPreviewResult] = React.useState<PreviewRenderResult | null>(null);
  const [previewBlend, setPreviewBlend] = React.useState<BlendParams | null>(null);

  const previewWidth = Math.max(220, Math.min(windowWidth - spacing.lg * 2, 420));
  const previewHeight = Math.max(
    220,
    Math.min(windowHeight * 0.52, Math.round(previewWidth / getAspectRatio(previewResult, editState))),
  );
  const hasAsset = editState.assetUri.length > 0;

  React.useEffect(() => {
    if (!hasAsset || isLoading) {
      setPreviewResult(null);
      return;
    }

    let cancelled = false;

    void renderPreview(buildPreviewRequest(editState))
      .then((result) => {
        if (!cancelled) {
          setPreviewResult(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewResult(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [editState, hasAsset, isLoading]);

  const openSheet = React.useCallback((sheet: ActiveSheet) => {
    setActiveSheet(sheet);
  }, []);

  const closeSheet = React.useCallback(() => {
    setActiveSheet(null);
  }, []);

  const handleArtisticLookApply = React.useCallback(
    (params: ArtisticLookParams | null) => {
      dispatch(params ? { type: 'SET_ARTISTIC_LOOK', params } : { type: 'CLEAR_ARTISTIC_LOOK' });
      closeSheet();
    },
    [closeSheet, dispatch],
  );

  const handleSmartFilterApply = React.useCallback(
    (params: SmartFilterParams | null) => {
      dispatch(params ? { type: 'SET_SMART_FILTER', params } : { type: 'CLEAR_SMART_FILTER' });
      closeSheet();
    },
    [closeSheet, dispatch],
  );

  const handleProClarityApply = React.useCallback(
    (params: ProClarityParams | null) => {
      dispatch(params ? { type: 'SET_PRO_CLARITY', params } : { type: 'CLEAR_PRO_CLARITY' });
      closeSheet();
    },
    [closeSheet, dispatch],
  );

  const handleBlendApply = React.useCallback(
    (params: BlendParams | null) => {
      setPreviewBlend(null);
      dispatch(params ? { type: 'SET_BLEND', params } : { type: 'CLEAR_BLEND' });
      closeSheet();
    },
    [closeSheet, dispatch],
  );

  const handleBlendCancel = React.useCallback(() => {
    setPreviewBlend(null);
    closeSheet();
  }, [closeSheet]);

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
            <PreviewCanvas
              imageUri={previewResult?.uri ?? editState.assetUri}
              width={previewWidth}
              height={previewHeight}
              blendLayers={previewBlend?.layers ?? editState.blend?.layers ?? null}
            />
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
        <Button label="Crop" onPress={() => openSheet('crop')} variant="secondary" />
        <Button label="Blend" onPress={() => openSheet('blend')} variant="secondary" />
        <Button label="Log" onPress={() => openSheet('log')} variant="secondary" />
        <Button label="Undo" onPress={undo} disabled={!canUndo} variant="secondary" />
        <Button label="Redo" onPress={redo} disabled={!canRedo} variant="secondary" />
      </View>

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

      <ModificationLogSheet
        visible={activeSheet === 'log'}
        states={[...history.past, history.present]}
        onClose={closeSheet}
      />

      <BottomSheet visible={activeSheet === 'export'} title="Export" onClose={closeSheet}>
        <ExportImageScreen editState={editState} />
      </BottomSheet>

      <ArtisticLookSheet
        visible={activeSheet === 'artistic-look'}
        initialParams={editState.artisticLook}
        onApply={handleArtisticLookApply}
        onCancel={closeSheet}
      />

      <SmartFilterSheet
        visible={activeSheet === 'smart-filter'}
        initialParams={editState.smartFilter}
        onApply={handleSmartFilterApply}
        onCancel={closeSheet}
      />

      <ProClaritySheet
        visible={activeSheet === 'pro-clarity'}
        initialParams={editState.proClarity}
        onApply={handleProClarityApply}
        onCancel={closeSheet}
      />

      <BlendSheet
        visible={activeSheet === 'blend'}
        initialParams={editState.blend}
        onApply={handleBlendApply}
        onCancel={handleBlendCancel}
        onPreview={setPreviewBlend}
      />
    </SafeAreaView>
  );
}

function getAspectRatio(
  previewResult: PreviewRenderResult | null,
  editState: { assetWidth: number; assetHeight: number },
): number {
  if (previewResult && previewResult.height > 0) {
    return previewResult.width / previewResult.height;
  }

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
