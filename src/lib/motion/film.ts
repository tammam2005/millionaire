/**
 * Primitives for scroll-driven film motion.
 *
 * Two problems these solve, both of which are audible as "cheapness" long
 * before anyone can name them:
 *
 * 1. **Corners in velocity.** Interpolating a table of keyframes segment by
 *    segment — linearly, or even with a per-segment ease — leaves the *rate* of
 *    change discontinuous at every stop. The value itself is smooth, but its
 *    derivative jumps, and the eye is far better at reading acceleration than
 *    position. A garment that turns at one speed and then abruptly at another
 *    reads as a scrubbed timeline. `curve()` fixes this.
 *
 * 2. **Frame-rate dependence.** `x += (target - x) * 0.075` is the standard
 *    smoothing one-liner and it is wrong: the coefficient is per *frame*, so
 *    the same code settles twice as fast on a 120Hz display and crawls when the
 *    tab is throttled. Every follower here is driven by elapsed time instead.
 */

export type Stops = readonly (readonly [number, number])[];

/**
 * Compile a table of `[input, output]` stops into a monotone cubic curve.
 *
 * Monotone cubic Hermite (Fritsch–Carlson): C¹ continuous, so speed carries
 * through each stop instead of restarting there, and provably free of the
 * overshoot a plain Catmull-Rom would introduce — which matters when the output
 * is an opacity that must never exceed 1, or a scale that must never invert.
 *
 * The end tangents are clamped to zero, so every curve *starts and finishes at
 * rest*. Interior stops keep their momentum; the film as a whole eases in and
 * out. A run of equal values (a deliberate hold) gets zero tangents at both of
 * its ends automatically, so holds stay perfectly flat and glide back out.
 *
 * Compiled once, called every frame: the tangent solve is hoisted out of the
 * rAF loop and evaluation is a handful of multiplies.
 */
export function curve(stops: Stops): (input: number) => number {
  const n = stops.length;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < n; i++) {
    const stop = stops[i]!;
    xs.push(stop[0]);
    ys.push(stop[1]);
  }

  if (n === 1) {
    const only = ys[0]!;
    return () => only;
  }

  // Secant slope of each segment.
  const secant: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    secant.push((ys[i + 1]! - ys[i]!) / (xs[i + 1]! - xs[i]!));
  }

  // Tangent at each stop. Zero at the ends; the average of the neighbouring
  // secants inside, except at a local extremum, where zero is the only value
  // that cannot overshoot.
  const tangent: number[] = new Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    const before = secant[i - 1]!;
    const after = secant[i]!;
    tangent[i] = before * after <= 0 ? 0 : (before + after) / 2;
  }

  // Fritsch–Carlson limiter: pull any tangent back inside the circle of radius
  // 3 that guarantees the segment stays monotone.
  for (let i = 0; i < n - 1; i++) {
    const slope = secant[i]!;
    if (slope === 0) {
      tangent[i] = 0;
      tangent[i + 1] = 0;
      continue;
    }
    const a = tangent[i]! / slope;
    const b = tangent[i + 1]! / slope;
    const magnitude = a * a + b * b;
    if (magnitude > 9) {
      const scale = 3 / Math.sqrt(magnitude);
      tangent[i] = scale * a * slope;
      tangent[i + 1] = scale * b * slope;
    }
  }

  const firstX = xs[0]!;
  const firstY = ys[0]!;
  const lastX = xs[n - 1]!;
  const lastY = ys[n - 1]!;

  return (input: number): number => {
    if (input <= firstX) return firstY;
    if (input >= lastX) return lastY;

    let i = 1;
    while (i < n - 1 && input > xs[i]!) i++;

    const x0 = xs[i - 1]!;
    const x1 = xs[i]!;
    const h = x1 - x0;
    const t = (input - x0) / h;
    const t2 = t * t;
    const t3 = t2 * t;

    return (
      (2 * t3 - 3 * t2 + 1) * ys[i - 1]! +
      (t3 - 2 * t2 + t) * h * tangent[i - 1]! +
      (-2 * t3 + 3 * t2) * ys[i]! +
      (t3 - t2) * h * tangent[i]!
    );
  };
}

/** Mutable velocity carried between frames by {@link smoothDamp}. */
export type Damper = { velocity: number };

export const damper = (): Damper => ({ velocity: 0 });

/**
 * Critically damped follow — the film's inertia.
 *
 * Unlike a per-frame lerp this integrates a velocity, so when the input stops
 * the motion *coasts and settles* instead of decaying instantly to a halt. That
 * carried momentum is the whole difference between a camera move and a value
 * being dragged. Critically damped, so it never overshoots: bounce would read
 * as playful, and this brand is not.
 *
 * `smoothTime` is roughly how long it takes to arrive, in seconds, and the
 * result is identical at 60Hz, 120Hz and on a throttled tab.
 *
 * (The exponential is the standard Padé approximation — cheaper than `Math.exp`
 * and accurate well past the step sizes that reach it here.)
 */
export function smoothDamp(
  current: number,
  target: number,
  state: Damper,
  smoothTime: number,
  dt: number,
): number {
  const omega = 2 / smoothTime;
  const x = omega * dt;
  const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = current - target;
  const temp = (state.velocity + omega * change) * dt;
  state.velocity = (state.velocity - omega * temp) * decay;
  return target + (change + temp) * decay;
}

/**
 * Time-correct exponential approach, for followers that want lag but no
 * momentum — the pointer camera, the key light.
 *
 * `halfLife` is the time to close half the remaining distance, which stays
 * true whatever the frame rate.
 */
export function approach(
  current: number,
  target: number,
  halfLife: number,
  dt: number,
): number {
  return target + (current - target) * Math.pow(2, -dt / halfLife);
}

/** Largest step the loop will integrate, so a backgrounded tab cannot lurch. */
export const MAX_STEP = 1 / 24;
