import arcxBack from "@/assets/products/arcx-mfta/back.jpg";
import setBack from "@/assets/products/millionaire-set/back.jpg";
import setFront from "@/assets/products/millionaire-set/front.jpg";
import setSide from "@/assets/products/millionaire-set/side.jpg";
import setThreeQuarter from "@/assets/products/millionaire-set/three-quarter.jpg";
import type { HeroAsset, Turnaround } from "./types";

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
