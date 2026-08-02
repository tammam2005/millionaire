import type { Transition, Variants } from "motion/react";

/**
 * Motion tokens for JS-driven animation.
 *
 * These mirror the CSS custom properties in globals.css. The CSS tokens
 * neutralise themselves under `prefers-reduced-motion`; JS cannot read that
 * for free, so components animating with `motion` must pair these with
 * `useMotionPreference()` below.
 */

/** The signature curve — slow arrival, no overshoot. Matches --ease-signature. */
export const EASE_SIGNATURE = [0.16, 1, 0.3, 1] as const;
export const EASE_SOFT = [0.65, 0, 0.35, 1] as const;

/** Seconds, to match the `motion` API. Mirrors the CSS duration tokens. */
export const DURATION = {
  micro: 0.4,
  element: 0.7,
  scene: 1.2,
} as const;

export const STAGGER_STEP = 0.06;

export const transition = {
  micro: { duration: DURATION.micro, ease: EASE_SIGNATURE },
  element: { duration: DURATION.element, ease: EASE_SIGNATURE },
  scene: { duration: DURATION.scene, ease: EASE_SIGNATURE },
} satisfies Record<string, Transition>;

/**
 * Text arrives by unmasking, never by fading alone.
 *
 * A line sits inside an `overflow: hidden` parent and slides up into view, so
 * it reads as revealed rather than as switched on. Opacity is included only to
 * soften the leading edge.
 */
export const lineReveal: Variants = {
  hidden: { y: "110%", opacity: 0 },
  visible: { y: "0%", opacity: 1, transition: transition.element },
};

/** Container that releases children one step at a time. */
export const stagger = (step: number = STAGGER_STEP): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: step } },
});

/** A block arriving from below — cards, images, panels. */
export const riseIn: Variants = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: transition.element },
};

/** A hairline rule drawing itself out from its origin. */
export const drawRule: Variants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: transition.scene },
};
