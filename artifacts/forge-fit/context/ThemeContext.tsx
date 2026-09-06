import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { useColorScheme } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

type ThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
};

const STORAGE_KEY = 'gainmode-theme-preference';
const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = React.useState<ThemePreference>('system');

  React.useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'system' || stored === 'light' || stored === 'dark') setPreferenceState(stored);
      })
      .catch(() => undefined);
  }, []);

  const setPreference = React.useCallback((nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference);
    AsyncStorage.setItem(STORAGE_KEY, nextPreference).catch(() => undefined);
  }, []);

  const resolvedTheme: ResolvedTheme = preference === 'system'
    ? (systemScheme === 'dark' ? 'dark' : 'light')
    : preference;

  const value = React.useMemo(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}