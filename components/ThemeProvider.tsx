'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setThemeState(savedTheme);
        applyTheme(savedTheme);
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initial = prefersDark ? 'dark' : 'light';
        setThemeState(initial);
        applyTheme(initial);
      }
    } catch (e) {
      console.warn('LocalStorage theme error:', e);
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    try {
      localStorage.setItem('theme', newTheme);
    } catch (e) {
      console.warn('Failed to save theme preference:', e);
    }
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
      {/* FLOATING THEME TOGGLE BUTTON (FIXED TOP-RIGHT CORNER) */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 select-none">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          title={theme === 'dark' ? 'Mode Gelap Aktif (Klik untuk Mode Terang)' : 'Mode Terang Aktif (Klik untuk Mode Gelap)'}
          className="group relative flex items-center justify-between w-14 h-8 px-1 rounded-full bg-[#E8DFD5] dark:bg-[#2E251C] border-2 border-[#D5C4B4] dark:border-[#4A3D2F] shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#8C6A47] dark:focus:ring-[#C19A6B] cursor-pointer"
        >
          {/* Ikon Latar belakang */}
          <Sun className="w-3.5 h-3.5 text-amber-600 transition-opacity duration-200" />
          <Moon className="w-3.5 h-3.5 text-amber-200 transition-opacity duration-200" />

          {/* Knob Bulat Bergeser */}
          <span
            className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white dark:bg-[#C19A6B] shadow-md flex items-center justify-center transition-transform duration-300 ease-in-out transform ${
              theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
            }`}
          >
            {theme === 'dark' ? (
              <Moon className="w-3.5 h-3.5 text-[#1A1512] transition-transform duration-300 rotate-0" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-600 transition-transform duration-300 rotate-0" />
            )}
          </span>
        </button>
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
