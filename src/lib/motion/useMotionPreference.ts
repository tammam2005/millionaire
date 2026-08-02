"use client";

import { useReducedMotion } from "motion/react";

/**
 * Single source of truth for whether JS-driven motion should run.
 *
 * CSS animation is already neutralised by the token collapse in globals.css.
 * This covers the JS side, and exists as its own hook so that "should this
 * animate?" is asked the same way everywhere rather than being re-derived in
 * each component.
 *
 * Returns `true` when motion is welcome.
 */
export function useMotionPreference(): boolean {
  return !useReducedMotion();
}
