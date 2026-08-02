import { cn } from "@/lib/utils/cn";

type SignatureProps = {
  className?: string;
};

/**
 * The "No Risk No Rich" script mark carried on the back of the garments.
 *
 * Set in a calligraphic face rather than hand-authored as SVG paths: real
 * curves from a real type designer beat approximated beziers, and it stays
 * text — selectable, searchable, and legible to assistive technology.
 *
 * Italianno runs optically small, hence the size bump relative to its box.
 */
export function Signature({ className }: SignatureProps) {
  return (
    <span
      className={cn(
        "block font-signature text-[2.75em] leading-[0.8] text-silver",
        className,
      )}
    >
      No Risk No Rich
    </span>
  );
}
