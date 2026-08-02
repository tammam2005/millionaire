import type { Collection, Drop, Product, ReleaseType } from "./types";

export interface ProductQuery {
  releaseType?: ReleaseType;
  collectionId?: string;
  dropId?: string;
  limit?: number;
}

/**
 * The boundary between the storefront and whatever is behind it.
 *
 * **No component may import a commerce SDK.** Everything goes through this
 * interface, which is why swapping the local catalogue for Shopify's Storefront
 * API means adding `lib/commerce/shopify/` and changing one export in
 * `index.ts` — with no change to a single component.
 *
 * Every method is async even though the local implementation resolves
 * immediately. Making them synchronous now would mean rewriting every call
 * site the day a network hop appears, and that rewrite is exactly the kind of
 * churn this boundary exists to prevent.
 *
 * The cart is deliberately **not** here yet. It currently lives entirely on
 * the client (`lib/cart/store.ts`) because there is no server to hold it. When
 * Shopify lands, carts become server-owned resources and this interface gains
 * `createCart` / `addLines` / `updateLine`; the store then becomes a thin
 * cache over a cart id rather than the source of truth.
 */
export interface CommerceProvider {
  getProducts(query?: ProductQuery): Promise<readonly Product[]>;
  getProduct(slug: string): Promise<Product | null>;
  /**
   * Batch lookup by id.
   *
   * Exists so the bag can resolve imagery for its lines without reaching into
   * the catalogue implementation — and so it resolves in one call rather than
   * one per line, which is the difference between one request and six once
   * there is a network behind this.
   */
  getProductsByIds(ids: readonly string[]): Promise<readonly Product[]>;

  getCollections(): Promise<readonly Collection[]>;
  getCollection(slug: string): Promise<Collection | null>;

  getDrops(): Promise<readonly Drop[]>;
  getDrop(slug: string): Promise<Drop | null>;
}
