"use client";

import { useEffect, useRef, useState } from "react";

/** Contextual cursor modes. Declared by elements via `data-cursor`. */
const LABELS = {
  drag: "Drag",
  view: "View",
  add: "Add",
} as const;

export type CursorMode = keyof typeof LABELS;

const FOLLOW_LERP = 0.18;
const MAGNET_LERP = 0.24;

function isCursorMode(value: string | undefined): value is CursorMode {
  return value !== undefined && value in LABELS;
}

/**
 * The MILLIONAIRE cursor — a hairline ring with a centre dot.
 *
 * Design rules, enforced here rather than left to callers:
 *
 * - `mix-blend-mode: difference` means it stays legible over the void ground
 *   and the bright studio ground without any per-section theming.
 * - It is **magnetic**: over an element marked `data-cursor-magnetic` it
 *   drifts toward that element's centre, so buttons feel like they attract it.
 * - Labels appear only for the three modes above. A cursor that narrates every
 *   hover stops being minimal.
 *
 * Never mounts on coarse pointers or under reduced motion — a lagging ring on
 * a touchscreen is pure cost, and a trailing element is exactly the kind of
 * motion the preference exists to suppress.
 *
 * Performance: position lives in refs and is written straight to `transform`
 * inside one rAF loop. React state changes only when the *mode* changes, which
 * is a handful of times per session rather than 60 times per second.
 */
export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<CursorMode | null>(null);
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);

  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  // Mirrors `visible` so the rAF effect can read it without depending on it —
  // otherwise the first pointer move would tear down and rebuild the loop.
  const visibleRef = useRef(false);

  // Target the cursor is chasing, and where it currently is.
  const pointer = useRef({ x: 0, y: 0 });
  const magnet = useRef<{ x: number; y: number } | null>(null);
  const ring = useRef({ x: 0, y: 0 });
  const dot = useRef({ x: 0, y: 0 });

  // Decide whether this device should have a custom cursor at all.
  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sync = () => setEnabled(finePointer.matches && !reduced.matches);
    sync();

    finePointer.addEventListener("change", sync);
    reduced.addEventListener("change", sync);
    return () => {
      finePointer.removeEventListener("change", sync);
      reduced.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Hide the native cursor only while ours is live, and only on elements
    // where a caret isn't needed — text fields keep the system cursor.
    document.documentElement.setAttribute("data-custom-cursor", "true");

    const show = (next: boolean) => {
      if (visibleRef.current === next) return;
      visibleRef.current = next;
      setVisible(next);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY };
      show(true);
    };

    const onPointerOver = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const holder = target.closest<HTMLElement>("[data-cursor]");
      const nextMode = holder?.dataset.cursor;
      setMode(isCursorMode(nextMode) ? nextMode : null);

      const interactive = target.closest<HTMLElement>(
        "a, button, [role='button'], [data-cursor]",
      );
      setActive(interactive !== null);

      const magnetic = target.closest<HTMLElement>("[data-cursor-magnetic]");
      if (magnetic) {
        const box = magnetic.getBoundingClientRect();
        magnet.current = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
      } else {
        magnet.current = null;
      }
    };

    const onPointerLeave = () => show(false);
    const onPointerEnter = () => show(true);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerover", onPointerOver, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("pointerenter", onPointerEnter);

    let frame = 0;
    const tick = () => {
      // The ring is drawn toward the magnet when there is one, so interactive
      // elements feel like they capture it. The dot always tracks the pointer
      // exactly — without that the cursor stops feeling connected to the hand.
      const ringTarget = magnet.current ?? pointer.current;
      const ringLerp = magnet.current ? MAGNET_LERP : FOLLOW_LERP;

      ring.current.x += (ringTarget.x - ring.current.x) * ringLerp;
      ring.current.y += (ringTarget.y - ring.current.y) * ringLerp;
      dot.current.x += (pointer.current.x - dot.current.x) * 0.55;
      dot.current.y += (pointer.current.y - dot.current.y) * 0.55;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.current.x}px, ${ring.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dot.current.x}px, ${dot.current.y}px, 0) translate(-50%, -50%)`;
      }

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("pointerenter", onPointerEnter);
      document.documentElement.removeAttribute("data-custom-cursor");
    };
  }, [enabled]);

  if (!enabled) return null;

  const label = mode ? LABELS[mode] : null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] mix-blend-difference"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 300ms var(--ease-signature)",
      }}
    >
      <div
        ref={ringRef}
        className="absolute top-0 left-0 flex items-center justify-center rounded-full border border-bone will-change-transform"
        style={{
          width: label ? 68 : 34,
          height: label ? 68 : 34,
          borderWidth: active ? 1.5 : 1,
          transition:
            "width 400ms var(--ease-signature), height 400ms var(--ease-signature), border-width 400ms var(--ease-signature)",
        }}
      >
        <span
          className="text-[0.5625rem] tracking-[0.2em] text-bone uppercase"
          style={{
            opacity: label ? 1 : 0,
            transition: "opacity 250ms var(--ease-signature)",
          }}
        >
          {label}
        </span>
      </div>

      <div
        ref={dotRef}
        className="absolute top-0 left-0 rounded-full bg-bone will-change-transform"
        style={{
          width: 3,
          height: 3,
          opacity: label ? 0 : 1,
          transition: "opacity 250ms var(--ease-signature)",
        }}
      />
    </div>
  );
}
