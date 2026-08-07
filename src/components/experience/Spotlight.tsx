"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

type SpotlightProps = {
  /** How far the light drifts from centre, as a fraction of the viewport. */
  reach?: number;
  className?: string;
  /**
   * Skip the reduced-motion / coarse-pointer opt-outs below and always
   * track the pointer.
   *
   * Default off — a decorative light is exactly the kind of motion those
   * opt-outs exist for. The hero film sets this: there the light is part of
   * the product presentation itself (see `OutfitFilm`), not an add-on, and a
   * touchscreen still generates `pointermove` while a finger is actually
   * dragging across it — see the `coarse` branch below for what's lost
   * without a finger there to move.
   */
  alwaysAnimate?: boolean;
};

/** Heavier than the cursor's follow on purpose — light has inertia. */
const LERP = 0.045;

/**
 * The key light.
 *
 * A single soft source behind the figure, which drifts fractionally as the
 * pointer moves. Not a "glow effect": a garment photographed on a cyclorama is
 * lit from somewhere, and letting that somewhere respond to the viewer makes
 * the void read as a room with depth rather than a flat black fill.
 *
 * The restraint is the point. `reach` defaults to 4% of the viewport, so the
 * movement is barely perceptible — you feel the room shift without being able
 * to name what moved. Anything larger reads as a gimmick immediately.
 *
 * **Performance.** The gradient is painted once into its own layer and then
 * only ever translated, so no frame repaints it. Position lives in refs and is
 * written straight to `transform` inside one rAF loop — React never re-renders
 * while the pointer moves.
 *
 * The lerp is deliberately slower than the cursor's (0.045 against 0.18): the
 * light lags well behind the hand, which is what makes it feel like a heavy
 * fixture rather than something stuck to the mouse.
 */
export function Spotlight({ reach = 0.04, className, alwaysAnimate = false }: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (!alwaysAnimate) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
      const coarse = window.matchMedia("(pointer: coarse)");
      // With no pointer to follow, or motion suppressed, the light simply
      // sits where it was composed. Static is a valid lighting state.
      if (reduced.matches || coarse.matches) return;
    }

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    const onPointerMove = (event: PointerEvent) => {
      target.x = (event.clientX / window.innerWidth - 0.5) * window.innerWidth * reach;
      target.y = (event.clientY / window.innerHeight - 0.5) * window.innerHeight * reach;
    };

    let frame = 0;
    const tick = () => {
      current.x += (target.x - current.x) * LERP;
      current.y += (target.y - current.y) * LERP;
      element.style.transform = `translate3d(${current.x.toFixed(2)}px, ${current.y.toFixed(2)}px, 0)`;
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [reach, alwaysAnimate]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("pointer-events-none absolute will-change-transform", className)}
      style={{
        background:
          "radial-gradient(closest-side, rgba(196,194,188,0.16), rgba(148,146,142,0.05) 45%, transparent 72%)",
      }}
    />
  );
}
