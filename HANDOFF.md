# MILLIONAIRE — Project Handoff

This document is **fully self-contained**. Another engineer (or Claude session) can
resume work from this file alone, with no access to prior conversation.

Last updated: 2026-08-04. Repository: `C:\Users\Smri IT\Downloads\m7md`.

---

## 1. Project vision and goals

**MILLIONAIRE** is the flagship web presence for a luxury streetwear house.

The brief, in the client's words, was for an *"award-winning luxury fashion editorial,
not a standard ecommerce store"* — minimal, timeless, expensive, cinematic, with
"zero template feeling" and "every pixel intentional".

**The organising idea is `concealment as luxury`.** The product is an all-black hooded
set worn with a balaclava; the figure is anonymous, the branding is tonal and almost
invisible at distance. The site withholds rather than announces. Wealth that needs to
be seen is not wealth.

**Commercial model (client-directed, Phase 5):** the house sells **one product** — the
complete Hooded Set. There is deliberately **no product grid, no collection index and
no related products**. The homepage *is* the purchase experience.

### Non-negotiables stated by the client
- Minimal, timeless, expensive. Quiet luxury. Editorial rather than ecommerce.
- Large negative space, beautiful typography, cinematic lighting.
- Physically believable motion — momentum, depth, restraint. No random movement,
  no flashy effects, no cheap glow.
- 60fps. Performance is mandatory.
- Accessibility must remain perfect.
- Desktop-first, then responsive.

---

## 2. Tech stack

| Concern | Choice | Version | Why |
|---|---|---|---|
| Framework | Next.js App Router | **16.2.12** | Server components, image pipeline, Turbopack default |
| React | React | 19.2.4 | Required by Next 16 |
| Language | TypeScript | 5.x, `strict` | Plus `noUncheckedIndexedAccess` (see §14) |
| Styling | Tailwind CSS | **v4** (CSS-first `@theme`) | No `tailwind.config.js`; tokens live in CSS |
| Animation | `motion` (Framer Motion successor) | 12.x | **Used narrowly — see §7 warning** |
| Smooth scroll | `lenis` | 1.3.x | Industry standard for this category |
| Dialogs | Radix UI (`@radix-ui/react-dialog`) | 1.1.x | Accessibility primitives, styled entirely by us |
| State | `zustand` + `persist` | 5.x | Cart only |
| Class merging | `clsx` + `tailwind-merge` | — | **Custom-configured, see §14** |
| Image processing | `sharp` | 0.34.5 | Build-time asset scripts only |

