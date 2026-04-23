import React from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

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
  readonly onClose: () => void;
}

type ActiveSheet = 'crop' | 'log' | 'export' | 'artistic-look' | 'smart-filter' | 'pro-clarity' | 'blend' | null;

export function EditorScreen({
  assetId,
  assetUri = '',
  assetWidth = 1080,
  assetHeight = 1080,
  onClose,
}: EditorScreenProps): React.JSX.Element {
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
  const cropPreviewWidth = Math.max(260, Math.min(windowWidth - spacing.lg * 2, 430));
  const cropPreviewHeight = Math.max(
    260,
    Math.min(windowHeight * 0.64, Math.round(cropPreviewWidth / getAssetAspectRatio(editState))),
  );
  const hasAsset = editState.assetUri.length > 0;
  const isCropMode = activeSheet === 'crop';

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

  if (isCropMode) {
    return (
      <SafeAreaView style={styles.cropContainer}>
        <View style={styles.cropHeader}>
          <Pressable
            accessibilityLabel="Close crop workspace"
            accessibilityRole="button"
            hitSlop={10}
            onPress={closeSheet}
            style={({ pressed }) => [styles.cropHeaderAction, pressed ? styles.actionPressed : null]}
          >
            <Text selectable={false} variant="heading" style={styles.cropHeaderIcon}>
              ✕
            </Text>
          </Pressable>
          <Button label="Export" onPress={() => openSheet('export')} />
        </View>

        {hasAsset && !isLoading ? (
          <CropOverlay
            crop={editState.crop}
            imageUri={editState.assetUri}
            previewWidth={cropPreviewWidth}
            previewHeight={cropPreviewHeight}
            onChangeCrop={(crop) => dispatch({ type: 'SET_CROP', crop })}
          />
        ) : (
          <View style={styles.cropPlaceholder}>
            <Text variant="body" style={styles.placeholderText}>
              Waiting for draft hydration…
            </Text>
          </View>
        )}

        <View style={styles.cropDock}>
          <RotateControls
            rotation={editState.rotation}
            onRotateClockwise={() => dispatch({ type: 'ROTATE_CW' })}
            onRotateCounterClockwise={() => dispatch({ type: 'ROTATE_CCW' })}
          />
          <View style={styles.cropFooter}>
            <FooterIconButton
              accessibilityLabel="Cancel crop editing"
              icon="×"
              onPress={closeSheet}
            />
            <CropFooterHistoryButton
              accessibilityLabel="Undo edit"
              disabled={!canUndo}
              icon="↶"
              onPress={undo}
            />
            <Text selectable={false} numberOfLines={1} variant="label" style={styles.cropTitle}>
              Transform & Crop
            </Text>
            <CropFooterHistoryButton
              accessibilityLabel="Redo edit"
              disabled={!canRedo}
              icon="↷"
              onPress={redo}
            />
            <FooterIconButton
              accessibilityLabel="Done cropping"
              icon="✓"
              onPress={closeSheet}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton accessibilityLabel="Close editor" icon="✕" onPress={onClose} />
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

      <View style={styles.toolbarDock}>
        <EditorActionButton icon="⌗" label="Crop" onPress={() => openSheet('crop')} />
        <EditorActionButton icon="◐" label="Blend" onPress={() => openSheet('blend')} />
        <EditorActionButton icon="☷" label="Log" onPress={() => openSheet('log')} />
        <View style={styles.historyGroup}>
          <HistoryButton
            accessibilityLabel="Undo edit"
            disabled={!canUndo}
            icon="↶"
            onPress={undo}
          />
          <HistoryButton
            accessibilityLabel="Redo edit"
            disabled={!canRedo}
            icon="↷"
            onPress={redo}
          />
        </View>
      </View>

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

function getAssetAspectRatio(editState: { assetWidth: number; assetHeight: number }): number {
  if (editState.assetHeight <= 0) {
    return 1;
  }

  return editState.assetWidth / editState.assetHeight;
}

interface EditorActionButtonProps {
  readonly accessibilityLabel?: string;
  readonly icon: string;
  readonly label: string;
  readonly onPress: () => void;
}

function EditorActionButton({
  accessibilityLabel,
  icon,
  label,
  onPress,
}: EditorActionButtonProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.editorAction, pressed ? styles.actionPressed : null]}
    >
      <Text selectable={false} variant="heading" color={colors.primary} style={styles.editorActionIcon}>
        {icon}
      </Text>
      <Text selectable={false} variant="caption" style={styles.editorActionLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

interface HistoryButtonProps {
  readonly accessibilityLabel: string;
  readonly disabled: boolean;
  readonly icon: string;
  readonly onPress: () => void;
}

function HistoryButton({
  accessibilityLabel,
  disabled,
  icon,
  onPress,
}: HistoryButtonProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.historyButton,
        disabled ? styles.historyButtonDisabled : null,
        pressed ? styles.actionPressed : null,
      ]}
    >
      <Text selectable={false} variant="heading" color={colors.primary} style={styles.historyIcon}>
        {icon}
      </Text>
    </Pressable>
  );
}

interface FooterIconButtonProps {
  readonly accessibilityLabel: string;
  readonly icon: string;
  readonly onPress: () => void;
}

function FooterIconButton({
  accessibilityLabel,
  icon,
  onPress,
}: FooterIconButtonProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.footerIconButton, pressed ? styles.actionPressed : null]}
    >
      <Text selectable={false} variant="heading" color={colors.primary} style={styles.footerIcon}>
        {icon}
      </Text>
    </Pressable>
  );
}

interface CropFooterHistoryButtonProps {
  readonly accessibilityLabel: string;
  readonly disabled: boolean;
  readonly icon: string;
  readonly onPress: () => void;
}

function CropFooterHistoryButton({
  accessibilityLabel,
  disabled,
  icon,
  onPress,
}: CropFooterHistoryButtonProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.cropHistoryButton,
        disabled ? styles.cropHistoryButtonDisabled : null,
        pressed ? styles.actionPressed : null,
      ]}
    >
      <Text selectable={false} variant="heading" color={colors.primary} style={styles.cropHistoryIcon}>
        {icon}
      </Text>
    </Pressable>
  );
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
  toolbarDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderRadius: 28,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  editorAction: {
    minWidth: 62,
    minHeight: 58,
    borderRadius: 22,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  editorActionIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
  editorActionLabel: {
    fontSize: 11,
  },
  historyGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  historyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyButtonDisabled: {
    opacity: 0.25,
  },
  historyIcon: {
    fontSize: 22,
    lineHeight: 26,
  },
  actionPressed: {
    opacity: 0.78,
  },
  cropContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  cropHeader: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cropHeaderAction: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropHeaderIcon: {
    color: colors.secondary,
    fontWeight: '400',
  },
  cropPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropDock: {
    gap: spacing.xs,
    paddingTop: spacing.sm + spacing.xs,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cropFooter: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  cropTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 1.9,
    textTransform: 'uppercase',
  },
  footerIconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerIcon: {
    color: colors.primary,
    fontSize: 21,
    fontWeight: '400',
    lineHeight: 24,
  },
  cropHistoryButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropHistoryButtonDisabled: {
    opacity: 0.22,
  },
  cropHistoryIcon: {
    color: colors.primary,
    fontSize: 18,
    lineHeight: 20,
  },
});
