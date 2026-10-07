import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { locales } from "@/paraglide/runtime.js";

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.flatMap((locale) => [
    { url: `${siteUrl}/${locale}` },
    { url: `${siteUrl}/${locale}/flowers` },
  ]);
}
