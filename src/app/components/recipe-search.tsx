"use client";

import { useState, type ReactNode } from "react";
import * as m from "@/paraglide/messages.js";
import type { Locale } from "@/paraglide/runtime.js";
import { Input } from "./ui/input";

export default function RecipeSearch({ recipes, locale }: {
  recipes: { id: string; name: string; content: ReactNode }[];
  locale: Locale;
}) {
  const [query, setQuery] = useState("");
  const search = query.trim().toLocaleLowerCase(locale);
  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLocaleLowerCase(locale).includes(search),
  );

  return (
    <>
      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={m.recipes_search({}, { locale })}
        aria-label={m.recipes_search({}, { locale })}
        aria-controls="recipe-list"
        className="mb-6 h-10 sm:max-w-md"
      />
      <p role="status" className={filteredRecipes.length > 0 ? "sr-only" : "text-muted-foreground"}>
        {recipes.length === 0
          ? m.recipes_empty({}, { locale })
          : filteredRecipes.length === 0
            ? m.recipes_no_results({}, { locale })
            : m.recipes_results({ count: filteredRecipes.length }, { locale })}
      </p>
      <ul id="recipe-list" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredRecipes.map((recipe) => (
          <li key={recipe.id} className="min-w-0">
            {recipe.content}
          </li>
        ))}
      </ul>
    </>
  );
}
