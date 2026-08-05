import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid, type ProductGridItem } from "@/components/product/ProductGrid";
import { Overline } from "@/components/ui/Overline";
import { commerce, getProductStatus } from "@/lib/commerce";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const collections = await commerce.getCollections();
  return collections.map((collection) => ({ slug: collection.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await commerce.getCollection(slug);
  if (!collection) return { title: "Not found" };

  return { title: collection.title, description: collection.description };
}

export default async function CollectionPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const collection = await commerce.getCollection(slug);
  if (!collection) notFound();

  const [products, drops] = await Promise.all([
    commerce.getProductsByIds(collection.productIds),
    commerce.getDrops(),
  ]);
  const dropsById = new Map(drops.map((drop) => [drop.id, drop]));

  const items: ProductGridItem[] = products.map((product) => ({
    product,
    status: getProductStatus(
      product,
      product.dropId ? (dropsById.get(product.dropId) ?? null) : null,
    ),
  }));

  return (
    <main className="flex-1 px-(--spacing-gutter) pt-36 pb-(--spacing-section)">
      <div className="mx-auto max-w-[1600px]">
        <Link
          href="/collections"
          data-cursor-magnetic
          className="text-overline text-stone transition-colors duration-(--duration-micro) hover:text-bone"
        >
          Collections
        </Link>

        <Overline tone="silver" className="mt-8">
          Collection
        </Overline>
        <h1 className="mt-4 font-display-tracked text-(length:--text-display-lg) text-bone">
          {collection.title}
        </h1>
        <p className="mt-6 max-w-lg text-(length:--text-body-lg) leading-relaxed text-stone">
          {collection.description}
        </p>
      </div>

      <div className="mx-auto mt-20 max-w-[1600px]">
        <ProductGrid items={items} />
      </div>
    </main>
  );
}
