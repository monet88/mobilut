import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockPickImage = jest.fn();
const mockSaveDraft = jest.fn(async () => undefined);
const mockAddRecentItem = jest.fn(async () => undefined);
const mockGetRecentItems = jest.fn(async () => []);
const mockListDrafts = jest.fn(async () => []);
const mockDeleteDraft = jest.fn(async () => undefined);

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@features/import-image', () => ({
  useImportImage: () => ({ isLoading: false, error: null, pickImage: mockPickImage }),
}));

jest.mock('@services/storage', () => ({
  addRecentItem: mockAddRecentItem,
  deleteDraft: mockDeleteDraft,
  getRecentItems: mockGetRecentItems,
  listDrafts: mockListDrafts,
  saveDraft: mockSaveDraft,
}));

jest.mock('react-native-google-mobile-ads', () => ({
  __esModule: true,
  default: () => ({ initialize: jest.fn(async () => []) }),
  TestIds: { BANNER: 'ca-app-pub-test/banner' },
  BannerAd: () => null,
  BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' },
}));

const { HomeScreen } = require('@features/home');

const draftSummary = {
  assetId: 'asset-1',
  assetUri: 'file:///draft.jpg',
  previewUri: 'file:///draft.jpg',
  createdAt: 1,
  updatedAt: 2,
};

const nextDraftSummary = {
  assetId: 'asset-2',
  assetUri: 'file:///new.jpg',
  previewUri: 'file:///new.jpg',
  createdAt: 3,
  updatedAt: 4,
};

const newAsset = {
  id: 'asset-2',
  uri: 'file:///new.jpg',
  width: 1600,
  height: 1200,
  format: 'jpeg',
  fileSize: null,
};

function renderHomeScreen() {
  return render(<HomeScreen />);
}

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPickImage.mockResolvedValue(newAsset);
    mockGetRecentItems.mockResolvedValue([]);
    mockListDrafts.mockResolvedValue([draftSummary]);
    mockDeleteDraft.mockResolvedValue(undefined);
    mockAddRecentItem.mockResolvedValue(undefined);
    mockSaveDraft.mockResolvedValue(undefined);
  });

  it('refreshes drafts and collection counts before routing after a successful draft save', async () => {
    mockGetRecentItems
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([newAsset]);
    mockListDrafts
      .mockResolvedValueOnce([draftSummary])
      .mockResolvedValueOnce([nextDraftSummary, draftSummary]);

    const screen = renderHomeScreen();

    await waitFor(() => {
      expect(screen.getByText('Continue Editing')).toBeTruthy();
    });
    expect(screen.getByText('Collection: 0')).toBeTruthy();
    expect(screen.getByText('Drafts: 1')).toBeTruthy();

    fireEvent.press(screen.getByText('Add New Photo'));

    await waitFor(() => {
      expect(screen.getByText('Collection: 1')).toBeTruthy();
      expect(screen.getByText('Drafts: 2')).toBeTruthy();
      expect(screen.getByText('asset-2')).toBeTruthy();
      expect(mockPush).toHaveBeenCalledWith('/editor/asset-2');
    });
    expect(mockGetRecentItems).toHaveBeenCalledTimes(2);
    expect(mockListDrafts).toHaveBeenCalledTimes(2);
  });

  it('shows an error banner when draft creation storage fails without mutating recent items', async () => {
    mockSaveDraft.mockRejectedValue(new Error('Failed to save draft'));

    const screen = renderHomeScreen();

    await waitFor(() => {
      expect(screen.getByText('Add New Photo')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Add New Photo'));

    await waitFor(() => {
      expect(screen.getByText('Failed to save draft')).toBeTruthy();
    });
    expect(mockAddRecentItem).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('still navigates when recent-item persistence fails after the draft is saved', async () => {
    mockAddRecentItem.mockRejectedValue(new Error('Failed to update recent items'));
    mockListDrafts
      .mockResolvedValueOnce([draftSummary])
      .mockResolvedValueOnce([nextDraftSummary, draftSummary]);

    const screen = renderHomeScreen();

    await waitFor(() => {
      expect(screen.getByText('Add New Photo')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Add New Photo'));

    await waitFor(() => {
      expect(mockSaveDraft).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/editor/asset-2');
    });
  });

  it('does not navigate when pressing Delete on a draft card', async () => {
    const screen = renderHomeScreen();

    await waitFor(() => {
      expect(screen.getByLabelText('Delete asset-1')).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText('Delete asset-1'));

    await waitFor(() => {
      expect(mockDeleteDraft).toHaveBeenCalledWith('asset-1');
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows an error banner when draft deletion fails', async () => {
    mockDeleteDraft.mockRejectedValue(new Error('Failed to delete draft'));

    const screen = renderHomeScreen();

    await waitFor(() => {
      expect(screen.getByLabelText('Delete asset-1')).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText('Delete asset-1'));

    await waitFor(() => {
      expect(screen.getByText('Failed to delete draft')).toBeTruthy();
    });
    expect(screen.getByText('asset-1')).toBeTruthy();
  });

  it('shows an error banner when recent items fail to load', async () => {
    mockGetRecentItems.mockRejectedValue(new Error('Failed to load recent items'));
    mockListDrafts.mockResolvedValue([]);

    const screen = renderHomeScreen();

    await waitFor(() => {
      expect(screen.getByText('Failed to load recent items')).toBeTruthy();
    });
  });
});
