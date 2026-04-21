import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  LANGUAGE: '@lut-app/language',
  THEME: '@lut-app/theme',
  EXPORT_QUALITY: '@lut-app/exportQuality',
  SHOW_WATERMARK: '@lut-app/showWatermark',
} as const;

export type Language = 'vi' | 'en';
export type ExportQuality = 'high' | 'medium' | 'low';
export type ThemePreference = 'system' | 'light' | 'dark';

export interface AppPreferences {
  readonly language: Language;
  readonly theme: ThemePreference;
  readonly exportQuality: ExportQuality;
  readonly showWatermark: boolean;
}

const DEFAULT_PREFERENCES: AppPreferences = {
  language: 'en',
  theme: 'system',
  exportQuality: 'high',
  showWatermark: false,
};

function isLanguage(value: string | null): value is Language {
  return value === 'vi' || value === 'en';
}

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

function isExportQuality(value: string | null): value is ExportQuality {
  return value === 'high' || value === 'medium' || value === 'low';
}

function getStorageKey<K extends keyof AppPreferences>(key: K): string {
  const keyMap: Record<keyof AppPreferences, string> = {
    language: KEYS.LANGUAGE,
    theme: KEYS.THEME,
    exportQuality: KEYS.EXPORT_QUALITY,
    showWatermark: KEYS.SHOW_WATERMARK,
  };

  return keyMap[key];
}

function getStoredValue(
  values: Partial<Record<string, string | null>>,
  key: string,
): string | null {
  return values[key] ?? null;
}

export async function getPreferences(): Promise<AppPreferences> {
  try {
    const entries = await AsyncStorage.multiGet([
      KEYS.LANGUAGE,
      KEYS.THEME,
      KEYS.EXPORT_QUALITY,
      KEYS.SHOW_WATERMARK,
    ]);

    const values = Object.fromEntries(entries) as Partial<Record<string, string | null>>;
    const languageValue = getStoredValue(values, KEYS.LANGUAGE);
    const themeValue = getStoredValue(values, KEYS.THEME);
    const exportQualityValue = getStoredValue(values, KEYS.EXPORT_QUALITY);
    const showWatermarkValue = getStoredValue(values, KEYS.SHOW_WATERMARK);

    return {
      language: isLanguage(languageValue) ? languageValue : DEFAULT_PREFERENCES.language,
      theme: isThemePreference(themeValue) ? themeValue : DEFAULT_PREFERENCES.theme,
      exportQuality: isExportQuality(exportQualityValue)
        ? exportQualityValue
        : DEFAULT_PREFERENCES.exportQuality,
      showWatermark: showWatermarkValue === 'true',
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function setPreference<K extends keyof AppPreferences>(
  key: K,
  value: AppPreferences[K],
): Promise<void> {
  await AsyncStorage.setItem(getStorageKey(key), String(value));
}
