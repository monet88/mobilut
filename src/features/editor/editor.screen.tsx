import React from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { PreviewCanvas } from '@adapters/skia/preview-canvas';
import { Button, Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

import { BeforeAfter } from './before-after';
import { useEditorSession } from './use-editor-session';

interface EditorScreenProps {
  readonly assetId: string;
  readonly assetUri?: string;
  readonly assetWidth?: number;
  readonly assetHeight?: number;
}

export function EditorScreen({
  assetId,
  assetUri = '',
  assetWidth = 1080,
  assetHeight = 1080,
}: EditorScreenProps): React.JSX.Element {
  const { width: windowWidth } = useWindowDimensions();
  const { editState, canUndo, canRedo, undo, redo } = useEditorSession(
    assetId,
    assetUri,
    assetWidth,
    assetHeight,
  );

  const previewWidth = Math.max(200, Math.min(windowWidth - spacing.lg * 2, 360));
  const aspectRatio = editState.assetHeight > 0 ? editState.assetWidth / editState.assetHeight : 1;
  const previewHeight = Math.max(200, Math.round(previewWidth / aspectRatio));
  const hasAsset = editState.assetUri.length > 0;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.scrollContent}
      style={styles.container}
    >
      <View style={styles.section}>
        <Text variant="heading">Editor</Text>
        <Text variant="body" style={styles.subtitle}>
          Asset ID: {assetId}
        </Text>
      </View>

      <View style={styles.section}>
        <Text variant="label">Preview</Text>
        <View style={styles.previewCard}>
          {hasAsset ? (
            <PreviewCanvas
              imageUri={editState.assetUri}
              width={previewWidth}
              height={previewHeight}
            />
          ) : (
            <View style={[styles.placeholder, { width: previewWidth, height: previewHeight }]}>
              <Text variant="body" style={styles.placeholderText}>
                No asset URI was provided to the editor route yet.
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="label">Before / After</Text>
        {hasAsset ? (
          <BeforeAfter
            beforeUri={editState.assetUri}
            afterUri={editState.assetUri}
            width={previewWidth}
            height={previewHeight}
          />
        ) : (
          <View style={styles.beforeAfterPlaceholder}>
            <Text variant="caption">
              Before/after becomes active once an image asset is loaded.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text variant="label">Session controls</Text>
        <View style={styles.toolbar}>
          <Button label="Undo" onPress={undo} disabled={!canUndo} variant="secondary" />
          <Button label="Redo" onPress={redo} disabled={!canRedo} variant="secondary" />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  subtitle: {
    color: colors.secondary,
  },
  previewCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: spacing.md,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: spacing.md,
  },
  placeholderText: {
    color: colors.secondary,
    textAlign: 'center',
  },
  beforeAfterPlaceholder: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: spacing.md,
  },
  toolbar: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
