import type Lenis from "lenis";

/**
 * Module-level handle on the running Lenis instance.
 *
 * Lenis takes ownership of scrolling, which makes `window.scrollTo`,
 * `scrollIntoView` and hash-link navigation silent no-ops — they set a
 * position that Lenis immediately overwrites on its next frame. Anything that
 * needs to move the page has to go through the instance.
 *
 * Deliberately a module singleton rather than React context: scroll is a
 * document-level concern with exactly one owner, and a context would force
 * every consumer to be a client component inside a provider for no benefit.
 */
let instance: Lenis | null = null;

export function registerLenis(lenis: Lenis | null): void {
  instance = lenis;
}

export function getLenis(): Lenis | null {
  return instance;
}

type ScrollTarget = number | string | HTMLElement;

/**
 * Scroll the page, whether or not Lenis is running.
 *
 * Falls back to native scrolling when Lenis is absent — which is the case on
 * touch devices and under reduced motion, where we deliberately never start
 * it. Callers should not have to know which mode they are in.
 */
export function scrollTo(target: ScrollTarget, options?: { immediate?: boolean }): void {
  const lenis = getLenis();

  if (lenis) {
    lenis.scrollTo(target, { immediate: options?.immediate ?? false });
    return;
  }

  const behavior: ScrollBehavior = options?.immediate ? "auto" : "smooth";

  if (typeof target === "number") {
    window.scrollTo({ top: target, behavior });
    return;
  }

  const element =
    typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  element?.scrollIntoView({ behavior, block: "start" });
}

export function scrollToTop(options?: { immediate?: boolean }): void {
  scrollTo(0, options);
}

/**
 * Freeze and resume scrolling around modal surfaces.
 *
 * Radix locks the body when a dialog opens, but Lenis animates its own
 * position and keeps running underneath that lock — so the page carries on
 * drifting behind an open overlay. Lenis has to be told separately.
 */
export function lockScroll(): void {
  getLenis()?.stop();
}

export function unlockScroll(): void {
  getLenis()?.start();
}
