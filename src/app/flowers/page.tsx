import type { Metadata } from "next";
import { getRequestLocale } from "@/lib/i18n";
import * as m from "@/paraglide/messages.js";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: m.flowers_title({}, { locale }) };
}

export default async function FlowersPage() {
  const locale = await getRequestLocale();
  return <main className="mx-auto max-w-[1448px]" aria-label={m.nav_flowers({}, { locale })} />;
}
