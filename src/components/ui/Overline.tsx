import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type OverlineProps = {
  children: ReactNode;
  /** `silver` promotes the label to accent weight. Use sparingly. */
  tone?: "stone" | "silver" | "bone";
  className?: string;
};

const TONE = {
  stone: "text-stone",
  silver: "text-silver",
  bone: "text-bone",
} as const;

/**
 * The small tracked label that sits above headings.
 *
 * Lifted directly from the garment: "EXCLUSIVE COLLECTION" is printed on the
 * reference hoodie in exactly this treatment — tiny, uppercase, widely
 * letterspaced. Reusing it on screen is what ties the site to the product.
 */
export function Overline({ children, tone = "stone", className }: OverlineProps) {
  return <p className={cn("text-overline", TONE[tone], className)}>{children}</p>;
}
