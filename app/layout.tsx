import type { Metadata } from "next";
import SiteHeader from "./components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Помощник Petit Planet",
  description: "Помощник для игры Petit Planet: рецепты и цветы.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" suppressHydrationWarning>
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
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
