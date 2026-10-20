"use client";

import { useEffect, useState } from "react";

/**
 * Tracks the `md` breakpoint so AppShell can decide which single component
 * tree to mount for the center stage (crucially: the globe must only ever
 * be mounted once — two simultaneous WebGL contexts would be wasteful).
 * Defaults to `true` so server/first-paint output is deterministic; the
 * real value is applied on mount.
 */
export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isDesktop;
}
