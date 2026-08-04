"use client";

import { useScroll } from "motion/react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { AddToBag } from "@/components/product/AddToBag";
import { Spotlight } from "@/components/experience/Spotlight";
import { Overline } from "@/components/ui/Overline";
import type { Product } from "@/lib/commerce";
import { formatMoney } from "@/lib/commerce";
import { millionaireSetTurnaroundCutout } from "@/lib/media/assets";
import { useMotionPreference } from "@/lib/motion/useMotionPreference";

/**
 * Scroll timeline, in progress units across the whole film.
 *
 * Written as one table because every element is choreographed against the same
 * clock — the wordmark, the figure's position, its rotation and four blocks of
 * type all read from these numbers. Scattering the ranges through the markup
 * is how a sequence like this drifts out of sync.
 */
const T = {
  wordHold: 0.06,
  morphStart: 0.08,
  morphEnd: 0.18,
  ch1: 0.26,
  ch1End: 0.38,
  ch2: 0.46,
  ch2End: 0.56,
  ch3: 0.64,
  ch3End: 0.74,
  buy: 0.82,
} as const;

/** Camera angle the garment holds during each chapter. */
const ANGLE_STOPS: readonly [number, number][] = [
  [T.morphEnd, 0],
  [T.ch1, 35],
  [T.ch2, 90],
  [T.ch3, 180],
  [T.buy, 360],
];

const normalise = (a: number) => ((a % 360) + 360) % 360;
const BLEND_START = 0.34;
const BLEND_END = 0.66;

type Chapter = {
  overline: string;
  title: string;
  body: string;
  notes?: readonly { term: string; detail: string }[];
};

const CHAPTERS: readonly Chapter[] = [
  {
    overline: "Chapter I — Material",
    title: "One cloth,\nnothing beneath it.",
    body: "480gsm loopback cotton, spun long-staple so the face stays flat and the loop holds its depth. Garment dyed in a single black bath — the colour is in the fibre, not printed over it.",
    notes: [
      { term: "Weight", detail: "480gsm loopback" },
      { term: "Dye", detail: "Garment dyed, single bath" },
      { term: "Hand", detail: "Brushed interior, dry face" },
    ],
  },
  {
    overline: "Chapter II — Construction",
    title: "Stitched to be\nturned inside out.",
    body: "Flatlock seams throughout, taped at the shoulder so nothing rubs under a hood. The interior is finished to the same standard as the face, because a garment worn this close is judged from both sides.",
    notes: [
      { term: "Seams", detail: "Flatlock, taped shoulders" },
      { term: "Hood", detail: "Double layer, self-supporting" },
      { term: "Cuff", detail: "Ribbed 2×2, fixed" },
    ],
  },
  {
    overline: "Chapter III — Specification",
    title: "Everything,\nand no more.",
    body: "Three pieces, one weight, one colour. The crest sits at the thigh and the wordmark at the chest, both in tonal silver — legible at arm's length and invisible across a room.",
    notes: [
      { term: "Pieces", detail: "Hood, jogger, balaclava" },
      { term: "Marks", detail: "Chest wordmark, thigh crest" },
      { term: "Origin", detail: "Made in Portugal" },
    ],
  },
];

/**
 * The film.
 *
 * One continuous shot. The wordmark opens alone on a black screen, dissolves
 * into the garment as the page begins to move, and the garment then stays —
 * crossing the frame, turning through a full revolution, and finally settling
 * where it can be bought.
 *
 * The point is that the product never leaves. Conventional pages introduce a
 * garment, scroll it away, and reintroduce it in a grid; here there is a single
 * object that the copy moves around. That is what makes it read as a film
 * rather than as a page of sections, and it is why everything below shares one
 * sticky stage and one scroll clock.
 *
 * Rotation reuses the turnaround frames, so the "3D" is real photography
 * blended between shot angles rather than a model — and it costs six images.
 */
export function OutfitFilm({ product }: { product: Product }) {
  const motionAllowed = useMotionPreference();
  if (!motionAllowed) return <FilmStatic product={product} />;
  return <FilmLive product={product} />;
}

/**
 * Piecewise-linear interpolation across a table of [input, output] stops,
 * clamped at both ends.
 *
 * Everything on the stage is driven through this rather than through
 * `useTransform`. That is a deliberate correction: motion's transform writes
 * (`scale`, `translateX`) update correctly here, but its `opacity` and
 * `filter` values were measured frozen at their initial output at every scroll
 * position — so the wordmark never dissolved and the garment never appeared.
 * Driving all of it from the same rAF loop that already paints the frame stack
 * removes the split entirely: one clock, one write path, nothing to get out of
 * step.
 */
