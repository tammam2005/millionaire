"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { EASE_SIGNATURE } from "@/lib/motion/tokens";

/**
 * Route-change transition.
 *
 * **Enter only, deliberately.** The App Router unmounts the outgoing route
 * before an exit animation can play, so the usual `AnimatePresence` approach
 * needs a "frozen router" workaround that caches the previous tree and renders
 * it from stale context. That trick breaks in ways that are hard to see and
 * harder to debug — stale params, double-fetched data, scroll restoration
 * fighting itself — for the sake of a few hundred milliseconds.
 *
 * A composed arrival with no departure still reads as intentional; a
 * transition that occasionally shows the wrong page does not. When Next's
 * View Transitions support leaves experimental this becomes the right place to
 * adopt it, and the change is contained entirely within this file.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_SIGNATURE }}
      className="flex flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}
