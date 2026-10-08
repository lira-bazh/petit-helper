import type { Metadata } from "next";
import Image from "next/image";
import RecipeSearch from "@/app/components/recipe-search";
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
import * as m from "@/paraglide/messages.js";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = await getRequestLocale(params);
  return {
    title: m.recipes_title({}, { locale }),
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
      <h1 className="mb-6 text-2xl font-semibold">{m.nav_recipes({}, { locale })}</h1>
      <RecipeSearch
        locale={locale}
        recipes={recipeData.recipes.map((recipe) => ({
          id: recipe.id,
          name: recipe.name[locale],
          content: (
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center gap-3">
                <Image
                  src={recipe.image}
                  alt=""
                  width={48}
                  height={48}
                  sizes="(max-width: 639px) 32px, 48px"
                  className="h-8 w-8 shrink-0 object-contain sm:h-12 sm:w-12"
                />
                <div className="min-w-0 space-y-1">
                  <CardTitle>
                    <h2>{recipe.name[locale]}</h2>
                  </CardTitle>
                  <CardDescription>
                    {m.recipe_power({}, { locale })}: {recipe.power ?? m.recipe_unknown({}, { locale })}
                  </CardDescription>
                  {recipe.effect && (
                    <CardDescription>
                      {m.recipe_effect({}, { locale })}: {recipeData.effects.find((effect) => effect.id === recipe.effect?.effectId)?.name[locale] ?? m.recipe_unknown({}, { locale })}
                      {recipe.effect.level != null && (
                        <> {["I", "II", "III"][recipe.effect.level - 1]}</>
                      )}
                    </CardDescription>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="mb-3 border-b border-border pb-2 font-medium">{m.recipe_ingredients({}, { locale })}</h3>
                <ul className="space-y-1">
                  {recipe.ingredients.map((requirement, index) => {
                    const name = requirement.type === "ingredient" && "ingredientId" in requirement
                      ? recipeData.ingredients.find((ingredient) => ingredient.id === requirement.ingredientId)?.name[locale]
                      : requirement.type === "category" && "category" in requirement
                        ? recipeData.categories.find((category) => category.id === requirement.category)?.name[locale]
                        : undefined;

                    return (
                      <li key={index} className="flex items-start justify-between gap-4">
                        <span>{name ?? m.recipe_unknown({}, { locale })}</span>
                        <span className="shrink-0 text-muted-foreground">×{requirement.quantity}</span>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ),
        }))}
      />
    </main>
  );
}
