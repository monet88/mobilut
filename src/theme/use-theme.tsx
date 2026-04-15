import React from 'react';

import { themeTokens, ThemeTokens } from './tokens';

const ThemeContext = React.createContext<ThemeTokens>(themeTokens);

export interface ThemeProviderProps {
  readonly children: React.ReactNode;
  readonly value?: ThemeTokens;
}

export function ThemeProvider({
  children,
  value = themeTokens,
}: ThemeProviderProps): React.JSX.Element {
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeTokens {
  return React.useContext(ThemeContext);
}
