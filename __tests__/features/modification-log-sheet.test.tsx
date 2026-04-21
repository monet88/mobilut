import React from 'react';
import { render } from '@testing-library/react-native';

import { ModificationLogSheet } from '@features/editor/modification-log-sheet';

jest.mock('@ui/layout', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    BottomSheet: ({
      visible,
      children,
    }: {
      visible: boolean;
      children: React.ReactNode;
    }) => (visible ? <View>{children}</View> : null),
  };
});

function createEditState(overrides: Record<string, unknown> = {}) {
  return {
    assetId: 'asset-1',
    assetUri: 'file:///photo.jpg',
    assetWidth: 1200,
    assetHeight: 900,
    selectedPresetId: null,
    customLutTable: null,
    adjustments: {
      intensity: 1,
      temperature: 0,
      brightness: 0,
      contrast: 0,
      saturation: 0,
      sharpen: 0,
    },
    rotation: 0 as const,
    crop: null,
    regionMask: null,
    framing: null,
    watermark: null,
    ...overrides,
  };
}

describe('ModificationLogSheet', () => {
  it('labels cleared LUT changes as cleared instead of custom LUT', () => {
    const screen = render(
      <ModificationLogSheet
        visible
        onClose={jest.fn()}
        states={[
          createEditState({ selectedPresetId: 'preset-1' }),
          createEditState(),
        ]}
      />,
    );

    expect(screen.getByText('LUT · Cleared')).toBeTruthy();
  });

  it('labels cleared crops as cleared instead of freeform', () => {
    const screen = render(
      <ModificationLogSheet
        visible
        onClose={jest.fn()}
        states={[
          createEditState({
            crop: {
              x: 0.1,
              y: 0.1,
              width: 0.8,
              height: 0.8,
              aspectRatio: null,
            },
          }),
          createEditState(),
        ]}
      />,
    );

    expect(screen.getByText('Crop · Cleared')).toBeTruthy();
  });

  it('does not misclassify same-value custom LUTs as a LUT change after hydration', () => {
    const previousLut = {
      size: 2,
      data: new Float32Array([0, 0.1, 0.2, 0.3, 0.4, 0.5]),
    };
    const hydratedLut = {
      size: 2,
      data: new Float32Array([0, 0.1, 0.2, 0.3, 0.4, 0.5]),
    };

    const screen = render(
      <ModificationLogSheet
        visible
        onClose={jest.fn()}
        states={[
          createEditState({
            customLutTable: previousLut,
            crop: {
              x: 0.05,
              y: 0.05,
              width: 0.9,
              height: 0.9,
              aspectRatio: null,
            },
          }),
          createEditState({
            customLutTable: hydratedLut,
            crop: {
              x: 0.1,
              y: 0.1,
              width: 0.8,
              height: 0.8,
              aspectRatio: null,
            },
          }),
        ]}
      />,
    );

    expect(screen.getByText('Crop · Freeform')).toBeTruthy();
    expect(screen.queryByText('LUT · Custom LUT')).toBeNull();
  });
});
