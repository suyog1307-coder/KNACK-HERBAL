"use client";

import { useEffect, useState } from "react";

/**
 * Returns true only after the component has mounted on the client.
 *
 * Server render  → false  (matches first client render → no hydration mismatch)
 * After hydration → true  (persisted Zustand state is now safe to read)
 */
export function useIsMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
