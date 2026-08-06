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
 * The turn is a real turntable clip, scrubbed by scroll rather than played:
 * `currentTime` is written from the same smoothed progress value that drives
 * the wordmark, the copy and the purchase panel, so the garment rotates only
 * while the page moves and holds whatever frame it stopped on.
 *
 * Reduced motion gets `FilmStatic`, which keeps the still cutouts — a clip
 * that only moves on scroll is still motion, and nothing there should autoplay.
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

/**
 * The turntable clip.
 *
 * Never played — `currentTime` is written directly from the same smoothed
 * scroll value that drives everything else on the stage, so the garment turns
 * only while the page moves and holds the exact frame it stopped on. The
 * filename is the one the client supplied; the space has to be encoded or the
 * request 404s.
 */
const TURNTABLE_SRC = "/videos/Create_a_perfectly_smooth_luxu%202.mp4";

/**
 * The clip's frame interval, in seconds.
 *
 * Used as the pump's resolution rather than as a grid to snap to: seek targets
 * stay continuous, because quantising them throws away the sub-frame precision
 * that decides *which* frame the decoder lands on near a boundary, and that
 * shows up as the scrub sticking and then jumping. Half of this is the
 * threshold below which a seek cannot change what is on screen, and one of it
 * is how far back from `duration` the last reachable frame sits.
 */
const FRAME_STEP = 1 / 24;

/** Filter id for the background key. Must be unique in the document. */
const KEY_FILTER_ID = "millionaire-studio-key";

/**
 * Largest distance, in frames, a single seek is allowed to cover.
 *
 * Without a cap the pump always aims at wherever the scroll has got to, so a
 * quick flick asks the decoder to jump twenty frames and the turn arrives as
 * one visible lurch. Capping the step makes it walk the intermediate frames
 * instead — each decode costs the same, but the ones that land describe a
 * continuous rotation rather than a cut. Six is the point where it stops
 * reading as a jump without falling so far behind that the garment lags the
 * page.
 */
const MAX_SEEK_FRAMES = 6;

/**
 * Horizontal glide applied per frame of un-decoded residual, in pixels.
 *
 * Sub-frame interpolation. The decoder can only hand over whole frames, and on
 * this clip it hands them over at roughly a tenth the rate the display
 * refreshes — so between two decodes the garment is, strictly, frozen. Sliding
 * the presented frame by the fraction of a frame still owed keeps something
 * moving on every one of those refreshes, in the direction the turn is already
 * going, so the eye reads continuous motion instead of a held image.
 *
 * Small on purpose: a frame of this turntable moves the silhouette a couple of
 * pixels, so this is calibrated to that and no further. Larger values buy
 * apparent smoothness at the price of the figure visibly swimming.
 */
