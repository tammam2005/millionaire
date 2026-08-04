"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect } from "react";
import { Signature } from "@/components/brand/Signature";
import { Overline } from "@/components/ui/Overline";
import { EASE_SIGNATURE, STAGGER_STEP } from "@/lib/motion/tokens";
import { PRIMARY_NAV, SECONDARY_NAV } from "@/lib/navigation";
import { lockScroll, unlockScroll } from "@/lib/scroll/lenis";

type NavOverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * The full-screen navigation.
 *
 * Built on Radix Dialog rather than a bare fixed div, which buys the things
 * hand-rolled overlays almost always get wrong: focus is trapped inside while
 * open and returned to the trigger on close, Escape closes, the rest of the
 * page is hidden from assistive technology, and the body is locked.
 *
 * Radix's body lock is not sufficient on its own here — Lenis animates its own
 * scroll position and would keep drifting the page behind the overlay — so
 * Lenis is stopped and restarted alongside it.
 */
export function NavOverlay({ open, onOpenChange }: NavOverlayProps) {
  useEffect(() => {
    if (open) lockScroll();
    else unlockScroll();
    return unlockScroll;
  }, [open]);

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
                className="fixed inset-0 z-50 bg-void/95 backdrop-blur-xl"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE_SIGNATURE }}
                className="fixed inset-0 z-50 flex flex-col overflow-y-auto px-(--spacing-gutter) py-28"
              >
                <Dialog.Title className="sr-only">Navigation</Dialog.Title>
                <Dialog.Description className="sr-only">
                  Browse collections, drops and the lookbook.
                </Dialog.Description>

                <nav className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center">
                  <ul>
                    {PRIMARY_NAV.map((link, index) => (
                      <li key={link.href} className="overflow-hidden">
                        <motion.div
                          initial={{ y: "110%" }}
                          animate={{ y: "0%" }}
                          exit={{ y: "110%" }}
                          transition={{
                            duration: 0.7,
                            ease: EASE_SIGNATURE,
                            delay: index * STAGGER_STEP,
                          }}
                        >
                          <Link
                            href={link.href}
                            onClick={() => onOpenChange(false)}
                            data-cursor-magnetic
                            className="group flex items-baseline gap-6 py-2"
                          >
                            <span className="font-display-tracked text-(length:--text-display-lg) text-bone transition-colors duration-(--duration-micro) ease-(--ease-signature) group-hover:text-silver">
                              {link.label}
                            </span>
                            {link.meta ? (
                              <span className="hidden text-overline text-ash sm:block">
                                {link.meta}
                              </span>
                            ) : null}
                          </Link>
                        </motion.div>
                      </li>
                    ))}
                  </ul>
                </nav>

                <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <Overline className="mb-4">More</Overline>
                    <ul className="flex gap-6">
                      {SECONDARY_NAV.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            onClick={() => onOpenChange(false)}
                            className="text-(length:--text-caption) text-stone transition-colors duration-(--duration-micro) hover:text-bone"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Signature className="text-[1.75em] sm:text-[2.25em]" />
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
