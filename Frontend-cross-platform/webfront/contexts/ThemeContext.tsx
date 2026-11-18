"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "light" | "dark";
type ThemeContextValue = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "lunetty-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "dark" || saved === "light") setThemeModeState(saved);
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, []);
  const toggleTheme = useCallback(
    () => setThemeMode(themeMode === "dark" ? "light" : "dark"),
    [setThemeMode, themeMode],
  );
  const value = useMemo(
    () => ({ themeMode, setThemeMode, toggleTheme }),
    [setThemeMode, themeMode, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside <ThemeProvider>");
  return context;
}
