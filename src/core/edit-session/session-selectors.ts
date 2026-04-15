import { EditState, DEFAULT_ADJUSTMENTS } from './edit-state';

export function selectAssetDimensions(state: EditState): {
  readonly width: number;
  readonly height: number;
} {
  return {
    width: state.assetWidth,
    height: state.assetHeight,
  };
}

export function selectHasSelectedPreset(state: EditState): boolean {
  return state.selectedPresetId !== null;
}

export function selectHasCustomLut(state: EditState): boolean {
  return state.customLutTable !== null;
}

export function selectHasAnyLutSelection(state: EditState): boolean {
  return selectHasSelectedPreset(state) || selectHasCustomLut(state);
}

export function selectAdjustmentCount(state: EditState): number {
  const pairs: ReadonlyArray<readonly [number, number]> = [
    [state.adjustments.intensity, DEFAULT_ADJUSTMENTS.intensity],
    [state.adjustments.temperature, DEFAULT_ADJUSTMENTS.temperature],
    [state.adjustments.brightness, DEFAULT_ADJUSTMENTS.brightness],
    [state.adjustments.contrast, DEFAULT_ADJUSTMENTS.contrast],
    [state.adjustments.saturation, DEFAULT_ADJUSTMENTS.saturation],
    [state.adjustments.sharpen, DEFAULT_ADJUSTMENTS.sharpen],
  ];

  return pairs.reduce((count, [current, initial]) => {
    return current === initial ? count : count + 1;
  }, 0);
}

export function selectTransformCount(state: EditState): number {
  const optionalTransforms = [
    selectHasAnyLutSelection(state),
    selectAdjustmentCount(state) > 0,
    state.rotation !== 0,
    state.crop !== null,
    state.regionMask !== null,
    state.framing !== null,
    state.watermark !== null,
  ];

  return optionalTransforms.reduce((count, isActive) => {
    return isActive ? count + 1 : count;
  }, 0);
}

export function selectIsEdited(state: EditState): boolean {
  return selectTransformCount(state) > 0;
}
