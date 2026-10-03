"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as m from "@/paraglide/messages.js";
import type { Locale } from "@/paraglide/runtime.js";
import LanguageSelect from "./language-select";
import ThemeToggle from "./theme-toggle";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

export default function SiteHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const sections = [
    { href: "/", label: m.nav_recipes({}, { locale }) },
    { href: "/flowers", label: m.nav_flowers({}, { locale }) },
  ];

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex min-h-20 max-w-[1448px] items-center gap-[84px] px-14 [@media(max-width:1024px)]:grid [@media(max-width:1024px)]:grid-cols-1 [@media(max-width:1024px)]:gap-x-4 [@media(max-width:1024px)]:gap-y-2 [@media(max-width:1024px)]:px-6 [@media(max-width:1024px)]:pt-[18px]">
        <Link className="shrink-0 text-[30px] leading-[1.3] font-bold focus-visible:rounded-[2px] focus-visible:outline-2 focus-visible:outline-offset-[5px] focus-visible:outline-primary [@media(max-width:1024px)]:text-2xl [@media(max-width:1024px)]:leading-[1.3]" href="/">
          {m.site_name({}, { locale })}
        </Link>
        <nav className="flex items-center [@media(max-width:1024px)]:col-span-full [@media(max-width:1024px)]:row-start-2" aria-label={m.nav_sections({}, { locale })}>
          <Tabs value={pathname}>
            <TabsList variant="line" className="gap-7 p-0 group-data-horizontal/tabs:h-auto [@media(max-width:1024px)]:gap-5" aria-label={m.nav_sections({}, { locale })}>
              {sections.map(({ href, label }) => (
                <TabsTrigger
                  key={href}
                  value={href}
                  nativeButton={false}
                  render={<Link href={href} />}
                  className="h-auto rounded-none border-0 px-2.5 py-6 text-2xl leading-8 font-semibold text-muted-foreground transition-colors duration-150 ease-[ease] hover:text-foreground focus-visible:rounded-[2px] focus-visible:outline-2 focus-visible:outline-offset-[5px] focus-visible:outline-primary data-active:text-foreground after:bg-primary group-data-horizontal/tabs:after:bottom-[9px] group-data-horizontal/tabs:after:h-[3px] dark:text-muted-foreground dark:hover:text-foreground dark:data-active:text-foreground [@media(max-width:1024px)]:px-2 [@media(max-width:1024px)]:pt-3 [@media(max-width:1024px)]:pb-5 [@media(max-width:1024px)]:text-xl [@media(max-width:1024px)]:leading-7"
                  aria-current={pathname === href ? "page" : undefined}
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </nav>
        <div className="ml-auto flex items-center gap-3 [@media(max-width:1024px)]:row-start-3 [@media(max-width:1024px)]:ml-0 [@media(max-width:1024px)]:pb-[18px]">
          <LanguageSelect locale={locale} />
          <ThemeToggle locale={locale} />
        </div>
      </div>
    </header>
  );
}
