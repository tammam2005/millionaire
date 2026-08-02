"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useMotionPreference } from "@/lib/motion/useMotionPreference";
import { registerLenis, scrollToTop } from "@/lib/scroll/lenis";

/**
 * Smooth scrolling, calibrated heavy.
 *
 * Luxury reads as weight, so the interpolation is slower than Lenis' default
 * (0.075 against 0.1) — the page keeps moving fractionally after the wheel
 * stops, the way a heavy door keeps swinging.
 *
 * Two deliberate restrictions:
 *
 * - **Touch is left native.** Synthesising momentum on a touchscreen fights
 *   the platform's own physics and always feels a frame behind. Phones get
 *   the OS scroller, which is better than anything we would write.
 * - **Disabled entirely under reduced motion.** Smooth scrolling is motion,
 *   and for people with vestibular sensitivity it is one of the worst kinds.
 */
export function SmoothScroll() {
  const motionAllowed = useMotionPreference();
  const pathname = usePathname();

  useEffect(() => {
    if (!motionAllowed) return;

    const lenis = new Lenis({
      lerp: 0.075,
      wheelMultiplier: 1,
      syncTouch: false,
      autoRaf: false,
    });

    registerLenis(lenis);

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      registerLenis(null);
      lenis.destroy();
    };
  }, [motionAllowed]);

  /**
   * Restore scroll position on navigation.
   *
   * Next resets native scroll on route change, but Lenis holds its own
   * position and would immediately scroll the new page back to wherever the
   * previous one was. Jumping to the top immediately (rather than animating)
   * is correct here — a new page should begin at its beginning, and animating
   * there would show the user a page they did not ask to see.
   */
  useEffect(() => {
    scrollToTop({ immediate: true });
  }, [pathname]);

  return null;
}
