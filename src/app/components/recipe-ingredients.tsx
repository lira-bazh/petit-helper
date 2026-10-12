"use client";

import { useId, useState, type ReactNode } from "react";
import type { Locale } from "@/paraglide/runtime.js";
import * as m from "@/paraglide/messages.js";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export default function RecipeIngredients({ children, locale }: {
  children: ReactNode;
  locale: Locale;
}) {
  const [revealed, setRevealed] = useState(false);
  const contentId = useId();

  return (
    <div className="relative flex flex-col sm:flex-1">
      <div
        id={contentId}
        aria-hidden={!revealed}
        className={cn("flex flex-col sm:flex-1", !revealed && "pointer-events-none select-none blur-sm")}
      >
        {children}
      </div>
      <Button
        type="button"
        variant="link"
        aria-expanded={revealed}
        aria-controls={contentId}
        onClick={() => setRevealed(!revealed)}
        className="absolute inset-0 h-full w-full cursor-pointer whitespace-normal hover:no-underline active:translate-y-0"
      >
        <span className={revealed ? "sr-only" : "rounded-md bg-card px-2 py-1 text-foreground shadow-sm"}>
          {revealed
            ? m.recipe_hide_ingredients({}, { locale })
            : m.recipe_show_ingredients({}, { locale })}
        </span>
      </Button>
    </div>
  );
}
