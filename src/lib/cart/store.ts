"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine, Money, Product, Variant } from "@/lib/commerce";
import { addMoney, multiplyMoney, ZERO } from "@/lib/commerce";

interface CartState {
  lines: CartLine[];
  /** False until persisted state has been read back. See the note below. */
  hydrated: boolean;

  addLine(product: Product, variant: Variant, quantity?: number): void;
  setQuantity(variantId: string, quantity: number): void;
  removeLine(variantId: string): void;
  clear(): void;
  setHydrated(): void;
}

const STORAGE_KEY = "millionaire-bag";

/**
 * The bag.
 *
 * **Hydration:** persistence is deliberately deferred with `skipHydration`.
 * Left to itself, zustand reads localStorage while the store is being created,
 * so the very first client render already knows about three items while the
 * server-rendered HTML says the bag is empty — React reports a mismatch and,
 * worse, refuses to patch it. Deferring means the first client render matches
 * the server exactly, and the real contents arrive one render later via
 * `CartHydrator`.
 *
 * **Derived values are not stored.** Subtotal and count are computed by the
 * selectors below rather than kept as fields, because a stored total is a
 * second source of truth that goes wrong the first time a code path forgets to
 * update it.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      hydrated: false,

      addLine(product, variant, quantity = 1) {
        set((state) => {
          const existing = state.lines.find((line) => line.variantId === variant.id);

          // Never let the bag exceed what exists. The stepper caps too, but the
          // store is the last line of defence and the only one that cannot be
          // bypassed by a stale component.
          const alreadyHeld = existing?.quantity ?? 0;
          const room = variant.quantity - alreadyHeld;
          const toAdd = Math.min(quantity, room);
          if (toAdd <= 0) return state;

          if (existing) {
            return {
              lines: state.lines.map((line) =>
                line.variantId === variant.id
                  ? { ...line, quantity: line.quantity + toAdd }
                  : line,
              ),
            };
          }

          const line: CartLine = {
            variantId: variant.id,
            productId: product.id,
            productSlug: product.slug,
            title: product.title,
            size: variant.size,
            unitPrice: variant.price ?? product.price,
            quantity: toAdd,
          };

          return { lines: [...state.lines, line] };
        });
      },

      setQuantity(variantId, quantity) {
        set((state) => {
          if (quantity <= 0) {
            return { lines: state.lines.filter((line) => line.variantId !== variantId) };
          }
          return {
            lines: state.lines.map((line) =>
              line.variantId === variantId ? { ...line, quantity } : line,
            ),
          };
        });
      },

      removeLine(variantId) {
        set((state) => ({
          lines: state.lines.filter((line) => line.variantId !== variantId),
        }));
      },

      clear() {
        set({ lines: [] });
      },

      setHydrated() {
        set({ hydrated: true });
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      skipHydration: true,
      // `hydrated` is runtime state about the store itself, not bag contents —
      // persisting it would restore a stale `true` before rehydration ran.
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);

/* -------------------------------------------------------------------------
   Selectors

   Subscribing to a whole store re-renders every consumer on any change — the
   header badge would re-render when a quantity stepper moves. These select the
   narrowest slice each consumer actually needs.
   ------------------------------------------------------------------------- */

export const selectLines = (state: CartState): CartLine[] => state.lines;

export const selectCount = (state: CartState): number =>
  state.lines.reduce((total, line) => total + line.quantity, 0);

export const selectSubtotal = (state: CartState): Money =>
  state.lines.reduce(
    (total, line) => addMoney(total, multiplyMoney(line.unitPrice, line.quantity)),
    ZERO,
  );

/** How many of a variant are already in the bag — used to cap steppers. */
export const selectQuantityOf =
  (variantId: string) =>
  (state: CartState): number =>
    state.lines.find((line) => line.variantId === variantId)?.quantity ?? 0;
