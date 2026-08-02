import type { Money } from "./types";

const FORMATTERS = new Map<string, Intl.NumberFormat>();

/**
 * Format money for display.
 *
 * The locale is pinned to `en-US` rather than left to the runtime. An
 * `Intl.NumberFormat` with no locale resolves differently on the server and in
 * the browser, which produces a hydration mismatch on every price on the page
 * — and prices are exactly the text nobody should ever see flicker.
 *
 * Formatters are cached because constructing one is comparatively expensive
 * and a collection grid formats a price per card.
 */
export function formatMoney(money: Money): string {
  const key = money.currency;
  let formatter = FORMATTERS.get(key);

  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: money.currency,
      // Luxury pricing is whole-unit; ".00" on every card is visual noise.
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    FORMATTERS.set(key, formatter);
  }

  return formatter.format(money.amount / 100);
}

/** Add money of the same currency. Mixing currencies is a programming error. */
export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot add ${a.currency} to ${b.currency}`);
  }
  return { amount: a.amount + b.amount, currency: a.currency };
}

export function multiplyMoney(money: Money, factor: number): Money {
  return { amount: money.amount * factor, currency: money.currency };
}

export const ZERO: Money = { amount: 0, currency: "USD" };
