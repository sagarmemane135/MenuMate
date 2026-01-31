"use client";

import { useEffect, useRef } from "react";

/**
 * Poll a URL at an interval and call the callback with the parsed JSON response.
 * Used for real-time updates without WebSockets (fully local setup).
 */
export function usePolling<T = unknown>(
  url: string | null,
  intervalMs: number,
  callback: (data: T) => void,
  options?: { enabled?: boolean }
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const enabled = options?.enabled !== false;

  useEffect(() => {
    if (!url || !enabled || intervalMs < 1000) return;

    const fetchData = async () => {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = (await res.json()) as T;
          callbackRef.current(data);
        }
      } catch (err) {
        console.error("[POLLING] Failed to fetch:", url, err);
      }
    };

    fetchData();
    const id = setInterval(fetchData, intervalMs);
    return () => clearInterval(id);
  }, [url, intervalMs, enabled]);
}
