"use client";

import { createContext, useState } from "react";
import type { Locale } from "@/paraglide/runtime.js";

export const ThemeContext = createContext<(() => void) | null>(null);

export default function ThemeRoot({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  const [theme, setTheme] = useState<"light" | "dark" | undefined>(() => {
    if (typeof window === "undefined") return undefined;

    try {
      const saved = localStorage.getItem("petit-helper-theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch {
      // Use the theme already applied by the initial document script.
    }

    const current = document.documentElement.dataset.theme;
    if (current === "light" || current === "dark") return current;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem("petit-helper-theme", nextTheme);
    } catch {
      // Switching still works when browser storage is unavailable.
    }
  }

  return (
    <html lang={locale} data-theme={theme} className="scheme-light dark:scheme-dark" suppressHydrationWarning>
      <ThemeContext.Provider value={toggleTheme}>
        {children}
      </ThemeContext.Provider>
    </html>
  );
}
