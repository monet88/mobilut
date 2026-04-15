import type { Preset, PresetCatalog } from '@core/lut/preset-model';

const EMPTY_CATALOG: PresetCatalog = {
  version: 1,
  presets: [],
};

export async function loadPresetCatalog(): Promise<PresetCatalog> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const rawCatalog = require('../../../assets/presets/catalog.json') as Partial<PresetCatalog>;

    return {
      version: typeof rawCatalog.version === 'number' ? rawCatalog.version : 1,
      presets: Array.isArray(rawCatalog.presets) ? rawCatalog.presets : EMPTY_CATALOG.presets,
    };
  } catch {
    return EMPTY_CATALOG;
  }
}

export function getPresetsByCategory(catalog: PresetCatalog, category: string): readonly Preset[] {
  if (category === 'all') {
    return [...catalog.presets];
  }

  return catalog.presets.filter((preset) => preset.category === category);
}

export function getUniqueCategories(catalog: PresetCatalog): string[] {
  const categories = new Set(catalog.presets.map((preset) => preset.category));
  return ['all', ...Array.from(categories)];
}
