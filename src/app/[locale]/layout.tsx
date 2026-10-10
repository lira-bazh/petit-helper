import type { Metadata } from "next";
import { getRequestLocale } from "@/lib/i18n";
import * as m from "@/paraglide/messages.js";
import SiteHeader from "../components/site-header";
import ThemeRoot from "../components/theme-root";
import { Toaster } from "../components/ui/toast";
import "../globals.css";

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const locale = await getRequestLocale(params);
  return {
    title: m.site_name({}, { locale }),
    description: m.site_description({}, { locale }),
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const locale = await getRequestLocale(params);
  return (
    <ThemeRoot locale={locale}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              let saved;
              try { saved = localStorage.getItem("petit-helper-theme"); } catch {}
              const theme = saved === "light" || saved === "dark"
                ? saved
                : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
              document.documentElement.dataset.theme = theme;
            })();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <SiteHeader locale={locale} />
        {children}
        <Toaster timeout={10000} />
      </body>
    </ThemeRoot>
  );
}
