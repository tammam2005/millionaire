"use client";

import { useAnimate } from "motion/react";
import { useEffect, useRef } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { EASE_SIGNATURE } from "@/lib/motion/tokens";

/**
 * Timing budget. These add up to the 2.2s ceiling deliberately:
 * readiness is abandoned at 1.3s, and the flight takes 0.9s, so the very worst
 * case a visitor can experience is 2.2s — never longer, whatever the network
 * is doing.
 */
const LETTERS_IN = 0.9;
const MIN_HOLD_MS = 1100;
const READY_CEILING_MS = 1300;
const FLIGHT = 0.9;

/**
 * Absolute dismissal, whatever happens.
 *
 * The sequence below `await`s animation promises, and those only settle when
 * the browser produces frames. A backgrounded tab, a throttled renderer or a
 * low-power mode can stop delivering them — and because the hero waits for
 * this overlay to lift before it animates in, a stalled intro does not degrade
 * the page, it leaves a permanently black screen.
 *
 * So the ceiling is enforced by a timer that owes nothing to rAF. Slightly
 * beyond the readiness ceiling plus the flight, so it never truncates a
 * sequence that is running normally — it only ever rescues one that is not.
 */
const HARD_CEILING_MS = 2600;

export const PRELOADER_SESSION_KEY = "mn-preloaded";

/**
 * The cinematic preloader.
 *
 * Three things make this defensible rather than decorative:
 *
 * 1. **It gates on real work, not a timer.** It resolves when `document.fonts`
 *    is ready — the Didone wordmark arriving mid-animation is exactly the kind
 *    of flash the preloader exists to hide. A ceiling dismisses it regardless,
 *    so a slow connection can never trap anyone behind it.
 *
 * 2. **It does not cost LCP.** The overlay sits above content that has already
 *    streamed and painted; it never gates rendering. Chrome measures LCP on
 *    paint, not on visibility through an overlay, so the hero behind still
 *    registers at its true time.
 *
 * 3. **It hands off rather than cutting.** The oversized wordmark is measured
 *    against the real header wordmark and flown onto it — same element, one
 *    continuous move. The header mark is revealed only once the flight lands.
 *
 * Shown once per session. Under reduced motion it degrades to a short fade
 * with no letter animation and no flight.
 *
 * Note there is no React state here. Whether the overlay is shown is already
 * expressed by `data-preloader` on the document plus one CSS rule — the inline
 * head script writes it before first paint, and this component writes it when
 * the flight lands. Mirroring that into component state would be a second
 * source of truth for the same fact, and would force a re-render to say
 * something the DOM had already said.
 */
export function Preloader() {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;

    // Returning visitors: the head script already marked the document, so CSS
    // hid the overlay before it was ever painted. Nothing to animate.
    if (root.dataset.preloader === "done") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;
    let settled = false;

    const finish = () => {
      if (cancelled || settled) return;
      settled = true;
      window.clearTimeout(rescue);
      try {
        sessionStorage.setItem(PRELOADER_SESSION_KEY, "1");
      } catch {
        // Private browsing can refuse storage. Showing the preloader again is
        // a far better failure than not rendering the page.
      }
      // This alone dismisses the overlay — the CSS rule keyed off it does the
      // rest, with no re-render.
      root.dataset.preloader = "done";
    };

    // Armed before anything else runs, so a stall at any point is covered.
    const rescue = window.setTimeout(finish, HARD_CEILING_MS);

    /** Resolves when the page is genuinely ready, or when we give up waiting. */
    const readiness = Promise.race([
      Promise.all([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, MIN_HOLD_MS)),
      ]),
      new Promise((resolve) => setTimeout(resolve, READY_CEILING_MS)),
    ]);

    const run = async () => {
      if (reduced) {
        await readiness;
        if (cancelled) return;
        await animate(scope.current, { opacity: 0 }, { duration: 0.2 });
        finish();
        return;
      }

      const letters = scope.current?.querySelectorAll("[data-wordmark-letter]");
      if (letters?.length) {
        void animate(
          letters,
          { y: ["115%", "0%"], opacity: [0, 1] },
          { duration: LETTERS_IN, ease: EASE_SIGNATURE, delay: stagger(letters.length) },
        );
      }

      if (ruleRef.current) {
        void animate(
          ruleRef.current,
          { scaleX: [0, 1] },
          { duration: READY_CEILING_MS / 1000, ease: "linear" },
        );
      }

      await readiness;
      if (cancelled) return;

      const source = wordmarkRef.current?.getBoundingClientRect();
      const target = document
        .querySelector<HTMLElement>("[data-wordmark-target]")
        ?.getBoundingClientRect();

      // Fade the ground out under the flight so the wordmark appears to travel
      // through the overlay rather than with it.
      void animate(
        scope.current,
        { backgroundColor: "rgba(8, 8, 10, 0)" },
        { duration: FLIGHT * 0.8, ease: EASE_SIGNATURE },
      );
      if (ruleRef.current) {
        void animate(ruleRef.current, { opacity: 0 }, { duration: 0.3 });
      }

      if (source && target && wordmarkRef.current && source.width > 0) {
        // FLIP: match centres, then match widths. Scaling about the centre
        // means aligning centres is all the translation has to achieve.
        const scale = target.width / source.width;
        const dx = target.left + target.width / 2 - (source.left + source.width / 2);
        const dy = target.top + target.height / 2 - (source.top + source.height / 2);

        await animate(
          wordmarkRef.current,
          { x: dx, y: dy, scale },
          { duration: FLIGHT, ease: EASE_SIGNATURE },
        );
      } else {
        // No header to fly to — dissolve instead of jumping.
        await animate(scope.current, { opacity: 0 }, { duration: 0.4 });
      }

      finish();
    };

    void run();

    return () => {
      cancelled = true;
      window.clearTimeout(rescue);
    };
  }, [animate, scope]);

  return (
    <div
      ref={scope}
      data-preloader-overlay
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-100 flex flex-col items-center justify-center gap-8 bg-void"
    >
      <div ref={wordmarkRef} className="will-change-transform">
        <Wordmark size="hero" split />
      </div>
      <div
        ref={ruleRef}
        className="h-px w-40 origin-left bg-silver"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}

/** Per-letter delay, compressed so the whole word lands inside LETTERS_IN. */
function stagger(count: number) {
  return (index: number) => (index / Math.max(count, 1)) * 0.45;
}