function stopsAt(p: number, stops: readonly (readonly [number, number])[]): number {
  const first = stops[0]!;
  const last = stops[stops.length - 1]!;
  if (p <= first[0]) return first[1];
  if (p >= last[0]) return last[1];
  for (let i = 1; i < stops.length; i++) {
    const [pa, va] = stops[i - 1]!;
    const [pb, vb] = stops[i]!;
    if (p <= pb) {
      // Smoothstep between stops rather than a straight line. Linear
      // interpolation gives every stop a visible corner — the eye reads the
      // exact frame a value starts and stops changing, which is what makes a
      // scroll timeline feel mechanical. Easing each segment in and out means
      // nothing on the stage ever begins or ends abruptly.
      const t = (p - pa) / (pb - pa);
      return va + t * t * (3 - 2 * t) * (vb - va);
    }
  }
  return last[1];
}

/**
 * How quickly the film catches up to the scrollbar.
 *
 * The single most important number here. Reading scroll position directly
 * couples the garment rigidly to the wheel, so every notch of a mouse wheel
 * lands as a discrete step. Chasing the target instead gives the whole stage
 * inertia — it arrives a beat after the input and settles rather than stops,
 * which is what makes the sequence read as a camera move instead of a
 * scrubbed timeline. Lower is heavier.
 */
const FILM_LERP = 0.075;

/** Degrees of Y-rotation applied per degree of turn away from camera. */
const ROTATION_DEPTH = 0.55;

const WORD_OPACITY = [
  [0, 1],
  [T.wordHold, 1],
  [T.morphEnd - 0.02, 0],
] as const;
const WORD_SCALE = [
  [0, 1],
  [T.morphStart, 1],
  [T.morphEnd, 1.28],
] as const;
const WORD_BLUR = [
  [T.morphStart, 0],
  [T.morphEnd, 9],
] as const;
const FIG_OPACITY = [
  [T.morphStart, 0],
  [T.morphEnd, 1],
] as const;
const FIG_X = [
  [T.morphEnd, 0],
  [T.ch1, 24],
  [T.ch1End, 24],
  [T.ch2, -24],
  [T.ch2End, -24],
  [T.ch3, 0],
] as const;
const FIG_SCALE = [
  [T.morphStart, 0.9],
  [T.morphEnd, 1],
  [T.ch3End, 1],
  [T.buy, 1.05],
] as const;

/**
 * In, hold, out — one row per chapter, in the order they appear.
 *
 * Each block is fully gone before the next begins, with a short beat of empty
 * frame between. Overlapping the ranges — the obvious way to write this — put
 * two blocks of type in the same place at the same time: on desktop Chapter III
 * was still dissolving while the purchase panel arrived over it, and on narrow
 * screens, where every chapter sits at the foot of the frame, *every* handover
 * did the same thing.
 *
 * A held beat of nothing is also better cinema than a crossfade. The garment
 * carries the cut on its own.
 */
const PANEL_RANGES: readonly (readonly [number, number, number, number])[] = [
  [0.2, 0.26, 0.34, 0.39],
  [0.41, 0.47, 0.53, 0.58],
  [0.6, 0.66, 0.7, 0.755],
];

/** The purchase panel arrives only once Chapter III has left the frame. */
const BUY_OPACITY = [
  [0.78, 0],
  [0.86, 1],
] as const;
const BUY_Y = [
  [0.78, 30],
  [0.86, 0],
] as const;

