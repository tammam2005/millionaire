/**
 * Headless verification of the commerce layer and the bag.
 *
 * Exercises the parts that are logic rather than pixels: stock caps, money
 * arithmetic, status derivation, and the persistence round-trip including the
 * deferred-hydration behaviour that keeps SSR and the client in agreement.
 *
 * Run: node --import ./scripts/register-loader.mjs scripts/verify-commerce.mjs
 */

/* A localStorage good enough for zustand's persist middleware. Installed
   before the store is imported, since persist captures storage at creation. */
const store = new Map();

// zustand's default persist storage is `createJSONStorage(() => window.localStorage)`
// — note `window.`, not the bare global. Without a `window` that access throws,
// zustand swallows it, and persistence is silently disabled while every other
// operation keeps working. Hence a `window` alias as well as the shim itself.
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  writable: true,
  value: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => void store.set(k, String(v)),
    removeItem: (k) => void store.delete(k),
    clear: () => store.clear(),
    key: (i) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  },
});

globalThis.window = globalThis;

const { commerce, formatMoney, getProductStatus, resolveDropStatus, totalStock } =
  await import("../src/lib/commerce/index.ts");
const { useCartStore, selectCount, selectSubtotal } =
  await import("../src/lib/cart/store.ts");

let failures = 0;
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${label}` +
      (ok
        ? `  → ${JSON.stringify(actual)}`
        : `\n        expected ${JSON.stringify(expected)}\n        actual   ${JSON.stringify(actual)}`),
  );
}

console.log("\n── Catalogue ──────────────────────────────────────────────");
const products = await commerce.getProducts();
check("product count", products.length, 5);
check("core line count", (await commerce.getProducts({ releaseType: "core" })).length, 4);
check("drop pieces", (await commerce.getProducts({ releaseType: "drop" })).length, 1);
check(
  "collection filter (col-core)",
  (await commerce.getProducts({ collectionId: "col-core" })).length,
  4,
);
check(
  "lookup by slug",
  (await commerce.getProduct("millionaire-hoodie"))?.title,
  "Wordmark Hoodie",
);
check("unknown slug returns null", await commerce.getProduct("nope"), null);
check(
  "batch lookup by ids",
  (await commerce.getProductsByIds(["prd-set", "prd-joggers"])).map((p) => p.id),
  ["prd-set", "prd-joggers"],
);
check(
  "drops sorted newest first",
  (await commerce.getDrops()).map((d) => d.slug),
  ["noctis", "arcx-mfta"],
);

console.log("\n── Money ──────────────────────────────────────────────────");
check("formats whole units", formatMoney({ amount: 89000, currency: "USD" }), "$890");
check("no stray cents", formatMoney({ amount: 18000, currency: "USD" }), "$180");

console.log("\n── Status derivation ──────────────────────────────────────");
const set = products.find((p) => p.id === "prd-set");
const joggers = products.find((p) => p.id === "prd-joggers");
const arcx = products.find((p) => p.id === "prd-arcx-hoodie");
const arcxDrop = await commerce.getDrop("arcx-mfta");
const noctis = await commerce.getDrop("noctis");

check("hooded set stock", totalStock(set), 0 + 8 + 2 + 1 + 8 + 3);
check("hooded set is available", getProductStatus(set, null), "available");
// Product-level status thresholds on TOTAL units, deliberately. Per-size
// scarcity is communicated where it is actionable — the size selector shows
// "N remaining" for the chosen variant — so the product badge is reserved for
// the piece as a whole being nearly gone.
check(
  "low stock is called out (3 units total across the run)",
  getProductStatus(
    {
      ...joggers,
      variants: joggers.variants.map((v, i) => ({ ...v, quantity: i < 3 ? 1 : 0 })),
    },
    null,
  ),
  "low-stock",
);
check(
  "one unit in each of six sizes is NOT low stock (6 total)",
  getProductStatus(
    { ...joggers, variants: joggers.variants.map((v) => ({ ...v, quantity: 1 })) },
    null,
  ),
  "available",
);
check(
  "zero stock is sold out",
  getProductStatus(
    { ...set, variants: set.variants.map((v) => ({ ...v, quantity: 0 })) },
    null,
  ),
  "sold-out",
);
check(
  "drop piece before release reads coming-soon despite stock",
  getProductStatus(arcx, arcxDrop, Date.parse("2026-07-01T00:00:00Z")),
  "coming-soon",
);
check(
  "ARCX is live after release",
  resolveDropStatus(arcxDrop, products, Date.parse("2026-08-02T00:00:00Z")),
  "live",
);
check(
  "ARCX is upcoming before release",
  resolveDropStatus(arcxDrop, products, Date.parse("2026-07-01T00:00:00Z")),
  "upcoming",
);
check(
  "drop with all stock gone is sold-out",
  resolveDropStatus(
    arcxDrop,
    products.map((p) =>
      p.id === "prd-arcx-hoodie"
        ? { ...p, variants: p.variants.map((v) => ({ ...v, quantity: 0 })) }
        : p,
    ),
    Date.parse("2026-08-02T00:00:00Z"),
  ),
  "sold-out",
);
check(
  "teaser drop with no products is not sold-out",
  resolveDropStatus(noctis, products, Date.parse("2026-12-01T00:00:00Z")),
  "live",
);

console.log("\n── Bag ────────────────────────────────────────────────────");
const cart = useCartStore;
const sizeS = set.variants.find((v) => v.size === "S"); // qty 8
const sizeL = set.variants.find((v) => v.size === "L"); // qty 1
const sizeXS = set.variants.find((v) => v.size === "XS"); // qty 0

cart.getState().addLine(set, sizeS);
check("add one", selectCount(cart.getState()), 1);

cart.getState().addLine(set, sizeS, 2);
check("adding same variant merges the line", cart.getState().lines.length, 1);
check("quantity accumulates", selectCount(cart.getState()), 3);

cart.getState().addLine(set, sizeL);
check("second variant is its own line", cart.getState().lines.length, 2);

cart.getState().addLine(set, sizeL);
check("cannot exceed stock (L has 1)", selectCount(cart.getState()), 4);

cart.getState().addLine(set, sizeXS);
check("cannot add a sold-out variant", cart.getState().lines.length, 2);

cart.getState().addLine(set, sizeS, 99);
check("bulk add is capped at stock", selectCount(cart.getState()), 9);

check("subtotal is exact integer arithmetic", selectSubtotal(cart.getState()), {
  amount: 89000 * 9,
  currency: "USD",
});
check("subtotal formats", formatMoney(selectSubtotal(cart.getState())), "$8,010");

cart.getState().setQuantity(sizeL.id, 0);
check("quantity 0 removes the line", cart.getState().lines.length, 1);

cart.getState().removeLine(sizeS.id);
check("remove empties the bag", selectCount(cart.getState()), 0);
check("empty subtotal is zero", selectSubtotal(cart.getState()).amount, 0);

console.log("\n── Persistence ────────────────────────────────────────────");
cart.getState().addLine(set, sizeS, 2);
const raw = JSON.parse(localStorage.getItem("millionaire-bag"));
check("writes to storage", raw.state.lines.length, 1);
check("storage is versioned", raw.version, 1);
check("only lines are persisted", Object.keys(raw.state), ["lines"]);
check(
  "no image is snapshotted (build hashes go stale)",
  Object.hasOwn(raw.state.lines[0], "image"),
  false,
);
check("price IS snapshotted", raw.state.lines[0].unitPrice, {
  amount: 89000,
  currency: "USD",
});

// Simulate a fresh page load: the store starts empty so SSR and the first
// client render agree, then rehydrates from what the previous session left.
//
// The snapshot/restore matters. `persist` writes on every state change, so
// clearing the store to fake a fresh load also wipes the very storage entry
// the rehydration is supposed to read — the fixture destroys itself.
const snapshot = localStorage.getItem("millionaire-bag");
cart.setState({ lines: [], hydrated: false });
localStorage.setItem("millionaire-bag", snapshot);
check("starts empty before rehydration", selectCount(cart.getState()), 0);
await cart.persist.rehydrate();
check("restores after rehydration", selectCount(cart.getState()), 2);
check("restored subtotal", formatMoney(selectSubtotal(cart.getState())), "$1,780");

console.log(
  `\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`,
);
process.exit(failures === 0 ? 0 : 1);
