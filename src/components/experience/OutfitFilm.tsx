"use client";

import { useScroll } from "motion/react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { LightPlate } from "@/components/experience/Spotlight";
import { AddToBag } from "@/components/product/AddToBag";
import { Overline } from "@/components/ui/Overline";
import type { Product } from "@/lib/commerce";
import { formatMoney } from "@/lib/commerce";
import { millionaireSetTurnaroundCutout } from "@/lib/media/assets";
import { approach, curve, damper, MAX_STEP, smoothDamp } from "@/lib/motion/film";
import { useMotionPreference } from "@/lib/motion/useMotionPreference";

/**
 * Scroll timeline, in progress units across the whole film.
 *
 * Written as one table because every element is choreographed against the same
 * clock — the wordmark, the figure's position, its rotation, the lighting and
 * four blocks of type all read from these numbers. Scattering the ranges
 * through the markup is how a sequence like this drifts out of sync.
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

/**
 * Camera angle the garment holds during each chapter.
 *
 * Run through the same monotone curve as everything else, so the turn carries
 * its speed *through* each chapter instead of restarting there. Interpolating
 * these linearly — the obvious way — left a corner in angular velocity at every
 * stop: the object visibly changed pace at four points in the revolution, which
 * is the single clearest tell that a rotation is a scrubbed value rather than
 * an object with mass.
 */
const ANGLE = curve([
  [T.morphEnd, 0],
  [T.ch1, 35],
  [T.ch2, 90],
  [T.ch3, 180],
  [T.buy, 360],
]);

const DEG = Math.PI / 180;
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
 * How long the film takes to arrive at the scroll position, in seconds.
 *
 * The single most important number here. Reading scroll position directly
 * couples the garment rigidly to the wheel, so every notch of a mouse wheel
 * lands as a discrete step. Following it through a critically damped spring
 * instead gives the whole stage inertia — it arrives a beat after the input and
 * *coasts to a stop* rather than halting, because the follower carries a
 * velocity across frames. That carried momentum is what makes the sequence read
 * as a camera move instead of a scrubbed timeline. Higher is heavier.
 */
const FILM_SETTLE = 0.28;

/** Lag on the pointer-driven camera. Slower than the cursor, faster than light. */
const CAMERA_HALF_LIFE = 0.25;

/** Degrees of Y-rotation applied per degree of turn away from camera. */
const ROTATION_DEPTH = 0.55;

/** How far a frame recedes, in px, per degree it is turned away from camera. */
const FRAME_DEPTH = 1.5;

/* --- The stage ----------------------------------------------------------- */

const WORD_OPACITY = curve([
  [0, 1],
  [T.wordHold, 1],
  [T.morphEnd - 0.02, 0],
]);
const WORD_SCALE = curve([
  [0, 1],
  [T.morphStart, 1],
  [T.morphEnd, 1.28],
]);
const WORD_BLUR = curve([
  [T.morphStart, 0],
  [T.morphEnd, 9],
]);

/**
 * The figure dissolves out again at the very end.
 *
 * Not decoration: the film is followed by another section, and a sticky stage
 * that simply stops being sticky hands over with a hard edge — the shot is
 * still full of product one pixel before the page starts scrolling normally
 * again. Letting the garment recede and dim over the last stretch means the
 * frame has already emptied by the time the stage releases, so there is nothing
 * left to cut away from.
 */
const FIG_OPACITY = curve([
  [T.morphStart, 0],
  [T.morphEnd, 1],
  [T.buy, 1],
  [0.94, 0.72],
  [1, 0.28],
]);
const FIG_X = curve([
  [T.morphEnd, 0],
  [T.ch1, 24],
  [T.ch1End, 24],
  [T.ch2, -24],
  [T.ch2End, -24],
  [T.ch3, 0],
]);
const FIG_SCALE = curve([
  [T.morphStart, 0.9],
  [T.morphEnd, 1],
  [T.ch3End, 1],
  [T.buy, 1.05],
  [1, 1.13],
]);

/**
 * Rack focus.
 *
 * The garment arrives out of focus and pulls sharp exactly as the wordmark
 * blurs away — the two halves of one focus pull rather than a crossfade between
 * two flat images. It is the oldest way a camera says *look here now*, and it
 * costs one filter on one element.
 */
const FIG_DEFOCUS = curve([
  [T.morphStart, 7],
  [T.morphEnd, 0],
]);

/**
 * The camera itself: a slow dolly in, and a lens that never quite settles.
 *
 * The opening is framed marginally wide and eases in as the wordmark holds, so
 * the very first thing the page does is move — but so slowly that it registers
 * as presence rather than as an animation. The push resumes through the
 * purchase, closing on the product.
 */
