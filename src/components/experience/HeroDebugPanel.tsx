"use client";

import { useEffect, useState } from "react";
import {
  type HeroDebugFlags,
  isHeroDebugActive,
  readHeroDebugFlags,
  subscribeHeroDebug,
  writeHeroDebugFlag,
} from "@/lib/debug/heroDebugFlags";

/**
 * Temporary — see `heroDebugFlags.ts`.
 *
 * Renders nothing unless the URL has `?debugHero=1`, so it is safe to leave
 * mounted globally. Each checkbox flips one layer live, via the URL, so the
 * state survives a reload and is easy to hand to someone else as a link.
 */
const ROWS: { key: keyof HeroDebugFlags; label: string; hint: string }[] = [
  {
    key: "spotlight",
    label: "Spotlight glow",
    hint: 'The radial-gradient light behind the model — the only "glow" element in the code, so this is also the "purple glow" candidate.',
  },
  {
    key: "keyFilter",
    label: "Video key filter",
    hint: "Bypasses the alpha-key filter, showing the raw un-keyed clip (a plain grey box — expected to look wrong). If a colour fringe at the model's edge disappears with this off, the filter is the source.",
  },
  {
    key: "grain",
    label: "Noise / grain",
    hint: "The full-page film-grain texture.",
  },
  {
    key: "scrim",
    label: "Vignette / bottom gradient",
    hint: "The dark gradient at the bottom of the phone-width hero, behind the chapter copy.",
  },
  {
    key: "voidBlack",
    label: "Background texture (void colour)",
    hint: "Swaps the page's near-black background from its token colour (#08080a) to literal pure black.",
  },
  {
    key: "mask",
    label: "Video CSS mask",
    hint: "The edge-falloff mask (mask-composite:intersect + -webkit-mask-composite:source-in — different keyword systems on the same element). Off removes the mask entirely.",
  },
  {
    key: "gpuHints",
    label: "Video GPU hints",
    hint: "translateZ(0) + will-change:transform + backface-visibility:hidden on the video element.",
  },
  {
    key: "subframeGlide",
    label: "Sub-frame glide",
    hint: "The per-frame video.style.transform rewrite used for sub-pixel smoothing between decoded frames. Off leaves the video's transform static after mount.",
  },
  {
    key: "cameraDrift",
    label: "Camera drift",
    hint: "The pointer-driven micro-parallax term added into the figure's transform every tick. Off keeps the core scroll choreography but removes the added drift.",
  },
  {
    key: "sticky",
    label: "Sticky stage",
    hint: "position:sticky on the stage container. Off switches it to position:relative (the stage will scroll normally instead of pinning).",
  },
  {
    key: "overflowHidden",
    label: "Stage overflow:hidden",
    hint: "Off switches the stage container to overflow:visible.",
  },
  {
    key: "backdropBlur",
    label: "Purchase panel backdrop-blur",
    hint: "backdrop-filter:blur() on the purchase panel that arrives at the end of the film — a sibling within the same stage, not the video itself.",
  },
];

export function HeroDebugPanel() {
  const [active, setActive] = useState(false);
  const [flags, setFlags] = useState<HeroDebugFlags | null>(null);

  useEffect(() => {
    const sync = () => {
      setActive(isHeroDebugActive());
      setFlags(readHeroDebugFlags());
    };
    sync();
    return subscribeHeroDebug(sync);
  }, []);

  if (!active || !flags) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        left: 12,
        zIndex: 999999,
        maxWidth: 300,
        maxHeight: "80svh",
        overflowY: "auto",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.25)",
        background: "rgba(0,0,0,0.88)",
        padding: "12px 14px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: 12,
        lineHeight: 1.4,
        color: "#fff",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8, letterSpacing: 0.3 }}>
        HERO LAYER DEBUG
      </div>
      {ROWS.map(({ key, label, hint }) => (
        <label key={key} style={{ display: "block", marginBottom: 10, cursor: "pointer" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={flags[key]}
              onChange={(event) => writeHeroDebugFlag(key, event.target.checked)}
            />
            {label}
          </span>
          <span style={{ display: "block", marginLeft: 20, opacity: 0.65, fontSize: 10.5 }}>
            {hint}
          </span>
        </label>
      ))}
    </div>
  );
}
