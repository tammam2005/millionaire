"use client";

import { useEffect, useRef } from "react";
import { approach, MAX_STEP } from "@/lib/motion/film";
import { cn } from "@/lib/utils/cn";

type SpotlightProps = {
  /** How far the light drifts from centre, as a fraction of the viewport. */
  reach?: number;
  className?: string;
};

/** Heavier than the cursor's follow on purpose — light has inertia. */
const HALF_LIFE = 0.25;

/**
 * The two fixtures.
 *
 * `key` is the soft source behind the figure. `rim` is narrower and colder — a
 * grazing light that only registers along an edge, which is what separates a
 * shoulder from the void when the garment turns side-on.
 */
const GRADIENTS = {
  key: "radial-gradient(closest-side, rgba(196,194,188,0.16), rgba(148,146,142,0.05) 45%, transparent 72%)",
  rim: "radial-gradient(closest-side, rgba(214,212,206,0.13), rgba(180,178,172,0.04) 38%, transparent 68%)",
} as const;

/**
 * A bare light plate — gradient, no behaviour.
 *
 * Split out so a scene that already runs its own animation loop (the film) can
 * drive the light from the same clock as everything else rather than starting a
 * second one. The gradient recipe lives here once, so the fixtures cannot drift
 * apart between sections.
 *
 * The caller writes `transform` and `opacity` on this element and nothing else:
 * the gradient is painted once into its own layer and thereafter only
 * composited, so no frame ever repaints it.
 */
export function LightPlate({
  variant = "key",
  className,
  ref,
}: {
  variant?: keyof typeof GRADIENTS;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute will-change-[opacity,transform]",
        className,
      )}
      style={{ background: GRADIENTS[variant] }}
    />
  );
}

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
 * **Performance.** Position lives in refs and is written straight to
 * `transform` inside one rAF loop — React never re-renders while the pointer
 * moves.
 *
 * The follow is deliberately slower than the cursor's: the light lags well
 * behind the hand, which is what makes it feel like a heavy fixture rather than
 * something stuck to the mouse. It is a time-based half-life rather than a
 * per-frame fraction, so a 120Hz display gets the same weight as a 60Hz one.
 */
export function Spotlight({ reach = 0.04, className }: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)");
    // With no pointer to follow, or motion suppressed, the light simply sits
    // where it was composed. Static is a valid lighting state.
    if (reduced.matches || coarse.matches) return;

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    const onPointerMove = (event: PointerEvent) => {
      target.x = (event.clientX / window.innerWidth - 0.5) * window.innerWidth * reach;
      target.y = (event.clientY / window.innerHeight - 0.5) * window.innerHeight * reach;
    };

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, MAX_STEP);
      last = now;
      current.x = approach(current.x, target.x, HALF_LIFE, dt);
      current.y = approach(current.y, target.y, HALF_LIFE, dt);
      element.style.transform = `translate3d(${current.x.toFixed(2)}px, ${current.y.toFixed(2)}px, 0)`;
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [reach]);

  return <LightPlate ref={ref} className={className} />;
}
