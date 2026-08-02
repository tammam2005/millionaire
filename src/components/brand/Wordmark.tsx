import { cn } from "@/lib/utils/cn";

const BRAND = "MILLIONAIRE";

type WordmarkProps = {
  /** Visual scale. `hero` is for the preloader and hero only. */
  size?: "hero" | "large" | "medium" | "small";
  /**
   * Split the word into per-letter elements so callers can animate letters
   * independently. Off by default — the extra DOM is only worth it where
   * something is actually going to animate.
   */
  split?: boolean;
  className?: string;
};

const SIZE_CLASS: Record<NonNullable<WordmarkProps["size"]>, string> = {
  hero: "text-(length:--text-display-xl)",
  large: "text-(length:--text-display-lg)",
  medium: "text-(length:--text-display-md)",
  small: "text-(length:--text-caption)",
};

/**
 * The MILLIONAIRE wordmark.
 *
 * Real text rather than an SVG outline: it stays selectable, scales with the
 * fluid type tokens, and can be animated letter-by-letter without shipping
 * path data. When split, the letters are hidden from assistive tech and the
 * wrapper carries the accessible name — otherwise screen readers spell the
 * brand out one character at a time.
 */
export function Wordmark({ size = "medium", split = false, className }: WordmarkProps) {
  const base = cn(
    "font-display text-bone tracking-(--tracking-wordmark) uppercase",
    // The tracking adds a trailing gap after the final letter; pulling it back
    // keeps the word optically centred.
    "indent-[0.26em] leading-[1]",
    SIZE_CLASS[size],
    className,
  );

  if (!split) {
    return <span className={base}>{BRAND}</span>;
  }

  return (
    <span className={cn(base, "inline-flex")} role="img" aria-label={BRAND}>
      {BRAND.split("").map((letter, index) => (
        <span
          key={`${letter}-${index}`}
          data-wordmark-letter={index}
          aria-hidden="true"
          className="inline-block"
        >
          {letter}
        </span>
      ))}
    </span>
  );
}
