/**
 * React hook for unified real-time subscriptions
 * Automatically uses Pusher or polling based on availability
 */

import { useEffect, useRef } from "react";
import { realtimeClient, EventCallback } from "./realtime-client";

interface UseRealtimeOptions {
  channelName: string;
  eventName: string;
  callback: EventCallback;
  pollingUrl?: string;
  pollingInterval?: number;
}

export function useRealtime({
  channelName,
  eventName,
  callback,
  pollingUrl,
  pollingInterval = 3000,
}: UseRealtimeOptions) {
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Initialize transport
    const transport = realtimeClient.initialize();
    console.log(`[REALTIME HOOK] Using transport: ${transport}`);

    // Subscribe with polling config if provided
    const unsubscribe = realtimeClient.subscribe(
      channelName,
      eventName,
      (data) => callbackRef.current(data),
      pollingUrl
        ? {
            url: pollingUrl,
            interval: pollingInterval,
          }
        : undefined
    );

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [channelName, eventName, pollingUrl, pollingInterval]);

  return realtimeClient.getTransport();
}

