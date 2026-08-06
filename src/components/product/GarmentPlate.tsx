import Image, { type StaticImageData } from "next/image";
import { cn } from "@/lib/utils/cn";

type GarmentPlateProps = {
  src: StaticImageData;
  alt: string;
  priority?: boolean;
  sizes: string;
  className?: string;
  imageClassName?: string;
};

/**
 * The dark ground a garment stands on, wherever more than one plate needs to
 * render at once.
 *
 * `ProductStage` (the product page's hero) lights itself with a torso-height
 * key light, a contact shadow and a floor reflection — right for one large
 * image, too much detail repeated across a grid of tiles. This is the same
 * room, stripped to what still reads at a fraction of the size: the neutral
 * background, a faint static wash, and the same hairline `drop-shadow`
 * tracing each cutout's own alpha edge. No JS, no per-tile cost.
 *
 * Every colour here is strictly neutral, same rule as `ProductStage`: equal
 * RGB channels, nothing warm or cool leant into. `bg-studio-void` was
 * corrected for exactly this reason — it no longer reads the brand's
 * void/ink tokens, which carry a blue bias invisible on a hairline but
 * visible once it is the dominant colour of a lit field.
 */
export function GarmentPlate({
  src,
  alt,
  priority,
  sizes,
  className,
  imageClassName,
}: GarmentPlateProps) {
  return (
    <div className={cn("bg-studio-void relative overflow-hidden", className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_32%_at_50%_38%,rgba(210,210,210,0.026),transparent_74%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 shadow-[inset_0_0_4vw_1.5vw_rgba(0,0,0,0.55)]"
      />
      <Image
        src={src}
        alt={alt}
        placeholder="blur"
        priority={priority}
        sizes={sizes}
        className={cn(
          "relative drop-shadow-[0_0_2px_rgba(255,255,255,0.06)]",
          imageClassName,
        )}
      />
    </div>
  );
}
