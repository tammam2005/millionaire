import type { StaticImageData } from "next/image";
import Image from "next/image";

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
 * Every colour here is strictly neutral — every channel equal, nothing
 * warm or cool leant into. The brand's own void/ink tokens were tried first
 * and rejected: they carry a two-value blue bias that is invisible as a
 * hairline border but reads as a cool cast once it is the dominant colour of
 * a large, softly lit field, which is exactly the failure mode a "photographed
 * in a dark studio" plate cannot afford. Four layers, each doing one job and
 * nothing else: a small soft key light at torso height, a vignette that keeps
 * the ground itself close to black, a soft dark contact shadow at the feet,
 * and a hairline `drop-shadow` rim tracing the cutout's own alpha edge.
 * Nothing here recolours the garment; the light sits around it, not on it.
 */
export function ProductStage({ src, alt, priority = true }: ProductStageProps) {
  return (
    <div className="relative">
      <div className="bg-studio-void relative overflow-hidden">
        {/* Key light — small, soft, centred at torso height. This is the only
            light source; a second wash on top of it reads as haze. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_38%_30%_at_50%_38%,rgba(210,210,210,0.032),rgba(210,210,210,0.01)_55%,transparent_75%)]"
        />

        {/* Vignette — the frame darkens toward its own edge, keeping the
            ground itself close to black rather than lit evenly. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 shadow-[inset_0_0_9vw_3vw_rgba(0,0,0,0.62)]"
        />

        {/* Contact shadow — a dark pool at the feet, not a glow. Grounds the
            figure on a floor rather than letting it float in front of the
            backdrop. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[22%] bottom-[2%] h-[7%] bg-[radial-gradient(ellipse_60%_100%_at_50%_100%,rgba(0,0,0,0.5),transparent_78%)]"
        />

        <Image
          src={src}
          alt={alt}
          placeholder="blur"
          priority={priority}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="relative h-auto w-full drop-shadow-[0_0_2px_rgba(255,255,255,0.07)]"
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
          className="absolute inset-x-0 top-0 h-auto w-full -scale-y-100 opacity-[0.07]"
        />
      </div>
    </div>
  );
}
