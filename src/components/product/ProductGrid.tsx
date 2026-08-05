import { ProductCard } from "@/components/product/ProductCard";
import type { Product, ProductStatus } from "@/lib/commerce";
import { cn } from "@/lib/utils/cn";

export type ProductGridItem = {
  product: Product;
  status: ProductStatus;
};

type ProductGridProps = {
  items: readonly ProductGridItem[];
  className?: string;
};

/**
 * The grid every collection and the product page's related pieces render
 * through. One layout, defined once, so a browsing view anywhere on the site
 * lines up the same way.
 *
 * Two up on a phone rather than one — a single column of square studio plates
 * reads as a feed to scroll past, not a collection to compare.
 */
export function ProductGrid({ items, className }: ProductGridProps) {
  if (items.length === 0) {
    return <p className="text-(length:--text-body) text-stone">Nothing here yet.</p>;
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-6 gap-y-14 sm:gap-x-8 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-20",
        className,
      )}
    >
      {items.map(({ product, status }, index) => (
        <ProductCard
          key={product.id}
          product={product}
          status={status}
          priority={index < 3}
        />
      ))}
    </div>
  );
}
