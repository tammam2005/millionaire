import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "solid" | "outline" | "quiet";

const VARIANT: Record<Variant, string> = {
  /* Bone on void — reserved for the single most important action on a view. */
  solid: "bg-bone text-void hover:bg-silver",
  /* Hairline box. The default for everything that isn't the primary action. */
  outline: "border border-ash text-bone hover:border-bone hover:bg-bone/5",
  /* Text with a rule that draws in on hover. Used inline and in nav. */
  quiet: "text-stone hover:text-bone",
};

type BaseProps = {
  variant?: Variant;
  children: ReactNode;
  className?: string;
};

/**
 * Shared shape for every button-like control.
 *
 * No rounded pills anywhere — a radius reads as friendly, and this brand isn't.
 * The corners stay square and the type stays tracked and uppercase, which is
 * what makes a control feel like signage rather than an app widget.
 */
const base = cn(
  "text-overline inline-flex items-center justify-center gap-3",
  "px-7 py-4 transition-colors duration-(--duration-micro) ease-(--ease-signature)",
  "disabled:pointer-events-none disabled:opacity-40",
);

type ButtonProps = BaseProps & ComponentPropsWithoutRef<"button">;

export function Button({
  variant = "outline",
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      data-cursor-magnetic
      className={cn(base, VARIANT[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

type ButtonLinkProps = BaseProps & ComponentPropsWithoutRef<typeof Link>;

/**
 * The same control rendered as a link.
 *
 * Kept as a separate export rather than a polymorphic `as` prop: navigation
 * and actions are semantically different, and forcing the choice at the import
 * makes it harder to ship a button that should have been a link.
 */
export function ButtonLink({
  variant = "outline",
  children,
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      data-cursor-magnetic
      className={cn(base, VARIANT[variant], className)}
      {...props}
    >
      {children}
    </Link>
  );
}
