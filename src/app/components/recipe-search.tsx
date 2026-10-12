"use client";

import { useState, type ReactNode } from "react";
import * as m from "@/paraglide/messages.js";
import type { Locale } from "@/paraglide/runtime.js";
import { Input } from "./ui/input";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "./ui/combobox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export default function RecipeSearch({ recipes, effects, locale }: {
  recipes: { id: string; name: string; kind: string; effectId: string | null; power: number | null; quality: string; ingredientCount: number; content: ReactNode }[];
  effects: { id: string; name: string }[];
  locale: Locale;
}) {
  const [query, setQuery] = useState("");
  const [selectedEffect, setSelectedEffect] = useState("");
  const [selectedQuality, setSelectedQuality] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("2");
  const [selectedSort, setSelectedSort] = useState("name-asc");
  const sortOptions = [
    { id: "name-asc", name: m.recipes_sort_name_asc({}, { locale }) },
    { id: "name-desc", name: m.recipes_sort_name_desc({}, { locale }) },
    { id: "power-asc", name: m.recipes_sort_power_asc({}, { locale }) },
    { id: "power-desc", name: m.recipes_sort_power_desc({}, { locale }) },
  ];
  const qualityOptions = [
    { id: "", name: m.recipes_all_qualities({}, { locale }) },
    { id: "normal", name: m.recipe_quality_normal({}, { locale }) },
    { id: "purple", name: m.recipe_quality_purple({}, { locale }) },
    { id: "gold", name: m.recipe_quality_gold({}, { locale }) },
  ];
  const effectOptions = [
    { id: "", name: m.recipes_all_effects({}, { locale }) },
    { id: "none", name: m.recipes_no_effect({}, { locale }) },
    ...[...effects].sort((a, b) => a.name.localeCompare(b.name, locale)),
  ];
  const search = query.trim().toLocaleLowerCase(locale);
  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLocaleLowerCase(locale).includes(search)
      && (!selectedEffect || recipe.effectId === (selectedEffect === "none" ? null : selectedEffect))
      && (!selectedQuality || recipe.quality === selectedQuality),
  ).sort((a, b) => {
    const nameOrder = a.name.localeCompare(b.name, locale);
    if (selectedSort === "name-desc") return -nameOrder;
    if (selectedSort === "power-asc" || selectedSort === "power-desc") {
      if (a.power == null && b.power == null) return nameOrder;
      if (a.power == null) return 1;
      if (b.power == null) return -1;
      const powerOrder = selectedSort === "power-asc" ? a.power - b.power : b.power - a.power;
      return powerOrder || nameOrder;
    }
    return nameOrder;
  });
  const groups = [2, 3, 4].map((ingredientCount) => ({
    id: String(ingredientCount),
    label: m.recipes_ingredient_count({ count: ingredientCount }, { locale }),
    recipes: filteredRecipes.filter((recipe) => recipe.kind !== "secret" && recipe.ingredientCount === ingredientCount),
  })).concat({
    id: "secret",
    label: m.recipes_secret({}, { locale }),
    recipes: filteredRecipes.filter((recipe) => recipe.kind === "secret"),
  });

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex">
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={m.recipes_search({}, { locale })}
          aria-label={m.recipes_search({}, { locale })}
          aria-controls="recipe-list"
          className="h-10 xl:max-w-md xl:flex-1"
        />
        <Combobox
          items={effectOptions}
          value={effectOptions.find((effect) => effect.id === selectedEffect) ?? null}
          onValueChange={(effect) => setSelectedEffect(effect?.id ?? "")}
          itemToStringLabel={(effect) => effect.name}
          itemToStringValue={(effect) => effect.id}
        >
          <ComboboxInput
            aria-label={m.recipe_effect({}, { locale })}
            placeholder={m.recipes_all_effects({}, { locale })}
            className="h-10 w-full xl:w-64 xl:shrink-0"
            showClear
          />
          <ComboboxContent>
            <ComboboxEmpty>{m.recipes_effect_no_results({}, { locale })}</ComboboxEmpty>
            <ComboboxList>
              {(effect: { id: string; name: string }) => (
                <ComboboxItem key={effect.id} value={effect}>
                  {effect.name}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <Combobox
          items={qualityOptions}
          value={qualityOptions.find((option) => option.id === selectedQuality) ?? null}
          onValueChange={(option) => setSelectedQuality(option?.id ?? "")}
          itemToStringLabel={(option) => option.name}
          itemToStringValue={(option) => option.id}
        >
          <ComboboxInput
            aria-label={m.recipes_quality({}, { locale })}
            placeholder={m.recipes_all_qualities({}, { locale })}
            className="h-10 w-full xl:w-64 xl:shrink-0"
            showClear
          />
          <ComboboxContent>
            <ComboboxEmpty>{m.recipes_quality_no_results({}, { locale })}</ComboboxEmpty>
            <ComboboxList>
              {(option: { id: string; name: string }) => (
                <ComboboxItem key={option.id} value={option}>
                  {option.name}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <Combobox
          items={sortOptions}
          value={sortOptions.find((option) => option.id === selectedSort) ?? null}
          onValueChange={(option) => setSelectedSort(option?.id ?? "name-asc")}
          itemToStringLabel={(option) => option.name}
          itemToStringValue={(option) => option.id}
        >
          <ComboboxInput
            aria-label={m.recipes_sort({}, { locale })}
            className="h-10 w-full xl:w-64 xl:shrink-0"
          />
          <ComboboxContent>
            <ComboboxEmpty>{m.recipes_sort_no_results({}, { locale })}</ComboboxEmpty>
            <ComboboxList>
              {(option: { id: string; name: string }) => (
                <ComboboxItem key={option.id} value={option}>
                  {option.name}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
      <Tabs
        id="recipe-list"
        value={selectedGroup}
        onValueChange={(value) => {
          if (typeof value === "string") setSelectedGroup(value);
        }}
        className="gap-4"
      >
        <TabsList className="grid w-full grid-cols-2 gap-1 group-data-horizontal/tabs:h-auto sm:flex sm:w-fit" aria-label={m.nav_recipes({}, { locale })}>
          {groups.map((group) => (
            <TabsTrigger key={group.id} value={group.id} className="h-auto px-3 py-2">
              {group.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {groups.map((group) => (
          <TabsContent key={group.id} value={group.id} keepMounted className="min-w-0 px-px pb-4">
            <p role="status" className="mb-4 text-sm text-muted-foreground">
              {recipes.length === 0
                ? m.recipes_empty({}, { locale })
                : group.recipes.length === 0
                  ? m.recipes_no_results({}, { locale })
                  : m.recipes_results({ count: group.recipes.length }, { locale })}
            </p>
            {group.recipes.length > 0 && (
              <ul className="grid grid-cols-1 gap-4 sm:auto-rows-fr sm:grid-cols-2 xl:grid-cols-3">
                {group.recipes.map((recipe) => (
                  <li key={recipe.id} className="min-w-0">
                    {recipe.content}
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
