import { Fragment } from "react";
import { cn } from "@/lib/utils/cn";

type MarqueeProps = {
  items: readonly string[];
  /** Seconds for one full pass. Higher is slower and calmer. */
  duration?: number;
  className?: string;
};

/**
 * An endless band of tracked type.
 *
 * Driven by a CSS animation rather than JS: the browser can run a transform
 * animation off the main thread, so it keeps moving smoothly even while React
 * is busy — which is exactly when a JS-driven marquee visibly stutters.
 *
 * The track is rendered twice and translated by exactly -50%, which is what
 * makes the wrap seamless; any other distance shows a seam.
 *
 * The duplicate is `aria-hidden` and the whole band is presentational — a
 * decorative loop of repeating words is noise to a screen reader.
 */
export function Marquee({ items, duration = 40, className }: MarqueeProps) {
  const track = (
    <span className="flex shrink-0 items-center">
      {items.map((item, index) => (
        <Fragment key={`${item}-${index}`}>
          <span className="px-8 text-overline text-stone">{item}</span>
          <span className="h-px w-8 shrink-0 bg-ash" />
        </Fragment>
      ))}
    </span>
  );

  return (
    <div
      role="presentation"
      className={cn("flex overflow-hidden", className)}
      style={{
        maskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
      }}
    >
      <div
        data-marquee
        className="flex w-max will-change-transform"
        style={{ animation: `millionaire-marquee ${duration}s linear infinite` }}
      >
        {track}
        <span aria-hidden="true" className="flex shrink-0 items-center">
          {track}
        </span>
      </div>
    </div>
  );
}
