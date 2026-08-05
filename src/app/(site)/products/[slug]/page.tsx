import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToBag } from "@/components/product/AddToBag";
import { ProductStage } from "@/components/product/ProductStage";
import { Overline } from "@/components/ui/Overline";
import { Reveal } from "@/components/ui/Reveal";
import { Rule } from "@/components/ui/Rule";
import { commerce, formatMoney, getProductStatus } from "@/lib/commerce";

/**
 * Product page.
 *
 * The garment holds its position on desktop while the copy scrolls past
 * beside it — the same "the product never leaves" idea the homepage film is
 * built on, applied here without any of its machinery. Description and
 * details arrive on `Reveal`, the site's ordinary scroll-into-view primitive;
 * nothing on this page runs its own animation loop.
 *
 * The description leads, ahead of price — story before transaction. Nothing
 * about the buy control changes: `AddToBag` is never wrapped in a reveal, so
 * it is always immediately present, never something a customer waits on.
 */

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const products = await commerce.getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await commerce.getProduct(slug);
  if (!product) return { title: "Not found" };

  return {
    title: product.title,
    description: product.description,
  };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const product = await commerce.getProduct(slug);

  if (!product) notFound();

  const drop = product.dropId ? await commerce.getDrop(product.dropId) : null;
  const status = getProductStatus(product, drop);

  return (
    <main className="flex-1 px-(--spacing-gutter) pt-36 pb-(--spacing-section)">
      <div className="mx-auto grid max-w-[1600px] gap-14 lg:grid-cols-2 lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <ProductStage
            src={product.media.cutout ?? product.media.primary}
            alt={product.title}
          />
        </div>

        <div className="lg:py-10">
          <Overline tone="silver">{product.overline}</Overline>

          <h1 className="mt-5 font-display-tracked text-(length:--text-display-md) text-bone">
            {product.title}
          </h1>

          <Rule className="mt-10 mb-10" />

          <Reveal>
            <p className="max-w-prose text-(length:--text-body-lg) text-stone">
              {product.description}
            </p>
          </Reveal>

          <p className="mt-8 text-(length:--text-body-lg) text-bone tabular-nums">
            {formatMoney(product.price)}
          </p>

          {status !== "available" ? (
            <p className="mt-3 text-[0.6875rem] tracking-[0.24em] text-silver uppercase">
              {status === "sold-out"
                ? "Sold out"
                : status === "low-stock"
                  ? "Low stock"
                  : "Coming soon"}
            </p>
          ) : null}

          <div className="mt-8">
            <AddToBag product={product} />
          </div>

          <Reveal delay={0.08}>
            <dl className="mt-16 border-t border-graphite">
              {product.details.map((detail) => (
                <div
                  key={detail.label}
                  className="flex gap-6 border-b border-graphite py-4"
                >
                  <dt className="w-32 shrink-0 text-overline text-ash">{detail.label}</dt>
                  <dd className="text-(length:--text-caption) text-stone">
                    {detail.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </main>
  );
}
