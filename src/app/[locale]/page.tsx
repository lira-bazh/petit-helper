import type { Metadata } from "next";
import Image from "next/image";
import RecipeSearch from "@/app/components/recipe-search";
import RecipeIngredients from "@/app/components/recipe-ingredients";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { getRequestLocale } from "@/lib/i18n";
import recipeData from "@/lib/recipes.json";
import { siteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";
import * as m from "@/paraglide/messages.js";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = await getRequestLocale(params);
  return {
    title: m.recipes_title({}, { locale }),
    description: m.recipes_meta_description({}, { locale }),
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        ru: `${siteUrl}/ru`,
        en: `${siteUrl}/en`,
      },
    },
  };
}

export default async function RecipesPage({ params }: PageProps<"/[locale]">) {
  const locale = await getRequestLocale(params);
  return (
    <main
      className="mx-auto max-w-[1448px] px-6 py-8 lg:px-14"
      aria-label={m.nav_recipes({}, { locale })}
    >
      <h1 className="mb-3 text-2xl font-semibold">{m.recipes_heading({}, { locale })}</h1>
      <p className="mb-6 text-muted-foreground">{m.recipes_description({}, { locale })}</p>
      <RecipeSearch
        locale={locale}
        effects={recipeData.effects.map((effect) => ({ id: effect.id, name: effect.name[locale] }))}
        recipes={recipeData.recipes.map((recipe) => {
          const ingredients = recipe.ingredients.map((requirement) => {
            const name = requirement.type === "ingredient" && "ingredientId" in requirement
              ? recipeData.ingredients.find((ingredient) => ingredient.id === requirement.ingredientId)?.name[locale]
              : requirement.type === "category" && "category" in requirement
                ? recipeData.categories.find((category) => category.id === requirement.category)?.name[locale]
                : undefined;
            const qualityLabel = requirement.quality === "gold"
              ? m.recipe_quality_gold({}, { locale })
              : requirement.quality === "purple"
                ? m.recipe_quality_purple({}, { locale })
                : undefined;

            return { ...requirement, name: name ?? m.recipe_unknown({}, { locale }), qualityLabel };
          });
          const ingredientDescriptions = ingredients.map((ingredient) =>
            `${ingredient.name}${ingredient.qualityLabel ? ` (${ingredient.qualityLabel.toLocaleLowerCase(locale)})` : ""} ×${ingredient.quantity}`,
          );
          const quality = ingredients.some((ingredient) => ingredient.quality === "gold")
            ? "gold"
            : ingredients.some((ingredient) => ingredient.quality === "purple")
              ? "purple"
              : "normal";

          return {
            id: recipe.id,
            name: recipe.name[locale],
            kind: recipe.kind,
            effectId: recipe.effect?.effectId ?? null,
            power: recipe.power,
            quality,
            ingredientCount: recipe.ingredients.reduce((count, ingredient) => count + ingredient.quantity, 0),
            content: (
              <Card className="relative sm:h-full">
                {quality !== "normal" && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute right-2 top-2 size-2 rounded-full",
                      quality === "gold" ? "bg-amber-400" : "bg-purple-400",
                    )}
                  />
                )}
                <CardHeader className="flex flex-row items-center gap-3">
                  {recipe.image && (
                    <Image
                      src={recipe.image}
                      alt=""
                      width={48}
                      height={48}
                      sizes="(max-width: 639px) 32px, 48px"
                      className="h-8 w-8 shrink-0 object-contain sm:h-12 sm:w-12"
                    />
                  )}
                  <div className="min-w-0 space-y-1">
                    <CardTitle>
                      <h2>{recipe.name[locale]}</h2>
                    </CardTitle>
                    <CardDescription>
                      {m.recipe_power({}, { locale })}: {recipe.power ?? m.recipe_unknown({}, { locale })}
                    </CardDescription>
                    <CardDescription className={cn("sm:min-h-5", !recipe.effect && "hidden sm:block")}>
                      {recipe.effect && (
                        <>
                          {m.recipe_effect({}, { locale })}: {recipeData.effects.find((effect) => effect.id === recipe.effect?.effectId)?.name[locale] ?? m.recipe_unknown({}, { locale })}
                          {recipe.effect.level != null && (
                            <> {["I", "II", "III"][recipe.effect.level - 1]}</>
                          )}
                        </>
                      )}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-1">
                  <h3 className="mb-3 font-medium">{m.recipe_ingredients({}, { locale })}</h3>
                  <RecipeIngredients locale={locale}>
                    <ul className="space-y-1 rounded-lg border border-border bg-muted/40 p-3">
                      {ingredients.map((requirement, index) => (
                        <li key={index} className="flex items-start justify-between gap-4">
                          <span className="flex min-w-0 items-start gap-2">
                            <span>{requirement.name}</span>
                            {(requirement.quality === "purple" || requirement.quality === "gold") && (
                              <span
                                role="img"
                                aria-label={requirement.qualityLabel}
                                className={cn(
                                  "mt-1.5 size-2 shrink-0 rounded-full",
                                  requirement.quality === "gold" ? "bg-amber-400" : "bg-purple-400",
                                )}
                              />
                            )}
                          </span>
                          <span className="shrink-0 text-muted-foreground">×{requirement.quantity}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="pt-3 text-sm text-muted-foreground sm:mt-auto sm:min-h-[calc(3lh+0.75rem)]">
                      {m.recipe_description({ name: recipe.name[locale], ingredients: ingredientDescriptions.join(", ") }, { locale })}
                    </p>
                  </RecipeIngredients>
                </CardContent>
              </Card>
            ),
          };
        })}
      />
    </main>
  );
}
