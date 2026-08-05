import { arcxMftaBack, cutouts, millionaireSetTurnaround } from "@/lib/media/assets";
import setFront from "@/assets/products/millionaire-set/front.jpg";
import setSide from "@/assets/products/millionaire-set/side.jpg";
import setThreeQuarter from "@/assets/products/millionaire-set/three-quarter.jpg";
import type { Collection, Drop, Money, Product, Size, Variant } from "../types";

/**
 * The MILLIONAIRE catalogue.
 *
 * Authored from the five brand renders — nothing here describes a garment that
 * does not exist in the reference photography. Pricing is placeholder at a
 * plausible luxury tier and is the one thing here meant to be overwritten.
 *
 * Currency is USD as the most neutral international default; it is a single
 * type change in `types.ts` plus these figures.
 */

const usd = (amount: number): Money => ({ amount, currency: "USD" });

const APPAREL_SIZES: readonly Size[] = ["XS", "S", "M", "L", "XL", "XXL"];

/**
 * Build a size run.
 *
 * Stock is uneven on purpose: middle sizes sell first, so M and L run low and
 * XS sells out. That gives the interface real states to render — a size run
 * where everything is in stock never exercises the sold-out treatment, and
 * that treatment is where a shop looks cheap if nobody designed it.
 */
function sizeRun(
  skuPrefix: string,
  quantities: Partial<Record<Size, number>>,
  sizes: readonly Size[] = APPAREL_SIZES,
): readonly Variant[] {
  return sizes.map((size) => ({
    id: `${skuPrefix}-${size.toLowerCase().replace(/\s+/g, "-")}`,
    size,
    sku: `${skuPrefix}-${size.replace(/\s+/g, "").toUpperCase()}`,
    quantity: quantities[size] ?? 8,
  }));
}

const CARE = [
  { label: "Composition", value: "480gsm loopback cotton, brushed interior" },
  { label: "Finish", value: "Garment dyed, enzyme washed" },
  { label: "Care", value: "Cold wash inside out. Do not tumble dry." },
  { label: "Origin", value: "Made in Portugal" },
] as const;

export const PRODUCTS: readonly Product[] = [
  {
    id: "prd-set",
    slug: "millionaire-hooded-set",
    title: "Hooded Set",
    overline: "Exclusive Collection",
    description:
      "The full silhouette: hood, joggers and balaclava cut from one weight of cotton so the black reads continuous from head to ankle. Chest wordmark and thigh crest in tonal silver.",
    price: usd(89000),
    releaseType: "core",
    collectionIds: ["col-core", "col-blackout"],
    variants: sizeRun("MN-SET", { XS: 0, M: 2, L: 1, XXL: 3 }),
    media: {
      primary: setFront,
      cutout: cutouts.front.src,
      turnaround: millionaireSetTurnaround,
    },
    details: CARE,
  },
  {
    id: "prd-hoodie",
    slug: "millionaire-hoodie",
    title: "Wordmark Hoodie",
    overline: "Exclusive Collection",
    description:
      "Heavyweight hood with a double-layer collar that holds its shape. Wordmark set across the chest in tonal silver, low enough in contrast to disappear at distance.",
    price: usd(52000),
    releaseType: "core",
    collectionIds: ["col-core", "col-blackout"],
    variants: sizeRun("MN-HD", { XS: 0, S: 3, M: 1 }),
    media: { primary: setThreeQuarter, cutout: cutouts.threeQuarter.src },
    details: CARE,
  },
  {
    id: "prd-joggers",
    slug: "millionaire-joggers",
    title: "Crest Joggers",
    overline: "Exclusive Collection",
    description:
      "Tapered through the leg with a fixed cuff. Crest embroidered at the thigh in tonal silver, the only mark on the piece.",
    price: usd(42000),
    releaseType: "core",
    collectionIds: ["col-core", "col-blackout"],
    variants: sizeRun("MN-JG", { L: 2, XXL: 0 }),
    media: { primary: setSide, cutout: cutouts.side.src },
    details: CARE,
  },
  {
    id: "prd-balaclava",
    slug: "millionaire-balaclava",
    title: "Balaclava",
    overline: "Exclusive Collection",
    description:
      "Single opening, unlined, cut to sit under a hood without bulk. The piece the rest of the collection is built around.",
    price: usd(18000),
    releaseType: "core",
    collectionIds: ["col-core", "col-blackout"],
    variants: sizeRun("MN-BL", { "One Size": 14 }, ["One Size"]),
    media: { primary: setFront, cutout: cutouts.front.src },
    details: [
      { label: "Composition", value: "Fine gauge merino, unlined" },
      { label: "Care", value: "Hand wash cold. Dry flat." },
      { label: "Origin", value: "Made in Portugal" },
    ],
  },
  {
    id: "prd-arcx-hoodie",
    slug: "arcx-mfta-hoodie",
    title: "ARCX MFTA Hoodie",
    overline: "ARCX MFTA Collection",
    description:
      "Drop exclusive. Script signature across the back beneath the collection overline, hand-drawn and printed once. Not restocked.",
    price: usd(64000),
    releaseType: "drop",
    dropId: "drp-arcx",
    collectionIds: ["col-blackout"],
    variants: sizeRun("MN-ARCX", { XS: 0, S: 1, M: 0, L: 2, XL: 4, XXL: 0 }),
    media: { primary: arcxMftaBack, cutout: cutouts.arcxBack.src },
    details: CARE,
  },
];

export const COLLECTIONS: readonly Collection[] = [
  {
    id: "col-core",
    slug: "the-core-line",
    title: "The Core Line",
    description:
      "Permanent pieces. Restocked rather than dropped, and available for as long as the house makes them.",
    productIds: ["prd-set", "prd-hoodie", "prd-joggers", "prd-balaclava"],
  },
  {
    id: "col-blackout",
    slug: "blackout",
    title: "Blackout",
    description:
      "Everything cut in a single black. No contrast, no colour, no exception.",
    productIds: [
      "prd-set",
      "prd-hoodie",
      "prd-joggers",
      "prd-balaclava",
      "prd-arcx-hoodie",
    ],
  },
];

/**
 * Drops.
 *
 * Dates are fixed ISO strings, never computed at module scope — a
 * `new Date()` here would bake build time into a statically rendered page and
 * quietly go stale. Status is derived from these against an explicit `now`
 * (see `drops.ts`), so the caller decides which clock applies.
 *
 * NOCTIS deliberately has no products: a teaser with a waitlist and nothing to
 * buy is a real state a drop-driven shop has to render, and Phase 6 needs it.
 */
export const DROPS: readonly Drop[] = [
  {
    id: "drp-arcx",
    slug: "arcx-mfta",
    title: "ARCX MFTA",
    description:
      "The script signature, printed once across the back. Released in a single run and closed when it is gone.",
    releaseAt: "2026-07-18T18:00:00.000Z",
    productIds: ["prd-arcx-hoodie"],
  },
  {
    id: "drp-noctis",
    slug: "noctis",
    title: "NOCTIS",
    description: "Announced only. Nothing else will be said before it opens.",
    releaseAt: "2026-11-14T19:00:00.000Z",
    productIds: [],
  },
];
