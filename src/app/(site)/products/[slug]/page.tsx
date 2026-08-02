import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AddToBag } from "@/components/product/AddToBag";
import { Overline } from "@/components/ui/Overline";
import { Rule } from "@/components/ui/Rule";
import { commerce, formatMoney, getProductStatus } from "@/lib/commerce";

/**
 * Product page — Phase 3 form.
 *
 * Deliberately plain. Its job right now is to prove the commerce layer end to
 * end: a server component reading through the provider, static params
 * generated from the catalogue, and a working path into the bag. The
 * turnaround gallery, sticky buy bar and related products arrive in Phase 5.
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
        <div className="bg-studio">
          <Image
            src={product.media.primary}
            alt={product.title}
            placeholder="blur"
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="h-auto w-full"
          />
        </div>

        <div className="lg:py-10">
          <Overline tone="silver">{product.overline}</Overline>

          <h1 className="mt-5 font-display-tracked text-(length:--text-display-md) text-bone">
            {product.title}
          </h1>

          <p className="mt-6 text-(length:--text-body-lg) text-bone tabular-nums">
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

          <Rule className="mt-10 mb-10" />

          <p className="max-w-prose text-(length:--text-body) text-stone">
            {product.description}
          </p>

          <div className="mt-12">
            <AddToBag product={product} />
          </div>

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
        </div>
      </div>
    </main>
  );
}
