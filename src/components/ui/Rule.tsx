"use client";

import { motion } from "motion/react";
import { drawRule } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";

type RuleProps = {
  /** Where the line grows from as it draws. */
  origin?: "left" | "center";
  tone?: "ash" | "silver";
  className?: string;
};

const TONE = {
  ash: "bg-ash",
  silver: "bg-silver",
} as const;

/**
 * A hairline that draws itself when scrolled into view.
 *
 * Used to separate sections instead of borders or boxes. The draw is the only
 * decoration this brand permits between blocks — everything else is spacing.
 */
export function Rule({ origin = "left", tone = "ash", className }: RuleProps) {
  return (
    <motion.div
      aria-hidden="true"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={drawRule}
      className={cn("h-px w-full", TONE[tone], className)}
      style={{ transformOrigin: origin === "left" ? "left center" : "center" }}
    />
  );
}
