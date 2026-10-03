"use client";

import * as m from "@/paraglide/messages.js";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/paraglide/runtime.js";
import { Button } from "./ui/button";

export default function LanguageSelect({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const nextLocale = locale === "ru" ? "en" : "ru";
  const href = `/${nextLocale}${pathname.slice(locale.length + 1)}`;
  const label = m.language_toggle_label({}, { locale });

  return (
    <Button
      nativeButton={false}
      render={<Link href={href} hrefLang={nextLocale} />}
      variant="outline"
      size="icon"
      className="grid size-10 cursor-pointer place-items-center rounded-[8px] border-border bg-card p-0 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:rounded-[2px] focus-visible:outline-2 focus-visible:outline-offset-[5px] focus-visible:outline-primary dark:bg-card dark:hover:bg-accent"
      aria-label={label}
      title={label}
    >
      <span aria-hidden="true">{locale.toUpperCase()}</span>
    </Button>
  );
}
