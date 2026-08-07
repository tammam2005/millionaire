"use client";

import { useEffect, useRef } from "react";

/**
 * Isolation test — nothing but the video.
 *
 * Built to answer one question: does the defect reported on iPhone belong
 * to the video itself (decode, colour, WebKit's media pipeline) or to
 * something layered over it in the real hero? So this page is deliberately
 * everything the hero is *not*: no React animation library, no overlays, no
 * gradients, no CSS `filter`, no `mask`, no `mix-blend-mode`, no
 * `position: sticky`. `GlobalChrome` also keeps Grain, Cursor, the
 * preloader and Lenis off this one route — see that file — so this page
 * carries literally nothing the production layout would otherwise mount.
 *
 * What *is* kept, deliberately, because the request was to test them, not
 * remove them along with everything else:
 * - The exact same two video files, in the exact same `<source>` order, so
 *   the browser's own codec-support decision is identical to production —
 *   iOS still lands on the MP4 fallback here for the same reason it does
 *   there.
 * - The same scroll-scrub pump: one seek in flight at a time, released by
 *   `requestVideoFrameCallback` (falling back to `seeked`), chasing an
 *   eased copy of scroll progress rather than reading it directly. This is
 *   the actual mechanism from `OutfitFilm.tsx`, not a simplified
 *   approximation of it — if a bug lives in this mechanism itself rather
 *   than in what surrounds it, it needs to still be present here to catch.
 * - The same silent play/pause decoder-priming step, for the same reason
 *   it exists in production: without it, iOS can under-decode a
 *   never-played video regardless of anything else on the page.
 *
 * The video is `position: fixed` rather than `position: sticky` (excluded
 * by name) or left in normal flow (which would scroll it off screen) — a
 * simple, different mechanism for "stay on screen while scroll drives the
 * frame", chosen so the video is actually visible to look at for the whole
 * length of the scroll.
 */

const TURNTABLE_WEBM_SRC = "/videos/hooded-set-turntable.webm";
const TURNTABLE_MP4_SRC = "/videos/hooded-set-turntable-fallback.mp4";
const FRAME_STEP = 1 / 24;
const SCROLL_LERP = 0.075;

export default function VideoTestPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Decoder priming — identical purpose to OutfitFilm.tsx: one silent,
    // muted play/pause so WebKit's decode pipeline is actually running
    // before the first programmatic seek.
    let primed = false;
    const primeDecoder = () => {
      if (primed) return;
      primed = true;
      video.play().then(
        () => video.pause(),
        () => {},
      );
    };
    video.addEventListener("loadedmetadata", primeDecoder);
    if (video.readyState >= 1) primeDecoder();

    let seekTarget = 0;
    let seekInFlight = false;

    const pump = () => {
      if (seekInFlight || !(video.duration > 0)) return;
      const wanted = Math.min(seekTarget * video.duration, video.duration - FRAME_STEP);
      const shown = video.currentTime;
      if (Math.abs(wanted - shown) < FRAME_STEP * 0.5) return;
      seekInFlight = true;
      video.currentTime = wanted;
    };

    const onSeeked = () => {
      seekInFlight = false;
      pump();
    };

    type FrameCallbackVideo = HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number;
      cancelVideoFrameCallback?: (handle: number) => void;
    };
    let frameHandle = 0;
    const watchFrames = (v: FrameCallbackVideo) => {
      if (!v.requestVideoFrameCallback) return;
      frameHandle = v.requestVideoFrameCallback(() => {
        seekInFlight = false;
        pump();
        watchFrames(v);
      });
    };

    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onSeeked);
    watchFrames(video);

    // Scroll progress, read directly — no Framer Motion, just the same
    // eased-chase the production pump uses once it has the raw value.
    let smoothed = 0;
    let raf = 0;
    const tick = () => {
      const doc = document.documentElement;
      const raw = doc.scrollHeight > doc.clientHeight
        ? window.scrollY / (doc.scrollHeight - doc.clientHeight)
        : 0;
      smoothed += (raw - smoothed) * SCROLL_LERP;
      seekTarget = Math.min(Math.max(smoothed, 0), 1);
      pump();
      if (statusRef.current) {
        statusRef.current.textContent = `scroll ${(seekTarget * 100).toFixed(0)}% — currentTime ${video.currentTime.toFixed(2)}s / ${(video.duration || 0).toFixed(2)}s — source: ${video.currentSrc.split("/").pop()}`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      video.removeEventListener("loadedmetadata", primeDecoder);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onSeeked);
      if (frameHandle) {
        (video as FrameCallbackVideo).cancelVideoFrameCallback?.(frameHandle);
      }
    };
  }, []);

  return (
    <main style={{ background: "#000000", minHeight: "500vh" }}>
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90vw",
          maxWidth: "900px",
          height: "auto",
        }}
      >
        <source src={TURNTABLE_WEBM_SRC} type="video/webm" />
        <source src={TURNTABLE_MP4_SRC} type="video/mp4" />
      </video>
      <div
        ref={statusRef}
        style={{
          position: "fixed",
          bottom: 12,
          left: 12,
          right: 12,
          color: "#ffffff",
          fontFamily: "monospace",
          fontSize: 12,
          opacity: 0.8,
        }}
      >
        loading…
      </div>
    </main>
  );
}
