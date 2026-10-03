import type { Metadata } from "next";
import { getRequestLocale } from "@/lib/i18n";
import * as m from "@/paraglide/messages.js";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = await getRequestLocale(params);
  return { title: m.recipes_title({}, { locale }) };
}

export default async function RecipesPage({ params }: PageProps<"/[locale]">) {
  const locale = await getRequestLocale(params);
  return <main className="mx-auto max-w-[1448px]" aria-label={m.nav_recipes({}, { locale })} />;
}
