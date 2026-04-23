import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { EditorScreen } from '@features/editor';

const mockDispatch = jest.fn();
const mockUndo = jest.fn();
const mockRedo = jest.fn();
const mockSetSelectedCategory = jest.fn();
const mockSetSelectedPresetId = jest.fn();
const mockUseEditorSession = jest.fn();

jest.mock('@adapters/skia/preview-canvas', () => ({
  PreviewCanvas: () => 'Preview Canvas',
}));

jest.mock('@ui/layout', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    BottomSheet: ({ visible, title, children }: { visible: boolean; title?: string; children: React.ReactNode }) =>
      visible ? (
        <View>
          {title ? <>{title}</> : null}
          {children}
        </View>
      ) : null,
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

jest.mock('@features/editor/use-editor-session', () => ({
  useEditorSession: (...args: unknown[]) => mockUseEditorSession(...args),
}));

jest.mock('@features/preset-browser', () => ({
  PresetBrowser: () => 'LUT Browser',
  usePresetBrowser: () => ({
    presets: [],
    categories: ['all'],
    selectedCategory: 'all',
    setSelectedCategory: mockSetSelectedCategory,
    selectedPresetId: null,
    setSelectedPresetId: mockSetSelectedPresetId,
    isLoading: false,
  }),
}));

jest.mock('@features/export-image', () => ({
  ExportImageScreen: () => 'Export Sheet Body',
}));

function createEditState(overrides: Partial<ReturnType<typeof buildBaseEditState>> = {}) {
  return {
    ...buildBaseEditState(),
    ...overrides,
  };
}

function buildBaseEditState() {
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
    artisticLook: null,
    smartFilter: null,
    proClarity: null,
    blend: null,
  };
}

function createSessionState({
  editState = createEditState(),
  past = [],
}: {
  editState?: ReturnType<typeof createEditState>;
  past?: ReturnType<typeof createEditState>[];
} = {}) {
  return {
    editState,
    history: {
      past,
      present: editState,
      future: [],
    },
    isLoading: false,
    isSavingDraft: false,
    error: null,
    canUndo: false,
    canRedo: false,
    dispatch: mockDispatch,
    undo: mockUndo,
    redo: mockRedo,
  };
}

function renderEditorScreen() {
  const onClose = jest.fn();

  return {
    ...render(
      <EditorScreen
        assetId="asset-1"
        assetUri="file:///photo.jpg"
        assetWidth={1200}
        assetHeight={900}
        onClose={onClose}
      />,
    ),
    onClose,
  };
}

describe('EditorScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEditorSession.mockReturnValue(createSessionState());
  });

  it('delegates close navigation to the route layer', () => {
    const screen = renderEditorScreen();

    fireEvent.press(screen.getByLabelText('Close editor'));

    expect(screen.onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the Blend tool reachable from the editor toolbar', async () => {
    const screen = renderEditorScreen();

    expect(screen.getByText('Crop')).toBeTruthy();
    expect(screen.getByText('Log')).toBeTruthy();
    expect(screen.getByText('Export')).toBeTruthy();
    expect(screen.getByText('Blend')).toBeTruthy();
    expect(screen.getByLabelText('Undo edit')).toBeTruthy();
    expect(screen.getByLabelText('Redo edit')).toBeTruthy();

    fireEvent.press(screen.getByText('Blend'));

    await waitFor(() => {
      expect(screen.getByLabelText('Add blend layer')).toBeTruthy();
      expect(screen.getByText('Apply')).toBeTruthy();
    });
  });

  it('opens a dedicated crop workspace with transform actions', async () => {
    const screen = renderEditorScreen();

    fireEvent.press(screen.getByText('Crop'));

    await waitFor(() => {
      expect(screen.getByText('Transform & Crop')).toBeTruthy();
      expect(screen.getByLabelText('Rotate counterclockwise')).toBeTruthy();
      expect(screen.getByLabelText('Rotate clockwise')).toBeTruthy();
      expect(screen.getByLabelText('Done cropping')).toBeTruthy();
      expect(screen.getByLabelText('Close crop workspace')).toBeTruthy();
    });
  });

  it('shows log steps derived from transitions between edit states', async () => {
    const initialState = createEditState();
    const presetState = createEditState({ selectedPresetId: 'preset-1' });
    const croppedState = createEditState({
      selectedPresetId: 'preset-1',
      crop: {
        x: 0.05,
        y: 0.05,
        width: 0.9,
        height: 0.9,
        aspectRatio: null,
      },
    });

    mockUseEditorSession.mockReturnValue(
      createSessionState({ editState: croppedState, past: [initialState, presetState] }),
    );

    const screen = renderEditorScreen();

    fireEvent.press(screen.getByText('Log'));

    await waitFor(() => {
      expect(screen.getByText('LUT · preset-1')).toBeTruthy();
      expect(screen.getByText('Crop · Freeform')).toBeTruthy();
    });
  });
});
