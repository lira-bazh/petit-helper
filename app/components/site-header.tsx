"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./theme-toggle";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

const sections = [
  { href: "/", label: "Рецепты" },
  { href: "/flowers", label: "Цветы" },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="site-name" href="/">
          Помощник Petit Planet
        </Link>
        <nav className="site-nav" aria-label="Разделы сайта">
          <Tabs value={pathname}>
            <TabsList variant="line" className="section-tabs" aria-label="Разделы сайта">
              {sections.map(({ href, label }) => (
                <TabsTrigger
                  key={href}
                  value={href}
                  nativeButton={false}
                  render={<Link href={href} />}
                  className="nav-link"
                  aria-current={pathname === href ? "page" : undefined}
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