const DOLLY = curve([
  [0, 1.05],
  [T.morphEnd, 1],
  [T.ch3End, 1.015],
  [T.buy, 1.035],
  [1, 1.07],
]);

/* --- Lighting ------------------------------------------------------------ */

/**
 * The key light is brought up as the garment appears, holds through the first
 * two chapters, drops as the figure turns its back, and lifts again for the
 * purchase. A room whose lighting never changes is a photograph; one whose
 * lighting evolves with the shot is a film.
 */
const KEY_OPACITY = curve([
  [0, 0.34],
  [T.morphStart, 0.52],
  [T.morphEnd, 1],
  [T.ch2, 1],
  [T.ch3, 0.76],
  [T.buy, 1],
  [0.94, 0.6],
  [1, 0.18],
]);
const KEY_SCALE = curve([
  [0, 0.82],
  [T.morphEnd, 1],
  [T.ch2, 1.06],
  [T.ch3, 0.93],
  [T.buy, 1.08],
  [1, 1.16],
]);

/**
 * The rim only exists while the garment is turned away from square.
 *
 * Its position is driven by the *angle*, not by progress: the highlight swings
 * around the body as the object rotates, which is the cue that sells a turn as
 * a turn. At the front and back views it fades out entirely — a rim light on a
 * face-on subject is just a glow.
 */
const RIM_GATE = curve([
  [T.morphStart, 0],
  [T.morphEnd, 1],
  [T.buy, 1],
  [0.92, 0.35],
  [1, 0],
]);

/* --- Copy ---------------------------------------------------------------- */

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
 * carries the cut on its own — and now that the turn never pauses and the light
 * keeps moving, the beat between chapters is a held shot rather than a gap.
 */
const PANEL_RANGES: readonly (readonly [number, number, number, number])[] = [
  [0.2, 0.26, 0.34, 0.39],
  [0.41, 0.47, 0.53, 0.58],
  [0.6, 0.66, 0.7, 0.755],
];

// Compiled once. Building these inside the loop allocated three arrays per
// frame for the garbage collector to sweep up during the one animation on the
// page that cannot afford a pause.
const PANEL_OPACITY = PANEL_RANGES.map(([inStart, inEnd, outStart, outEnd]) =>
  curve([
    [inStart, 0],
    [inEnd, 1],
    [outStart, 1],
    [outEnd, 0],
  ]),
);
const PANEL_Y = PANEL_RANGES.map(([inStart, inEnd, outStart, outEnd]) =>
  curve([
    [inStart, 26],
    [inEnd, 0],
    [outStart, 0],
    [outEnd, -14],
  ]),
);

/** The purchase panel arrives only once Chapter III has left the frame. */
const BUY_OPACITY = curve([
  [0.78, 0],
  [0.86, 1],
]);
const BUY_Y = curve([
  [0.78, 30],
  [0.86, 0],
]);

