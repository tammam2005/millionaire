"use client";

import { useSyncExternalStore } from "react";

/**
 * Resolves once the intro has finished and the page is the visitor's to look at.
 *
 * Without this the hero animates underneath the preloader and is already over
 * by the time the overlay lifts — the most considered moment on the site,
 * played to nobody. The whole sequence is one arrival: intro, then hero.
 *
 * Reads the same `data-preloader` attribute the intro writes, so there is no
 * second source of truth and no event bus to keep in sync.
 *
 * `useSyncExternalStore` rather than state-plus-effect: the value being read
 * lives in the DOM, which is precisely the case this hook exists for. It also
 * gets the server snapshot right for free — the intro has definitionally not
 * finished during SSR — so the first client render matches the markup and
 * nothing has to be patched up afterwards.
 */
export function usePreloaderComplete(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function subscribe(onStoreChange: () => void): () => void {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-preloader"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): boolean {
  return document.documentElement.dataset.preloader === "done";
}

function getServerSnapshot(): boolean {
  return false;
}
