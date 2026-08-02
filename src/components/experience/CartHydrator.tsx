"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/cart/store";

/**
 * Reads the persisted bag back after the first render.
 *
 * The store is created with `skipHydration`, so this is what actually restores
 * it. Running in an effect guarantees the first client render matched the
 * server-rendered HTML — an empty bag — before the real contents appear.
 *
 * Renders nothing; it exists purely to own that timing in one place rather
 * than have every consumer guess at it.
 */
export function CartHydrator() {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    useCartStore.getState().setHydrated();
  }, []);

  return null;
}
