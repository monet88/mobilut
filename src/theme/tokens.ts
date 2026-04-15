export const colors = {
  background: '#0A0A0A',
  surface: '#1A1A1A',
  surfaceElevated: '#252525',
  border: '#333333',
  primary: '#FFFFFF',
  secondary: '#AAAAAA',
  accent: '#FF6B35',
  error: '#FF4444',
  success: '#44FF88',
  warning: '#FFAA44',
  overlay: 'rgba(0,0,0,0.7)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    display: 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export interface ThemeTokens {
  readonly colors: typeof colors;
  readonly spacing: typeof spacing;
  readonly radius: typeof radius;
  readonly typography: typeof typography;
}

export const themeTokens: ThemeTokens = {
  colors,
  spacing,
  radius,
  typography,
};

export type Colors = typeof colors;
export type Spacing = typeof spacing;
