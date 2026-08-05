import type { Money, ResolvedCartLine } from "@/lib/commerce";
import { formatMoney } from "@/lib/commerce";

/** The house takes orders directly — no payment gateway sits between them. */
const WHATSAPP_NUMBER = "972528304877";

/**
 * Every MILLIONAIRE piece ships in a single colourway — the catalogue has no
 * colour field because there is no choice to make ("Blackout: no contrast,
 * no colour, no exception"). Stated plainly in the order message rather than
 * invented as a selector nobody would ever use.
 */
const COLOR = "Black";

/**
 * The order message sent to the house over WhatsApp.
 *
 * Plain text, not a deep link into a payment flow: the brand takes orders the
 * way a made-to-order house always has, by a person reading a message and
 * confirming it. The format is fixed so every order arrives shaped the same
 * way regardless of what is in the bag.
 */
export function buildOrderMessage(
  lines: readonly ResolvedCartLine[],
  subtotal: Money,
): string {
  const products = lines
    .map(
      (line) =>
        `- ${line.title}\n  Size: ${line.size}\n  Color: ${COLOR}\n  Quantity: ${line.quantity}`,
    )
    .join("\n\n");

  return [
    "Hello MILLIONAIRE,",
    "",
    "I would like to place the following order:",
    "",
    "Products:",
    products,
    "",
    `Total: ${formatMoney(subtotal)}`,
    "",
    "Please confirm my order.",
  ].join("\n");
}

/** A `wa.me` deep link carrying the order as pre-filled message text. */
export function buildOrderUrl(
  lines: readonly ResolvedCartLine[],
  subtotal: Money,
): string {
  const text = encodeURIComponent(buildOrderMessage(lines, subtotal));
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}
