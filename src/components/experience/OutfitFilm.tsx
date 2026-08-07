"use client";

import { useScroll } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AddToBag } from "@/components/product/AddToBag";
import { Spotlight } from "@/components/experience/Spotlight";
import { Overline } from "@/components/ui/Overline";
import type { Product } from "@/lib/commerce";
import { formatMoney } from "@/lib/commerce";
import { millionaireSetTurnaroundCutout } from "@/lib/media/assets";

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
 * Runs identically regardless of device or motion preference — the film
 * itself is the product presentation, not decoration layered on top of a
 * simpler page, so there is no reduced/simplified variant to fall back to.
 */
export function OutfitFilm({ product }: { product: Product }) {
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
 * The turntable clip, in two formats.
 *
 * Never played — `currentTime` is written directly from the same smoothed
 * scroll value that drives everything else on the stage, so the garment turns
 * only while the page moves and holds the exact frame it stopped on.
 *
 * Sourced from a second studio pass, graded and keyed in DaVinci Resolve with
 * a real alpha channel (CineForm RGBA) rather than shot against a cyclorama —
 * so the matte is a genuine per-pixel alpha, not a luminance guess. That
 * matters because no browser plays a QuickTime/CineForm alpha track directly,
 * so the source is re-encoded to two web formats and offered as ordered
 * `<source>` children — the browser picks the first it can play:
 *
 * 1. **WebM/VP9 with real alpha** (`.webm`) — the primary. Chrome, Edge and
 *    Firefox composite its alpha channel natively, so the garment needs no
 *    keying at all here; `StudioKeyFilter` is skipped for this source (see
 *    the `needsKeyFilter` detection below).
 * 2. **MP4/H.264** (`.mp4`) — the fallback for Safari, which cannot decode
 *    alpha WebM. Baked by compositing the same alpha footage over a flat
 *    mid-grey chosen to sit inside `StudioKeyFilter`'s existing transparent
 *    luminance band (see that filter's comments), so the fallback reuses the
 *    same tuned key rather than needing its own.
 *
 * Both are re-encoded all-intra (GOP=1): every frame is its own keyframe, so
 * a scroll-driven seek decodes exactly one frame instead of walking forward
 * through a GOP the way the client's original upload (still at
 * `public/videos/Create_a_perfectly_smooth_luxu 2.mp4`, untouched) required.
 * Same 1920×1080, same 24fps, same 240 frames, same 10.000s as the previous
 * pass. Audio is dropped from both: the element is permanently muted and
 * never played, so the track could only ever be dead weight.
 */
const TURNTABLE_WEBM_SRC = "/videos/hooded-set-turntable.webm";
const TURNTABLE_MP4_SRC = "/videos/hooded-set-turntable-fallback.mp4";

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
 * How many frames of residual correspond to full sub-frame glide amplitude.
 *
 * Not a seek cap — with every frame a keyframe, a seek costs the same whether
 * it moves one frame or fifty, so there is nothing to gain by walking toward
 * the target in steps the way the long-GOP source needed. The pump now seeks
 * straight to wherever the scroll is, every time. This constant only shapes
 * the glide below: at the display's refresh rate against this clip's decode
 * rate, the residual between two arrived frames rarely exceeds one or two
 * frames' worth, so that is the range the glide is calibrated across.
 */
const GLIDE_NORMALIZE_FRAMES = 2;

/**
 * Horizontal glide applied per frame of un-decoded residual, in pixels.
 *
 * Sub-frame interpolation. However fast the decoder now runs, it can only
 * hand over whole frames, and the display refreshes faster than that — so
 * between two decodes the garment is, strictly, momentarily frozen. Sliding
 * the presented frame by the fraction of a frame still owed keeps something
 * moving on every one of those refreshes, in the direction the turn is already
 * going, so the eye reads continuous motion rather than a held image.
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

  /**
   * Whether the browser fell back to the keyed MP4 rather than playing the
   * alpha WebM.
   *
   * `StudioKeyFilter` rewrites alpha from luminance — correct for the flat
   * grey the MP4 was composited over, destructive on the WebM, which already
   * carries real per-pixel alpha and would have its transparent background
   * (near-black where alpha is 0) read as near-opaque garment by the same
   * table. So the filter is applied only once we know which `<source>` the
   * browser actually selected. `currentSrc` is empty until the resource
   * selection algorithm has picked one, which `loadedmetadata` guarantees has
   * happened; a `readyState` check covers the case where it fired before this
   * effect's listener was attached.
   */
  const [needsKeyFilter, setNeedsKeyFilter] = useState(false);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const detectSource = () => setNeedsKeyFilter(video.currentSrc.endsWith(".mp4"));
    video.addEventListener("loadedmetadata", detectSource);
    if (video.readyState >= 1) detectSource();
    return () => video.removeEventListener("loadedmetadata", detectSource);
  }, []);

  /**
   * One silent play/pause to unstick WebKit's decoder.
   *
   * On iOS Safari, writing `currentTime` to a `<video>` that has never
   * played can update the reported time without the decoder ever producing
   * the frame at that time — the element reports the seek as done, but
   * nothing new is painted, which is exactly what makes a scroll-scrub built
   * entirely from `currentTime` writes (see the pump below) read as frozen
   * there while working everywhere else. Chrome and desktop Safari don't
   * have this limitation, which is why it doesn't show up until iOS.
   *
   * A single real playback start, however brief, gets WebKit's decode
   * pipeline running properly; every seek after that paints correctly. Muted
   * + `playsInline` means iOS allows this without a user gesture, and it
   * runs while `figureRef` is still at `opacity: 0` (the wordmark hasn't
   * dissolved yet), so there is nothing to see even on the one frame it
   * might render before pausing.
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let primed = false;
    const primeDecoder = () => {
      if (primed) return;
      primed = true;
      video.play().then(
        () => video.pause(),
        // Playback can still be blocked in unusual embedding contexts (e.g.
        // an iframe without allow="autoplay"); the scroll pump below falls
        // back to whatever the browser can seek to on its own.
        () => {},
      );
    };
    video.addEventListener("loadedmetadata", primeDecoder);
    if (video.readyState >= 1) primeDecoder();
    return () => video.removeEventListener("loadedmetadata", primeDecoder);
  }, []);

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
      // Straight to the target. With every frame a keyframe there is no
      // decode-chain cost that grows with distance, so there is nothing a
      // stepped walk would buy — see GLIDE_NORMALIZE_FRAMES.
      seekInFlight = true;
      video.currentTime = wanted;
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

    const onPointerMove = (event: PointerEvent) => {
      // Camera drift is deliberately tiny — a couple of percent of the
      // viewport. Enough that the frame feels hand-held rather than locked
      // off; not enough that anyone can point at what moved. Pointer Events
      // fire for touch as well as mouse, so this tracks a finger while it is
      // actually moving across the glass — there is just no equivalent of
      // "hovering" for the camera to read while the phone sits still.
      camera.tx = (event.clientX / window.innerWidth - 0.5) * 2;
      camera.ty = (event.clientY / window.innerHeight - 0.5) * 2;
    };
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
           scroll into a slideshow. Waiting for the frame to actually present
           (or, as a fallback, for `seeked`) issues exactly one seek at a time,
           as fast as the decoder can retire them — see `pump` and
           `watchFrames` above.
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
          Math.max(-1, Math.min(1, residualFrames / GLIDE_NORMALIZE_FRAMES)) *
          SUBFRAME_GLIDE_PX;
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
        <Spotlight
          className="top-[4%] left-1/2 h-[80svh] w-[80svh] -translate-x-1/2"
          alwaysAnimate
        />

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
          <h1 className="block font-display text-[9vw] leading-none tracking-[0.08em] whitespace-nowrap text-bone uppercase select-none lg:text-[11.8vw]">
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
          {/*
             Static 16% display enlargement — a rendering-level change, not an
             addition to the film's own choreography. Grows the box's own
             native size (78svh → 90.48svh, exactly 78×1.16) rather than
             adding a `transform: scale()` on top of it. The two can look
             identical at rest but are not the same thing to the compositor:
             a `transform: scale()` wrapping this box was tried and measured
             directly — 55.2fps decoded without it, 2fps with it.
             The video's SVG filter (StudioKeyFilter) is what pays for that:
             browsers rasterize a filtered element at a resolution accounting
             for its cumulative on-screen scale, so stacking a second
             transformed layer directly around the filtered box pushed the
             feather blur back into the slow path this same file already
             documents (0.5 vs 0.75 stdDeviation, 55fps vs 1.7fps) — without
             the blur's own radius changing at all. Growing the box's real
             size instead adds no new transformed layer: `figureRef`, one
             level up, remains the only transform in the chain, exactly as it
             already was before this change.

             This still composes multiplicatively with `figureRef`'s own
             scale exactly the way the transform approach would have: final
             on-screen size = 1.16 × FIG_SCALE(p) at every point in the film.
             FIG_SCALE itself — the 0.9→1→1.05 curve — is untouched, and
             nothing about the source video changes: `object-cover` still
             shows its full native framing, just inside a bigger box, so
             cropping risk is unchanged. The box is still centered by the
             flex parent, so it grows around the same point rather than
             shifting it.

             `max-h-[92vw]` mirrors `max-w-[92vw]`: on a narrow, tall
             viewport (a phone) the box's own 90.48svh height comfortably
             clears the width cap alone, so only width was ever constrained
             — the box stopped being square, and `object-cover` on the video
             inside then framed itself against that stretched box instead of
             the intended square, cropping the garment badly. Capping height
             the same way keeps the box square everywhere; on desktop, where
             90.48svh is already far under 92vw of width, neither cap
             engages, so this changes nothing there.
          */}
          <div className="relative h-[90.48svh] w-[90.48svh] max-w-[92vw] max-h-[92vw] overflow-visible">
            <StudioKeyFilter />
            {/*
               The clip runs at its own brightness and colour. The backdrop is
               keyed out by alpha, not hidden by grading — see StudioKeyFilter.

               `translateZ(0)` and `will-change: transform` promote this to its
               own compositor layer, so a decoded frame is uploaded straight to
               the GPU and the page around it is never repainted to show it.
            */}
            {/*
               Framing safety margin, not a crop fix on the source.

               The figure wrapper (`figureRef`, above) grows to 1.05× scale
               late in the film while the turn is still turning through its
               back half, and the source footage was framed with very little
               headroom above the head to begin with — the two together were
               enough to push the crown of the hood past the top of frame at
               the highest scale values. A 3% margin here shrinks the video
               fractionally *within its own unchanged box*, buying back margin
               on every edge before the outer scale can spend it, without
               moving the box itself or touching the scale curve that drives it.

               `top-[3%] left-[3%] h-[94%] w-[94%]`, not the `inset-[3%]`
               shorthand this was originally written as. That was a real bug,
               found and fixed in this pass: `inset` alone, with no explicit
               width/height, leaves both "auto" — and for a replaced element
               (a `<video>`) with all four sides constrained and both
               dimensions auto, the browser resolves the conflict by deriving
               one dimension from the intrinsic aspect ratio instead of
               honouring the inset on that axis. Concretely, this video was
               rendering at 786×442 inside a 786×786 box — full width, but
               height locked to the clip's native 16:9 regardless of the box's
               own height — which is why every size change made to the box in
               the last several rounds landed on screen as far smaller than
               measured, or not at all. Explicit height and width remove the
               ambiguity outright: both dimensions are stated, so there is
               nothing left for the browser to infer from aspect ratio.
            */}
            <video
              ref={videoRef}
              muted
              playsInline
              preload="auto"
              aria-label={millionaireSetTurnaroundCutout.alt}
              className="absolute top-[3%] left-[3%] h-[94%] w-[94%] object-cover"
              style={{
                filter: needsKeyFilter ? `url(#${KEY_FILTER_ID})` : undefined,
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
            >
              {/* Ordered by preference — the browser plays the first it
                  supports. WebM's real alpha first; the keyed MP4 only for
                  browsers (Safari) that can't decode alpha WebM. */}
              <source src={TURNTABLE_WEBM_SRC} type="video/webm" />
              <source src={TURNTABLE_MP4_SRC} type="video/mp4" />
            </video>
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
 * Background key and local sharpening for the turntable clip, as one filter.
 *
 * Two independent branches, both reading `SourceGraphic`, that only meet at
 * the very last step:
 *
 * 1. **Alpha** — a real matte, not a brightness trick. The clip's own colour
 *    is never graded or dimmed to hide the backdrop; only the alpha channel
 *    is rewritten. The obvious approach, treating everything bright as
 *    background, is the one thing that cannot work here, and
 *    `scripts/extract-cutouts.mjs` documents why: the chest wordmark and
 *    thigh crest are the brightest pixels in frame, so a one-sided luminance
 *    key deletes exactly the branding the garment exists to carry. So the key
 *    is two-sided: the near-black garment stays opaque at the bottom of the
 *    luminance scale, the silver prints stay opaque at the top, and the
 *    cyclorama — which sits between them and nowhere near either — is what
 *    drops out. A feather blur on this branch alone turns the key's hard step
 *    into a soft, anti-aliased edge.
 * 2. **Colour** — an unsharp mask, recovering some of what a 1280×720 clip
 *    loses when it is stretched across a box several times that size.
 *
 * Because the two branches never cross until the final composite, sharpening
 * the print cannot move the silhouette edge and feathering the edge cannot
 * soften the print — each `feComposite operator="in"` at the end of a branch
 * takes its *colour* from one place and its *alpha* from the other.
 *
 * `colorInterpolationFilters="sRGB"` is not optional on either branch. The
 * filter default is linearRGB, which would silently shift every colour in the
 * clip on its way through — the exact opposite of leaving the footage alone.
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

            The bottom of the range: the garment's own highlights — the hood,
            the shoulder, the chest under the key light — reach roughly 0.20,
            documented here once already, but the table that shipped against
            that number didn't actually honour it. Its flat-1 opaque region
            only ran to 0.1875, one stop short, with the ramp to transparent
            already underway by 0.20 — a `feFuncA` table interpolates linearly
            between entries, so that highlight landed around 80% opaque, not
            the intended 100%, and read as the matte eating into the garment
            itself: missing coverage on exactly the surfaces that catch the
            light, not a framing crop. Full opacity now holds to 0.3125 —
            real margin past the measured highlight, not a value flush against
            it — before ramping to transparent by 0.5, still comfortably short
            of the cyclorama's measured floor above 0.63.
          */}
          <feComponentTransfer in="luma" result="keyed">
            <feFuncA type="table" tableValues="1 1 1 1 1 1 0.6 0.15 0 0 0 0 0 0 0 1 1" />
          </feComponentTransfer>

          {/*
            Feather, on the matte alone.

            A key built from a luminance threshold steps between opaque and
            transparent within a pixel or two, which is what reads as a ragged
            silhouette. A sub-pixel blur turns that step into a ramp — the
            same soft edge a real matte has.
          */}
          {/*
            0.5, and not a fraction more — re-confirmed, not just estimated:
            0.5 costs ~27ms per decoded frame; 0.75, one stop up, measured at
            *1.7fps* — the compositor falls off its fast path somewhere in
            that gap and the whole scrub collapses. This is the ceiling, not a
            starting point. Edge smoothness beyond what half a pixel of blur
            buys has to come from elsewhere — see the alpha table immediately
            below (free: a lookup table costs the same at any resolution) and
            the premultiplication after the matte (also free: composite
            operations, no new blur).
          */}
          <feGaussianBlur in="keyed" stdDeviation="0.5" result="feathered" />

          {/*
            Blurring a matte also spreads it outward, and the pixels it spreads
            onto are cyclorama — which would ring the garment in a pale halo,
            the classic tell of a bad cutout. Re-steepening the ramp and
            biasing it low pulls the matte back inside the silhouette: the
            edge stays soft, but the feather eats into the garment rather than
            out into the background it was cut from.

            Narrowed again in this pass, still without touching the blur that
            produces `feathered` — a lookup table costs the same regardless of
            its shape, so this is free the same way the nine-stop resolution
            bump was. The transition now clears essentially all its distance
            between input 0.375 and 0.75 (was 0.25 to 0.875): the *spatial*
            softness is whatever the unchanged 0.5px blur produces, but the
            *tonal* band over which a pixel can sit at some ambiguous partial
            alpha is deliberately narrower, which is directly the same thing
            as fewer pixels able to carry a visible fringe. The 50%-alpha
            crossing still lands past the input's own midpoint (~0.56, versus
            ~0.53 before) — narrower is not the same as re-centred; the ramp
            still eats into the garment side first, same as it always did,
            not out into the cyclorama.
          */}
          <feComponentTransfer in="feathered" result="matte">
            <feFuncA type="table" tableValues="0 0 0 0.03 0.25 0.75 0.97 1 1" />
          </feComponentTransfer>

          {/*
            Local sharpening — an unsharp mask, the same technique a print
            house uses on a soft scan. It runs on a second, independent branch
            straight off `SourceGraphic`, entirely separate from the alpha
            chain above: this stage never touches the matte, and the matte
            stage never touches colour, so sharpening the print cannot move
            the silhouette edge and feathering the edge cannot soften the
            print.

            The method: blur the colour slightly, then push each pixel *away*
            from its own blurred version. Blurring removes fine detail and
            leaves the broad shape; subtracting that from the original and
            adding the difference back amplifies exactly the high-frequency
            content the blur discarded — the weave, the seam lines, the edges
            of the printed letterforms — while flat regions (blur ≈ original)
            are left alone, which is what keeps this from shifting colour the
            way a saturation or contrast move would.

            `feComposite operator="arithmetic"` computes
            `k1·i1·i2 + k2·i1 + k3·i2 + k4` per pixel. With i1 the original and
            i2 the blur, k2 = 1+amount and k3 = -amount gives
            (1+amount)·original − amount·blur — original plus `amount` times
            the (original − blur) detail signal, in one filter primitive
            rather than a separate subtract-and-add pass.

            stdDeviation stays at 0.5, the same fast-path ceiling the feather
            above is held to: a second blur at this radius costs about the
            same ~27ms it costs there, and going further risks the same
            compositor cliff that made the feather collapse the scrub to
            roughly one frame a second at stdDeviation 1.1. 0.6 is a
            deliberately moderate amount — enough to bring the wordmark and
            the crest back from the softness of a 1280×720 clip stretched
            across a much larger box, short of the halo a heavier pass would
            ring around every letter.
          */}
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="colorBlur" />
          <feComposite
            in="SourceGraphic"
            in2="colorBlur"
            operator="arithmetic"
            k1="0"
            k2="1.6"
            k3="-0.6"
            k4="0"
            result="sharpened"
          />

          {/*
            The white fringe, and why it existed: everything above only ever
            rewrote *alpha*. At the feathered edge the underlying pixel is
            genuinely a blend of dark garment and light cyclorama — real
            antialiasing in the source footage, not a bug — and a plain
            `feComposite operator="in"` here would carry that blended colour
            through unchanged, just at partial opacity. A half-transparent
            pixel whose *colour* is still light-grey reads, composited onto
            this page's near-black, as a pale rim around the whole silhouette.

            The fix is the same one `scripts/extract-cutouts.mjs` uses for the
            static cutouts — decontaminate the edge colour rather than only
            gating its opacity — done here as alpha premultiplication instead
            of that script's per-row background solve, because a solve needs a
            known background sample and nothing in a filter graph can measure
            one.

            This pass makes that premultiply quadratic rather than linear —
            colour falls off by alpha *squared*, not alpha — because linear
            premultiply alone still leaves a visible pixel wherever the source
            colour was badly contaminated: at alpha 0.5 a pixel blended
            halfway to the cyclorama (say, mid-grey) was still cut only in
            half, and half of mid-grey reads as a dim grey ring, not black.
            Squaring the falloff cuts that same pixel to a quarter, and it
            keeps compounding faster than alpha itself does everywhere alpha
            is below 1 — which is exactly the transition zone this exists to
            clean up, and nowhere else, since at alpha 1 (the solid interior)
            alpha² and alpha are identical and the real, untouched texture
            still comes through.

            Getting there without corrupting *alpha itself* — final alpha has
            to stay exactly the matte's, or the silhouette's actual coverage
            erodes, which is a shape change wearing a colour fix's clothes —
            needs two multiplies where a naive squaring would use one.
            `alphaOpaque` copies the matte's alpha into R, G and B *but pins
            its own alpha channel to a flat 1* (`0 0 0 0 1` on that row: output
            = 0×input + 1, ignoring input entirely). Multiplying `sharpened`
            by that gives a colour darkened by alpha once, still fully opaque
            — `decontaminated`, alpha 1, not yet the filter's output. Only the
            *second* multiply, against `matteAsColor` (alpha copied into every
            channel *including* its own, `0 0 0 1 0`), brings alpha back in:
            colour ends up scaled by alpha twice (alpha²) while alpha itself
            is scaled by 1×alpha — the matte's value, untouched, because the
            first multiply never touched it.
          */}
          <feColorMatrix
            in="matte"
            type="matrix"
            values="0 0 0 1 0
                    0 0 0 1 0
                    0 0 0 1 0
                    0 0 0 0 1"
            result="alphaOpaque"
          />
          <feComposite
            in="sharpened"
            in2="alphaOpaque"
            operator="arithmetic"
            k1="1"
            k2="0"
            k3="0"
            k4="0"
            result="decontaminated"
          />
          <feColorMatrix
            in="matte"
            type="matrix"
            values="0 0 0 1 0
                    0 0 0 1 0
                    0 0 0 1 0
                    0 0 0 1 0"
            result="matteAsColor"
          />
          <feComposite
            in="decontaminated"
            in2="matteAsColor"
            operator="arithmetic"
            k1="1"
            k2="0"
            k3="0"
            k4="0"
          />
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
