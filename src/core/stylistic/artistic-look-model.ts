export interface ArtisticLookParams {
  readonly styleId: string;
  readonly intensity: number;
}

export interface ArtisticLookStyle {
  readonly id: string;
  readonly name: string;
  readonly family: 'vintage' | 'film' | 'modern' | 'dramatic' | 'soft';
  readonly colorMatrix: readonly number[];
  readonly vignetteStrength: number;
  readonly grainAmount: number;
  readonly contrastBoost: number;
}

export const ARTISTIC_LOOK_STYLES: readonly ArtisticLookStyle[] = [
  {
    id: 'vintage-warm',
    name: 'Vintage Warm',
    family: 'vintage',
    colorMatrix: [1.2, 0.1, 0, 0, 0.05, 0.1, 1.1, 0, 0, 0.02, 0, 0.1, 0.9, 0, -0.02, 0, 0, 0, 1, 0],
    vignetteStrength: 0.3,
    grainAmount: 0.15,
    contrastBoost: 0.1,
  },
  {
    id: 'vintage-cool',
    name: 'Vintage Cool',
    family: 'vintage',
    colorMatrix: [0.9, 0, 0.1, 0, -0.02, 0, 1.0, 0.1, 0, 0, 0.1, 0, 1.2, 0, 0.05, 0, 0, 0, 1, 0],
    vignetteStrength: 0.25,
    grainAmount: 0.1,
    contrastBoost: 0.05,
  },
  {
    id: 'film-kodak',
    name: 'Film Kodak',
    family: 'film',
    colorMatrix: [1.1, 0.05, 0, 0, 0.03, 0, 1.05, 0.02, 0, 0.01, 0, 0.02, 0.95, 0, -0.01, 0, 0, 0, 1, 0],
    vignetteStrength: 0.15,
    grainAmount: 0.08,
    contrastBoost: 0.08,
  },
  {
    id: 'film-fuji',
    name: 'Film Fuji',
    family: 'film',
    colorMatrix: [1.0, 0, 0.05, 0, 0, 0, 1.1, 0, 0, 0.02, 0.05, 0, 1.05, 0, 0.03, 0, 0, 0, 1, 0],
    vignetteStrength: 0.1,
    grainAmount: 0.05,
    contrastBoost: 0.12,
  },
  {
    id: 'modern-crisp',
    name: 'Modern Crisp',
    family: 'modern',
    colorMatrix: [1.05, 0, 0, 0, 0, 0, 1.05, 0, 0, 0, 0, 0, 1.05, 0, 0, 0, 0, 0, 1, 0],
    vignetteStrength: 0,
    grainAmount: 0,
    contrastBoost: 0.15,
  },
  {
    id: 'dramatic-dark',
    name: 'Dramatic Dark',
    family: 'dramatic',
    colorMatrix: [1.1, 0, 0, 0, -0.05, 0, 1.1, 0, 0, -0.05, 0, 0, 1.1, 0, -0.05, 0, 0, 0, 1, 0],
    vignetteStrength: 0.5,
    grainAmount: 0.02,
    contrastBoost: 0.25,
  },
  {
    id: 'soft-glow',
    name: 'Soft Glow',
    family: 'soft',
    colorMatrix: [1.0, 0.02, 0.02, 0, 0.05, 0.02, 1.0, 0.02, 0, 0.05, 0.02, 0.02, 1.0, 0, 0.05, 0, 0, 0, 1, 0],
    vignetteStrength: 0.1,
    grainAmount: 0,
    contrastBoost: -0.1,
  },
];

export function getArtisticLookById(id: string): ArtisticLookStyle | undefined {
  return ARTISTIC_LOOK_STYLES.find((style) => style.id === id);
}

export function getStylesByFamily(family: ArtisticLookStyle['family']): ArtisticLookStyle[] {
  return ARTISTIC_LOOK_STYLES.filter((style) => style.family === family);
}
