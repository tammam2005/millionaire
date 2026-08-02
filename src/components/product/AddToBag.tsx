"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Overline } from "@/components/ui/Overline";
import { useCartStore } from "@/lib/cart/store";
import type { Product, Variant } from "@/lib/commerce";
import { isVariantAvailable, remainingFor } from "@/lib/commerce";
import { cn } from "@/lib/utils/cn";

type AddToBagProps = {
  product: Product;
};

/**
 * Size selection and add-to-bag.
 *
 * Sold-out sizes stay visible and disabled rather than being removed. A size
 * run with gaps in it tells the customer something real — that their size sold
 * out — where a shortened list just looks like it was never made.
 *
 * Quantity is capped against what remains *after* accounting for what is
 * already in the bag, so a piece with two left cannot be added twice from two
 * visits to this page.
 */
export function AddToBag({ product }: AddToBagProps) {
  const firstAvailable = product.variants.find(isVariantAvailable);
  const [selectedId, setSelectedId] = useState<string | null>(firstAvailable?.id ?? null);

  const addLine = useCartStore((state) => state.addLine);
  const lines = useCartStore((state) => state.lines);

  const selected: Variant | undefined = product.variants.find(
    (variant) => variant.id === selectedId,
  );
  const inBag = lines.find((line) => line.variantId === selectedId)?.quantity ?? 0;
  const remaining = selected ? remainingFor(selected, inBag) : 0;
  const canAdd = selected !== undefined && remaining > 0;

  const singleSize = product.variants.length === 1;

  return (
    <div>
      {!singleSize ? (
        <fieldset>
          <legend className="sr-only">Select a size</legend>
          <Overline className="mb-4">Size</Overline>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => {
              const available = isVariantAvailable(variant);
              const isSelected = variant.id === selectedId;

              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={!available}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedId(variant.id)}
                  data-cursor-magnetic
                  className={cn(
                    "min-w-14 border px-4 py-3 text-overline transition-colors duration-(--duration-micro)",
                    available
                      ? isSelected
                        ? "border-bone text-bone"
                        : "border-graphite text-stone hover:border-ash hover:text-bone"
                      : // Struck through, not hidden: the size existed.
                        "cursor-not-allowed border-graphite text-ash line-through",
                  )}
                >
                  {variant.size}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <div className="mt-8">
        <Button
          variant="solid"
          disabled={!canAdd}
          data-cursor="add"
          onClick={() => {
            if (selected) addLine(product, selected);
          }}
          className="w-full sm:w-auto"
        >
          {canAdd ? "Add to bag" : selected ? "Sold out" : "Select a size"}
        </Button>

        {canAdd && remaining <= 3 ? (
          <p className="mt-4 text-[0.6875rem] tracking-[0.16em] text-silver uppercase">
            {remaining} remaining
          </p>
        ) : null}
      </div>
    </div>
  );
}
