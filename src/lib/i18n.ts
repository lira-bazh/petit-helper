import "server-only";

import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/paraglide/runtime.js";

export async function getRequestLocale(
  params: Promise<{ locale: string }>,
): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}
