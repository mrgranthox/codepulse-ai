import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'system' | 'dark' | 'light';
export type EffectiveTheme = 'dark' | 'light';

interface ThemeContextType {
  mode: ThemeMode;
  effectiveTheme: EffectiveTheme;
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
  systemDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'codepulse_theme_mode_v2';

const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  effectiveTheme: 'dark',
  isDark: true,
  isLight: false,
  isSystem: true,
  systemDark: true,
  setMode: () => {},
  toggleTheme: () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light' || stored === 'system') {
        return stored;
      }
    } catch (e) {
      console.warn('LocalStorage error reading theme mode:', e);
    }
    return 'system';
  });

  const [systemDark, setSystemDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Track OS system theme changes in real time with forward/backward compatibility
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setSystemDark(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else if ((mediaQuery as any).removeListener) {
        (mediaQuery as any).removeListener(handleChange);
      }
    };
  }, []);

  // Listen to storage events from other browser tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        if (e.newValue === 'dark' || e.newValue === 'light' || e.newValue === 'system') {
          setModeState(e.newValue);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const effectiveTheme: EffectiveTheme = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;
  const isDark = effectiveTheme === 'dark';
  const isLight = effectiveTheme === 'light';
  const isSystem = mode === 'system';

  // Apply classes to <html> & <body>
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
      body.classList.add('dark');
      body.classList.remove('light');
      body.style.backgroundColor = '#090D16';
      body.style.color = '#f1f5f9';
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
      body.classList.add('light');
      body.classList.remove('dark');
      body.style.backgroundColor = '#f8fafc';
      body.style.color = '#0f172a';
    }
  }, [effectiveTheme, isDark]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (e) {
      console.warn('LocalStorage error writing theme mode:', e);
    }
  };

  const toggleTheme = () => {
    // Elegant 3-mode cycle: system -> dark -> light -> system
    if (mode === 'system') {
      setMode('dark');
    } else if (mode === 'dark') {
      setMode('light');
    } else {
      setMode('system');
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      mode, 
      effectiveTheme, 
      isDark, 
      isLight, 
      isSystem, 
      systemDark,
      setMode, 
      toggleTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
