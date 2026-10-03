import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Рецепты — Помощник Petit Planet",
};

export default function RecipesPage() {
  return <main className="page-content" aria-label="Рецепты" />;
}
