"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "light" | "dark" | "system";
type ThemeContextValue = {
  themeMode: ThemeMode;
  resolvedTheme: "light" | "dark";
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "lunetty-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "dark" || saved === "light" || saved === "system") {
        setThemeModeState(saved);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => setSystemDark(preference.matches);
    updateSystemTheme();
    preference.addEventListener("change", updateSystemTheme);
    return () => preference.removeEventListener("change", updateSystemTheme);
  }, []);

  const resolvedTheme = themeMode === "system"
    ? systemDark ? "dark" : "light"
    : themeMode;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, []);
  const toggleTheme = useCallback(
    () => setThemeMode(resolvedTheme === "dark" ? "light" : "dark"),
    [resolvedTheme, setThemeMode],
  );
  const value = useMemo(
    () => ({ themeMode, resolvedTheme, setThemeMode, toggleTheme }),
    [resolvedTheme, setThemeMode, themeMode, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside <ThemeProvider>");
  return context;
}
