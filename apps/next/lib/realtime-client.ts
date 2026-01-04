/**
 * Unified Real-time Client
 * Automatically uses Pusher if available, falls back to polling
 */

import Pusher, { Channel } from "pusher-js";

type EventCallback = (data: any) => void;
type Transport = "pusher" | "polling" | "none";

interface PollingConfig {
  url: string;
  interval: number;
}

class RealtimeClient {
  private pusher: Pusher | null = null;
  private pusherChannels: Map<string, Channel> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private eventCallbacks: Map<string, Map<string, Set<EventCallback>>> = new Map();
  private transport: Transport = "none";
  private isInitialized = false;

  /**
   * Initialize the real-time client
   * Tries Pusher first, falls back to polling if Pusher isn't available
   */
  initialize(): Transport {
    if (this.isInitialized) {
      console.log("[REALTIME] Already initialized with:", this.transport);
      return this.transport;
    }

    // Try Pusher first
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2";

    if (pusherKey && pusherKey.trim()) {
      try {
        this.pusher = new Pusher(pusherKey.trim(), {
          cluster: pusherCluster.trim(),
        });

        this.pusher.connection.bind("connected", () => {
          console.log("[REALTIME] ✅ Pusher connected");
        });

        this.pusher.connection.bind("error", (err: any) => {
          console.error("[REALTIME] ❌ Pusher error:", err);
          // Don't fall back mid-session, just log the error
        });

        this.transport = "pusher";
        this.isInitialized = true;
        console.log("[REALTIME] 🚀 Initialized with Pusher");
        return "pusher";
      } catch (error) {
        console.error("[REALTIME] Failed to initialize Pusher:", error);
        this.pusher = null;
      }
    }

    // Fallback to polling
    this.transport = "polling";
    this.isInitialized = true;
    console.log("[REALTIME] 🔄 Initialized with polling fallback");
    return "polling";
  }

  /**
   * Subscribe to a channel and listen for events
   */
  subscribe(
    channelName: string,
    eventName: string,
    callback: EventCallback,
    pollingConfig?: PollingConfig
  ): () => void {
    // Ensure initialized
    if (!this.isInitialized) {
      this.initialize();
    }

    console.log(`[REALTIME] Subscribing to ${channelName}:${eventName} via ${this.transport}`);

    // Store callback
    if (!this.eventCallbacks.has(channelName)) {
      this.eventCallbacks.set(channelName, new Map());
    }
    const channelCallbacks = this.eventCallbacks.get(channelName)!;
    if (!channelCallbacks.has(eventName)) {
      channelCallbacks.set(eventName, new Set());
    }
    channelCallbacks.get(eventName)!.add(callback);

    if (this.transport === "pusher" && this.pusher) {
      // Use Pusher
      let channel = this.pusherChannels.get(channelName);
      if (!channel) {
        channel = this.pusher.subscribe(channelName);
        this.pusherChannels.set(channelName, channel);
        
        channel.bind("pusher:subscription_succeeded", () => {
          console.log(`[REALTIME] ✅ Pusher subscribed to ${channelName}`);
        });

        channel.bind("pusher:subscription_error", (error: any) => {
          console.error(`[REALTIME] ❌ Pusher subscription error for ${channelName}:`, error);
        });
      }

      channel.bind(eventName, callback);
    } else if (this.transport === "polling" && pollingConfig) {
      // Use polling
      const pollKey = `${channelName}:${eventName}`;
      
      if (!this.pollingIntervals.has(pollKey)) {
        let lastData: any = null;
        
        const poll = async () => {
          try {
            const response = await fetch(pollingConfig.url);
            const data = await response.json();
            
            // Only trigger callback if data changed
            if (JSON.stringify(data) !== JSON.stringify(lastData)) {
              lastData = data;
              const callbacks = this.eventCallbacks.get(channelName)?.get(eventName);
              callbacks?.forEach(cb => cb(data));
            }
          } catch (error) {
            console.error(`[REALTIME] Polling error for ${channelName}:${eventName}:`, error);
          }
        };

        // Initial poll
        poll();
        
        // Set up interval
        const intervalId = setInterval(poll, pollingConfig.interval);
        this.pollingIntervals.set(pollKey, intervalId);
      }
    }

    // Return unsubscribe function
    return () => {
      console.log(`[REALTIME] Unsubscribing from ${channelName}:${eventName}`);
      
      const callbacks = this.eventCallbacks.get(channelName)?.get(eventName);
      callbacks?.delete(callback);

      if (this.transport === "pusher" && this.pusher) {
        const channel = this.pusherChannels.get(channelName);
        if (channel) {
          channel.unbind(eventName, callback);
          
          // If no more callbacks for this channel, unsubscribe
          const channelCallbacks = this.eventCallbacks.get(channelName);
          const hasCallbacks = Array.from(channelCallbacks?.values() || []).some(
            set => set.size > 0
          );
          
          if (!hasCallbacks) {
            this.pusher.unsubscribe(channelName);
            this.pusherChannels.delete(channelName);
            this.eventCallbacks.delete(channelName);
          }
        }
      } else if (this.transport === "polling") {
        const pollKey = `${channelName}:${eventName}`;
        const intervalId = this.pollingIntervals.get(pollKey);
        
        if (intervalId && callbacks?.size === 0) {
          clearInterval(intervalId);
          this.pollingIntervals.delete(pollKey);
        }
      }
    };
  }

  /**
   * Get current transport method
   */
  getTransport(): Transport {
    return this.transport;
  }

  /**
   * Disconnect and clean up
   */
  disconnect(): void {
    console.log("[REALTIME] Disconnecting...");

    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
    }

    this.pusherChannels.clear();
    
    this.pollingIntervals.forEach(interval => clearInterval(interval));
    this.pollingIntervals.clear();
    
    this.eventCallbacks.clear();
    this.transport = "none";
    this.isInitialized = false;
  }
}

// Singleton instance
const realtimeClient = new RealtimeClient();

export { realtimeClient, type EventCallback, type Transport };

