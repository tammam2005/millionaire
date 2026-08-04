import arcxBack from "@/assets/products/arcx-mfta/back.jpg";
import arcxBackCut from "@/assets/products/arcx-mfta/back-cutout.png";
import setBack from "@/assets/products/millionaire-set/back.jpg";
import setBackCut from "@/assets/products/millionaire-set/back-cutout.png";
import setFront from "@/assets/products/millionaire-set/front.jpg";
import setFrontCut from "@/assets/products/millionaire-set/front-cutout.png";
import setSide from "@/assets/products/millionaire-set/side.jpg";
import setSideCut from "@/assets/products/millionaire-set/side-cutout.png";
import setThreeQuarter from "@/assets/products/millionaire-set/three-quarter.jpg";
import setThreeQuarterCut from "@/assets/products/millionaire-set/three-quarter-cutout.png";
import type { Cutout, HeroAsset, Turnaround } from "./types";

/**
 * Turnaround for the core MILLIONAIRE set.
 *
 * Four camera positions were actually shot: 0, 35, 90 and 180 degrees. The
 * back half of the rotation is covered by mirroring — a view at angle t looks
 * like its reflection at 360 - t, so 90 stands in for 270 and 35 for 325.
 * Front and back sit on the mirror axis and need no reflection.
 *
 * KNOWN ARTEFACT: the M crest sits on one thigh, so mirrored frames place it
 * on the wrong leg. On a black garment at these angles it is very hard to
 * catch, and the section's callouts deliberately draw the eye elsewhere while
 * those frames are on screen. A real 24-36 frame turntable render removes both
 * the artefact and the 90-degree gaps either side of the back view — and
 * requires no code change, only a longer array here.
 */
export const millionaireSetTurnaround: Turnaround = {
  alt: "The MILLIONAIRE hooded set, shown rotating through a full turn",
  frames: [
    { angle: 0, src: setFront, mirrored: false },
    { angle: 35, src: setThreeQuarter, mirrored: false },
    { angle: 90, src: setSide, mirrored: false },
    { angle: 180, src: setBack, mirrored: false },
    { angle: 270, src: setSide, mirrored: true },
    { angle: 325, src: setThreeQuarter, mirrored: true },
  ],
};

/** The ARCX MFTA drop piece. Only one angle exists, so there is no turnaround. */
export const arcxMftaBack = arcxBack;

/**
 * Matted figures, free of the studio backdrop.
 *
 * Produced by `scripts/extract-cutouts.mjs`, which separates the near-black
 * garment from the light cyclorama and — critically — keeps the silver print,
 * by treating only backdrop connected to the frame edge as removable.
 *
 * These are what make layering possible: type can pass behind a shoulder, the
 * figure can take parallax independently of its ground, and the same asset
 * works on void or on studio white.
 */
export const cutouts = {
  front: {
    src: setFrontCut,
    alt: "A figure in the MILLIONAIRE hooded set and balaclava, seen from the front",
    bounds: { top: 0.036, bottom: 0.965, left: 0.284, right: 0.715 },
  },
  threeQuarter: {
    src: setThreeQuarterCut,
    alt: "The MILLIONAIRE hooded set seen at three-quarters",
    bounds: { top: 0.035, bottom: 0.976, left: 0.31, right: 0.67 },
  },
  side: {
    src: setSideCut,
    alt: "The MILLIONAIRE hooded set in profile",
    bounds: { top: 0.038, bottom: 0.973, left: 0.414, right: 0.603 },
  },
  back: {
    src: setBackCut,
    alt: "The MILLIONAIRE hooded set from behind",
    bounds: { top: 0.038, bottom: 0.96, left: 0.302, right: 0.702 },
  },
  arcxBack: {
    src: arcxBackCut,
    alt: "The ARCX MFTA hoodie from behind, script signature across the back",
    bounds: { top: 0.039, bottom: 0.98, left: 0.331, right: 0.689 },
  },
} satisfies Record<string, Cutout>;

/**
 * Turnaround built from the matted figures.
 *
 * Used by the 360° section, where the garment rotates against a void ground —
 * only possible because the backdrop is gone. Same mirroring scheme as the
 * flat turnaround above.
 */
export const millionaireSetTurnaroundCutout: Turnaround = {
  alt: millionaireSetTurnaround.alt,
  frames: [
    { angle: 0, src: setFrontCut, mirrored: false },
    { angle: 35, src: setThreeQuarterCut, mirrored: false },
    { angle: 90, src: setSideCut, mirrored: false },
    { angle: 180, src: setBackCut, mirrored: false },
    { angle: 270, src: setSideCut, mirrored: true },
    { angle: 325, src: setThreeQuarterCut, mirrored: true },
  ],
};

/**
 * Hero master.
 *
 * Currently the 1024px front render, so `maxNaturalWidth` caps it there. When
 * a larger or wider master arrives, raising that number is the entire change.
 */
export const heroAsset: HeroAsset = {
  src: setFront,
  alt: "A figure in the MILLIONAIRE hooded set and balaclava, front view",
  focal: { x: 0.5, y: 0.38 },
  maxNaturalWidth: setFront.width,
};
