import { createContext, useContext } from 'react';

// Context
interface ThemeModeContextValue {
  mode: 'light' | 'dark';
  toggle: () => void;
}

export const ThemeModeContext = createContext<ThemeModeContextValue>({
  mode: 'light',
  toggle: () => {},
});

export const useThemeModeContext = () => useContext(ThemeModeContext);