function FilmLive({ product }: { product: Product }) {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRefs = useRef<(HTMLDivElement | null)[]>([]);
  const wordRef = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const purchaseRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  /**
   * The whole stage, painted from one rAF loop.
   *
   * Direct style writes rather than React state — at sixty frames a second a
   * re-render per frame would be the most expensive thing on the page.
   */
  useEffect(() => {
    const frames = millionaireSetTurnaroundCutout.frames;
    let raf = 0;
    // Lagging copy of the scroll position, and a lagging copy of the pointer.
    let smoothed = scrollYProgress.get();
    const camera = { x: 0, y: 0, tx: 0, ty: 0 };

    const reduced = window.matchMedia("(pointer: coarse)").matches;
    const onPointerMove = (event: PointerEvent) => {
      // Camera drift is deliberately tiny — a couple of percent of the
      // viewport. Enough that the frame feels hand-held rather than locked
      // off; not enough that anyone can point at what moved.
      camera.tx = (event.clientX / window.innerWidth - 0.5) * 2;
      camera.ty = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    if (!reduced)
      window.addEventListener("pointermove", onPointerMove, { passive: true });

    const angleAt = (p: number) => {
      if (p <= ANGLE_STOPS[0]![0]) return ANGLE_STOPS[0]![1];
      for (let i = 1; i < ANGLE_STOPS.length; i++) {
        const [pa, aa] = ANGLE_STOPS[i - 1]!;
        const [pb, ab] = ANGLE_STOPS[i]!;
        if (p <= pb) return aa + ((p - pa) / (pb - pa)) * (ab - aa);
      }
      return ANGLE_STOPS[ANGLE_STOPS.length - 1]![1];
    };

    const tick = () => {
      // Everything downstream reads the eased value, never the raw one.
      smoothed += (scrollYProgress.get() - smoothed) * FILM_LERP;
      camera.x += (camera.tx - camera.x) * 0.045;
      camera.y += (camera.ty - camera.y) * 0.045;
      const p = smoothed;

      if (wordRef.current) {
        wordRef.current.style.opacity = stopsAt(p, WORD_OPACITY).toFixed(3);
        // The wordmark takes the camera at half strength, the figure at full —
        // the difference is what separates them in depth during the morph.
        wordRef.current.style.transform = `translate3d(${(camera.x * 0.6).toFixed(2)}%, ${(camera.y * 0.4).toFixed(2)}%, 0) scale(${stopsAt(p, WORD_SCALE).toFixed(4)})`;
        wordRef.current.style.filter = `blur(${stopsAt(p, WORD_BLUR).toFixed(2)}px)`;
      }

      if (figureRef.current) {
        figureRef.current.style.opacity = stopsAt(p, FIG_OPACITY).toFixed(3);
        figureRef.current.style.transform = `translate3d(${(stopsAt(p, FIG_X) + camera.x * 1.1).toFixed(2)}%, ${(camera.y * 0.7).toFixed(2)}%, 0) scale(${stopsAt(p, FIG_SCALE).toFixed(4)})`;
      }

      // Chapter copy: fade up on arrival, hold, fade out as the next begins.
      for (let i = 0; i < PANEL_RANGES.length; i++) {
        const el = panelRefs.current[i];
        if (!el) continue;
        const [inStart, inEnd, outStart, outEnd] = PANEL_RANGES[i]!;
        const o = stopsAt(p, [
          [inStart, 0],
          [inEnd, 1],
          [outStart, 1],
          [outEnd, 0],
        ]);
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translate3d(0,${stopsAt(p, [
          [inStart, 26],
          [inEnd, 0],
        ]).toFixed(1)}px,0)`;
      }

      if (purchaseRef.current) {
        const o = stopsAt(p, BUY_OPACITY);
        purchaseRef.current.style.opacity = o.toFixed(3);
        purchaseRef.current.style.transform = `translate3d(0,${stopsAt(p, BUY_Y).toFixed(1)}px,0)`;
        // Only clickable once it has actually arrived, so an invisible panel
        // can never intercept a click meant for the film behind it.
        purchaseRef.current.style.pointerEvents = o > 0.9 ? "auto" : "none";
      }

      const angle = normalise(angleAt(p));

      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i]!;
        let delta = frame.angle - angle;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;

        const next = frames[(i + 1) % frames.length]!;
        const prev = frames[(i - 1 + frames.length) % frames.length]!;
        const gap = Math.max(
          normalise(next.angle - frame.angle),
          normalise(frame.angle - prev.angle),
        );

        const t = Math.min(1, Math.abs(delta) / gap);
        const ramp = Math.min(
          1,
          Math.max(0, (t - BLEND_START) / (BLEND_END - BLEND_START)),
        );
        const opacity = 1 - ramp * ramp * (3 - 2 * ramp);

        /*
           Real rotation, not a slideshow.

           Each frame is turned about the vertical axis in proportion to how far
           the camera has moved past it, inside a parent carrying perspective.
           A frame being turned away from leans back and foreshortens exactly as
           a solid object would, while the incoming frame swings in to meet it.
           With the crossfade on top, the handover reads as one object rotating
           rather than two photographs being exchanged — which is the whole
           difference between this and a gallery.

           Mirrored frames negate the rotation as well as the scale, or they
           would lean the wrong way.
        */
        const facing = frame.mirrored ? -1 : 1;
        const rotateY = Math.max(-40, Math.min(40, delta * ROTATION_DEPTH));
        const shift = Math.max(-14, Math.min(14, -delta * 0.16));

        const el = frameRefs.current[i];
        if (el) {
          el.style.opacity = opacity.toFixed(3);
          el.style.transform = `translate3d(${shift.toFixed(1)}px,0,0) rotateY(${(rotateY * facing).toFixed(2)}deg) scaleX(${facing})`;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [scrollYProgress]);

  return (
    <section
      ref={sectionRef}
      className="relative bg-void"
      style={{ height: "760svh" }}
      aria-label="The MILLIONAIRE hooded set"
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        <Spotlight className="top-[4%] left-1/2 h-[80svh] w-[80svh] -translate-x-1/2" />

        {/* Scrim under the chapter copy on narrow screens, where the type sits
            over the garment rather than beside it. Absent from lg up. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[62svh] bg-gradient-to-t from-[#08080a] via-[#08080a]/88 to-transparent lg:hidden"
        />

        {/* The opening frame: the wordmark, alone. */}
        <div
          ref={wordRef}
          style={{ opacity: 1 }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center will-change-[opacity,transform,filter]"
        >
          <h1 className="block font-display text-[11.8vw] leading-none tracking-[0.08em] whitespace-nowrap text-bone uppercase select-none">
            Millionaire
          </h1>
        </div>

        {/* The garment. */}
        <div
          ref={figureRef}
          style={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center will-change-[opacity,transform]"
        >
          {/* Perspective lives here so the frames inside can genuinely rotate
              in depth rather than just squash horizontally. */}
          <div
            className="relative h-[78svh] w-[78svh] max-w-[92vw]"
            style={{ perspective: "1600px", transformStyle: "preserve-3d" }}
          >
            {millionaireSetTurnaroundCutout.frames.map((frame, index) => (
              <div
                key={`${frame.angle}-${frame.mirrored}`}
                ref={(node) => {
                  frameRefs.current[index] = node;
                }}
                className="absolute inset-0 will-change-[opacity,transform]"
                style={{ opacity: index === 0 ? 1 : 0 }}
              >
                <Image
                  src={frame.src}
                  alt={index === 0 ? millionaireSetTurnaroundCutout.alt : ""}
                  priority={index < 2}
                  sizes="(max-width: 768px) 92vw, 78vh"
                  className="h-full w-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Chapters I–III. */}
        {CHAPTERS.map((chapter, index) => (
          <ChapterPanel
            key={chapter.overline}
            chapter={chapter}
            ref={(node) => {
              panelRefs.current[index] = node;
            }}
            // I sits left of the figure, II right, III centred beneath it.
            side={index === 0 ? "left" : index === 1 ? "right" : "centre"}
          />
        ))}

        {/* Final chapter — the only thing for sale. */}
        <PurchasePanel product={product} ref={purchaseRef} />
      </div>
    </section>
  );
}

function ChapterPanel({
  chapter,
  side,
  ref,
}: {
  chapter: Chapter;
  side: "left" | "right" | "centre";
  ref: (node: HTMLDivElement | null) => void;
}) {
  /*
     Below `lg` there is not enough width to set type beside the figure, so
     every chapter drops to the foot of the frame over a scrim. Keeping the
     side positions on a phone put the copy directly across the garment with
     nothing separating them, and both became hard to read.
  */
  const position =
    side === "left"
      ? "lg:left-(--spacing-gutter) lg:max-w-[26rem] lg:translate-y-0"
      : side === "right"
        ? "lg:right-(--spacing-gutter) lg:left-auto lg:max-w-[26rem] lg:text-right lg:translate-y-0"
        : "lg:left-1/2 lg:w-[min(46rem,86vw)] lg:-translate-x-1/2 lg:text-center";

  /*
     Two elements, not one. The outer div owns placement — including the
     `-translate-y-1/2` that centres a side chapter — while the inner div is
     the only thing the scroll loop writes to. Animating transform on the same
     element that uses a transform for layout would overwrite the centring on
     the first frame.
  */
  return (
    <div
      className={[
        "pointer-events-none absolute inset-x-(--spacing-gutter) bottom-[9svh]",
        side === "centre"
          ? "lg:bottom-[8svh]"
          : "lg:top-1/2 lg:bottom-auto lg:-translate-y-1/2",
        position,
      ].join(" ")}
    >
      <div ref={ref} style={{ opacity: 0 }} className="will-change-[opacity,transform]">
        <Overline tone="silver">{chapter.overline}</Overline>
        <h2 className="mt-6 font-display text-[clamp(1.75rem,3.4vw,3rem)] leading-[1.1] tracking-[0.02em] whitespace-pre-line text-bone">
          {chapter.title}
        </h2>
        <p className="mt-7 text-(length:--text-body) leading-relaxed text-stone">
          {chapter.body}
        </p>

        {chapter.notes ? (
          <dl
            className={`mt-9 border-t border-line ${side === "centre" ? "grid grid-cols-3 gap-6 pt-5" : ""}`}
          >
            {chapter.notes.map((note) => (
              <div
                key={note.term}
                className={
                  side === "centre"
                    ? ""
                    : "flex items-baseline gap-6 border-b border-line py-3"
                }
              >
                <dt className="shrink-0 text-overline text-ash">{note.term}</dt>
                <dd className="text-(length:--text-caption) text-stone">{note.detail}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </div>
  );
}

function PurchasePanel({
  product,
  ref,
}: {
  product: Product;
  ref: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      id="purchase"
      ref={ref}
      style={{ opacity: 0, pointerEvents: "none" }}
      className="absolute inset-x-0 bottom-0 px-(--spacing-gutter) pb-[6svh] will-change-[opacity,transform]"
    >
      <div className="mx-auto max-w-[1600px] bg-void/70 backdrop-blur-md">
        <div className="flex flex-col gap-8 border-t border-line pt-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Overline tone="silver">The complete set</Overline>
            <h2 className="mt-4 font-display text-[clamp(1.75rem,3vw,2.75rem)] leading-none tracking-[0.02em] text-bone">
              {product.title}
            </h2>
            <p className="mt-4 max-w-[38ch] text-(length:--text-caption) leading-relaxed text-stone">
              Hood, jogger and balaclava. Sold only as a set — the pieces were cut to be
              worn together.
            </p>
          </div>

          <div className="lg:text-right">
            <p className="text-(length:--text-display-md) text-bone tabular-nums">
              {formatMoney(product.price)}
            </p>
          </div>
        </div>

        <div className="mt-10 pb-2">
          <AddToBag product={product} />
        </div>
      </div>
    </div>
  );
}

/**
 * Reduced-motion presentation.
 *
 * A film that depends on scroll choreography cannot simply have its motion
 * removed — it would be four blocks of type stacked on one image. So this is
 * the same story told as a printed spread: the wordmark, then each chapter
 * beside a fixed angle of the garment, then the purchase. Nothing is pinned,
 * nothing moves, and nothing is lost.
 */
function FilmStatic({ product }: { product: Product }) {
  const shot = millionaireSetTurnaroundCutout.frames.filter((f) => !f.mirrored);

  return (
    <section className="bg-void" aria-label="The MILLIONAIRE hooded set">
      <div className="flex h-svh items-center justify-center px-(--spacing-gutter)">
        <h1 className="font-display text-[11.8vw] leading-none tracking-[0.08em] whitespace-nowrap text-bone uppercase">
          Millionaire
        </h1>
      </div>

      {CHAPTERS.map((chapter, index) => (
        <div
          key={chapter.overline}
          className="mx-auto grid max-w-[1600px] items-center gap-14 px-(--spacing-gutter) py-(--spacing-section) lg:grid-cols-2"
        >
          <div className={index === 1 ? "lg:order-2" : ""}>
            <Image
              src={(shot[index] ?? shot[0]!).src}
              alt={`${millionaireSetTurnaroundCutout.alt} — ${chapter.overline}`}
              sizes="(max-width: 1024px) 90vw, 45vw"
              className="h-auto w-full"
            />
          </div>
          <div>
            <Overline tone="silver">{chapter.overline}</Overline>
            <h2 className="mt-6 font-display text-(length:--text-display-md) leading-[1.1] whitespace-pre-line text-bone">
              {chapter.title}
            </h2>
            <p className="mt-7 text-(length:--text-body-lg) leading-relaxed text-stone">
              {chapter.body}
            </p>
            <dl className="mt-10 border-t border-line">
              {chapter.notes?.map((note) => (
                <div
                  key={note.term}
                  className="flex items-baseline gap-6 border-b border-line py-4"
                >
                  <dt className="w-28 shrink-0 text-overline text-ash">{note.term}</dt>
                  <dd className="text-(length:--text-caption) text-stone">
                    {note.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      ))}

      <div
        id="purchase"
        className="mx-auto max-w-[1600px] px-(--spacing-gutter) pb-(--spacing-section)"
      >
        <div className="border-t border-line pt-10">
          <Overline tone="silver">The complete set</Overline>
          <h2 className="mt-4 font-display text-(length:--text-display-md) leading-none text-bone">
            {product.title}
          </h2>
          <p className="mt-6 text-(length:--text-body-lg) text-bone tabular-nums">
            {formatMoney(product.price)}
          </p>
          <div className="mt-10">
            <AddToBag product={product} />
          </div>
        </div>
      </div>
    </section>
  );
}
