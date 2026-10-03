import type { Metadata } from "next";
import { getRequestLocale } from "@/lib/i18n";
import * as m from "@/paraglide/messages.js";

export async function generateMetadata({ params }: PageProps<"/[locale]/flowers">): Promise<Metadata> {
  const locale = await getRequestLocale(params);
  return { title: m.flowers_title({}, { locale }) };
}

export default async function FlowersPage({ params }: PageProps<"/[locale]/flowers">) {
  const locale = await getRequestLocale(params);
  return <main className="mx-auto max-w-[1448px]" aria-label={m.nav_flowers({}, { locale })} />;
}
