# WebSocket Implementation Plan - Real-Time Notifications

**Last Updated:** December 2024  
**Status:** ✅ **IMPLEMENTED**  
**Priority:** 🔴 **HIGHEST** - Critical for production

---

## 🎯 Overview

Implement real-time bidirectional communication using WebSockets (Socket.io) to enable:
1. **Kitchen staff** receive instant notifications when orders are placed
2. **Kitchen staff** can update order status in real-time
3. **Customers** see order status updates instantly on their table session

---

## 🔄 Complete Flow

```
┌─────────────┐
│   Customer  │
│  (Table 5)  │
└──────┬──────┘
       │
       │ 1. Scans QR → Creates Session
       │
       │ 2. Adds items to cart
       │
       │ 3. Places Order
       │    POST /api/orders/create
       │
       ▼
┌─────────────────────┐
│   Order Created     │
│   Status: "pending"  │
└──────┬──────────────┘
       │
       │ 4. Emit WebSocket Event
       │    socket.to(`restaurant:${restaurantId}`)
       │    .emit('order:created', orderData)
       │
       ▼
┌─────────────────────┐
│  Kitchen Staff      │
│  (Connected to      │
│   restaurant room)  │
└──────┬──────────────┘
       │
       │ 5. Receives notification
       │    Sound + Visual alert
       │
       │ 6. Updates Status
       │    PATCH /api/orders/:id
       │    { status: "cooking" }
       │
       ▼
┌─────────────────────┐
│  Order Status       │
│  Updated            │
└──────┬──────────────┘
       │
       │ 7. Emit WebSocket Events
       │    socket.to(`restaurant:${restaurantId}`)
       │      .emit('order:status:updated', orderData)
       │    socket.to(`session:${sessionToken}`)
       │      .emit('order:status:updated', orderData)
       │
       ▼
┌─────────────────────┐
│  Customer & Kitchen │
│  See Update         │
│  Instantly          │
└─────────────────────┘
```

---

## 🏗️ Architecture

### Server-Side (Next.js API Routes)

**Option 1: Socket.io with Next.js API Route (Recommended)**
- Use `socket.io` package
- Create custom server or use API route handler
- For Vercel: Use Serverless WebSocket (Vercel supports Socket.io)

**Option 2: Native WebSocket**
- Use native `ws` package
- More control but more setup required

**Recommended:** Socket.io (easier, more features, better error handling)

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "socket.io": "^4.7.0",
    "socket.io-client": "^4.7.0"
  }
}
```

---

## 🔧 Implementation Steps

### Step 1: Install Dependencies

```bash
cd apps/next
npm install socket.io socket.io-client
```

---

### Step 2: Create WebSocket Server

**File:** `apps/next/lib/socket-server.ts`

```typescript
import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";

let io: SocketIOServer | null = null;

