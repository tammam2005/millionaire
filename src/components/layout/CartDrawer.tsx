"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { buttonClass } from "@/components/ui/Button";
import { Overline } from "@/components/ui/Overline";
import { selectSubtotal, useCartStore } from "@/lib/cart/store";
import { useResolvedLines } from "@/lib/cart/useResolvedLines";
import { formatMoney, multiplyMoney } from "@/lib/commerce";
import { EASE_SIGNATURE } from "@/lib/motion/tokens";
import { lockScroll, unlockScroll } from "@/lib/scroll/lenis";
import { buildOrderUrl } from "@/lib/whatsapp";

type CartDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const lines = useResolvedLines();
  // `selectSubtotal` builds a new Money object on every call (it reduces over
  // the lines), so a plain selector defeats useSyncExternalStore's identity
  // check and spins into "Maximum update depth exceeded" the moment the bag
  // holds anything — an empty bag never hit this because reduce over an empty
  // array short-circuits to the same ZERO constant every time. useShallow
  // compares the object's own fields instead of its reference.
  const subtotal = useCartStore(useShallow(selectSubtotal));
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeLine = useCartStore((state) => state.removeLine);

  useEffect(() => {
    if (open) lockScroll();
    else unlockScroll();
    return unlockScroll;
  }, [open]);

  const isEmpty = lines.length === 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE_SIGNATURE }}
                className="fixed inset-0 z-50 bg-void/70 backdrop-blur-sm"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild forceMount>
              <motion.aside
                initial={{ x: "100%" }}
                animate={{ x: "0%" }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.6, ease: EASE_SIGNATURE }}
                className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-graphite bg-ink"
              >
                <header className="flex items-center justify-between border-b border-graphite px-8 py-7">
                  <Dialog.Title className="text-overline text-bone">
                    Your bag
                  </Dialog.Title>
                  <Dialog.Close
                    data-cursor-magnetic
                    className="text-overline text-stone transition-colors duration-(--duration-micro) hover:text-bone"
                  >
                    Close
                  </Dialog.Close>
                </header>

                <Dialog.Description className="sr-only">
                  Items you have added to your bag.
                </Dialog.Description>

                {isEmpty ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
                    <Overline tone="silver">Empty</Overline>
                    <p className="max-w-xs text-(length:--text-body) text-stone">
                      Nothing here yet. The core line is always available; drops are not.
                    </p>
                  </div>
                ) : (
                  <ul className="flex-1 divide-y divide-graphite overflow-y-auto px-8">
                    {lines.map((line) => (
                      <li key={line.variantId} className="flex gap-5 py-7">
                        <div className="bg-studio-void shrink-0">
                          {line.image ? (
                            <Image
                              src={line.image}
                              alt=""
                              width={88}
                              height={88}
                              className="h-22 w-22 object-cover drop-shadow-[0_0_2px_rgba(255,255,255,0.06)]"
                            />
                          ) : (
                            <div className="h-22 w-22" />
                          )}
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <Link
                            href={`/products/${line.productSlug}`}
                            onClick={() => onOpenChange(false)}
                            className="truncate text-(length:--text-caption) text-bone transition-colors hover:text-silver"
                          >
                            {line.title}
                          </Link>
                          <p className="mt-1 text-[0.6875rem] tracking-[0.16em] text-ash uppercase">
                            {line.size}
                          </p>

                          {!line.stillAvailable ? (
                            <p className="mt-2 text-[0.6875rem] text-silver">
                              No longer available
                            </p>
                          ) : null}

                          <div className="mt-auto flex items-center justify-between gap-4 pt-4">
                            <div className="flex items-center border border-graphite">
                              <button
                                type="button"
                                aria-label={`Decrease quantity of ${line.title}, size ${line.size}`}
                                onClick={() =>
                                  setQuantity(line.variantId, line.quantity - 1)
                                }
                                className="px-3 py-1 text-(length:--text-caption) text-stone transition-colors hover:text-bone"
                              >
                                −
                              </button>
                              <span className="min-w-6 text-center text-(length:--text-caption) text-bone tabular-nums">
                                {line.quantity}
                              </span>
                              <button
                                type="button"
                                aria-label={`Increase quantity of ${line.title}, size ${line.size}`}
                                onClick={() =>
                                  setQuantity(line.variantId, line.quantity + 1)
                                }
                                className="px-3 py-1 text-(length:--text-caption) text-stone transition-colors hover:text-bone"
                              >
                                +
                              </button>
                            </div>

                            <span className="text-(length:--text-caption) text-bone tabular-nums">
                              {formatMoney(multiplyMoney(line.unitPrice, line.quantity))}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeLine(line.variantId)}
                          aria-label={`Remove ${line.title}, size ${line.size}, from your bag`}
                          className="self-start text-[0.6875rem] text-ash transition-colors hover:text-bone"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <footer className="border-t border-graphite px-8 py-7">
                  <div className="mb-5 flex items-center justify-between">
                    <Overline>Subtotal</Overline>
                    <span className="text-(length:--text-body) text-bone tabular-nums">
                      {formatMoney(subtotal)}
                    </span>
                  </div>
                  {isEmpty ? (
                    <button
                      type="button"
                      disabled
                      className={buttonClass("solid", "w-full")}
                    >
                      Order via WhatsApp
                    </button>
                  ) : (
                    <a
                      href={buildOrderUrl(lines, subtotal)}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cursor-magnetic
                      className={buttonClass("solid", "w-full")}
                    >
                      Order via WhatsApp
                    </a>
                  )}
                  <p className="mt-4 text-center text-[0.6875rem] text-ash">
                    Opens WhatsApp with your order filled in — confirm it there.
                  </p>
                </footer>
              </motion.aside>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
