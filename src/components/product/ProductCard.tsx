import Link from "next/link";
import { GarmentPlate } from "@/components/product/GarmentPlate";
import { Overline } from "@/components/ui/Overline";
import type { Product, ProductStatus } from "@/lib/commerce";
import { formatMoney } from "@/lib/commerce";
import { cn } from "@/lib/utils/cn";

type ProductCardProps = {
  product: Product;
  status: ProductStatus;
  /** Loads eagerly for cards above the fold — the first row of a grid. */
  priority?: boolean;
  className?: string;
};

const STATUS_LABEL: Partial<Record<ProductStatus, string>> = {
  "sold-out": "Sold out",
  "low-stock": "Low stock",
  "coming-soon": "Coming soon",
};

/**
 * One tile in a product grid.
 *
 * The whole card is the link, not just the title — a customer scanning a grid
 * shouldn't have to aim for a single line of type. The image is the only thing
 * that moves on hover, and only barely: a hairline scale on a GPU-composited
 * transform, the same restraint the rest of the site applies to hover states
 * (the header's Monogram condense is the same trick). No shadow, no radius,
 * no lift — those read as generic ecommerce chrome on a brand that withholds.
 *
 * Renders don't need cropping: every render is a 1024×1024 plate from the
 * same shoot, so `aspect-square` never fights the source.
 */
export function ProductCard({ product, status, priority, className }: ProductCardProps) {
  const statusLabel = STATUS_LABEL[status];

  return (
    <Link
      href={`/products/${product.slug}`}
      data-cursor-magnetic
      className={cn("group flex flex-col", className)}
    >
      <GarmentPlate
        src={product.media.cutout ?? product.media.primary}
        alt={product.title}
        priority={priority}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="aspect-square"
        imageClassName="h-full w-full object-cover transition-transform duration-(--duration-element) ease-(--ease-signature) group-hover:scale-[1.035]"
      />

      <Overline tone="silver" className="mt-6">
        {product.overline}
      </Overline>
      <h3 className="mt-3 font-display text-(length:--text-heading) leading-tight text-bone transition-colors duration-(--duration-micro) group-hover:text-silver">
        {product.title}
      </h3>

      <div className="mt-3 flex items-baseline gap-3">
        <span className="text-(length:--text-caption) text-stone tabular-nums">
          {formatMoney(product.price)}
        </span>
        {statusLabel ? (
          <span className="text-[0.6875rem] tracking-[0.2em] text-silver uppercase">
            {statusLabel}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
