import type { Drop, DropStatus, Product, ProductStatus, Variant } from "./types";

/** At or below this many units left, the piece is called out as running low. */
export const LOW_STOCK_THRESHOLD = 3;

export function totalStock(product: Product): number {
  return product.variants.reduce((sum, variant) => sum + variant.quantity, 0);
}

export function isVariantAvailable(variant: Variant): boolean {
  return variant.quantity > 0;
}

/**
 * How much of a given variant may still be added, given what is already in the
 * bag. Callers use this to cap quantity steppers rather than letting someone
 * add eleven of a piece that has two left.
 */
export function remainingFor(variant: Variant, alreadyInCart: number): number {
  return Math.max(0, variant.quantity - alreadyInCart);
}

/**
 * Derive what a customer can do with a product right now.
 *
 * Derived rather than stored: a `status` field in the catalogue is a second
 * source of truth that drifts the first time someone edits stock without
 * editing the label, and the failure mode is a shop selling something it does
 * not have.
 *
 * A drop piece before its release reads "coming soon" regardless of stock —
 * the units exist, they are simply not for sale yet.
 */
export function getProductStatus(
  product: Product,
  drop?: Drop | null,
  now: number = Date.now(),
): ProductStatus {
  if (product.releaseType === "drop" && drop) {
    if (now < Date.parse(drop.releaseAt)) return "coming-soon";
  }

  const stock = totalStock(product);
  if (stock === 0) return "sold-out";
  if (stock <= LOW_STOCK_THRESHOLD) return "low-stock";
  return "available";
}

/**
 * Derive a drop's state from its dates and the stock behind it.
 *
 * `now` is a parameter rather than an internal `Date.now()` so a server render
 * and the client that hydrates it can be handed the same instant. Reading the
 * clock independently in both places produces a page that says "live" on the
 * server and "sold out" in the browser — a hydration mismatch on the single
 * most commercially important word on the page.
 */
export function resolveDropStatus(
  drop: Drop,
  products: readonly Product[],
  now: number = Date.now(),
): DropStatus {
  if (now < Date.parse(drop.releaseAt)) return "upcoming";
  if (drop.endsAt && now > Date.parse(drop.endsAt)) return "archived";

  const dropProducts = products.filter((product) => drop.productIds.includes(product.id));

  // A drop that has opened with nothing behind it is still live — it is a
  // teaser, not a sell-out. Only a drop that had stock and lost it is closed.
  if (dropProducts.length > 0 && dropProducts.every((p) => totalStock(p) === 0)) {
    return "sold-out";
  }

  return "live";
}
