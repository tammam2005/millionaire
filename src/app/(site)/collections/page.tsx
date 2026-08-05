import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Overline } from "@/components/ui/Overline";
import { commerce } from "@/lib/commerce";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: "Collections",
  description: "The MILLIONAIRE catalogue, by collection.",
};

/**
 * The collections index.
 *
 * Two rows, not a grid of tiles — with only two collections, a grid would be
 * two lonely squares in a lot of empty space. A full-width editorial row per
 * collection, alternating image side like the chapters of the film, reads as
 * considered instead of sparse and scales cleanly to a third collection later.
 */
export default async function CollectionsPage() {
  const collections = await commerce.getCollections();

  const rows = await Promise.all(
    collections.map(async (collection) => {
      const products = await commerce.getProductsByIds(collection.productIds);
      return { collection, cover: products[0] ?? null, count: products.length };
    }),
  );

  return (
    <main className="flex-1 px-(--spacing-gutter) pt-36 pb-(--spacing-section)">
      <div className="mx-auto max-w-[1600px]">
        <Overline tone="silver">The catalogue</Overline>
        <h1 className="mt-5 font-display-tracked text-(length:--text-display-lg) text-bone">
          Collections
        </h1>
      </div>

      <div className="mx-auto mt-20 max-w-[1600px] divide-y divide-graphite border-t border-graphite">
        {rows.map(({ collection, cover, count }, index) => (
          <Link
            key={collection.id}
            href={`/collections/${collection.slug}`}
            data-cursor-magnetic
            className="group grid items-center gap-10 py-16 lg:grid-cols-2 lg:gap-20"
          >
            <div
              className={cn(
                "bg-studio aspect-[4/3] overflow-hidden",
                index % 2 === 1 ? "lg:order-2" : "",
              )}
            >
              {cover ? (
                <Image
                  src={cover.media.primary}
                  alt=""
                  placeholder="blur"
                  priority={index === 0}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="h-full w-full object-cover transition-transform duration-(--duration-scene) ease-(--ease-signature) group-hover:scale-[1.03]"
                />
              ) : null}
            </div>

            <div>
              <Overline tone="silver">
                {count} {count === 1 ? "piece" : "pieces"}
              </Overline>
              <h2 className="mt-5 font-display-tracked text-(length:--text-display-md) text-bone transition-colors duration-(--duration-micro) group-hover:text-silver">
                {collection.title}
              </h2>
              <p className="mt-6 max-w-md text-(length:--text-body-lg) leading-relaxed text-stone">
                {collection.description}
              </p>
              <span className="mt-8 inline-block text-overline text-bone">
                View the collection
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
