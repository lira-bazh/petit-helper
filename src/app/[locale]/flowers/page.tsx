import { Fragment } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUp } from "lucide-react";
import FlowerSectionLink from "@/app/components/flower-section-link";
import { buttonVariants } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { getRequestLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import flowerData from "@/lib/flowers.json";
import { siteUrl } from "@/lib/site";
import * as m from "@/paraglide/messages.js";
import sunflowerRed from "../../../../public/images/flowers/sunflower-red.webp";

export async function generateMetadata({ params }: PageProps<"/[locale]/flowers">): Promise<Metadata> {
  const locale = await getRequestLocale(params);
  return {
    title: m.flowers_title({}, { locale }),
    alternates: {
      canonical: `${siteUrl}/${locale}/flowers`,
      languages: {
        ru: `${siteUrl}/ru/flowers`,
        en: `${siteUrl}/en/flowers`,
      },
    },
  };
}

export default async function FlowersPage({ params }: PageProps<"/[locale]/flowers">) {
  const locale = await getRequestLocale(params);
  const flowers = flowerData.flowers;
  const crosses = flowerData.crosses.flatMap((cross) => {
    const result = flowers.find((flower) => flower.id === cross.resultId);
    const parents = cross.parentIds.map((id) => flowers.find((flower) => flower.id === id));
    const [parent1, parent2] = parents;
    if (!result || (cross.parentIds.length !== 0 && (!parent1 || !parent2))) return [];
    return [{ parents: [parent1, parent2], result }];
  });
  const groups = flowerData.species.flatMap((species) => {
    const speciesCrosses = crosses.filter((cross) => cross.result.speciesId === species.id);
    const whiteFlowers = flowers.filter((flower) => flower.speciesId === species.id && flower.quality === "white");
    return speciesCrosses.length > 0 ? [{ species, whiteFlowers, crosses: speciesCrosses }] : [];
  }).sort((a, b) => b.crosses.length - a.crosses.length);

  return (
    <main
      className="mx-auto max-w-[1448px] px-6 py-8 lg:px-14"
      aria-label={m.nav_flowers({}, { locale })}
    >
      {groups.length > 0 && (
        <nav aria-labelledby="flowers-contents" className="mx-auto mb-8 max-w-[49.5rem]">
          <h2 id="flowers-contents" className="mb-3 text-center text-sm font-medium text-muted-foreground">
            {m.flowers_contents({}, { locale })}
          </h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-7">
            {groups.map(({ species }) => (
              <li key={species.id} className="min-w-0">
                <Link
                  href={`#${species.id}`}
                  className="flex h-full w-full items-center justify-center rounded-lg bg-card px-3 py-2 text-center text-sm font-medium ring-1 ring-foreground/10 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {species.name[locale]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {groups.length > 0 ? groups.map(({ species, whiteFlowers, crosses }) => (
        <section key={species.id} id={species.id} aria-labelledby={`${species.id}-title`} className="mx-auto mb-8 max-w-[49.5rem] scroll-mt-6">
          <h2 id={`${species.id}-title`} className="mb-2 text-center text-xl font-semibold">
            <span className="relative inline-block max-w-[calc(100%_-_5rem)]">
              {species.name[locale]}
              <FlowerSectionLink
                sectionId={species.id}
                label={m.flowers_copy_link({ name: species.name[locale] }, { locale })}
                copiedLabel={m.flowers_link_copied({}, { locale })}
                fallbackLabel={m.flowers_link_in_address({}, { locale })}
              />
            </span>
          </h2>
          <div className="grid items-start gap-6 md:grid-cols-[12rem_minmax(0,36rem)]">
            <aside aria-labelledby={`${species.id}-base-colors`}>
              <h3 id={`${species.id}-base-colors`} className="mb-3 text-sm font-medium text-muted-foreground">
                {m.flowers_base_colors({}, { locale })}
              </h3>
              <Card>
                <CardContent>
                  <ul className="space-y-3">
                    {whiteFlowers.map((flower) => (
                      <li key={flower.id} className="flex items-center gap-3 text-sm">
                        <Image
                          src={flower.id === "sunflower-red" ? sunflowerRed : flower.image}
                          alt=""
                          width={48}
                          height={48}
                          sizes="(max-width: 639px) 32px, 48px"
                          className="h-8 w-8 shrink-0 object-contain sm:h-12 sm:w-12"
                        />
                        <span className="min-w-0 break-words font-medium">{flower.colorName[locale]}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </aside>
            <div className="min-w-0">
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                {m.flowers_crosses({}, { locale })}
              </h3>
              <ul className="max-w-xl space-y-4">
                {crosses.map(({ parents, result }) => (
                  <li key={`${parents.map((flower) => flower?.id ?? "unknown").join("+")}-${result.id}`}>
                    <Card>
                      <CardContent>
                        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-center text-sm sm:gap-4">
                          {[...parents, result].map((flower, index) => (
                            <Fragment key={`${flower?.id ?? "unknown"}-${index}`}>
                              {index > 0 && (
                                <span className="text-xl text-muted-foreground">
                                  {index === 1 ? "+" : "→"}
                                </span>
                              )}
                              <div className="flex min-w-0 flex-col items-center gap-2">
                                {(!flower || flower.image) && (
                                  <span className="relative inline-flex max-w-full p-1.5">
                                    <Image
                                      src={flower?.id === "sunflower-red"
                                        ? sunflowerRed
                                        : flower?.image ?? "/images/flowers/unknown.png"}
                                      alt=""
                                      width={48}
                                      height={48}
                                      sizes="(max-width: 639px) 32px, 48px"
                                      className="h-8 w-8 max-w-full object-contain sm:h-12 sm:w-12"
                                    />
                                    {flower && "quality" in flower
                                      && (flower.quality === "blue" || flower.quality === "purple" || flower.quality === "gold") && (
                                      <span
                                        aria-hidden="true"
                                        className={cn(
                                          "absolute right-0.5 top-0.5 size-2 rounded-full",
                                          {
                                            "bg-sky-400": flower.quality === "blue",
                                            "bg-purple-400": flower.quality === "purple",
                                            "bg-amber-400": flower.quality === "gold",
                                          },
                                        )}
                                      />
                                    )}
                                  </span>
                                )}
                                <span className="w-full break-words font-medium">
                                  {flower ? flower.colorName[locale] : m.recipe_unknown({}, { locale })}
                                </span>
                              </div>
                            </Fragment>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )) : (
        <p className="mx-auto max-w-[49.5rem] text-muted-foreground">{m.flowers_empty({}, { locale })}</p>
      )}
      {groups.length > 0 && (
        <Link
          href="#top"
          aria-label={m.flowers_back_to_top({}, { locale })}
          title={m.flowers_back_to_top({}, { locale })}
          className={cn(
            buttonVariants({ variant: "outline", size: "icon-lg" }),
            "fixed bottom-6 right-6 z-10 size-11 rounded-full shadow-sm",
          )}
        >
          <ArrowUp aria-hidden="true" />
        </Link>
      )}
    </main>
  );
}
