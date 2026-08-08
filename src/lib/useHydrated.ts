"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * The project lives in localStorage, so the server has nothing to render.
 * Gate anything store-driven on this to keep hydration honest.
 */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
