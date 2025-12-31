"use client";

import Pusher from "pusher-js";

let pusherClient: Pusher | null = null;

/**
 * Initialize Pusher client for WebSocket communication
 * This is the recommended approach for Vercel deployment
 */
export function getPusherClient(): Pusher | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (!pusherClient) {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2";

    if (!pusherKey) {
      console.warn("Pusher key not found. WebSocket features will be disabled.");
      return null;
    }

    pusherClient = new Pusher(pusherKey, {
      cluster: pusherCluster,
    });
  }

  return pusherClient;
}

/**
 * Subscribe to a channel
 */
export function subscribeToChannel(
  channelName: string,
  eventName: string,
  callback: (data: unknown) => void
) {
  const pusher = getPusherClient();
  if (!pusher) {
    return () => {};
  }

  const channel = pusher.subscribe(channelName);
  channel.bind(eventName, callback);

  return () => {
    channel.unbind(eventName, callback);
    pusher.unsubscribe(channelName);
  };
}

/**
 * React hook for Pusher channel subscription
 */
export function usePusherChannel(
  channelName: string | null,
  eventName: string,
  callback: (data: unknown) => void
) {
  if (typeof window === "undefined") {
    return;
  }

  const React = require("react");
  const { useEffect, useRef } = React;

  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!channelName) {
      return;
    }

    const unsubscribe = subscribeToChannel(channelName, eventName, (data) => {
      callbackRef.current(data);
    });

    return unsubscribe;
  }, [channelName, eventName]);
}

