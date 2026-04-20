import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import { SettingsScreen } from '@features/settings';

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

describe('SettingsScreen', () => {
  it('shows export defaults but no language picker in Phase 1', async () => {
    const screen = render(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText('settings.exportQuality')).toBeTruthy();
    });

    expect(screen.queryByText('English')).toBeNull();
    expect(screen.queryByText('Tiếng Việt')).toBeNull();
  });
});
