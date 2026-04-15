export type PresetCategory =
  | 'cinematic'
  | 'portrait'
  | 'landscape'
  | 'vintage'
  | 'moody'
  | 'bright'
  | 'black-and-white'
  | 'custom';

export interface Preset {
  readonly id: string;
  readonly name: string;
  readonly category: PresetCategory;
  readonly thumbnailPath: string;
  readonly haldPath: string;
  readonly isPremium: boolean;
}

export interface PresetCatalog {
  readonly version: number;
  readonly presets: readonly Preset[];
}
