"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Get or create Socket.io client instance
 * For Vercel deployment, we'll use Pusher instead
 */
export function getSocket(): Socket | null {
  // For now, return null if we're on Vercel (will use Pusher)
  if (typeof window === "undefined") {
    return null;
  }

  // Check if we should use Socket.io (for self-hosted) or Pusher (for Vercel)
  const useSocketIO = process.env.NEXT_PUBLIC_USE_SOCKET_IO === "true";
  
  if (!useSocketIO) {
    // Will use Pusher for Vercel
    return null;
  }

  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    socket = io(socketUrl, {
      path: "/api/socket",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      autoConnect: true,
    });
  }
  return socket;
}

/**
 * Disconnect Socket.io client
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * React hook for Socket.io connection
 */
export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const sock = getSocket();
    if (!sock) {
      return;
    }

    setSocket(sock);

    sock.on("connect", () => {
      setIsConnected(true);
    });

    sock.on("disconnect", () => {
      setIsConnected(false);
    });

    return () => {
      sock.off("connect");
      sock.off("disconnect");
    };
  }, []);

  return { socket, isConnected };
}


