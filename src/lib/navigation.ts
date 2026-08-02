import type { Route } from "next";

export interface NavLink {
  href: Route;
  label: string;
  /** Shown beneath the label in the overlay. Omit where it would be noise. */
  meta?: string;
}

/**
 * Primary navigation.
 *
 * The split between core line and drops is the brand's central distinction, so
 * it is the first thing the menu expresses: the core line browses by category,
 * drops browse by moment.
 */
export const PRIMARY_NAV: readonly NavLink[] = [
  { href: "/collections", label: "Collections", meta: "The core line" },
  { href: "/drops", label: "Drops", meta: "Limited releases" },
  { href: "/lookbook", label: "Lookbook", meta: "Campaign" },
  { href: "/about", label: "About", meta: "The house" },
];

/** Quieter links — present, but never competing with the primary set. */
export const SECONDARY_NAV: readonly NavLink[] = [
  { href: "/archive", label: "Archive" },
  { href: "/styleguide", label: "Styleguide" },
];
