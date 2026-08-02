import { localProvider } from "./local/provider";
import type { CommerceProvider } from "./provider";

/**
 * The active commerce backend.
 *
 * **This is the swap point.** Migrating to Shopify means writing
 * `./shopify/provider.ts` against the same `CommerceProvider` interface and
 * changing the one line below. Nothing else in the codebase names a backend,
 * so nothing else has to change.
 *
 * Import from `@/lib/commerce` — never from `@/lib/commerce/local/*`. A direct
 * import into the local implementation is the thing that would quietly turn
 * this boundary into a fiction.
 */
export const commerce: CommerceProvider = localProvider;

export type {
  Cart,
  CartLine,
  Collection,
  Drop,
  DropStatus,
  Money,
  Product,
  ProductMedia,
  ProductStatus,
  ReleaseType,
  ResolvedCartLine,
  Size,
  Variant,
} from "./types";

export type { CommerceProvider, ProductQuery } from "./provider";

export { addMoney, formatMoney, multiplyMoney, ZERO } from "./money";

export {
  getProductStatus,
  isVariantAvailable,
  LOW_STOCK_THRESHOLD,
  remainingFor,
  resolveDropStatus,
  totalStock,
} from "./status";
