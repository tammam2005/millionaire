import { Bodoni_Moda, Geist, Italianno } from "next/font/google";

/**
 * Display face. A Didone with hairline serifs, matching the wordmark printed
 * on the reference garments. Used only at large sizes and wide tracking —
 * Didones fall apart below ~24px, so the type scale never asks it to.
 */
export const displayFont = Bodoni_Moda({
  variable: "--font-display-family",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

/**
 * Interface face. A neutral grotesque that stays out of the way — navigation,
 * product metadata, controls. Deliberately anonymous so the display face and
 * the photography carry all the character.
 */
export const interfaceFont = Geist({
  variable: "--font-interface-family",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Signature face, used for the "No Risk No Rich" mark only.
 *
 * The garment carries this as a looping calligraphic script. Hand-authoring
 * that as SVG paths would produce worse curves than a real calligraphic
 * typeface, and would not scale or stay accessible as text.
 */
export const signatureFont = Italianno({
  variable: "--font-signature-family",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

export const fontVariables = [
  displayFont.variable,
  interfaceFont.variable,
  signatureFont.variable,
].join(" ");
