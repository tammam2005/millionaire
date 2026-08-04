/**
 * Film grain.
 *
 * Flat black on a screen is inert — real photographic black has structure.
 * A trace of grain gives the void depth and stops large dark areas banding on
 * cheap panels, which is where a site like this looks worst.
 *
 * **Why it costs nothing.** The obvious implementations are all expensive:
 * animating `background-position` repaints a full-screen layer every frame,
 * and a canvas grain burns main-thread time forever. Instead the noise tile is
 * rendered once as an inline SVG data URI, sized larger than the viewport, and
 * *transformed* between offsets. Transforms are composited on the GPU, so the
 * animation never touches layout, paint or the main thread.
 *
 * `steps()` is deliberate: grain that eases between positions reads as a
 * sliding texture. Real grain jumps, so the movement is quantised to 6 discrete
 * frames — the difference between film and a moving pattern.
 *
 * A server component: it has no state and no interactivity, so it ships as
 * markup with no JavaScript at all.
 */

/** Fractal noise, generated once by the browser's SVG filter, then reused. */
const NOISE = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">
     <filter id="n">
       <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" stitchTiles="stitch"/>
       <feColorMatrix type="saturate" values="0"/>
     </filter>
     <rect width="180" height="180" filter="url(#n)" opacity="0.42"/>
   </svg>`,
)}`;

export function Grain() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
      style={{ contain: "strict" }}
    >
      <div
        data-grain
        className="absolute -inset-[60px] opacity-[0.055] mix-blend-overlay"
        style={{
          backgroundImage: `url("${NOISE}")`,
          backgroundRepeat: "repeat",
          willChange: "transform",
        }}
      />
    </div>
  );
}
