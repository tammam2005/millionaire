import { cn } from "@/lib/utils/cn";

type MonogramProps = {
  /** Rendered height in px. Width follows the 4:5 aspect of the mark. */
  size?: number;
  /**
   * Decorative by default — the mark almost always sits beside the wordmark,
   * and announcing it twice is noise. Pass a label where it stands alone.
   */
  label?: string;
  className?: string;
};

/**
 * The MILLIONAIRE crest — an original heraldic M.
 *
 * Drawn as strokes rather than filled shapes so a single `stroke-width` keeps
 * the whole mark hairline at any size, matching the fine embroidery on the
 * garment. `vector-effect: non-scaling-stroke` holds that hairline constant
 * whether the crest is 16px in a nav or 400px in a section.
 *
 * Geometry: two outer stems splay outward as they descend, two inner
 * diagonals fall to a low centre vertex, and a pendant stem drops below the
 * baseline. Above sits a three-part fleur — a central spear with a diamond
 * finial, flanked by two sweeps.
 */
export function Monogram({ size = 48, label, className }: MonogramProps) {
  const decorative = label === undefined;

  return (
    <svg
      viewBox="0 0 120 150"
      height={size}
      width={(size * 120) / 150}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={label}
      className={cn("text-silver", className)}
    >
      {/* --- Fleur ------------------------------------------------------- */}
      {/* Central spear with a diamond finial. */}
      <path d="M60 34 L60 12" />
      <path d="M60 4 L64 10 L60 16 L56 10 Z" fill="currentColor" stroke="none" />
      {/* Two sweeps curling outward and up from the base of the spear. */}
      <path d="M60 32 C52 28 47 20 48.5 11" />
      <path d="M60 32 C68 28 73 20 71.5 11" />

      {/* --- The M ------------------------------------------------------- */}
      {/* Outer stems, splaying as they fall. */}
      <path d="M30 40 L18 120" />
      <path d="M90 40 L102 120" />
      {/* Inner diagonals meeting at the centre vertex. */}
      <path d="M30 40 L60 96" />
      <path d="M90 40 L60 96" />

      {/* --- Pendant ----------------------------------------------------- */}
      <path d="M60 96 L60 138" />
      <path d="M50 126 L70 126" />

      {/* Serif feet — the detail that makes it read as heraldic rather than
          geometric. */}
      <path d="M11 120 L25 120" />
      <path d="M95 120 L109 120" />
    </svg>
  );
}
