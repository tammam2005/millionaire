import type { CommerceProvider, ProductQuery } from "../provider";
import type { Collection, Drop, Product } from "../types";
import { COLLECTIONS, DROPS, PRODUCTS } from "./catalog";

/**
 * Catalogue reads backed by the local dataset.
 *
 * Async despite resolving immediately — see the note on `CommerceProvider`.
 * Returning already-resolved promises keeps every call site written the way it
 * will need to be written once there is a network hop.
 *
 * Reads return the module-level arrays directly rather than copying them. They
 * are typed `readonly` throughout, so nothing downstream can mutate the
 * catalogue, and copying on every render of a collection grid would be waste.
 */
export const localProvider: CommerceProvider = {
  async getProducts(query?: ProductQuery): Promise<readonly Product[]> {
    let results: readonly Product[] = PRODUCTS;

    if (query?.releaseType) {
      results = results.filter((product) => product.releaseType === query.releaseType);
    }
    if (query?.collectionId) {
      const id = query.collectionId;
      results = results.filter((product) => product.collectionIds.includes(id));
    }
    if (query?.dropId) {
      results = results.filter((product) => product.dropId === query.dropId);
    }
    if (query?.limit !== undefined) {
      results = results.slice(0, query.limit);
    }

    return results;
  },

  async getProduct(slug: string): Promise<Product | null> {
    return PRODUCTS.find((product) => product.slug === slug) ?? null;
  },

  async getProductsByIds(ids: readonly string[]): Promise<readonly Product[]> {
    const wanted = new Set(ids);
    return PRODUCTS.filter((product) => wanted.has(product.id));
  },

  async getCollections(): Promise<readonly Collection[]> {
    return COLLECTIONS;
  },

  async getCollection(slug: string): Promise<Collection | null> {
    return COLLECTIONS.find((collection) => collection.slug === slug) ?? null;
  },

  async getDrops(): Promise<readonly Drop[]> {
    // Newest release first — a drops index reads as a timeline.
    return [...DROPS].sort((a, b) => Date.parse(b.releaseAt) - Date.parse(a.releaseAt));
  },

  async getDrop(slug: string): Promise<Drop | null> {
    return DROPS.find((drop) => drop.slug === slug) ?? null;
  },
};
