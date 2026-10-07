import type { Metadata } from "next";
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
          name: recipe.name,
          content: (
            <Card className="h-full">
              <CardHeader>
                <CardTitle>
                  <h2>{recipe.name}</h2>
                </CardTitle>
                <CardDescription>
                  {m.recipe_power({}, { locale })}: {recipe.power ?? m.recipe_unknown({}, { locale })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <h3 className="mb-2 font-medium">{m.recipe_ingredients({}, { locale })}</h3>
                <ul className="space-y-1">
                  {recipe.ingredients.map((requirement, index) => {
                    const name = requirement.type === "ingredient" && "ingredientId" in requirement
                      ? recipeData.ingredients.find((ingredient) => ingredient.id === requirement.ingredientId)?.name
                      : requirement.type === "category" && "category" in requirement
                        ? recipeData.categories.find((category) => category.id === requirement.category)?.name
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
