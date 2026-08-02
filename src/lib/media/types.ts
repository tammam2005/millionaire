import type { StaticImageData } from "next/image";

/**
 * A single position in a product turnaround.
 *
 * `mirrored` frames reuse another frame's bitmap flipped horizontally. This is
 * how the unshot half of the rotation is covered without inventing pixels —
 * and it costs nothing, because a CSS `scaleX(-1)` needs no extra file, no
 * extra request and no extra decode.
 */
export interface TurnaroundFrame {
  /** Camera position in degrees. 0 is dead front, 180 is dead back. */
  angle: number;
  src: StaticImageData;
  /** Render flipped horizontally to stand in for the opposite camera angle. */
  mirrored: boolean;
}

export interface Turnaround {
  /** Ordered by angle, ascending. The player assumes this. */
  frames: readonly TurnaroundFrame[];
  alt: string;
}

/**
 * Everything the hero needs to compose itself.
 *
 * Isolating this into a descriptor is what makes the hero resolution-agnostic:
 * dropping in a 4K or ultrawide master is an edit to this object, never to the
 * component or its CSS.
 */
export interface HeroAsset {
  src: StaticImageData;
  alt: string;
  /**
   * Focal point as fractions of the image, 0–1. Drives `object-position`, so
   * a re-crop for a different aspect is one value rather than a media query.
   */
  focal: { x: number; y: number };
  /**
   * Never scale beyond the master's real pixel width.
   *
   * Enforced because the current renders are only 1024px square: stretched to
   * fill a 2560px viewport they would go soft, and soft product photography
   * reads as cheap faster than almost anything else.
   */
  maxNaturalWidth: number;
}
