import type { StaticImageData } from "next/image";
import type { Turnaround } from "@/lib/media/types";

/**
 * Money is always integer minor units plus a currency.
 *
 * Never a float. `0.1 + 0.2 !== 0.3`, and a storefront that adds up line items
 * in floating point will eventually disagree with the payment processor by a
 * cent — on a £890 garment that is a support ticket, not a rounding detail.
 */
export interface Money {
  /** Minor units: 89000 is 890.00. */
  amount: number;
  currency: "USD";
}

export type ReleaseType = "core" | "drop";

/**
 * What a customer can actually do with a product right now.
 *
 * Derived from variant stock rather than stored, so it cannot drift out of
 * sync with the thing it describes.
 */
export type ProductStatus = "available" | "low-stock" | "sold-out" | "coming-soon";

export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL" | "One Size";

export interface Variant {
  id: string;
  size: Size;
  sku: string;
  /** Units on hand. 0 means sold out; the UI still shows the size, greyed. */
  quantity: number;
  /** Overrides the product price where a size costs more. Rare. */
  price?: Money;
}

export interface ProductMedia {
  primary: StaticImageData;
  /** Present only where enough camera angles exist to rotate. */
  turnaround?: Turnaround;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  /** The small tracked line above the title. Lifted from the garment prints. */
  overline: string;
  description: string;
  price: Money;
  releaseType: ReleaseType;
  /** Set when releaseType is "drop". Ties the piece to its moment. */
  dropId?: string;
  collectionIds: readonly string[];
  variants: readonly Variant[];
  media: ProductMedia;
  /** Composition and care, shown as a definition list on the product page. */
  details: readonly { label: string; value: string }[];
}

export interface Collection {
  id: string;
  slug: string;
  title: string;
  description: string;
  productIds: readonly string[];
}

export type DropStatus = "upcoming" | "live" | "sold-out" | "archived";

export interface Drop {
  id: string;
  slug: string;
  title: string;
  description: string;
  /** ISO 8601. Fixed strings, never `new Date()` at module scope. */
  releaseAt: string;
  /** Absent means it runs until stock is gone. */
  endsAt?: string;
  productIds: readonly string[];
}

/* -------------------------------------------------------------------------
   Cart
   ------------------------------------------------------------------------- */

/**
 * A line in the bag.
 *
 * The product fields are deliberately **denormalised copies**, not lookups.
 * A bag should show what was put in it: if a price changes or a piece is
 * withdrawn while someone is still shopping, the line must not silently
 * mutate underneath them. Totals are re-validated at checkout, which is where
 * authority over price belongs anyway.
 *
 * This also happens to be the shape Shopify returns for cart lines, so the
 * migration does not reshape the drawer.
 *
 * Imagery is pointedly NOT snapshotted. Image URLs carry a build hash, so a
 * persisted one 404s after the next deploy — a bag that survives a release
 * would fill with broken images. Prices are snapshotted because they are
 * commercial facts; pictures are resolved fresh from the catalogue.
 */
export interface CartLine {
  /** Stable key for the line: one per variant. */
  variantId: string;
  productId: string;
  productSlug: string;
  title: string;
  size: Size;
  unitPrice: Money;
  quantity: number;
}

/** A cart line with its imagery resolved against the current catalogue. */
export interface ResolvedCartLine extends CartLine {
  image: StaticImageData | null;
  /** False when the piece has since been withdrawn — the line still shows. */
  stillAvailable: boolean;
}

export interface Cart {
  lines: readonly CartLine[];
  subtotal: Money;
  /** Total units, not total lines — this is what the header badge shows. */
  count: number;
}
