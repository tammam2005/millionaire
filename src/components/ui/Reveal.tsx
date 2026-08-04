"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { lineReveal, riseIn, stagger } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";

type RevealProps = {
  children: ReactNode;
  /** Delay before this block starts, in seconds. */
  delay?: number;
  className?: string;
};

/**
 * A block that rises into view the first time it is scrolled to.
 *
 * `once: true` matters — content that re-animates every time it re-enters the
 * viewport turns scrolling back up into a strobe. `margin` holds the trigger
 * slightly inside the fold so the movement is finished by the time the element
 * is properly in view, rather than starting as it appears.
 *
 * Under reduced motion the duration tokens collapse to 1ms, so this resolves
 * to an instant appearance with no extra branching here.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      variants={riseIn}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type RevealTextProps = {
  /**
   * One entry per visual line.
   *
   * Lines are explicit rather than measured from the DOM. In editorial layout
   * where a line breaks is a design decision, not an accident of container
   * width — and measuring introduces a reflow and a frame of unstyled text
   * that a masked reveal makes very visible.
   */
  lines: readonly string[];
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  lineClassName?: string;
};

/**
 * Type that unmasks line by line.
 *
 * Each line sits in an `overflow-hidden` parent and slides up from below, so
 * it reads as uncovered rather than faded in. The full string is exposed to
 * assistive tech via the wrapper; the animated spans are hidden, otherwise a
 * screen reader announces the heading one line at a time.
 */
export function RevealText({
  lines,
  as: Tag = "p",
  className,
  lineClassName,
}: RevealTextProps) {
  return (
    <Tag className={className} aria-label={lines.join(" ")}>
      <motion.span
        aria-hidden="true"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "0px 0px -12% 0px" }}
        variants={stagger()}
        className="block"
      >
        {lines.map((line, index) => (
          <span key={`${line}-${index}`} className="block overflow-hidden">
            <motion.span
              variants={lineReveal}
              className={cn("block will-change-transform", lineClassName)}
            >
              {line}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}
