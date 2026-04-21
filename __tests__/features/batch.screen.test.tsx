/**
 * Basic smoke tests for the BatchScreen component.
 * These tests verify the component renders without crashing and
 * exposes the expected UI elements.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
}));

jest.mock('expo-media-library', () => ({
  __esModule: true,
  requestPermissionsAsync: jest.fn(async () => ({ status: 'denied' })),
  getAssetsAsync: jest.fn(async () => ({ assets: [] })),
  getAlbumsAsync: jest.fn(async () => []),
  SortBy: { creationTime: 'creationTime' },
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: View,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('@features/preset-browser', () => ({
  PresetBrowser: () => null,
  usePresetBrowser: () => ({
    presets: [],
    categories: ['all'],
    selectedCategory: 'all',
    selectedPresetId: null,
    setSelectedCategory: jest.fn(),
    setSelectedPresetId: jest.fn(),
    isLoading: false,
  }),
}));

jest.mock('@features/batch/batch-photo-picker', () => ({
  BatchPhotoPicker: () => null,
}));

jest.mock('@services/batch', () => ({
  createWorkspaceWithPhotos: jest.fn(async () => ({
    id: 'ws-1',
    photos: [],
    selectedPhotoId: null,
    appliedPresetId: null,
    appliedIntensity: 1,
    createdAt: 0,
    updatedAt: 0,
  })),
  addPhotosToWorkspace: jest.fn(),
  removePhotoFromWorkspace: jest.fn(),
  selectPhoto: jest.fn((ws: unknown) => ws),
  applyPreset: jest.fn((ws: unknown) => ws),
  exportBatch: jest.fn(async () => ({ successful: [], failed: [] })),
  generateThumbnail: jest.fn(async () => 'thumb://'),
  getThumbnail: jest.fn(async () => null),
  clearThumbnail: jest.fn(async () => undefined),
  clearThumbnailCache: jest.fn(async () => undefined),
}));

const { BatchScreen } = require('../../src/features/batch/batch.screen');

describe('BatchScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<BatchScreen />)).not.toThrow();
  });

  it('shows BATCH PROCESS title', () => {
    const { getByText } = render(<BatchScreen />);
    expect(getByText('BATCH PROCESS')).toBeTruthy();
  });

  it('shows EXPORT button', () => {
    const { getByText } = render(<BatchScreen />);
    expect(getByText('EXPORT')).toBeTruthy();
  });
});
