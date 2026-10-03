import type { Metadata } from "next";
import { getRequestLocale } from "@/lib/i18n";
import * as m from "@/paraglide/messages.js";
import SiteHeader from "./components/site-header";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: m.site_name({}, { locale }),
    description: m.site_description({}, { locale }),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getRequestLocale();
  return (
    <html lang={locale} className="scheme-light dark:scheme-dark" suppressHydrationWarning>
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
      </body>
    </html>
  );
}