const SUBFRAME_GLIDE_PX = 2.4;

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
  const videoRef = useRef<HTMLVideoElement>(null);
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
    let raf = 0;
    // Lagging copy of the scroll position, and a lagging copy of the pointer.
    let smoothed = scrollYProgress.get();
    const camera = { x: 0, y: 0, tx: 0, ty: 0 };
    /*
       The scrub pump.

       Seeking from inside the rAF loop couples the decoder to the display
       clock, and the two do not agree: a seek that takes longer than a frame
       makes the loop skip its next turn and then jump two frames at once,
       which is the stepping you feel rather than see. So the loop only ever
       records where the video *should* be, and a separate pump issues one
       seek at a time, starting the next the instant `seeked` confirms the
       last one landed. Frames then arrive as fast as the decoder can retire
       them, at its own even cadence, with nothing queued behind a stale
       request.
    */
    let seekTarget = 0;
    let seekInFlight = false;

    const pump = () => {
      const video = videoRef.current;
      if (!video || seekInFlight || !(video.duration > 0)) return;
      // Never ask for the timestamp at `duration` itself: decoders disagree
      // about whether a sample exists there, and the ones that say no snap
      // back to frame 0 — a front view flashing in behind the purchase panel.
      const wanted = Math.min(seekTarget * video.duration, video.duration - FRAME_STEP);
      const shown = video.currentTime;
      // Below half a frame the decoder would hand back the frame already on
      // screen, so the seek costs a decode and changes nothing.
      if (Math.abs(wanted - shown) < FRAME_STEP * 0.5) return;
      // Walk toward the target rather than leaping to it — see MAX_SEEK_FRAMES.
      const reach = FRAME_STEP * MAX_SEEK_FRAMES;
      const delta = wanted - shown;
      const desired = Math.abs(delta) > reach ? shown + Math.sign(delta) * reach : wanted;
      seekInFlight = true;
      video.currentTime = desired;
    };

    const onSeeked = () => {
      seekInFlight = false;
      pump();
    };

    /*
       `seeked` fires when the decoder has the frame, which is not the same
       instant the compositor has shown it. `requestVideoFrameCallback` fires
       on presentation, so releasing the pump there starts the next decode
       exactly as the previous frame reaches the screen — no gap waiting for a
       rAF turn, and no second seek issued against a frame still in flight.
       Chrome and Safari have it; Firefox does not, which is why `seeked`
       stays wired up as the fallback rather than being replaced.
    */
    type FrameCallbackVideo = HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number;
      cancelVideoFrameCallback?: (handle: number) => void;
    };
    let frameHandle = 0;
    const watchFrames = (video: FrameCallbackVideo) => {
      if (!video.requestVideoFrameCallback) return;
      frameHandle = video.requestVideoFrameCallback(() => {
        seekInFlight = false;
        pump();
        watchFrames(video);
      });
    };

    const videoEl = videoRef.current;
    videoEl?.addEventListener("seeked", onSeeked);
    // A seek that fails still has to release the pump, or the scrub stalls
    // for good on the frame it happened to be holding.
    videoEl?.addEventListener("error", onSeeked);
    if (videoEl) watchFrames(videoEl);

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

      /*
         The turn, scrubbed rather than played.

         The whole scroll range maps linearly onto the whole clip, so every
         frame the camera shot is reachable and the garment completes exactly
         one revolution across the film — no easing table in between, because
         any curve here would make the turntable speed up and slow down
         against footage that was shot at a constant rate.

         Nothing calls `play()`: the video only ever advances because the page
         moved, so scrolling up runs the turn backwards and stopping leaves it
         on the exact frame it reached. `smoothed` still chases the scrollbar,
         so the turn keeps going for a beat after the wheel stops and settles
         with the same inertia as everything else on the stage.

         Two guards keep the scrub smooth rather than stuttering:

         - Seeking while a previous seek is still in flight makes the decoder
           abandon work it has already started, which is what turns a fast
           scroll into a slideshow. Waiting for `seeking` to clear issues
           exactly one seek per decode, as fast as the decoder can retire them.
         - `duration` is NaN until metadata loads, and writing NaN to
           `currentTime` throws.
      */
      seekTarget = Math.min(Math.max(p, 0), 1);
      pump();

      /*
         Sub-frame interpolation, written every rAF turn.

         The residual is how much of the turn the scroll has asked for but the
         decoder has not delivered yet. Expressing it as a small horizontal
         glide means the garment keeps moving on frames where no new video
         frame arrived, and snaps back to zero the moment one does — the two
         together read as one continuous rotation rather than a series of
         held stills. Transform only, on an already-promoted layer, so this
         costs a composite and never a repaint.
      */
      const glideVideo = videoRef.current;
      if (glideVideo && glideVideo.duration > 0) {
        const residualFrames =
          (seekTarget * glideVideo.duration - glideVideo.currentTime) / FRAME_STEP;
        const glide =
          Math.max(-1, Math.min(1, residualFrames / MAX_SEEK_FRAMES)) * SUBFRAME_GLIDE_PX;
        glideVideo.style.transform = `translate3d(${glide.toFixed(2)}px,0,0)`;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      videoEl?.removeEventListener("seeked", onSeeked);
      videoEl?.removeEventListener("error", onSeeked);
      if (frameHandle) {
        (videoEl as FrameCallbackVideo | null)?.cancelVideoFrameCallback?.(frameHandle);
      }
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
          {/* Same box the frame stack occupied — position and scale on this
              stage are unchanged, only its contents are. */}
          {/* `overflow-visible` is explicit: the filter region now reaches
              well past the element so the feather can resolve, and anything
              clipping back to the box would reinstate the edge it exists to
              remove. */}
          <div className="relative h-[78svh] w-[78svh] max-w-[92vw] overflow-visible">
            <StudioKeyFilter />
            {/*
               The clip runs at its own brightness and colour. The backdrop is
               keyed out by alpha, not hidden by grading — see StudioKeyFilter.

               `translateZ(0)` and `will-change: transform` promote this to its
               own compositor layer, so a decoded frame is uploaded straight to
               the GPU and the page around it is never repainted to show it.
            */}
            <video
              ref={videoRef}
              src={TURNTABLE_SRC}
              muted
              playsInline
              preload="auto"
              aria-label={millionaireSetTurnaroundCutout.alt}
              className="h-full w-full object-cover"
              style={{
                filter: `url(#${KEY_FILTER_ID})`,
                transform: "translateZ(0)",
                willChange: "transform",
                backfaceVisibility: "hidden",
                /*
                   Edge falloff, not a vignette.

                   The key cannot guarantee that every pixel along the clip's
                   own border resolves to zero alpha — the cyclorama vignettes
                   as it approaches the frame edge, and wherever it drifts out
                   of the transparent band it survives as a hairline and reads
                   as a box around the video. This drops alpha over the
                   outermost 3%, which on this framing contains nothing but
                   backdrop: the figure occupies the middle quarter of the
                   frame and is never touched. It removes the boundary rather
                   than shading it, so there is no mask edge to see.
                */
                maskImage:
                  "linear-gradient(to right, transparent 0, #000 3%, #000 97%, transparent 100%), linear-gradient(to bottom, transparent 0, #000 3%, #000 97%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent 0, #000 3%, #000 97%, transparent 100%), linear-gradient(to bottom, transparent 0, #000 3%, #000 97%, transparent 100%)",
                maskComposite: "intersect",
                WebkitMaskComposite: "source-in",
              }}
            />
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

/**
 * Background key for the turntable clip.
 *
 * A real alpha matte, not a brightness trick: the clip's own colour comes
 * through untouched and only the alpha channel is rewritten.
 *
 * The obvious approach — treat everything bright as background — is the one
 * thing that cannot work here, and `scripts/extract-cutouts.mjs` documents
 * why: the chest wordmark and thigh crest are the brightest pixels in frame,
 * so a one-sided luminance key deletes exactly the branding the garment
 * exists to carry.
 *
 * So the key is two-sided. Luminance goes into alpha, then a lookup table
 * makes only the *middle* of the range transparent: the near-black garment
 * stays opaque at the bottom of the scale, the silver prints stay opaque at
 * the top, and the cyclorama — which sits between them and nowhere near
 * either — is what drops out. The ramps between bands are what leave a soft,
 * anti-aliased edge instead of a cut-out's hard one.
 *
 * `colorInterpolationFilters="sRGB"` is not optional. The filter default is
 * linearRGB, which would silently shift every colour in the clip on its way
 * through — the exact opposite of leaving the footage alone.
 *
 * **The garment itself is never filtered.** Everything below builds an alpha
 * matte and nothing else; the final `feComposite operator="in"` reads colour
 * from the untouched `SourceGraphic` and takes only the *alpha* of the matte.
 * That is what lets the silhouette edge be feathered while the weave, the
 * seams and the print stay exactly as sharp as the footage is — softening the
 * matte cannot soften the pixels inside it.
 *
 * The filter region is deliberately generous. A region that ends near the
 * element's own edge truncates the feather blur exactly at the frame boundary,
 * and a truncated ramp is a hard line — the thin rectangle that gave the clip
 * away as a video sitting on the page rather than a garment standing in it.
 * The margin costs a slightly larger buffer and removes the seam outright.
 */
function StudioKeyFilter() {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute h-0 w-0">
      <defs>
        <filter
          id={KEY_FILTER_ID}
          colorInterpolationFilters="sRGB"
          x="-15%"
          y="-15%"
          width="130%"
          height="130%"
        >
          {/* Colour rows are identity; the alpha row becomes luminance. */}
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0.2126 0.7152 0.0722 0 0"
            result="luma"
          />
          {/*
            Alpha by luminance band, sampled at seventeen evenly spaced stops
            so each step is 0.0625 rather than 0.125.

            The top of the range carries the branding, and it has to be *fully*
            opaque rather than merely on its way there. Ending the ramp at 1.0
            meant the chest wordmark sat around alpha 0.4 — printed white in
            the footage, but composited 60% onto a black page, which is
            precisely why it read as grey rather than white. The opaque band now
            closes at 0.9375, so anything near-white is solid: the wordmark and
            the crest come through at the white they were shot at.

            The lit floor sits at roughly 0.76 and stays comfortably inside the
            transparent band, so buying the prints back costs nothing there.

            The bottom of the range is unchanged and deliberately tight: the
            garment's own highlights reach roughly 0.20, so the opaque band
            cannot extend past 0.25 without the cyclorama starting to stick.
          */}
          <feComponentTransfer in="luma" result="keyed">
            <feFuncA type="table" tableValues="1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 1 1" />
          </feComponentTransfer>

          {/*
            Feather, on the matte alone.

            A key built from a luminance threshold steps between opaque and
            transparent within a pixel or two, which is what reads as a ragged
            silhouette. A sub-pixel blur turns that step into a ramp — the
            same soft edge a real matte has.
          */}
          {/*
            0.5, and not a fraction more, for a measured reason: at
            stdDeviation 0.5 this blur costs about 27ms per decoded frame, and
            at 1.1 it costs 580ms — the radius crosses a threshold where the
            compositor stops taking the fast path and the whole scrub collapses
            to roughly one frame a second. Half a pixel is enough to turn the
            key's hard step into a ramp; anything more buys a softness nobody
            can see at the price of the motion itself.
          */}
          <feGaussianBlur in="keyed" stdDeviation="0.5" result="feathered" />

          {/*
            Blurring a matte also spreads it outward, and the pixels it spreads
            onto are cyclorama — which would ring the garment in a pale halo,
            the classic tell of a bad cutout. Re-steepening the ramp and
            biasing it low pulls the matte back inside the silhouette: the
            edge stays soft, but the feather eats into the garment rather than
            out into the background it was cut from.
          */}
          <feComponentTransfer in="feathered" result="matte">
            <feFuncA type="table" tableValues="0 0.08 0.45 0.82 1" />
          </feComponentTransfer>

          {/* Untouched pixels, matte alpha. */}
          <feComposite in="SourceGraphic" in2="matte" operator="in" />
        </filter>
      </defs>
    </svg>
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
