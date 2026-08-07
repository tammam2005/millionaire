"use client";

/**
 * Temporary hero layer debug flags.
 *
 * Built to answer one question: which background layer behind the hero
 * garment renders differently on iPhone Safari than on desktop. Entirely
 * URL-driven rather than a Next.js router hook (`useSearchParams`) so it
 * never touches static rendering/Suspense on the pages that use it — reading
 * `window.location.search` directly is a pure runtime effect, invisible to
 * the build. Inert by construction: every default here matches current
 * production behaviour exactly, and nothing reads these flags unless
 * `?debugHero=1` is present, so a normal visit is completely unaffected.
 *
 * Cross-tree reactivity (the panel lives in the root layout; the layers it
 * controls live in `Grain` — a sibling in that same layout — and in
 * `OutfitFilm`, nested inside the page) is a plain `window` event rather than
 * React context, since the whole point is to stay small enough to delete in
 * one pass once the culprit layer is found.
 *
 * Delete this file, its `HeroDebugPanel`, and the flag reads in `Grain` and
 * `OutfitFilm` together once diagnosis is done — none of the three has any
 * other reason to exist.
 */

export type HeroDebugFlags = {
  spotlight: boolean;
  grain: boolean;
  scrim: boolean;
  keyFilter: boolean;
  voidBlack: boolean;
  /** The video's CSS `mask`/`-webkit-mask-composite` edge falloff. */
  mask: boolean;
  /** `translateZ(0)` + `will-change: transform` + `backface-visibility: hidden` on the video. */
  gpuHints: boolean;
  /** The per-rAF-tick `video.style.transform` rewrite (sub-frame glide). */
  subframeGlide: boolean;
  /** The pointer-driven micro-parallax term added into the figure's transform. */
  cameraDrift: boolean;
  /** `position: sticky` on the stage container (false → `relative`). */
  sticky: boolean;
  /** `overflow: hidden` on the stage container (false → `visible`). */
  overflowHidden: boolean;
  /** `backdrop-filter: blur()` on the purchase panel. */
  backdropBlur: boolean;
};

const DEFAULTS: HeroDebugFlags = {
  spotlight: true,
  grain: true,
  scrim: true,
  keyFilter: true,
  voidBlack: false,
  mask: true,
  gpuHints: true,
  subframeGlide: true,
  cameraDrift: true,
  sticky: true,
  overflowHidden: true,
  backdropBlur: true,
};

/** Flags-object key -> URL query param name. */
const PARAM_NAMES: Record<keyof HeroDebugFlags, string> = {
  spotlight: "spotlight",
  grain: "grain",
  scrim: "scrim",
  keyFilter: "keyfilter",
  voidBlack: "voidblack",
  mask: "mask",
  gpuHints: "gpuhints",
  subframeGlide: "glide",
  cameraDrift: "camera",
  sticky: "sticky",
  overflowHidden: "overflow",
  backdropBlur: "backdrop",
};

const EVENT = "herodebug:change";

export function isHeroDebugActive(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("debugHero") === "1";
}

export function readHeroDebugFlags(): HeroDebugFlags {
  if (!isHeroDebugActive()) return DEFAULTS;
  const params = new URLSearchParams(window.location.search);
  const flags = { ...DEFAULTS };
  for (const key of Object.keys(PARAM_NAMES) as (keyof HeroDebugFlags)[]) {
    const raw = params.get(PARAM_NAMES[key]);
    if (raw !== null) flags[key] = raw !== "0";
  }
  return flags;
}

/** Flips one flag, updates the URL (no reload) and notifies every listener. */
export function writeHeroDebugFlag(key: keyof HeroDebugFlags, value: boolean): void {
  const params = new URLSearchParams(window.location.search);
  params.set("debugHero", "1");
  params.set(PARAM_NAMES[key], value ? "1" : "0");
  window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  window.dispatchEvent(new Event(EVENT));
}

/** Re-run `callback` whenever a flag changes, including browser back/forward. */
export function subscribeHeroDebug(callback: () => void): () => void {
  window.addEventListener(EVENT, callback);
  window.addEventListener("popstate", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("popstate", callback);
  };
}
