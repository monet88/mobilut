import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { SettingsScreen } from '@features/settings';

const mockBack = jest.fn();

jest.mock('@services/storage', () => ({
  getPreferences: jest.fn(async () => ({
    language: 'en',
    theme: 'system',
    exportQuality: 'high',
    showWatermark: false,
  })),
  setPreference: jest.fn(async () => undefined),
}));

jest.mock('@i18n', () => ({
  initI18n: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
  }),
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    mockBack.mockClear();
  });

  it('shows export defaults but no language picker in Phase 1', async () => {
    const screen = render(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText('settings.exportQuality')).toBeTruthy();
    });

    expect(screen.queryByText('settings.language')).toBeNull();
    expect(screen.queryByText('English')).toBeNull();
    expect(screen.queryByText('Tiếng Việt')).toBeNull();
    expect(screen.getByText('settings.watermark')).toBeTruthy();
  });

  it('keeps Done available as a back action when not saving', async () => {
    const screen = render(<SettingsScreen />);

    const doneButton = await waitFor(() => screen.getByText('common.done'));
    fireEvent.press(doneButton);

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
