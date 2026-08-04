import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge, taught about this project's custom utilities.
 *
 * This configuration is not optional polish — without it `cn()` silently
 * deletes classes. tailwind-merge resolves conflicts by bucketing every class
 * into a group and keeping only the last of each. It has never heard of
 * `text-overline`, so it guesses from the shape of the name and files it under
 * *text colour*. The moment a caller writes `cn("text-overline", "text-silver")`
 * the utility is dropped as a superseded colour, and the label quietly loses
 * its size, tracking and uppercasing.
 *
 * That is exactly how `<Overline tone="silver">` ended up rendering "The Set"
 * in sentence case while an identical hard-coded className rendered correctly.
 * The failure is invisible in review: the class is in the source, just not in
 * the DOM.
 *
 * Declaring the custom utilities in their real groups fixes it at the root and
 * keeps them readable. Any future `@utility` in globals.css needs adding here.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      // Sets font-size, letter-spacing and text-transform — so it belongs with
      // sizes, and must never conflict with a text colour.
      "font-size": [{ text: ["overline"] }],
      // Sets font-family, letter-spacing and text-transform.
      "font-family": ["font-display-tracked"],
    },
  },
});

/**
 * Merge class names with Tailwind conflict resolution.
 *
 * Later classes win over earlier ones for the same CSS property, which is what
 * makes component-level `className` overrides behave predictably.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
