"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";

export default function ThemeToggle() {
  function toggleTheme() {
    const root = document.documentElement;
    const theme = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = theme;

    try {
      localStorage.setItem("petit-helper-theme", theme);
    } catch {
      // Switching still works when browser storage is unavailable.
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label="Переключить светлую и тёмную тему"
      title="Переключить тему"
    >
      <Moon className="theme-icon-moon size-5" strokeWidth={1.7} aria-hidden="true" />
      <Sun className="theme-icon-sun size-5" strokeWidth={1.7} aria-hidden="true" />
    </Button>
  );
}
