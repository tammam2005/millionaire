"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Monogram } from "@/components/brand/Monogram";
import { Wordmark } from "@/components/brand/Wordmark";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { NavOverlay } from "@/components/layout/NavOverlay";
import { selectCount, useCartStore } from "@/lib/cart/store";
import { cn } from "@/lib/utils/cn";

/** Distance before the header commits to its condensed state. */
const CONDENSE_AT = 24;

export function Header() {
  const [condensed, setCondensed] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  // Safe to read directly: the store starts empty and is rehydrated in an
  // effect, so this render matches the server-rendered HTML exactly.
  const count = useCartStore(selectCount);

  useEffect(() => {
    // Listening to native scroll rather than to Lenis: Lenis dispatches real
    // scroll events as it animates, so this works identically whether Lenis is
    // running or the device is on native scrolling.
    const onScroll = () => setCondensed(window.scrollY > CONDENSE_AT);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40",
          "transition-[background-color,backdrop-filter,border-color,padding] duration-(--duration-micro) ease-(--ease-signature)",
          "px-(--spacing-gutter)",
          condensed
            ? "border-b border-graphite bg-void/80 py-4 backdrop-blur-xl"
            : "border-b border-transparent py-7",
        )}
      >
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-6">
          <Link
            href="/"
            data-cursor-magnetic
            className="flex items-center gap-3"
            aria-label="MILLIONAIRE — home"
          >
            <Monogram size={condensed ? 20 : 26} className="transition-all" />
            {/*
              The preloader measures this element and flies its own oversized
              wordmark onto it, so the identifier has to stay stable. `opacity`
              rather than conditional rendering: the box must exist and be
              measurable before the flight begins.
            */}
            <span
              data-wordmark-target
              className="transition-opacity duration-(--duration-micro)"
            >
              <Wordmark size="small" className="text-bone" />
            </span>
          </Link>

          <nav className="flex items-center gap-7" aria-label="Primary">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              data-cursor-magnetic
              className="text-overline text-stone transition-colors duration-(--duration-micro) hover:text-bone"
            >
              Menu
            </button>

            <button
              type="button"
              onClick={() => setBagOpen(true)}
              data-cursor-magnetic
              aria-label={`Open bag, ${count} ${count === 1 ? "item" : "items"}`}
              className="text-overline text-stone transition-colors duration-(--duration-micro) hover:text-bone"
            >
              Bag{" "}
              <span
                aria-hidden="true"
                className={cn(
                  "tabular-nums transition-colors duration-(--duration-micro)",
                  count > 0 ? "text-silver" : "text-ash",
                )}
              >
                ({count})
              </span>
            </button>
          </nav>
        </div>
      </header>

      <NavOverlay open={navOpen} onOpenChange={setNavOpen} />
      <CartDrawer open={bagOpen} onOpenChange={setBagOpen} />
    </>
  );
}
