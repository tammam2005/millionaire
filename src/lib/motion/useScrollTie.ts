"use client";

import { useScroll } from "motion/react";
import { useEffect, useRef, type RefObject } from "react";
import { damper, MAX_STEP, smoothDamp } from "@/lib/motion/film";

/** The `offset` tuple `useScroll` accepts, without restating its vocabulary. */
type ScrollOffset = NonNullable<Parameters<typeof useScroll>[0]>["offset"];

/**
 * Tie a section's appearance to the scroll position rather than to a trigger.
 *
 * A `whileInView` reveal is a threshold and a stopwatch: the element crosses a
 * line, a timed animation plays, and from then on the block is running on its
 * own clock while the page runs on another. Two clocks is exactly what a
 * "section" is, and it is what the eye reads as a seam between one part of a
 * page and the next.
 *
 * Tying the reveal to scroll instead means the whole document moves as one
 * piece: scroll halfway into the block and it is halfway arrived, scroll back
 * and it retreats. The same damped follower the film uses smooths it, so the
 * weight matches — the page below the film is the same camera, not a different
 * one.
 *
 * The loop runs only while the section is anywhere near the viewport. A rAF
 * that never stops is the classic way a scroll effect quietly costs a phone its
 * battery for a block nobody has reached yet.
 */
export function useScrollTie(
  target: RefObject<HTMLElement | null>,
  offset: ScrollOffset,
  write: (progress: number) => void,
  options: { settle?: number; enabled?: boolean } = {},
) {
  const { settle = 0.28, enabled = true } = options;

  // The caller's writer is almost always a fresh closure each render; holding
  // it in a ref keeps the effect from tearing down the loop every time.
  const writeRef = useRef(write);
  useEffect(() => {
    writeRef.current = write;
  });

  const { scrollYProgress } = useScroll({ target, offset });

  useEffect(() => {
    const element = target.current;
    if (!element) return;

    if (!enabled) {
      // Reduced motion: the section is simply present, fully arrived.
      writeRef.current(1);
      return;
    }

    let raf = 0;
    let running = false;
    let progress = scrollYProgress.get();
    const state = damper();
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, MAX_STEP);
      last = now;
      progress = smoothDamp(progress, scrollYProgress.get(), state, settle, dt);
      writeRef.current(progress);
      raf = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        const near = entry?.isIntersecting ?? false;
        if (near === running) return;
        running = near;
        if (near) {
          last = performance.now();
          raf = requestAnimationFrame(tick);
        } else {
          cancelAnimationFrame(raf);
          // Settle on the exact end state, so a section scrolled past quickly
          // is never left frozen part-way through its arrival.
          progress = scrollYProgress.get() > 0.5 ? 1 : 0;
          state.velocity = 0;
          writeRef.current(progress);
        }
      },
      { rootMargin: "40% 0px 40% 0px" },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, scrollYProgress, settle, enabled]);
}
