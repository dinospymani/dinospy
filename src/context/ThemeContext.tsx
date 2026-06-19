import React, { createContext, useContext, useState, useEffect } from 'react';
import { HorologicalTheme } from '../types';

interface ThemeContextType {
  theme: HorologicalTheme;
  setTheme: (theme: HorologicalTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<HorologicalTheme>(() => {
    return (localStorage.getItem('horological-theme') as HorologicalTheme) || 'noir';
  });

  const setTheme = (newTheme: HorologicalTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('horological-theme', newTheme);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
