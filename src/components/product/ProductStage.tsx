import type { StaticImageData } from "next/image";
import Image from "next/image";
import { Spotlight } from "@/components/experience/Spotlight";

type ProductStageProps = {
  src: StaticImageData;
  alt: string;
  /** Off for anything below the fold — a related-products rail, say. */
  priority?: boolean;
};

/**
 * The garment, staged rather than photographed on a swatch.
 *
 * Every render in the catalogue exists twice: the flat studio plate
 * (`primary`, backdrop and all) and the matted cutout (`cutout`, same pixels,
 * alpha where the backdrop was). This renders the cutout inside a dark
 * cinematic ground built entirely from layers around it — no new image is
 * generated and not one pixel of the render itself is touched. `primary` is
 * the caller's fallback for the day a piece exists with no cutout yet.
 *
 * The lighting is the same fixture the rest of the site already uses:
 * `Spotlight` is the exact component the homepage and the newsletter section
 * light themselves with, reused here rather than reinvented, so the product
 * page reads as the same room as everywhere else on the site. Everything
 * beyond it — the ambient wash, the vignette, the contact shadow, the rim
 * glow, the floor reflection — is composited from gradients, a box-shadow and
 * one `drop-shadow` filter tracing the cutout's own alpha edge. Nothing here
 * recolours the garment; the effects sit around it, not on it.
 */
export function ProductStage({ src, alt, priority = true }: ProductStageProps) {
  return (
    <div className="relative">
      <div className="bg-studio-void relative overflow-hidden">
        {/* Key light — drifts fractionally with the pointer, same fixture as
            the homepage. No-ops under reduced motion or a coarse pointer. */}
        <Spotlight
          reach={0.03}
          className="top-[4%] left-1/2 h-[88%] w-[88%] -translate-x-1/2"
        />

        {/* Fill — a second, broader, static wash so the figure never reads as
            lit from a single source. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_72%_58%_at_50%_36%,rgba(232,232,230,0.05),transparent_70%)]"
        />

        {/* Vignette — the frame darkens toward its own edge, pulling the eye
            back to the garment rather than the corners of the plate. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 shadow-[inset_0_0_9vw_3vw_rgba(0,0,0,0.55)]"
        />

        {/* Contact shadow — grounds the figure on a floor rather than letting
            it float in front of the backdrop. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[16%] bottom-[3%] h-[9%] bg-[radial-gradient(ellipse_60%_100%_at_50%_100%,rgba(0,0,0,0.55),transparent_75%)]"
        />

        <Image
          src={src}
          alt={alt}
          placeholder="blur"
          priority={priority}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="relative h-auto w-full drop-shadow-[0_0_16px_rgba(180,178,172,0.16)]"
        />
      </div>

      {/* Floor reflection — bounded rather than faded to infinity, the way an
          actual reflective floor is bounded by its own edge. `aria-hidden`:
          the image above already carries the accessible name. */}
      <div
        aria-hidden="true"
        className="relative h-16 overflow-hidden sm:h-20 lg:h-28"
        style={{
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)",
        }}
      >
        <Image
          src={src}
          alt=""
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="absolute inset-x-0 top-0 h-auto w-full -scale-y-100 opacity-[0.08]"
        />
      </div>
    </div>
  );
}
