"use client";

import { usePathname } from "next/navigation";
import { CartHydrator } from "@/components/experience/CartHydrator";
import { Cursor } from "@/components/experience/Cursor";
import { Grain } from "@/components/experience/Grain";
import { HeroDebugPanel } from "@/components/experience/HeroDebugPanel";
import { Preloader } from "@/components/experience/Preloader";
import { SmoothScroll } from "@/components/experience/SmoothScroll";

/**
 * Everything mounted globally in the root layout, gathered in one place so
 * there is exactly one spot that knows about the single deliberate
 * exception: `/lab/*`.
 *
 * `/lab/video-test` is an isolation test — same video, same scroll-scrub
 * pump, and nothing else, built specifically to answer whether a rendering
 * defect belongs to the video itself or to something layered over it. That
 * question is meaningless if the page still carries Grain's blend mode,
 * Cursor's blend mode, the preloader overlay, or Lenis's scroll rewrite —
 * so those five are the one thing this file exists to skip, and only there.
 * Every other route is untouched: same five components, same order, same
 * conditions each already had internally (coarse pointers, reduced motion,
 * an already-seen intro) — this adds a route check in front of them, not a
 * change to what any of them do.
 */
export function GlobalChrome() {
  const pathname = usePathname();
  if (pathname?.startsWith("/lab/")) return null;

  return (
    <>
      <SmoothScroll />
      <Cursor />
      <Grain />
      <Preloader />
      <CartHydrator />
      {/* Temporary — see heroDebugFlags.ts. Renders nothing without
          ?debugHero=1 in the URL. */}
      <HeroDebugPanel />
    </>
  );
}
