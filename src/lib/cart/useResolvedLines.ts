"use client";

import { useEffect, useState } from "react";
import { selectLines, useCartStore } from "@/lib/cart/store";
import { commerce } from "@/lib/commerce";
import type { Product, ResolvedCartLine } from "@/lib/commerce";

/**
 * Cart lines with their imagery resolved against the current catalogue.
 *
 * Lines persist without images on purpose (build-hashed URLs go stale), so
 * something has to put the pictures back. Doing it here keeps the drawer a
 * presentational component.
 *
 * A line whose product no longer exists is kept and flagged rather than
 * dropped. Silently removing something a customer chose is the worse failure:
 * they should be told it was withdrawn, not left wondering what happened to it.
 */
export function useResolvedLines(): readonly ResolvedCartLine[] {
  const lines = useCartStore(selectLines);
  const [products, setProducts] = useState<readonly Product[]>([]);

  const ids = lines.map((line) => line.productId).join(",");

  useEffect(() => {
    // Nothing to resolve. Leaving `products` stale is safe and cheaper than
    // clearing it: with no lines to map over, its contents are unobservable,
    // and it is still there if the same piece is added back.
    if (!ids) return;

    let active = true;
    void commerce.getProductsByIds(ids.split(",")).then((result) => {
      // The bag can change while this is in flight; a stale response must not
      // overwrite a newer one.
      if (active) setProducts(result);
    });

    return () => {
      active = false;
    };
  }, [ids]);

  return lines.map((line) => {
    const product = products.find((candidate) => candidate.id === line.productId);
    return {
      ...line,
      image: product?.media.cutout ?? product?.media.primary ?? null,
      stillAvailable: product !== undefined,
    };
  });
}
