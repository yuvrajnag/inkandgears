"use client";

import { useSyncExternalStore } from "react";

/**
 * SSR-safe media query. Returns false during server render and on the first
 * client paint, then settles — same contract as useHydrated, so layouts never
 * mismatch.
 */
export function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Phones and small tablets in portrait — the dense toolbar can't fit here. */
export function useIsCompact() {
  return useMedia("(max-width: 1023px)");
}

/** Phone-sized. */
export function useIsPhone() {
  return useMedia("(max-width: 639px)");
}

/** Coarse pointer — touch targets need to be bigger. */
export function useIsTouch() {
  return useMedia("(pointer: coarse)");
}