**Runtime:** Node **24.18.1**, npm 11.16.0. (Installed via `winget install OpenJS.NodeJS.LTS`
— winget's LTS channel serves 24, not 22.)

### Deliberately rejected
- **shadcn/ui as a component set.** Its visual defaults are the fastest way to look
  templated. We use Radix primitives directly and none of the styling.
- **CSS-in-JS runtime.** Costs the server-component win.
- **Three.js / WebGL for the 360°.** No GLB model exists. Image-sequence blending is
  correct for photographic frames and a fraction of the bundle.
- **A "frozen router" for exit page transitions.** See §8.

---

## 3. Commands

```bash
npm run dev           # Next dev server (Turbopack)
npm run build         # Production build
npm start             # Serve production build
npm run typecheck     # tsc --noEmit
npm run lint          # eslint
npm run format        # prettier --write .
npm run test:commerce # 32 headless assertions (see §16)
npm run verify        # typecheck + lint + format:check + test:commerce
```

**Always run `npm run verify` before considering work done.** It is the project's gate.

### Asset scripts (build-time, run manually — not part of `npm run build`)
```bash
node scripts/prepare-assets.mjs      # .jfif source renders -> optimised .jpg in src/assets
node scripts/sample-print-colour.mjs # measures the garment print colour (evidence for the palette)
node scripts/extract-cutouts.mjs     # mattes garment off backdrop -> *-cutout.png
node scripts/qa-cutouts.mjs          # writes .qa/ visual QA sheets for the mattes
```

---

## 4. Folder structure

```
/
├── HANDOFF.md                 ← this file
├── AGENTS.md / CLAUDE.md      ← "This is NOT the Next.js you know" — read node_modules/next/dist/docs
├── _source/
│   ├── references/            ← the 5 ORIGINAL .jfif brand renders (source of truth)
│   └── unrelated/             ← two VC++ installers that predated the project (gitignored)
├── .qa/                       ← generated cutout QA sheets (gitignored-ish, safe to delete)
├── scripts/                   ← build-time asset + test tooling (never shipped)
└── src/
    ├── app/
    │   ├── layout.tsx         ← root: fonts, Grain, Cursor, SmoothScroll, Preloader, CartHydrator
    │   ├── globals.css        ← ALL design tokens, reduced-motion enforcement, keyframes
    │   ├── styleguide/        ← internal, noindex — proves the design system
    │   └── (site)/
    │       ├── layout.tsx     ← Header + PageTransition + Footer
    │       ├── page.tsx       ← HOME = OutfitFilm + TheList
    │       ├── products/[slug]/page.tsx
    │       ├── drops|lookbook|about|archive/page.tsx   ← ComingSoon placeholders
    ├── assets/products/       ← optimised .jpg renders + matted *-cutout.png
    ├── components/
    │   ├── brand/             ← Wordmark, Monogram (SVG crest), Signature
    │   ├── experience/        ← OutfitFilm, Preloader, Cursor, Grain, Spotlight,
    │   │                        SmoothScroll, PageTransition, CartHydrator
    │   ├── layout/            ← Header, Footer, NavOverlay, CartDrawer, ComingSoon
    │   ├── product/           ← AddToBag
    │   ├── sections/          ← TheList (newsletter)
    │   └── ui/                ← Button, Overline, Reveal, Rule, Marquee
    └── lib/
        ├── commerce/          ← THE ADAPTER BOUNDARY (see §6)
        ├── cart/              ← zustand store + useResolvedLines
        ├── media/             ← asset descriptors, turnaround manifests, cutout bounds
        ├── motion/            ← tokens, useMotionPreference, usePreloaderComplete
        ├── scroll/            ← Lenis singleton registry
        ├── navigation.ts
        ├── fonts.ts
        └── utils/cn.ts        ← CUSTOM-CONFIGURED tailwind-merge (see §14)
```

---

## 5. Important files — what each does

### Experience
| File | Responsibility |
|---|---|
| `components/experience/OutfitFilm.tsx` | **The homepage.** Entire scroll film: wordmark → morph → 3 chapters → purchase. ~500 lines. The single most important file. |
| `components/experience/Preloader.tsx` | Cinematic intro; FLIP hand-off to header wordmark; hard 2.6s rescue timer |
| `components/experience/Cursor.tsx` | Custom magnetic cursor, rAF-driven, contextual labels |
| `components/experience/Grain.tsx` | Film grain — server component, GPU-only, zero JS |
| `components/experience/Spotlight.tsx` | Mouse-reactive key light, lerped, transform-only |
| `components/experience/SmoothScroll.tsx` | Lenis lifecycle + route-change scroll reset |
| `components/experience/PageTransition.tsx` | Enter-only route transition (see §8) |
| `components/experience/CartHydrator.tsx` | Deferred zustand rehydration (SSR-safe) |

### Commerce
| File | Responsibility |
|---|---|
| `lib/commerce/index.ts` | **THE SWAP POINT.** Exports the active provider. |
| `lib/commerce/provider.ts` | `CommerceProvider` interface — all async by design |
| `lib/commerce/types.ts` | Money, Product, Variant, Drop, CartLine, ResolvedCartLine |
| `lib/commerce/status.ts` | Derived product/drop status — never stored |
| `lib/commerce/money.ts` | Integer minor units; pinned `en-US` formatter |
| `lib/commerce/local/catalog.ts` | The dataset — 5 products, 2 collections, 2 drops |
| `lib/cart/store.ts` | zustand bag, `skipHydration`, versioned persistence |

### Design system
| File | Responsibility |
|---|---|
| `app/globals.css` | Every token. Reduced-motion enforcement. Unlayered state overrides. |
| `lib/utils/cn.ts` | tailwind-merge **taught about custom utilities** — critical, see §14 |
| `lib/motion/tokens.ts` | JS mirrors of the CSS motion tokens |

---

## 6. Architecture — the commerce boundary

**The one rule that matters: no component may import a commerce SDK.**

Everything reads through `@/lib/commerce`. Migrating to Shopify means:
1. Write `lib/commerce/shopify/provider.ts` implementing `CommerceProvider`.
2. Change one line in `lib/commerce/index.ts`.

Nothing else in the codebase names a backend. **Never import from
`@/lib/commerce/local/*` directly** — that would quietly turn the boundary into fiction.

Every provider method is `async` even though the local implementation resolves
immediately, so no call site changes when a network hop appears.

**The cart is deliberately outside the provider** — it lives entirely client-side in
`lib/cart/store.ts` because there is no server to hold it. When Shopify lands, carts
become server-owned and the interface gains `createCart` / `addLines` / `updateLine`;
the store becomes a thin cache over a cart id.

### Data model notes
- **Money is integer minor units.** `{ amount: 89000, currency: "USD" }` = $890.
  Never floats — `0.1 + 0.2 !== 0.3` and a storefront that disagrees with the payment
  processor by a cent is a support ticket.
- **Status is derived, never stored** (`status.ts`). A stored status drifts the first
  time someone edits stock without editing the label, and the failure mode is selling
  something you do not have.
- **Cart lines snapshot price but NOT imagery.** Image URLs carry a build hash, so a
  persisted one 404s after the next deploy. Prices are commercial facts and must be
  frozen; pictures are resolved fresh via `useResolvedLines`.

---

## 7. ⚠️ CRITICAL: the motion library caveat

**`motion`'s `opacity` and `filter` values were measured frozen at their initial output
at every scroll position, while its `transform` writes (`scale`, `translateX`) updated
correctly.**

This was discovered during Phase 5 by reading inline styles at known scroll offsets:
at progress 0.30 the wordmark still reported `opacity: 1; filter: blur(0px)` when it
should have been `0` and `blur(9px)`, while `scale` on the same element was correct.

**Consequence:** the entire `OutfitFilm` stage is driven by **one hand-rolled rAF loop
writing styles directly to refs**, not by `useTransform`. Do not "simplify" this back
to motion values — it will silently break the film. The helper is `stopsAt()`.

`motion` is still used successfully for:
- Discrete enter animations (`TheList`, `Reveal`, `Rule`)
- `AnimatePresence` in `NavOverlay` / `CartDrawer`
- `useScroll` (the scroll **progress** MotionValue is reliable; only styling was not)

---

## 8. Scroll system

- **Lenis** owns scrolling (`components/experience/SmoothScroll.tsx`), `lerp: 0.075`
  — deliberately heavier than default. Luxury reads as weight.
- **`syncTouch: false`** — touch keeps native platform physics. Synthesised momentum on
  a touchscreen always feels a frame behind.
- **Disabled entirely under `prefers-reduced-motion`.**
- **`window.scrollTo` is a no-op while Lenis runs.** Anything needing to move the page
  must use `lib/scroll/lenis.ts` → `scrollTo()` / `scrollToTop()`, which falls back to
  native scrolling when Lenis is absent.
- **`lockScroll()` / `unlockScroll()`** must wrap modal surfaces. Radix's body lock is
  *not* sufficient — Lenis animates its own position and keeps drifting behind an open
  overlay.

---

## 9. The film — `OutfitFilm.tsx`

The homepage is a single `760svh` section containing one `sticky top-0 h-svh` stage.
Everything shares **one scroll clock**.

### Timeline (`const T`, progress units 0→1)
| Key | Value | Meaning |
|---|---|---|
| `wordHold` | 0.06 | wordmark holds alone |
| `morphStart` | 0.08 | dissolve begins |
| `morphEnd` | 0.18 | garment fully present |
| `ch1` / `ch1End` | 0.26 / 0.38 | figure right |
| `ch2` / `ch2End` | 0.46 / 0.56 | figure left |
| `ch3` / `ch3End` | 0.64 / 0.74 | figure centred |
| `buy` | 0.82 | purchase settled |

### Sequence
1. **0.00–0.08** — MILLIONAIRE wordmark alone on black. Nothing else on screen.
2. **0.08–0.18** — wordmark swells to `scale(1.28)`, blurs to `9px`, fades to 0 while
   the garment fades in from `scale(0.9)`. This is the "logo becomes the outfit".
3. **Chapter I — Material** (figure right, copy left)
4. **Chapter II — Construction** (figure left, copy right)
5. **Chapter III — Specification** (figure centred, copy beneath)
6. **Purchase** — the only thing for sale.

### Panel handoffs — `PANEL_RANGES`
```
ch1: in 0.20→0.26, out 0.34→0.39
ch2: in 0.41→0.47, out 0.53→0.58
ch3: in 0.60→0.66, out 0.70→0.755
buy: in 0.78→0.86
```
**These are deliberately non-overlapping with empty beats between.** Overlapping them
(the obvious way) put two blocks of type in the same place: Chapter III dissolved *over*
the purchase panel on desktop, and on narrow screens — where every chapter sits at the
foot of the frame — *every* handover collided. Verified: max 1 legible text block at any
scroll position, on both desktop and mobile.

---

## 10. 3D outfit implementation

**It is not a 3D model.** It is six photographic frames blended with real perspective.

- Source: `millionaireSetTurnaroundCutout` in `lib/media/assets.ts`.
- **Four camera angles were actually shot:** 0° (front), 35° (three-quarter),
  90° (side), 180° (back).
- **The back half is synthesised by mirroring** — a view at θ resembles its reflection
  at 360−θ. So 90° serves as 270°, and 35° serves as 325°.
  **KNOWN ARTEFACT:** the M crest sits on one thigh, so mirrored frames place it on the
  wrong leg. Very hard to catch on a black garment at those angles, but real.

### What makes it feel physical rather than like a slideshow
1. **`perspective: 1600px`** on the frame container, `transformStyle: preserve-3d`.
2. **`rotateY`** per frame, proportional to angular distance from camera
   (`ROTATION_DEPTH = 0.55`, clamped ±40°). A frame being turned away from leans back
   and foreshortens exactly as a solid object would; the incoming frame swings in to
   meet it. Mirrored frames negate the rotation as well as the scale.
3. **Hold-handover-release crossfade** (`BLEND_START = 0.34`, `BLEND_END = 0.66`).
   Each frame holds full opacity until a third of the way to its neighbour, hands over
   across the middle third, and is gone by two thirds. A linear blend kept both frames
   half-visible across the whole gap — with only four real angles that is a long time
   to look at a double exposure. **Measured: 81% of the rotation shows a single clean
   frame.**
4. **Small horizontal counter-shift** (±14px). Larger values made the two blending
   frames read as two people standing side by side rather than one object turning.

### Angle choreography (`ANGLE_STOPS`)
`0° at morphEnd → 35° at ch1 → 90° at ch2 → 180° at ch3 → 360° at buy`
— a full revolution across the film, ending front-facing for purchase.

**A real 24–36 frame turntable render would drop straight into the same manifest with
no code change** and would eliminate both the mirroring artefact and the residual
ghosting. This is the single highest-value asset upgrade available.

---

## 11. Camera movement and parallax

### Scroll parallax
Planes move at different rates so distance reads as depth:
- Wordmark: camera at 0.6× horizontal, 0.4× vertical
- Figure: camera at 1.1× horizontal, 0.7× vertical
The differential is what separates them in space during the morph.

### Pointer camera drift
A lagging pointer-follow (`lerp 0.045`) applied to the stage. **Deliberately tiny** —
a couple of percent of the viewport. Enough that the frame feels hand-held rather than
locked off; not enough that anyone can name what moved. Disabled on coarse pointers.

### Spotlight
`Spotlight.tsx` — a single soft radial key light behind the figure that drifts with the
pointer at `lerp 0.045` (slower than the cursor's 0.18, so it reads as a heavy fixture
rather than something stuck to the mouse). Painted once into its own layer, then only
ever translated. `reach` defaults to 4% of viewport.

### Smoothing — the most important number
```ts
const FILM_LERP = 0.075;
```
The film chases the scroll position rather than reading it directly. Reading it directly
couples the garment rigidly to the wheel and every notch lands as a discrete step.
Chasing gives the whole stage inertia — it arrives a beat after the input and *settles*
rather than stops. **This single value is what makes it read as a camera move instead
of a scrubbed timeline.** Lower is heavier.

### Easing
`stopsAt()` applies **smoothstep between every pair of stops**, not linear
interpolation. Linear gives each stop a visible corner — the eye reads the exact frame
a value starts and stops changing. Nothing on the stage begins or ends abruptly.

---

## 12. Purchase flow

1. Scroll to the end of the film (progress ≥ 0.78). The purchase panel rises in.
2. `AddToBag` — size selector. **Sold-out sizes stay visible, struck through and
   disabled.** A size run with gaps tells the customer their size sold out; a shortened
   list just looks like it was never made.
3. Quantity is capped against `remaining = variant.quantity − alreadyInCart`, enforced
   both in the UI and again in the store (last line of defence).
4. `CartDrawer` (Radix Dialog) — line items, quantity steppers, subtotal, remove.
   Shows "No longer available" for withdrawn pieces rather than silently dropping them.
5. **Checkout is a stub.** The button is disabled when empty and otherwise does nothing.
   This is the main functional gap.

**`pointerEvents` on the purchase panel is `none` until opacity > 0.9**, so an invisible
panel can never intercept a click meant for the film behind it.

---

## 13. Performance

**Measured on the production build, 1280×800, real wheel-driven scroll through 6,495px:**
```
median frame   16.7 ms
p95 frame      16.8 ms
worst frame    33.2 ms  (one dropped frame)
frames > 20ms  1 / 236  (0.4%)
effective      60 fps
```

Mobile (390×844): **246 kB JS**, 271 DOM nodes, no horizontal overflow.

### What buys that
- **Only `transform` and `opacity` are animated.** Verified by grep: no animated
  `width`/`height`/`top`/`left`/`margin`/`padding` anywhere.
- **The header condense uses paint-only properties.** It originally transitioned
  `padding`, which reflows the document on a fixed element during scroll — the most
  expensive place in the page to do it. The height is now constant and the brand mark
  scales (a transform) instead.
- **`backdrop-blur` is toggled, never transitioned.** Animating a backdrop filter
  forces a re-blur of everything behind it every frame.
- **One rAF loop** for the entire film stage. React re-renders zero times during scroll.
- **Grain is a transform-animated noise tile** with `steps(1)`, so the GPU composites it
  and nothing repaints. Animating `background-position` would repaint fullscreen.
- **AVIF-first** image config (`next.config.ts`), verified negotiating correctly.
- **Named imports from `motion/react`** — namespace imports defeated tree-shaking and
  cost 24 kB (276 → 252 kB).

---

## 14. Design decisions and hard-won gotchas

### Palette — MEASURED, not chosen
Every colour was sampled from the brand renders with `scripts/sample-print-colour.mjs`.

An initial read called the garment print a warm champagne-taupe (`#C4B9A6`, R−B +30).
**Measuring the brightest percentile of actual print pixels returned warmth (R−B) of
0 to +6 across all five sampled regions — i.e. neutral.** The accent is a silver.
Warmth is what drags this category toward the black-and-gold cliché.

| Token | Value | Role |
|---|---|---|
| `--color-void` | `#08080a` | primary ground |
| `--color-ink` | `#131315` | raised surfaces |
| `--color-graphite` | `#1e1e21` | hairlines on dark |
| `--color-line` | `#2a2a2e` | dividers, borders |
| `--color-ash` | `#7a7a7e` | tertiary text |
| `--color-stone` | `#8a8a86` | secondary text |
| `--color-silver` | `#b4b2ac` | **THE ACCENT** — measured print colour |
| `--color-bone` | `#e8e8e6` | primary text on void |
| `--color-studio-*` | `#cdcdcf → #e6e6e6` | reconstructed cyclorama gradient |

**`--color-ash` was raised from `#55555A`, which measured 2.7:1 on void — below AA for
the 11px labels it was used on.** It now clears 4.5:1. `--color-line` was introduced so
borders keep the old darker value. **Do not use `ash` below 4.5:1 again.**

Contrast (measured): silver 9.44:1, stone 5.77:1, bone 16.31:1 — all pass AA.

### Typography
- **Display:** Bodoni Moda — hairline Didone matching the garment's serif wordmark.
  Never set below ~24px; its hairlines break up.
- **Interface:** Geist Sans — deliberately anonymous.
- **Signature:** Italianno — the "No Risk No Rich" script. Set in a real calligraphic
  face rather than hand-authored SVG paths.
- Hero wordmark is **`11.8vw`, measured not chosen**: eleven characters at the display
  face's advance widths plus `0.08em` tracking come to ~7.8em, landing the word at ~92%
  of the viewport at every width. **At 19vw it overflowed by 47% and read "MILLIONA".**

### ⚠️ Tailwind v4 gotchas that cost real time
1. **`@theme` only emits variables in namespaces Tailwind recognises.** `--duration-*`
   is *not* one. Declaring durations inside `@theme` silently dropped them, so every
   `duration-(--duration-micro)` resolved to nothing **and took the reduced-motion
   override down with it.** Duration tokens therefore live in a plain `:root` block.
2. **Rules in `@layer base` lose to Tailwind utilities regardless of specificity.**
   `display:none` in base cannot beat `flex` in utilities. All document-state overrides
   (`data-preloader`, `data-custom-cursor`) are therefore **unlayered** — unlayered
   rules outrank every layer.
3. **`tailwind-merge` silently deletes custom utilities.** It bucketed `text-overline`
   as a *text colour*, so `cn("text-overline", "text-silver")` dropped it — every
   `<Overline tone="…">` rendered in sentence case while an identical hard-coded
   className rendered correctly. **`lib/utils/cn.ts` now declares the custom utilities
   in their real groups. Any new `@utility` in globals.css must be added there.**

### Preloader
- Gates on `document.fonts.ready`, not a timer.
- **Hard 2.6s rescue timer that owes nothing to rAF.** The sequence `await`s animation
  promises, which only settle when the browser produces frames — a backgrounded or
  throttled tab could stall it forever, and because the hero waits for the overlay to
  lift, a stalled intro leaves a **permanently black screen**. This was a real observed
  failure, not a theoretical one.
- Once per session via `sessionStorage`.
- **The bootstrap script must be a raw inline `<script>` in `<head>`.**
  `next/script strategy="beforeInteractive"` does *not* emit an executable tag — it
  pushes onto Next's `self.__next_s` queue, drained by the framework runtime **after
  first paint**, which reintroduces the flash it exists to prevent.
- `suppressHydrationWarning` on `<html>` is required, not incidental — the script writes
  an attribute before React hydrates.

### Accessibility
- **Reduced motion is enforced at the token level** — collapsing the duration custom
  properties neutralises any animation built on them. A contributor cannot ship an
  inaccessible transition by forgetting a media query.
- `OutfitFilm` has a **complete alternative presentation** under reduced motion
  (`FilmStatic`) — not a degraded version. The same story as a printed spread: wordmark,
  then each chapter beside a fixed angle, then purchase. Nothing pinned, nothing lost.
- **`<noscript>` fallback resets inline `opacity:0`/`transform`.** `motion` serialises
  its `initial` state into the server HTML — 27 elements shipped hidden — so without
  JavaScript most of the page was permanently invisible.
- Custom cursor never mounts on coarse pointers or under reduced motion, and never
  hides the caret over text inputs.
- All images carry `alt` (empty for decorative). Single `h1` per page.

### UI/UX philosophy
- **No radii anywhere.** A radius reads as friendly; this brand is not.
- Controls are square with tracked uppercase type — signage, not app widgets.
- **No inline nav link bar.** Wordmark left, `Menu` / `Bag` right at every breakpoint;
  navigation opens as a full-screen overlay. It reads better and scales as categories grow.
- The only looping animation in the layout is the hero scroll cue, which earns it by
  carrying information.
- Product imagery uses **lit studio plates on a black page** — the renders' own
  cyclorama becomes the composition rather than something to fight.
- `.bg-studio` reconstructs the sampled cyclorama gradient so product-image edges
  dissolve into the page.

---

## 15. Garment matting — `scripts/extract-cutouts.mjs`

The renders ship on an opaque backdrop, so the figure could only ever sit in a light
rectangle. Matting frees it to float on the void and be layered with type.

**Two things a naive luminance threshold gets wrong, both handled:**

1. **It erases the print.** The chest wordmark and thigh crest are silver — lighter than
   any cut-off — so brightness alone deletes exactly the branding the garment exists to
   carry. The test is therefore **topological**: true backdrop is the region connected
   to the frame edge, found by flood fill. The print is enclosed by garment, so the fill
   never reaches it.
2. **Colour decontamination.** An antialiased edge pixel is a blend of black garment and
   light backdrop; keeping it grey and merely lowering alpha leaves a pale halo — the
   tell of a bad cutout. Observed colour is `a·F + (1−a)·B`, so with the local background
   `B` sampled **per row** (the cyclorama is vignetted) we solve for true foreground `F`.

Verified against a magenta background — no fringing, print intact, drawstrings preserved.

---

## 16. Testing

`npm run test:commerce` runs **32 headless assertions** covering catalogue queries,
money arithmetic, status derivation and the cart persistence round-trip.

It runs through `scripts/ts-loader.mjs`, a ~60-line Node module resolver handling the
`@/` alias, extensionless relative imports, and stubbed static image imports.

**Two gotchas baked into that harness:**
- Resolved `.ts` files must be reported as `format: "module-typescript"` or Node skips
  type stripping. Candidate matching must check `isFile()` — `@/lib/commerce` names a
  directory too.
- **zustand's default persist storage is `createJSONStorage(() => window.localStorage)`
  — `window.`, not the bare global.** Under Node a `localStorage` shim alone is not
  enough; without a `window` the access throws, zustand swallows it, and persistence is
  **silently** disabled while every other operation keeps working.
- `persist` writes on every state change, so a test that clears the store to fake a fresh
  page load **wipes the storage entry it is about to assert on**. Snapshot and restore.

There are **no component or E2E tests.** This is a gap.

---

## CURRENT STATUS

### ✅ Completed

**Phase 0 — Environment**
- Node 24.18.1 installed; Next 16 + React 19 + TS strict + Tailwind v4 scaffolded
- ESLint, Prettier (+ Tailwind class sorting), `verify` gate
- Security headers, `poweredByHeader: false`, AVIF-first image config
- Git initialised; **one commit exists: `6271361` (phases 0–3)**

**Phase 1 — Brand foundation**
- Full measured token system; Bodoni Moda / Geist / Italianno via `next/font`
- Wordmark (real text, splittable), Monogram (original stroked heraldic M crest),
  Signature
- Lenis smooth scroll; custom magnetic cursor; motion tokens
- Reference renders processed to optimised `.jpg`; `/styleguide` route

**Phase 2 — Shell**
- Header (condenses on scroll, carries FLIP landing target)
- Full-screen NavOverlay (Radix, focus-trapped, Escape, sibling `aria-hidden`)
- Footer, CartDrawer, `(site)` route group, ComingSoon placeholders
- Cinematic Preloader with FLIP hand-off — **measured landing error: 0.000px on width
  and both centre axes**

**Phase 3 — Commerce layer**
- Typed commerce boundary, local provider, derived status
- Persisted zustand bag with SSR-safe deferred hydration
- `/products/[slug]` (5 pages, SSG); 32 headless tests

**Phase 4 — Atmosphere (partly superseded by Phase 5)**
- Garment cutouts with flood-fill matting and colour decontamination
- Grain layer, Spotlight, resolution-agnostic hero descriptor

**Phase 5 — Single-product film (current homepage)**
- Wordmark-only opening screen
- Wordmark → garment morph
- Three cinematic chapters with the product persisting throughout
- Purchase as the final chapter
- Product grid, collection page and related products **removed**

**Final polish**
- `FILM_LERP` inertia smoothing; smoothstep easing between all stops
- True `rotateY` 3D rotation with `perspective: 1600px`
- Pointer camera drift + differential plane parallax
- Non-overlapping panel handoffs (max 1 legible text block anywhere)
- **60fps verified** on production build

### ❌ Removed (deliberately — do not reinstate without instruction)
| Removed | Reason |
|---|---|
| `sections/Hero.tsx` | Superseded by the film's opening |
| `sections/Story.tsx` | Became Chapter I |
| `sections/FeaturedCollection.tsx` | Client: **no product grid** |
| `sections/Lookbook.tsx` | Client: minimal, one product |
| `sections/Philosophy.tsx` | Chapters carry the message |
| `product/ProductCard.tsx` | Only used by the removed grid |
| `experience/Turnaround360.tsx` | Superseded by `OutfitFilm` |
| `app/(site)/collections/` | Client: **no collection page** |
| Nav "Collections" link | Replaced by "The Set" → `/#purchase` |

### ⚠️ Known issues
1. **Checkout does nothing.** The button is disabled when empty and inert otherwise.
2. **Mirrored-frame crest artefact** — the thigh crest appears on the wrong leg in
   synthesised frames (270°, 325°).
3. **~19% of the rotation still shows two frames** during handover. Inherent to four
   source angles.
4. **`/drops`, `/lookbook`, `/about`, `/archive` are `ComingSoon` placeholders** but are
   linked from nav and footer.
5. **`/products/[slug]` still exists for all 5 products** including the four the house
   no longer sells as separate items. It is reachable and SSG'd. Possibly contradicts
   "only one product".
6. **`/styleguide` documents removed components** (ProductCard etc.) and will drift.
7. **3 npm audit highs** — `postcss` and `sharp` pinned inside Next 16. `npm audit fix
   --force` downgrades Next to **9.3.3**. **Never run it.** Build-time only.
8. **31 uncommitted files.** Phases 4–5 are not committed.
9. **No component or E2E tests.**
10. **Lookbook/Marquee/Reveal components may now be unused** — needs a dead-code sweep.
11. Hero assets are only **1024×1024**; the film never upscales past native, which
    constrains composition.

---

## TODO

1. **Commit phases 4–5.** 31 files are uncommitted; only `6271361` exists.
2. Wire a real checkout (Shopify Storefront API or a payment stub).
3. Decide the fate of `/products/[slug]` — remove, or keep as canonical detail pages.
4. Build `/drops` properly (Phase 6): countdown, waitlist, sold-out, archive.
   `catalog.ts` already models `drp-arcx` (live) and `drp-noctis` (product-less teaser).
5. Build `/about` and `/lookbook`, or remove them from nav and footer.
6. Wire the newsletter (`TheList`) and drop waitlist to a real endpoint.
7. Dead-code sweep: `Marquee`, `Reveal`, `Rule`, `lib/media` hero descriptors,
   `millionaireSetTurnaround` (non-cutout) may be orphaned.
8. Update or delete `/styleguide` — it references removed components.
9. Add component tests for `OutfitFilm` timeline maths (`stopsAt`, `angleAt`) —
   pure functions, trivially testable, currently untested.
10. Add E2E coverage for the purchase flow.
11. Commission a **24–36 frame turntable render** — the highest-value asset upgrade.
12. Commission a higher-resolution hero master (current: 1024²).
13. Lighthouse audit on the production build; target 95+ perf / 100 a11y.
14. Add `.gitattributes` (`* text=auto eol=lf`) — ~50 CRLF warnings on commit.
15. Real pricing (currently placeholder $180–$890) and real copy review.
16. Add a CSP once runtime origins are known (deliberately deferred).
17. Screen-reader pass on the film — the chapters are visually sequenced but a
    screen reader encounters all of them at once in DOM order.
18. Decide whether `arcx-mfta-hoodie` (drop product) is still in scope.

---

## NEXT SESSION

**Start here, in this order:**

### 1. Commit the work (5 minutes, do this first)
31 files are uncommitted. The repo has exactly one commit (`6271361`, phases 0–3).
Everything from the cutout pipeline through the film is at risk.

```bash
npm run verify   # must pass first
git add -A
git commit       # message: "Build single-product cinematic film homepage (phases 4-5)"
```
Git identity is already set **repo-locally**: `Mohamed <mafarjeh1975@gmail.com>`.
Note: `.claude/settings.local.json` is gitignored deliberately — it contains absolute
paths and a saved grant for a command that broke the browser tooling.

### 2. Resolve the `/products/[slug]` contradiction (decision required from the client)
The client said "only one premium purchase experience for the complete set", but five
product pages are still generated and linked from the cart drawer.
**Ask before deleting** — the cart links to them, so removing them breaks that link.

### 3. Then: Phase 6 — Drops
`lib/commerce/local/catalog.ts` already models everything needed:
- `drp-arcx` — live, one product, `releaseAt: 2026-07-18`
- `drp-noctis` — **deliberately product-less** teaser, `releaseAt: 2026-11-14`, so the
  waitlist/announcement state has a real case to render
- `resolveDropStatus()` in `lib/commerce/status.ts` derives `upcoming | live | sold-out
  | archived` from an **explicit `now`** — pass the same instant to server and client or
  the page will say "live" on the server and "sold out" in the browser.

Replace `app/(site)/drops/page.tsx` (currently `ComingSoon`).

---

## Working practices (client-stated)

- Act as senior frontend engineer, luxury brand creative director and UI/UX designer.
- Never produce generic ecommerce design.
- Choose the most production-ready option by default; do not ask unnecessary
  implementation questions.
- **Summarise at the end of every phase and wait for approval before the next.**
- The client asked for **extremely short replies** during execution — make the change,
  verify it, state pass/fail in one sentence. Ask only when a decision is genuinely
  theirs.

## Environment notes (this machine)

- **Never run `Get-Process node | Stop-Process -Force`.** It kills processes the browser
  tooling depends on and disables preview for the rest of the session. Stop only the
  specific PID on port 3000:
  ```
  (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess
  ```
- The shell may not have Node on `PATH`. Rebuild it per command:
  ```
  $env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")
  ```
- `Move-Item` fails on the `SMRIIT~1` 8.3 short path — resolve with
  `(Get-Item -LiteralPath …).FullName` first.
- **Never use PowerShell `Get-Content`/`Set-Content` for bulk text replacement** — it
  corrupted UTF-8 em-dashes into mojibake. Use `[System.IO.File]::ReadAllText` /
  `WriteAllText` with `New-Object System.Text.UTF8Encoding($false)`.
- Lenis fights direct `scrollTop` writes during browser testing. To hold a scroll
  position for measurement, re-assert it in a loop (~40 × 40ms), or drive with real
  `WheelEvent`s.
