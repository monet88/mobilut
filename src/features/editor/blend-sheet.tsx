import React, { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { pickImageFromLibrary } from '@adapters/expo/image-picker';
import { BottomSheet } from '@ui/layout';
import { Slider, Text } from '@ui/primitives';
import {
  BLEND_MODE_LABELS,
  createBlendLayer,
  type BlendLayer,
  type BlendMode,
  type BlendParams,
} from '@core/blend';
import { colors, spacing } from '@theme/tokens';

interface BlendSheetProps {
  readonly visible: boolean;
  readonly initialParams: BlendParams | null;
  readonly onApply: (params: BlendParams | null) => void;
  readonly onCancel: () => void;
  readonly onPreview: (params: BlendParams | null) => void;
}

const BLEND_MODES = Object.keys(BLEND_MODE_LABELS) as BlendMode[];

export function BlendSheet({
  visible,
  initialParams,
  onApply,
  onCancel,
  onPreview,
}: BlendSheetProps): React.JSX.Element {
  const [layers, setLayers] = useState<BlendLayer[]>(
    initialParams?.layers ? [...initialParams.layers] : [],
  );
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);
  const updateLayer = useCallback(
    (layerId: string, updates: Partial<BlendLayer>, preview: boolean) => {
      setLayers((prev) => {
        const next = prev.map((layer) => (layer.id === layerId ? { ...layer, ...updates } : layer));
        if (preview) {
          onPreview(next.length > 0 ? { layers: next } : null);
        }
        return next;
      });
    },
    [onPreview],
  );

  const handleAddLayer = useCallback(async () => {
    const asset = await pickImageFromLibrary();

    if (asset) {
      const newLayer = createBlendLayer(asset.uri, asset.width, asset.height);
      setLayers((prev) => {
        const next = [...prev, newLayer];
        onPreview({ layers: next });
        return next;
      });
      setSelectedLayerId(newLayer.id);
    }
  }, [onPreview]);

  const handleRemoveLayer = useCallback(
    (layerId: string) => {
      setLayers((prev) => {
        const next = prev.filter((l) => l.id !== layerId);
        onPreview(next.length > 0 ? { layers: next } : null);
        return next;
      });
      if (selectedLayerId === layerId) {
        setSelectedLayerId(null);
      }
    },
    [selectedLayerId, onPreview],
  );

  const handleApply = useCallback(() => {
    onApply(layers.length > 0 ? { layers } : null);
  }, [layers, onApply]);

  const handleClear = useCallback(() => {
    setLayers([]);
    setSelectedLayerId(null);
    onPreview(null);
  }, [onPreview]);

  return (
    <BottomSheet visible={visible} onClose={onCancel} title="BLEND">
      <View style={styles.layerStrip}>
        <Pressable
          style={styles.addLayerButton}
          onPress={() => void handleAddLayer()}
          accessibilityRole="button"
          accessibilityLabel="Add blend layer"
        >
          <Text style={styles.addLayerText}>+</Text>
        </Pressable>
        <FlatList
          data={layers}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.layerThumb,
                selectedLayerId === item.id && styles.layerThumbSelected,
              ]}
              onPress={() => setSelectedLayerId(item.id)}
              accessibilityRole="button"
              accessibilityLabel="Select layer"
            >
              <Image source={{ uri: item.imageUri }} style={styles.layerImage} />
              <Pressable
                style={styles.removeButton}
                onPress={() => handleRemoveLayer(item.id)}
                accessibilityRole="button"
                accessibilityLabel="Remove layer"
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </Pressable>
            </Pressable>
          )}
        />
      </View>

      {selectedLayer != null && (
        <View style={styles.layerControls}>
          <Text style={styles.controlLabel}>Blend Mode</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.blendModes}>
            {BLEND_MODES.map((mode) => (
              <Pressable
                key={mode}
                style={[
                  styles.modeButton,
                  selectedLayer.blendMode === mode && styles.modeButtonActive,
                ]}
                onPress={() => updateLayer(selectedLayer.id, { blendMode: mode }, true)}
                accessibilityRole="button"
                accessibilityLabel={`Blend mode ${BLEND_MODE_LABELS[mode]}`}
              >
                <Text
                  style={[
                    styles.modeText,
                    selectedLayer.blendMode === mode && styles.modeTextActive,
                  ]}
                >
                  {BLEND_MODE_LABELS[mode]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.sliderRow}>
            <Text style={styles.controlLabel}>
              {`Opacity: ${Math.round(selectedLayer.opacity * 100)}%`}
            </Text>
            <Slider
              value={selectedLayer.opacity}
              minimumValue={0}
              maximumValue={1}
              onValueChange={(value) => updateLayer(selectedLayer.id, { opacity: value }, false)}
              onSlidingComplete={(value) => updateLayer(selectedLayer.id, { opacity: value }, true)}
            />
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable
          onPress={onCancel}
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text style={styles.actionBtnText}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleClear}
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel="Clear all layers"
        >
          <Text style={styles.actionBtnText}>Clear</Text>
        </Pressable>
        <Pressable
          onPress={handleApply}
          style={[styles.actionBtn, styles.actionBtnPrimary]}
          accessibilityRole="button"
          accessibilityLabel="Apply blend"
        >
          <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>Apply</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  layerStrip: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    height: 64,
  },
  addLayerButton: {
    width: 56,
    height: 56,
    borderRadius: 4,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  addLayerText: { color: colors.primary, fontSize: 24 },
  layerThumb: {
    width: 56,
    height: 56,
    borderRadius: 4,
    marginRight: spacing.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  layerThumbSelected: { borderColor: colors.accent },
  layerImage: { width: '100%', height: '100%' },
  removeButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: { color: colors.primary, fontSize: 10 },
  layerControls: { marginBottom: spacing.md },
  controlLabel: { color: colors.secondary, fontSize: 12, marginBottom: spacing.sm },
  blendModes: { marginBottom: spacing.sm },
  modeButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
  },
  modeButtonActive: { backgroundColor: colors.accent },
  modeText: { color: colors.secondary, fontSize: 12 },
  modeTextActive: { color: colors.primary },
  sliderRow: { marginTop: spacing.sm },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  actionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
    backgroundColor: colors.surfaceElevated,
  },
  actionBtnPrimary: { backgroundColor: colors.accent },
  actionBtnText: { color: colors.secondary, fontSize: 14 },
  actionBtnTextPrimary: { color: colors.primary, fontWeight: '600' },
});