export function initializeSocket(server: HTTPServer) {
  io = new SocketIOServer(server, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join restaurant room
    socket.on("join:restaurant", (restaurantId: string) => {
      socket.join(`restaurant:${restaurantId}`);
      console.log(`Socket ${socket.id} joined restaurant:${restaurantId}`);
    });

    // Join session room (for customer table sessions)
    socket.on("join:session", (sessionToken: string) => {
      socket.join(`session:${sessionToken}`);
      console.log(`Socket ${socket.id} joined session:${sessionToken}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
}
```

---

### Step 3: Create WebSocket API Route

**File:** `apps/next/app/api/socket/route.ts`

```typescript
import { NextRequest } from "next/server";
import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { initializeSocket } from "@/lib/socket-server";

// For Next.js App Router, we need to handle WebSocket differently
// This is a placeholder - actual implementation depends on deployment

export async function GET(request: NextRequest) {
  // WebSocket upgrade happens here
  // Implementation depends on hosting (Vercel/self-hosted)
  return new Response("WebSocket endpoint", { status: 200 });
}
```

**Note:** For Vercel, consider using:
- Vercel's Serverless WebSocket support
- Or use a separate WebSocket server (Railway, Render, etc.)
- Or use Pusher/Ably as managed WebSocket service

---

### Step 4: Create Client-Side Socket Hook

**File:** `apps/next/lib/socket-client.ts`

```typescript
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "", {
      path: "/api/socket",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
```

---

### Step 5: Update Order Creation API

**File:** `apps/next/app/api/orders/create/route.ts`

Add WebSocket emission after order creation:

```typescript
import { getIO } from "@/lib/socket-server";

// After order is created (line 96)
const [newOrder] = await db.insert(orders).values({...}).returning();

// Emit WebSocket event to restaurant room
try {
  const io = getIO();
  io.to(`restaurant:${session.restaurantId}`).emit("order:created", {
    order: {
      id: newOrder.id,
      items: newOrder.items,
      totalAmount: newOrder.totalAmount,
      status: newOrder.status,
      tableNumber: session.tableNumber,
      customerName: validatedData.customerName,
      createdAt: newOrder.createdAt,
    },
    session: {
      id: session.id,
      tableNumber: session.tableNumber,
    },
  });
} catch (error) {
  console.error("WebSocket emission error:", error);
  // Don't fail the request if WebSocket fails
}

return NextResponse.json({...});
```

---

### Step 6: Update Order Status API

**File:** `apps/next/app/api/orders/[id]/route.ts`

Add WebSocket emission after status update:

```typescript
import { getIO } from "@/lib/socket-server";
import { db, tableSessions, eq } from "@menumate/db";

// After status is updated
const [updatedOrder] = await db.update(orders).set({...}).returning();

// Get session if exists
let sessionToken = null;
if (updatedOrder.sessionId) {
  const [session] = await db
    .select()
    .from(tableSessions)
    .where(eq(tableSessions.id, updatedOrder.sessionId))
    .limit(1);
  sessionToken = session?.sessionToken || null;
}

// Emit to restaurant room (for kitchen staff)
try {
  const io = getIO();
  io.to(`restaurant:${updatedOrder.restaurantId}`).emit("order:status:updated", {
    orderId: updatedOrder.id,
    status: updatedOrder.status,
    tableNumber: updatedOrder.tableNumber,
  });

  // Emit to session room (for customer)
  if (sessionToken) {
    io.to(`session:${sessionToken}`).emit("order:status:updated", {
      orderId: updatedOrder.id,
      status: updatedOrder.status,
    });
  }
} catch (error) {
  console.error("WebSocket emission error:", error);
}

return NextResponse.json({...});
```

---

### Step 7: Kitchen Display System with WebSocket

**File:** `apps/next/app/admin/kitchen/page.tsx` (NEW)

```typescript
"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket-client";
import { useRouter } from "next/navigation";

export default function KitchenPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    // Get restaurant ID (from auth or props)
    // For now, assume we have it
    const restaurantId = "your-restaurant-id";
    setRestaurantId(restaurantId);

    const socket = getSocket();

    // Join restaurant room
    socket.emit("join:restaurant", restaurantId);

    // Listen for new orders
    socket.on("order:created", (data) => {
      setOrders((prev) => [data.order, ...prev]);
      // Play sound notification
      playNotificationSound();
    });

    // Listen for status updates
    socket.on("order:status:updated", (data) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === data.orderId
            ? { ...order, status: data.status }
            : order
        )
      );
    });

    return () => {
      socket.off("order:created");
      socket.off("order:status:updated");
    };
  }, []);

  const playNotificationSound = () => {
    const audio = new Audio("/notification.mp3");
    audio.play().catch(console.error);
  };

  const updateStatus = async (orderId: string, status: string) => {
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-6">Kitchen Display</h1>
      <div className="grid grid-cols-3 gap-4">
        {/* Pending Orders */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Pending</h2>
          {orders
            .filter((o) => o.status === "pending")
            .map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onUpdateStatus={(status) => updateStatus(order.id, status)}
              />
            ))}
        </div>
        {/* Cooking Orders */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Cooking</h2>
          {orders
            .filter((o) => o.status === "cooking")
            .map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onUpdateStatus={(status) => updateStatus(order.id, status)}
              />
            ))}
        </div>
        {/* Ready Orders */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Ready</h2>
          {orders
            .filter((o) => o.status === "ready")
            .map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
        </div>
      </div>
    </div>
  );
}
```

---

### Step 8: Customer Table Session with WebSocket

**File:** `apps/next/app/r/[slug]/menu-with-session.tsx`

Add WebSocket listener for status updates:

```typescript
import { useEffect } from "react";
import { getSocket } from "@/lib/socket-client";

export function MenuWithSession({...}) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [orderStatuses, setOrderStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!sessionToken) return;

    const socket = getSocket();

    // Join session room
    socket.emit("join:session", sessionToken);

    // Listen for order status updates
    socket.on("order:status:updated", (data) => {
      setOrderStatuses((prev) => ({
        ...prev,
        [data.orderId]: data.status,
      }));

      // Show notification to customer
      showStatusUpdateNotification(data.status);
    });

    return () => {
      socket.off("order:status:updated");
    };
  }, [sessionToken]);

  // ... rest of component
}
```

---

### Step 9: Bill Page with WebSocket

**File:** `apps/next/app/bill/page.tsx`

Add WebSocket listener for order status updates:

```typescript
import { useEffect } from "react";
import { getSocket } from "@/lib/socket-client";

function BillPageContent() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!sessionToken) return;

    const socket = getSocket();

    // Join session room
    socket.emit("join:session", sessionToken);

    // Listen for order status updates
    socket.on("order:status:updated", (data) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === data.orderId
            ? { ...order, status: data.status }
            : order
        )
      );
    });

    return () => {
      socket.off("order:status:updated");
    };
  }, [sessionToken]);

  // ... rest of component
}
```

---

## 🚀 Deployment Considerations

### For Vercel:
- Vercel supports WebSockets but with limitations
- Consider using:
  - **Pusher** (managed WebSocket service)
  - **Ably** (managed WebSocket service)
  - **Separate WebSocket server** (Railway, Render, etc.)

### For Self-Hosted:
- Use Node.js server with Socket.io
- Configure reverse proxy (Nginx)
- Handle WebSocket upgrades

### Recommended: Pusher or Ably
- Managed service
- Reliable
- Easy integration
- Free tier available
- Works with Vercel

---

## 📋 Testing Checklist

- [ ] WebSocket connection established
- [ ] Kitchen staff receives order notification
- [ ] Sound plays on new order
- [ ] Kitchen can update order status
- [ ] Customer sees status update in real-time
- [ ] Reconnection works on disconnect
- [ ] Multiple customers can connect
- [ ] Multiple kitchen staff can connect
- [ ] Room isolation works (restaurant rooms separate)
- [ ] Session rooms work correctly

---

## 🎯 Success Metrics

- **Latency:** < 100ms from order creation to kitchen notification
- **Reliability:** 99.9% message delivery
- **Uptime:** 99.9% WebSocket server uptime
- **User Experience:** Real-time updates without page refresh

---

*This implementation plan should be followed step-by-step, testing after each step.*

