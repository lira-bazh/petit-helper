"use client";

import { Moon, Sun } from "lucide-react";
import { useContext } from "react";
import * as m from "@/paraglide/messages.js";
import type { Locale } from "@/paraglide/runtime.js";
import { Button } from "./ui/button";
import { ThemeContext } from "./theme-root";

export default function ThemeToggle({ locale }: { locale: Locale }) {
  const toggleTheme = useContext(ThemeContext);
  if (!toggleTheme) throw new Error("ThemeToggle must be rendered inside ThemeRoot");

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="grid size-10 cursor-pointer place-items-center rounded-[8px] border-border bg-card p-0 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:rounded-[2px] focus-visible:outline-2 focus-visible:outline-offset-[5px] focus-visible:outline-primary dark:bg-card dark:hover:bg-accent"
      onClick={toggleTheme}
      aria-label={m.theme_toggle_label({}, { locale })}
      title={m.theme_toggle_title({}, { locale })}
    >
      <Moon className="size-5 dark:hidden" strokeWidth={1.7} aria-hidden="true" />
      <Sun className="hidden size-5 dark:block" strokeWidth={1.7} aria-hidden="true" />
    </Button>
  );
}
