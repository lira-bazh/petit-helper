"use client";

import { useState, type ReactNode } from "react";
import * as m from "@/paraglide/messages.js";
import type { Locale } from "@/paraglide/runtime.js";
import { Input } from "./ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

export default function RecipeSearch({ recipes, locale }: {
  recipes: { id: string; name: string; ingredientCount: number; content: ReactNode }[];
  locale: Locale;
}) {
  const ingredientCounts = [...new Set(recipes.map((recipe) => recipe.ingredientCount))]
    .sort((a, b) => a - b);
  const [query, setQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState(ingredientCounts);
  const search = query.trim().toLocaleLowerCase(locale);
  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLocaleLowerCase(locale).includes(search),
  );
  const groups = ingredientCounts.map((ingredientCount) => ({
    ingredientCount,
    recipes: filteredRecipes.filter((recipe) => recipe.ingredientCount === ingredientCount),
  })).filter((group) => group.recipes.length > 0);

  return (
    <>
      <Input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setExpandedGroups(ingredientCounts);
        }}
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
      <Accordion
        id="recipe-list"
        multiple
        value={expandedGroups}
        onValueChange={setExpandedGroups}
      >
        {groups.map((group) => (
          <AccordionItem key={group.ingredientCount} value={group.ingredientCount}>
            <AccordionTrigger className="items-center gap-3 py-4 text-base hover:no-underline">
              <span>{m.recipes_ingredient_count({ count: group.ingredientCount }, { locale })}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {m.recipes_results({ count: group.recipes.length }, { locale })}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {group.recipes.map((recipe) => (
                  <li key={recipe.id} className="min-w-0">
                    {recipe.content}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </>
  );
}
