"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { UtensilsCrossed, CheckCircle2, ImageOff, ShoppingCart, Send, Plus, Minus, X, Receipt, AlertCircle } from "lucide-react";
import { useCart, useToast } from "@menumate/app";
import { Button } from "@menumate/app";
import { usePusherChannel } from "@/lib/pusher-client";

interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  available: boolean;
  categoryId: string;
  sortOrder: number;
}

interface MenuWithSessionProps {
  restaurant: {
    name: string;
    slug: string;
    isActive: boolean;
  };
  categories: Category[];
  menuItems: MenuItem[];
}

export function MenuWithSession({ restaurant, categories, menuItems }: MenuWithSessionProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableNumber = searchParams.get("table");
  
  const { addItem, items, removeItem, updateQuantity, clearCart, totalPrice } = useCart();
  const { showToast } = useToast();
  
  // Initialize state without localStorage access (to avoid hydration mismatch)
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isSendingOrder, setIsSendingOrder] = useState(false);
  
  // Load customer details from localStorage or session
  const getInitialCustomerData = (): { name: string; phone: string } => {
    if (typeof window === "undefined") return { name: "", phone: "" };
    const savedName = localStorage.getItem(`customer_name_${restaurant.slug}`);
    const savedPhone = localStorage.getItem(`customer_phone_${restaurant.slug}`);
    return {
      name: savedName || "",
      phone: savedPhone || "",
    };
  };
  
  const initialCustomerData = getInitialCustomerData();
  const [customerName, setCustomerName] = useState(initialCustomerData.name);
  const [customerPhone, setCustomerPhone] = useState(initialCustomerData.phone);
  const [phoneError, setPhoneError] = useState("");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [inputTableNumber, setInputTableNumber] = useState(tableNumber || "");
  const [recentOrders, setRecentOrders] = useState<Array<{
    id: string;
    status: string;
    createdAt: string;
  }>>([]);
  const [sessionStatus, setSessionStatus] = useState<"active" | "closed" | "paid" | null>(null);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);

  // Validate phone number (10 digits for Indian numbers)
  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.length === 10;
  };

  const handlePhoneChange = (value: string) => {
    setCustomerPhone(value);
    if (value && !validatePhone(value)) {
      setPhoneError("Please enter a valid 10-digit phone number");
    } else {
      setPhoneError("");
    }
  };

  // Verify session token is still valid
  const verifySession = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/sessions/${token}`);
      if (response.ok) {
        const data = await response.json();
        return data.success && data.session?.status === "active";
      }
      return false;
    } catch (error) {
      console.error("[CLIENT] Session verification error:", error);
      return false;
    }
  };

  // Restore session from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Get initial session data from localStorage
    const getInitialSessionData = (): { token: string | null; table: string | null } => {
      // Store a master key for the current restaurant's active session
      const masterKey = `active_session_${restaurant.slug}`;
      
      // If table number is in URL, prioritize it and check if stored session matches
      if (tableNumber) {
        const masterData = localStorage.getItem(masterKey);
        if (masterData) {
          try {
            const { token, table } = JSON.parse(masterData);
            // If stored table doesn't match URL table, clear old session
            if (table && table !== tableNumber) {
              console.log(`[CLIENT] Table number changed from ${table} to ${tableNumber}, clearing old session`);
              localStorage.removeItem(masterKey);
              // Also clear the old table's session storage
              const oldStorageKey = `session_${restaurant.slug}_${table}`;
              localStorage.removeItem(oldStorageKey);
            } else if (token && table === tableNumber) {
              // Table matches, return stored session
              return { token, table };
            }
          } catch (e) {
            console.warn("[CLIENT] Failed to parse master session data:", e);
          }
        }
        
        // Check for session specific to this table
        const storageKey = `session_${restaurant.slug}_${tableNumber}`;
        const savedToken = localStorage.getItem(storageKey);
        if (savedToken) {
          // Also store in master key for easier retrieval
          localStorage.setItem(masterKey, JSON.stringify({ token: savedToken, table: tableNumber }));
          return { token: savedToken, table: tableNumber };
        }
        
        // No session found for this table, return null to create new one
        return { token: null, table: null };
      }
      
      // No table number in URL, try to restore from localStorage
      const masterData = localStorage.getItem(masterKey);
      if (masterData) {
        try {
          const { token, table } = JSON.parse(masterData);
          if (token && table) {
            return { token, table };
          }
        } catch (e) {
          console.warn("[CLIENT] Failed to parse master session data:", e);
        }
      }
      
      // Check localStorage for any session keys matching this restaurant
      const prefix = `session_${restaurant.slug}_`;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const savedTable = key.replace(prefix, "");
          const savedToken = localStorage.getItem(key);
          if (savedToken && savedTable) {
            // Store in master key
            localStorage.setItem(masterKey, JSON.stringify({ token: savedToken, table: savedTable }));
            return { token: savedToken, table: savedTable };
          }
        }
      }
      
      return { token: null, table: null };
    };
    
    const initialData = getInitialSessionData();
    const effectiveTable = tableNumber || initialData.table || inputTableNumber;
    
    // Update inputTableNumber if we found one from localStorage
    if (initialData.table && !tableNumber && !inputTableNumber) {
      setInputTableNumber(initialData.table);
    }
    
    // If we have a table number (from URL or localStorage), restore session
    if (effectiveTable) {
      // If table number was restored from localStorage but not in URL, update URL
      if (!tableNumber && initialData.table) {
        router.replace(`/r/${restaurant.slug}?table=${initialData.table}`, { scroll: false });
      }
      
      const storageKey = `session_${restaurant.slug}_${effectiveTable}`;
      const savedToken = initialData.token || localStorage.getItem(storageKey);
      
      // If we have a token, verify it matches the current table
      if (savedToken) {
        // Verify the token is still valid and matches the table
        verifySession(savedToken).then(async (isValid) => {
          if (isValid) {
            // Double-check the token is for the correct table
            try {
              const verifyResponse = await fetch(`/api/sessions/${savedToken}`);
              if (verifyResponse.ok) {
                const verifyData = await verifyResponse.json();
                if (verifyData.success && verifyData.session) {
                  const sessionTable = verifyData.session.tableNumber;
                  if (sessionTable === effectiveTable) {
                    // Token is valid and matches table
                    // Check if session is still active
                    const sessionStatusValue = verifyData.session.status || "active";
                    if (sessionStatusValue === "active") {
                      setSessionToken(savedToken);
                      setSessionStatus("active");
                      const masterKey = `active_session_${restaurant.slug}`;
                      localStorage.setItem(masterKey, JSON.stringify({ token: savedToken, table: effectiveTable }));
                    } else {
                      // Session is closed/paid, clear it and create new one
                      console.log(`[CLIENT] useEffect - Session is ${sessionStatusValue}, creating new session.`);
                      localStorage.removeItem(storageKey);
                      const masterKey = `active_session_${restaurant.slug}`;
                      localStorage.removeItem(masterKey);
                      setSessionToken(null);
                      setSessionStatus(null);
                      createSession(effectiveTable);
                    }
                  } else {
                    // Token is for a different table, clear it and create new session
                    console.log(`[CLIENT] useEffect - Token is for table ${sessionTable}, but current table is ${effectiveTable}. Creating new session.`);
                    localStorage.removeItem(storageKey);
                    const masterKey = `active_session_${restaurant.slug}`;
                    localStorage.removeItem(masterKey);
                    setSessionToken(null);
                    createSession(effectiveTable);
                  }
                } else {
                  // Invalid session data, create new
                  localStorage.removeItem(storageKey);
                  const masterKey = `active_session_${restaurant.slug}`;
                  localStorage.removeItem(masterKey);
                  setSessionToken(null);
                  createSession(effectiveTable);
                }
              } else {
                // Verification failed, create new session
                localStorage.removeItem(storageKey);
                const masterKey = `active_session_${restaurant.slug}`;
                localStorage.removeItem(masterKey);
                setSessionToken(null);
                createSession(effectiveTable);
              }
            } catch (error) {
              console.error("[CLIENT] useEffect - Error verifying token table:", error);
              localStorage.removeItem(storageKey);
              const masterKey = `active_session_${restaurant.slug}`;
              localStorage.removeItem(masterKey);
              setSessionToken(null);
              createSession(effectiveTable);
            }
          } else {
            localStorage.removeItem(storageKey);
            const masterKey = `active_session_${restaurant.slug}`;
            localStorage.removeItem(masterKey);
            setSessionToken(null);
            // The API will check for existing active sessions and return it if found
            createSession(effectiveTable);
          }
        }).catch((error) => {
          console.error("[CLIENT] useEffect - Error verifying token:", error);
          // On error, try to get/create session
          createSession(effectiveTable);
        });
      } else {
        // The API will check for existing active sessions and return it if found
        createSession(effectiveTable);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableNumber, restaurant.slug]);

  // Listen for order status updates via WebSocket
  const channelName = sessionToken ? `session-${sessionToken}` : null;
  
  usePusherChannel(
    channelName,
    "order:status:updated",
    (data: unknown) => {
      const eventData = data as { orderId: string; status: string; tableNumber?: string };
      
      // Update recent orders list
      setRecentOrders((prev) =>
        prev.map((order) =>
          order.id === eventData.orderId
            ? { ...order, status: eventData.status }
            : order
        )
      );

      const statusMessages: Record<string, string> = {
        pending: "Order received! 📝",
        cooking: "Your order is being prepared! 👨‍🍳",
        ready: "Your order is ready! 🎉",
        paid: "Payment received! Thank you! ✅",
        cancelled: "Order cancelled ❌",
      };

      if (statusMessages[eventData.status]) {
        showToast(statusMessages[eventData.status], "info");
      }
    }
  );

  // Listen for new orders created
  usePusherChannel(
    sessionToken ? `session-${sessionToken}` : null,
    "order:created",
    (data: unknown) => {
      const eventData = data as { order: { id: string; status: string; createdAt: string } };
      if (eventData.order) {
        setRecentOrders((prev) => [eventData.order, ...prev]);
      }
    }
  );

  const createSession = async (tableNum?: string) => {
    const table = tableNum || tableNumber || inputTableNumber;
    
    if (!table || isCreatingSession) {
      return;
    }
    
    // Check localStorage first to avoid unnecessary API calls
    if (typeof window !== "undefined") {
      const storageKey = `session_${restaurant.slug}_${table}`;
      const savedToken = localStorage.getItem(storageKey);
      if (savedToken) {
        const isValid = await verifySession(savedToken);
        if (isValid) {
          setSessionToken(savedToken);
          return;
        } else {
          localStorage.removeItem(storageKey);
        }
      }
    }
    
    setIsCreatingSession(true);
    
    try {
      const requestBody = {
        restaurantSlug: restaurant.slug,
        tableNumber: table,
      };
      
      const response = await fetch("/api/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[CLIENT] Session creation failed - status:", response.status, "error:", errorData);
        throw new Error(errorData.error || "Failed to create session");
      }

      const data = await response.json();

      if (data.success && data.session?.sessionToken) {
        const token = data.session.sessionToken;
        const sessionTable = data.session.tableNumber || table;
        const sessionStatusValue = data.session.status || "active";
        setSessionToken(token);
        setSessionStatus(sessionStatusValue as "active" | "closed" | "paid");
        if (typeof window !== "undefined") {
          try {
            const storageKey = `session_${restaurant.slug}_${sessionTable}`;
            const masterKey = `active_session_${restaurant.slug}`;
            // Store in both specific key and master key for persistence
            window.localStorage.setItem(storageKey, token);
            window.localStorage.setItem(masterKey, JSON.stringify({ token, table: sessionTable }));
            // Update inputTableNumber if it was different
            if (sessionTable && sessionTable !== inputTableNumber) {
              setInputTableNumber(sessionTable);
            }
            // Update URL if table number was input manually or different
            if ((!tableNumber || tableNumber !== sessionTable) && sessionTable) {
              router.replace(`/r/${restaurant.slug}?table=${sessionTable}`, { scroll: false });
            }
          } catch (e) {
            console.warn("[CLIENT] Failed to save session to localStorage:", e);
          }
        }
      } else {
        console.error("[CLIENT] Invalid response format - success:", data.success, "hasSession:", !!data.session, "hasToken:", !!data.session?.sessionToken);
        throw new Error(data.error || "Failed to create session");
      }
    } catch (error) {
      console.error("[CLIENT] Session creation error:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to create session",
        "error"
      );
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleSendToKitchenClick = () => {
    if (items.length === 0) {
      showToast("Please add items to your cart first", "warning");
      return;
    }

    // Check if session is closed/paid
    if (sessionStatus === "closed" || sessionStatus === "paid") {
      showToast("This session has been closed. Please create a new session to place orders.", "error");
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      console.log("[CLIENT] handleSendToKitchenClick - showing customer form");
      setShowCustomerForm(true);
      setShowCart(true);
      return;
    }

    if (!validatePhone(customerPhone)) {
      showToast("Please enter a valid 10-digit phone number", "error");
      return;
    }

    // Show confirmation dialog
    setShowOrderConfirmation(true);
  };

  const sendToKitchen = async () => {
    // Prevent double submission
    if (isSendingOrder) {
      console.log("[CLIENT] sendToKitchen - Already sending order, ignoring duplicate click");
      return;
    }

    // Close confirmation dialog
    setShowOrderConfirmation(false);
    if (items.length === 0) {
      showToast("Please add items to your cart first", "warning");
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      console.log("[CLIENT] sendToKitchen - showing customer form");
      setShowCustomerForm(true);
      setShowCart(true);
      return;
    }

    if (!validatePhone(customerPhone)) {
      showToast("Please enter a valid 10-digit phone number", "error");
      return;
    }

    // Get table number (from URL or input)
    const table = tableNumber || inputTableNumber;
    
    if (!table) {
      showToast("Please enter a table number to continue", "error");
      return;
    }
    
    // Check if current session token matches the current table number
    let token: string | null = sessionToken;
    let needsNewSession = false;
    
    if (token) {
      // Verify the token is for the correct table
      try {
        const verifyResponse = await fetch(`/api/sessions/${token}`);
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          if (verifyData.success && verifyData.session) {
            const sessionTable = verifyData.session.tableNumber;
            if (sessionTable !== table) {
              console.log(`[CLIENT] sendToKitchen - Token is for table ${sessionTable}, but current table is ${table}. Creating new session.`);
              needsNewSession = true;
              token = null; // Clear old token
            }
          } else {
            needsNewSession = true;
            token = null;
          }
        } else {
          needsNewSession = true;
          token = null;
        }
      } catch (error) {
        console.error("[CLIENT] sendToKitchen - Error verifying token:", error);
        needsNewSession = true;
        token = null;
      }
    }
    
    console.log("[CLIENT] sendToKitchen - current token:", token ? token.substring(0, 8) + "..." : "null", "table:", table, "needsNewSession:", needsNewSession);
    
    // If no session token or token doesn't match table, create one first
    if ((!token || needsNewSession) && table) {
      console.log("[CLIENT] sendToKitchen - No token, creating session first");
      setIsSendingOrder(true);
      showToast("Creating session...", "info");
      try {
        const requestBody = {
          restaurantSlug: restaurant.slug,
          tableNumber: table,
        };
        console.log("[CLIENT] sendToKitchen - Creating session with:", JSON.stringify(requestBody));
        
        const sessionResponse = await fetch("/api/sessions/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!sessionResponse.ok) {
          const errorData = await sessionResponse.json();
          console.error("[CLIENT] sendToKitchen - Session creation failed:", errorData);
          throw new Error(errorData.error || "Failed to create session");
        }

        const sessionData = await sessionResponse.json();

        if (sessionData.success && sessionData.session?.sessionToken) {
          token = sessionData.session.sessionToken;
          const sessionTable = sessionData.session.tableNumber || table;
          const sessionStatusValue = sessionData.session.status || "active";
          
          // Clear old session token if it exists and is different
          if (sessionToken && sessionToken !== token) {
            console.log("[CLIENT] sendToKitchen - Clearing old session token");
            setSessionToken(null);
            setSessionStatus(null);
          }
          
          setSessionToken(token);
          setSessionStatus(sessionStatusValue as "active" | "closed" | "paid");
          
          if (sessionTable && token && typeof window !== "undefined") {
            try {
              const storageKey = `session_${restaurant.slug}_${sessionTable}`;
              const masterKey = `active_session_${restaurant.slug}`;
              
              // Clear old master session if table changed
              const oldMasterData = localStorage.getItem(masterKey);
              if (oldMasterData) {
                try {
                  const oldData = JSON.parse(oldMasterData);
                  if (oldData.table && oldData.table !== sessionTable) {
                    const oldStorageKey = `session_${restaurant.slug}_${oldData.table}`;
                    localStorage.removeItem(oldStorageKey);
                    console.log(`[CLIENT] sendToKitchen - Cleared old session for table ${oldData.table}`);
                  }
                } catch (e) {
                  // Ignore parse errors
                }
              }
              
              // Store in both specific key and master key for persistence
              window.localStorage.setItem(storageKey, token);
              window.localStorage.setItem(masterKey, JSON.stringify({ token, table: sessionTable }));
              
              // Update inputTableNumber and URL if needed
              if (sessionTable !== inputTableNumber) {
                setInputTableNumber(sessionTable);
              }
              if ((!tableNumber || tableNumber !== sessionTable) && sessionTable) {
                router.replace(`/r/${restaurant.slug}?table=${sessionTable}`, { scroll: false });
              }
            } catch (e) {
              console.warn("[CLIENT] sendToKitchen - Failed to save to localStorage:", e);
            }
          }
        } else {
          console.error("[CLIENT] sendToKitchen - Invalid session response:", sessionData);
          throw new Error(sessionData.error || "Failed to create session");
        }
      } catch (error) {
        console.error("[CLIENT] sendToKitchen - Session creation error:", error);
        console.error("[CLIENT] sendToKitchen - Error details:", error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error);
        showToast(
          error instanceof Error ? error.message : "Failed to create session",
          "error"
        );
        setIsSendingOrder(false);
        return;
      }
    }

    if (!token) {
        console.error("[CLIENT] sendToKitchen - No token available after creation attempt");
      showToast("Please enter a table number to continue", "error");
      setIsSendingOrder(false);
      return;
    }

    setIsSendingOrder(true);
    try {
      const orderBody = {
        sessionToken: token,
        items: items.map((item) => ({
          itemId: item.id,
          quantity: item.quantity,
        })),
        customerName: customerName.trim(),
        customerPhone: customerPhone.replace(/\D/g, ""), // Clean phone number
      };

      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[CLIENT] sendToKitchen - Order creation failed:", errorData);
        throw new Error(errorData.error || "Failed to send order");
      }

      const data = await response.json();

      if (data.success && data.data) {
        const orderId = data.data.id;
        const orderStatus = data.data.status || "pending";
        
        // Add to recent orders
        setRecentOrders((prev) => [
          {
            id: orderId,
            status: orderStatus,
            createdAt: data.data.createdAt || new Date().toISOString(),
          },
          ...prev,
        ]);
        
        showToast(
          `Order sent to kitchen! Order #${orderId.slice(0, 8).toUpperCase()}`,
          "success"
        );
        // Save customer details to localStorage for future orders
        if (typeof window !== "undefined") {
          localStorage.setItem(`customer_name_${restaurant.slug}`, customerName.trim());
          localStorage.setItem(`customer_phone_${restaurant.slug}`, customerPhone.replace(/\D/g, ""));
        }
        clearCart();
        setShowCustomerForm(false);
        setShowCart(false);
        // Don't clear customerName and customerPhone - keep them for next order
        // Keep the page open to show order status updates
      } else {
        console.error("[CLIENT] sendToKitchen - Order creation returned success:false or no data");
        throw new Error(data.error || data.message || "Failed to send order");
      }
    } catch (error) {
      console.error("[CLIENT] sendToKitchen - Order creation error:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to send order",
        "error"
      );
    } finally {
      setIsSendingOrder(false);
    }
  };

  const currentTable = tableNumber || inputTableNumber;

  return (
    <>
      <div className="min-h-screen bg-neutral-50 pb-24">
        {/* Compact Mobile Header */}
        <header className="bg-white/95 backdrop-blur-sm border-b border-neutral-200 shadow-sm sticky top-0 z-40">
          <div className="px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center shadow-md flex-shrink-0">
                  <UtensilsCrossed className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base font-bold text-gray-900 truncate">
                    {restaurant.name}
                  </h1>
                  {currentTable ? (
                    <p className="text-[10px] text-primary-600 font-medium">
                      Table {currentTable} • {sessionToken ? "Session Active" : "Connecting..."}
                    </p>
                  ) : (
                    <div className="flex items-center gap-1 mt-0.5">
                      <input
                        type="text"
                        placeholder="Table #"
                        value={inputTableNumber}
                        onChange={(e) => setInputTableNumber(e.target.value)}
                        onBlur={() => {
                          if (inputTableNumber && !sessionToken) {
                            createSession();
                          }
                        }}
                        className="text-[10px] w-16 px-1.5 py-0.5 border border-neutral-300 rounded focus:ring-1 focus:ring-primary-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {sessionToken && (
                  <a
                    href={`/bill?session=${sessionToken}`}
                    className="relative p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                    title="Track Orders & View Bill"
                  >
                    <Receipt className="w-5 h-5 text-primary-600" />
                    {recentOrders.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-[8px] text-white font-bold">{recentOrders.length}</span>
                      </span>
                    )}
                  </a>
                )}
                <button
                  onClick={() => setShowCart(true)}
                  className="relative p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5 text-gray-700" />
                  {items.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {items.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Order Status Banner */}
        {recentOrders.length > 0 && (
          <div className="px-3 py-2 bg-primary-50 border-b border-primary-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-primary-900">
                  {recentOrders.length} Active Order{recentOrders.length > 1 ? "s" : ""}
                </span>
              </div>
              {sessionToken && (
                <a
                  href={`/bill?session=${sessionToken}`}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                >
                  View All →
                </a>
              )}
            </div>
            <div className="mt-2 space-y-1">
              {recentOrders.slice(0, 2).map((order) => {
                const statusColors: Record<string, string> = {
                  pending: "bg-yellow-100 text-yellow-800",
                  cooking: "bg-blue-100 text-blue-800",
                  ready: "bg-green-100 text-green-800",
                  paid: "bg-gray-100 text-gray-800",
                  cancelled: "bg-red-100 text-red-800",
                };
                const statusLabels: Record<string, string> = {
                  pending: "Pending",
                  cooking: "Cooking",
                  ready: "Ready",
                  paid: "Paid",
                  cancelled: "Cancelled",
                };
                return (
                  <div key={order.id} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-gray-600">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold ${
                        statusColors[order.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content - Mobile Optimized */}
        <main className="px-3 py-4">
          {categories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center mt-4">
              <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Menu Coming Soon
              </h2>
              <p className="text-sm text-gray-600">
                We're preparing something delicious for you
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {categories
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((category) => {
                  const categoryItems = menuItems
                    .filter(
                      (item) => item.categoryId === category.id && item.available
                    )
                    .sort((a, b) => a.sortOrder - b.sortOrder);

                  if (categoryItems.length === 0) return null;

                  return (
                    <section key={category.id} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent flex-1" />
                        <h2 className="text-lg font-bold text-gray-900 px-3 py-1 bg-white rounded-full border border-neutral-200 shadow-sm">
                          {category.name}
                        </h2>
                        <div className="h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent flex-1" />
                      </div>

                      <div className="space-y-3">
                        {categoryItems.map((item) => {
                          const cartItem = items.find((i) => i.id === item.id);
                          const quantity = cartItem?.quantity || 0;

                          return (
                            <div
                              key={item.id}
                              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm active:scale-[0.98] transition-transform"
                            >
                              <div className="flex gap-3 p-3">
                                {item.imageUrl ? (
                                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                    <img
                                      src={item.imageUrl}
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-1 right-1">
                                      <div className="bg-green-500 text-white p-1 rounded shadow-sm">
                                        <CheckCircle2 className="w-3 h-3" />
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                                    <ImageOff className="w-8 h-8 text-gray-400" />
                                    <div className="absolute top-1 right-1">
                                      <div className="bg-green-500 text-white p-1 rounded shadow-sm">
                                        <CheckCircle2 className="w-3 h-3" />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                  <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">
                                      {item.name}
                                    </h3>
                                    {item.description && (
                                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-base font-bold text-primary-700">
                                      ₹{item.price.toFixed(0)}
                                    </span>

                                    {quantity > 0 ? (
                                      <div className="flex items-center gap-2 bg-primary-50 rounded-lg px-2 py-1">
                                        <button
                                          onClick={() => updateQuantity(item.id, quantity - 1)}
                                          className="w-6 h-6 rounded-full bg-white border border-primary-200 flex items-center justify-center active:scale-90 transition-transform"
                                        >
                                          <Minus className="w-3 h-3 text-primary-600" />
                                        </button>
                                        <span className="text-sm font-bold text-primary-700 w-6 text-center">
                                          {quantity}
                                        </span>
                                        <button
                                          onClick={() => updateQuantity(item.id, quantity + 1)}
                                          className="w-6 h-6 rounded-full bg-white border border-primary-200 flex items-center justify-center active:scale-90 transition-transform"
                                        >
                                          <Plus className="w-3 h-3 text-primary-600" />
                                        </button>
                                      </div>
                                    ) : (
                                      <Button
                                        onClick={() =>
                                          addItem({
                                            id: item.id,
                                            name: item.name,
                                            price: item.price,
                                            imageUrl: item.imageUrl,
                                          })
                                        }
                                        size="sm"
                                        className="text-xs px-3 py-1.5 h-auto"
                                      >
                                        Add
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
            </div>
          )}
        </main>

        {/* Mobile Cart Drawer */}
        {showCart && (
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowCart(false)}>
            <div
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Your Order</h3>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">Your cart is empty</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 rounded-xl p-3 flex items-center gap-3"
                    >
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {item.name}
                        </h4>
                        <p className="text-xs text-gray-600">
                          ₹{item.price.toFixed(0)} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-full bg-white border border-gray-300 flex items-center justify-center active:scale-90"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-full bg-white border border-gray-300 flex items-center justify-center active:scale-90"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {items.length > 0 && (
                <div className="p-4 border-t border-gray-200 space-y-3">
                  {!currentTable && (
                    <div className="mb-2">
                      <label className="text-xs font-semibold text-gray-700 mb-1 block">
                        Table Number *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter table number"
                        value={inputTableNumber}
                        onChange={(e) => setInputTableNumber(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                      />
                    </div>
                  )}
                  
                  {showCustomerForm ? (
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 mb-1 block">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          placeholder="Enter your name"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 mb-1 block">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          placeholder="10-digit phone number"
                          value={customerPhone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          maxLength={10}
                          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none ${
                            phoneError ? "border-red-300" : "border-gray-300"
                          }`}
                          required
                        />
                        {phoneError && (
                          <p className="text-xs text-red-600 mt-1">{phoneError}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setShowCustomerForm(false);
                            setPhoneError("");
                            // Don't clear customer details - keep them for next order
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSendToKitchenClick}
                          disabled={isSendingOrder || !customerName.trim() || !customerPhone.trim() || !validatePhone(customerPhone) || !currentTable || sessionStatus === "closed" || sessionStatus === "paid"}
                          className="flex-1"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {isSendingOrder ? "Sending..." : "Send to Kitchen"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-primary-700">₹{totalPrice.toFixed(0)}</span>
                      </div>
                      <Button
                        onClick={() => {
                          if (!customerName.trim() || !customerPhone.trim()) {
                            setShowCustomerForm(true);
                          } else {
                            handleSendToKitchenClick();
                          }
                        }}
                        disabled={isSendingOrder || isCreatingSession || !currentTable || sessionStatus === "closed" || sessionStatus === "paid"}
                        className="w-full h-12 text-base font-semibold"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {isSendingOrder
                          ? "Sending to Kitchen..."
                          : isCreatingSession
                          ? "Initializing..."
                          : "Send to Kitchen"}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fixed Bottom Button - Mobile Only */}
        {items.length > 0 && !showCart && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-primary-600 shadow-2xl z-40 safe-area-inset-bottom">
            <div className="px-4 py-3">
              <Button
                onClick={() => {
                  if (!customerName.trim() || !customerPhone.trim()) {
                    setShowCustomerForm(true);
                    setShowCart(true);
                          } else if (!currentTable) {
                            showToast("Please enter a table number", "warning");
                            setShowCart(true);
                          } else {
                            handleSendToKitchenClick();
                          }
                }}
                disabled={isSendingOrder || isCreatingSession || sessionStatus === "closed" || sessionStatus === "paid"}
                className="w-full h-12 text-base font-semibold"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSendingOrder
                  ? "Sending to Kitchen..."
                  : isCreatingSession
                  ? "Initializing..."
                  : `Send to Kitchen (₹${totalPrice.toFixed(0)})`}
              </Button>
            </div>
          </div>
        )}

        {/* Order Confirmation Modal */}
        {showOrderConfirmation && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Confirm Order</h3>
              </div>
              
              <p className="text-slate-600 mb-4">
                Are you sure you want to send this order to the kitchen?
              </p>
              
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <div className="text-sm text-slate-700 mb-2">
                  <span className="font-semibold">Table:</span> {currentTable}
                </div>
                <div className="text-sm text-slate-700 mb-2">
                  <span className="font-semibold">Items:</span> {items.length}
                </div>
                <div className="text-sm text-slate-700">
                  <span className="font-semibold">Total:</span> ₹{totalPrice.toFixed(0)}
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowOrderConfirmation(false)}
                  disabled={isSendingOrder}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={sendToKitchen}
                  disabled={isSendingOrder}
                  className="flex-1 bg-primary-600 hover:bg-primary-700"
                >
                  {isSendingOrder ? "Sending..." : "Confirm & Send"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

    </>
  );
}