function FilmLive({ product }: { product: Product }) {
  const sectionRef = useRef<HTMLElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const keyLightRef = useRef<HTMLDivElement>(null);
  const rimLightRef = useRef<HTMLDivElement>(null);
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
   *
   * Everything is driven from here rather than through `useTransform`. That is
   * a deliberate correction, not a preference: motion's transform writes
   * (`scale`, `translateX`) update correctly, but its `opacity` and `filter`
   * values were measured frozen at their initial output at every scroll
   * position — so the wordmark never dissolved and the garment never appeared.
   * One clock, one write path, nothing to get out of step.
   */
  useEffect(() => {
    const frames = millionaireSetTurnaroundCutout.frames;
    let raf = 0;

    // Lagging copy of the scroll position, with a velocity it carries between
    // frames, and a lagging copy of the pointer.
    let progress = scrollYProgress.get();
    const scrollDamper = damper();
    const camera = { x: 0, y: 0, tx: 0, ty: 0 };

    let previousAngle = ANGLE(progress);
    let turnSpeed = 0;
    let appliedBlur = -1;
    const frameOpacity = new Array<number>(frames.length).fill(-1);

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const onPointerMove = (event: PointerEvent) => {
      // Camera drift is deliberately tiny — a couple of percent of the
      // viewport. Enough that the frame feels hand-held rather than locked
      // off; not enough that anyone can point at what moved.
      camera.tx = (event.clientX / window.innerWidth - 0.5) * 2;
      camera.ty = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    if (!coarse) window.addEventListener("pointermove", onPointerMove, { passive: true });

    let last = performance.now();

    const tick = (now: number) => {
      // Clamped, so a tab returning from the background integrates one ordinary
      // step and eases in rather than lurching a second's worth of film.
      const dt = Math.min((now - last) / 1000, MAX_STEP);
      last = now;
      const time = now / 1000;

      // Everything downstream reads the eased value, never the raw one.
      progress = smoothDamp(
        progress,
        scrollYProgress.get(),
        scrollDamper,
        FILM_SETTLE,
        dt,
      );
      camera.x = approach(camera.x, camera.tx, CAMERA_HALF_LIFE, dt);
      camera.y = approach(camera.y, camera.ty, CAMERA_HALF_LIFE, dt);
      const p = progress;

      /*
         Breath.

         Two pairs of sine waves at incommensurate periods — around 30 and 48
         seconds — so the drift never visibly repeats and never arrives
         anywhere. Amplitude is a third of a percent of the viewport, which is
         three or four pixels: far below the threshold at which anyone could
         say what moved, and far above nothing at all. It is the difference
         between a held shot and a paused one, and it is the only motion on the
         stage that does not require the viewer to scroll.
      */
      const breathX = Math.sin(time * 0.21) * 0.26 + Math.sin(time * 0.13 + 1.7) * 0.15;
      const breathY =
        Math.cos(time * 0.17 + 0.6) * 0.2 + Math.sin(time * 0.29 + 0.4) * 0.09;
      const breathTilt = Math.sin(time * 0.19 + 2.1) * 0.22;

      if (cameraRef.current) {
        cameraRef.current.style.transform = `translate3d(${breathX.toFixed(3)}%, ${breathY.toFixed(3)}%, 0) scale(${DOLLY(p).toFixed(4)})`;
      }

      // The turn, and how fast it is turning. Unwrapped, so the wrap from 359°
      // back to 0° cannot register as a thousand degrees a second of speed.
      const turned = ANGLE(p);
      turnSpeed = approach(
        turnSpeed,
        Math.abs(turned - previousAngle) / Math.max(dt, 1e-4),
        0.1,
        dt,
      );
      previousAngle = turned;
      const angle = normalise(turned);
      const sinAngle = Math.sin(angle * DEG);

      const figX = FIG_X(p);

      if (keyLightRef.current) {
        // The fixture follows the figure across the frame, but only part of the
        // way and a beat behind — a light on a stand is not welded to its
        // subject.
        keyLightRef.current.style.opacity = KEY_OPACITY(p).toFixed(3);
        keyLightRef.current.style.transform = `translate3d(${(figX * 0.9 + camera.x * 0.5 + breathX * 2).toFixed(2)}%, ${(camera.y * 0.35 + breathY * 2).toFixed(2)}%, 0) scale(${KEY_SCALE(p).toFixed(4)})`;
      }

      if (rimLightRef.current) {
        rimLightRef.current.style.opacity = (
          RIM_GATE(p) *
          (0.22 + 0.78 * Math.abs(sinAngle))
        ).toFixed(3);
        rimLightRef.current.style.transform = `translate3d(${(figX * 0.8 + sinAngle * 30).toFixed(2)}%, ${(camera.y * 0.2 - 4).toFixed(2)}%, 0)`;
      }

      if (wordRef.current) {
        wordRef.current.style.opacity = WORD_OPACITY(p).toFixed(3);
        // The wordmark takes the camera at half strength, the figure at full —
        // the difference is what separates them in depth during the morph.
        wordRef.current.style.transform = `translate3d(${(camera.x * 0.6).toFixed(2)}%, ${(camera.y * 0.4).toFixed(2)}%, 0) scale(${WORD_SCALE(p).toFixed(4)})`;
        wordRef.current.style.filter = `blur(${WORD_BLUR(p).toFixed(2)}px)`;
      }

      if (figureRef.current) {
        /*
           The pointer orbits the figure rather than sliding it.

           A translate makes the object move across a flat plane; a rotation
           about the vertical axis, inside the camera's perspective, makes the
           viewer move around a solid one. Two and a half degrees is the whole
           range — but because the frames inside are themselves turned in depth,
           it is enough for the parallax between shoulder and hem to read.
        */
        const orbit = camera.x * 2.4 + breathTilt;
        const pitch = -camera.y * 1.1;
        figureRef.current.style.opacity = FIG_OPACITY(p).toFixed(3);
        figureRef.current.style.transform = `translate3d(${(figX + camera.x * 1.1).toFixed(2)}%, ${(camera.y * 0.7).toFixed(2)}%, 0) rotateY(${orbit.toFixed(2)}deg) rotateX(${pitch.toFixed(2)}deg) scale(${FIG_SCALE(p).toFixed(4)})`;

        /*
           Depth of field, driven by how fast the object is actually turning.

           A camera cannot resolve something moving quickly across its sensor,
           and with only four shot angles the fastest part of the turn is
           precisely where two frames are dissolving through each other. Softening
           in proportion to angular speed does two jobs with one filter: it is
           what real motion looks like, and it hides the double exposure that no
           amount of crossfade tuning can remove. Stop scrolling and the image
           settles back to sharp, exactly like focus catching up.

           Quantised to a quarter pixel so the blur is re-rasterised only when
           the bucket actually changes, and removed outright at zero rather than
           left as `blur(0px)`, which still costs a filter pass.
        */
        const blur =
          Math.round((FIG_DEFOCUS(p) + Math.min(2.2, turnSpeed * 0.011)) * 4) / 4;
        if (blur !== appliedBlur) {
          figureRef.current.style.filter = blur > 0 ? `blur(${blur}px)` : "";
          appliedBlur = blur;
        }
      }

      // Chapter copy: fade up on arrival, hold, drift out as the next begins.
      for (let i = 0; i < PANEL_RANGES.length; i++) {
        const el = panelRefs.current[i];
        if (!el) continue;
        el.style.opacity = PANEL_OPACITY[i]!(p).toFixed(3);
        // A sliver of the pointer camera, so the type occupies the same room as
        // the garment rather than sitting on the glass in front of it.
        el.style.transform = `translate3d(${(camera.x * 4).toFixed(2)}px,${PANEL_Y[i]!(p).toFixed(1)}px,0)`;
      }

      if (purchaseRef.current) {
        const o = BUY_OPACITY(p);
        purchaseRef.current.style.opacity = o.toFixed(3);
        purchaseRef.current.style.transform = `translate3d(0,${BUY_Y(p).toFixed(1)}px,0)`;
        // Only clickable once it has actually arrived, so an invisible panel
        // can never intercept a click meant for the film behind it.
        purchaseRef.current.style.pointerEvents = o > 0.9 ? "auto" : "none";
      }

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

        const el = frameRefs.current[i];
        if (!el) continue;

        if (opacity <= 0.001) {
          // Nothing to see, so nothing to compute. Four of the six frames are
          // invisible at any moment; writing transforms to them is work the
          // compositor throws away.
          if (frameOpacity[i] !== 0) {
            el.style.opacity = "0";
            frameOpacity[i] = 0;
          }
          continue;
        }
        frameOpacity[i] = opacity;

        /*
           Real rotation, not a slideshow.

           Each frame is turned about the vertical axis in proportion to how far
           the camera has moved past it, inside a parent carrying perspective,
           and pushed back along Z by the same amount. A frame being turned away
           from leans back, foreshortens *and recedes* exactly as a solid object
           would, while the incoming frame swings forward to meet it. The depth
           offset is what stops the handover reading as two photographs at
           different opacities: they are no longer on the same plane, so the
           perspective divide separates them the way it separates the near and
           far side of any real object.

           Mirrored frames negate the rotation as well as the scale, or they
           would lean the wrong way.
        */
        const facing = frame.mirrored ? -1 : 1;
        const rotateY = Math.max(-40, Math.min(40, delta * ROTATION_DEPTH));
        const depth = -Math.abs(delta) * FRAME_DEPTH;
        const shift = Math.max(-14, Math.min(14, -delta * 0.16));

        el.style.opacity = opacity.toFixed(3);
        el.style.transform = `translate3d(${shift.toFixed(1)}px,0,${depth.toFixed(1)}px) rotateY(${(rotateY * facing).toFixed(2)}deg) scaleX(${facing})`;
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
        {/*
          The camera.

          Perspective lives on this element rather than on the figure, so the
          dolly, the breath and the figure's orbit are all resolved in one
          projection — the lights, the wordmark and the garment share a single
          space instead of each being transformed in its own flat one.

          Type is deliberately outside it: scaling a heading resamples its
          glyphs every frame, and a Didone loses its hairlines first.
        */}
        <div
          ref={cameraRef}
          className="absolute inset-0 will-change-transform"
          style={{ perspective: "2000px", transformStyle: "preserve-3d" }}
        >
          {/* Placed with a negative margin rather than a translate: the loop
              owns `transform` on these elements, and a Tailwind centring
              transform would be overwritten on the first frame. */}
          <LightPlate
            ref={keyLightRef}
            className="top-[4%] left-1/2 -ml-[40svh] h-[80svh] w-[80svh]"
          />
          <LightPlate
            variant="rim"
            ref={rimLightRef}
            className="top-[14%] left-1/2 -ml-[26svh] h-[58svh] w-[52svh]"
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
            className="absolute inset-0 flex items-center justify-center will-change-[opacity,transform,filter]"
          >
            {/* A second, tighter perspective for the frames themselves, so the
                turn reads strongly at the scale of the object while the camera
                above it stays wide. */}
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
        </div>

        {/* Scrim under the chapter copy on narrow screens, where the type sits
            over the garment rather than beside it. Absent from lg up. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[62svh] bg-gradient-to-t from-[#08080a] via-[#08080a]/88 to-transparent lg:hidden"
        />

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
