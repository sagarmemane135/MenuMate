"use client";

import { useState, useEffect } from "react";
import { Button, useToast } from "@menumate/app";
import { Users, Calendar, CreditCard, Store, CheckCircle2, Clock, Eye, X, Receipt } from "lucide-react";
import { formatIndianDateTime } from "@/lib/date-utils";
import { usePolling } from "@/lib/use-polling";

interface Session {
  id: string;
  tableNumber: string;
  sessionToken: string;
  status: string;
  totalAmount: string;
  paymentMethod: string | null;
  paymentStatus: string | null;
  startedAt: string | Date;
  closedAt: string | Date | null;
  ordersCount: number;
  customerName?: string | null;
  customerPhone?: string | null;
}

interface SessionsPageClientProps {
  initialSessions: Session[];
  restaurantId: string;
  pendingCounterPayments?: Array<{
    id: string;
    sessionToken: string;
    tableNumber: string;
    totalAmount: string;
    startedAt: string | Date;
  }>;
}

export function SessionsPageClient({ initialSessions, restaurantId }: SessionsPageClientProps) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [filter, setFilter] = useState<"all" | "active" | "closed" | "paid">("all");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const { showToast } = useToast();

  // Cleanup inactive sessions when page loads
  useEffect(() => {
    const cleanupInactiveSessions = async () => {
      setIsCleaningUp(true);
      try {
        const response = await fetch("/api/sessions/cleanup-inactive", {
          method: "POST",
        });

        if (response.ok) {
          const result = await response.json();
          if (result.closedCount > 0) {
            console.log(`[SESSIONS] Auto-closed ${result.closedCount} inactive sessions`);
            showToast(`Automatically closed ${result.closedCount} inactive session(s)`, "info");
            
            // Refresh sessions to show updated status
            window.location.reload();
          }
        }
      } catch (error) {
        console.error("[SESSIONS] Failed to cleanup inactive sessions:", error);
      } finally {
        setIsCleaningUp(false);
      }
    };

    cleanupInactiveSessions();
  }, []); // Run once on mount

  // Poll for session updates (local setup)
  usePolling<{ data: Session[] }>(
    `/api/realtime/sessions?restaurantId=${restaurantId}`,
    5000,
    (res) => {
      if (res.data && Array.isArray(res.data)) {
        setSessions(res.data);
      }
    }
  );
  const [sessionDetails, setSessionDetails] = useState<{
    session: Session;
    orders: Array<{
      id: string;
      items: Array<{ itemId: string; name: string; quantity: number; price: number }>;
      totalAmount: string;
      status: string;
      isPaid: boolean;
      createdAt: string;
      notes: string | null;
    }>;
  } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const filteredSessions = sessions.filter((session) => {
    if (filter === "all") return true;
    return session.status === filter;
  });

  const stats = {
    active: sessions.filter((s) => s.status === "active").length,
    closed: sessions.filter((s) => s.status === "closed").length,
    paid: sessions.filter((s) => s.status === "paid").length,
  };

  const fetchSessionDetails = async (session: Session) => {
    setIsLoadingDetails(true);
    try {
      const response = await fetch(`/api/sessions/${session.sessionToken}`);
      const data = await response.json();

      if (data.success) {
        setSessionDetails({
          session: {
            ...session,
            ...data.session,
          },
          orders: data.orders,
        });
        setSelectedSession(session);
      } else {
        showToast("Failed to load session details", "error");
      }
    } catch (error) {
      console.error("Failed to fetch session details:", error);
      showToast("An error occurred", "error");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const closeSessionModal = () => {
    setSelectedSession(null);
    setSessionDetails(null);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Table Sessions</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Track all dining sessions and their payment status
        </p>
      </div>

      {/* Stats - same alignment as admin dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label stat-label-fixed-height mb-1">Active Tables</p>
              <p className="stat-value text-success-600 min-h-[2.25rem] flex items-center">{stats.active}</p>
              <p className="stat-change">Currently dining</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-success-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Users className="w-5 h-5 text-success-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label stat-label-fixed-height mb-1">Pay at Counter</p>
              <p className="stat-value text-warning-600 min-h-[2.25rem] flex items-center">{stats.closed}</p>
              <p className="stat-change">Awaiting payment</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-warning-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Store className="w-5 h-5 text-warning-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label stat-label-fixed-height mb-1">Paid Online</p>
              <p className="stat-value text-primary-600 min-h-[2.25rem] flex items-center">{stats.paid}</p>
              <p className="stat-change">Completed</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter - consistent pill style, selected = tint + border */}
      <div className="flex space-x-2 mb-5 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap border ${
            filter === "all"
              ? "bg-primary-50 text-primary-700 border-primary-200"
              : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
          }`}
        >
          All ({sessions.length})
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap border ${
            filter === "active"
              ? "bg-success-50 text-success-700 border-success-200"
              : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
          }`}
        >
          Active ({stats.active})
        </button>
        <button
          onClick={() => setFilter("closed")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap border ${
            filter === "closed"
              ? "bg-warning-50 text-warning-700 border-warning-200"
              : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
          }`}
        >
          Counter ({stats.closed})
        </button>
        <button
          onClick={() => setFilter("paid")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap border ${
            filter === "paid"
              ? "bg-primary-50 text-primary-700 border-primary-200"
              : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
          }`}
        >
          Paid ({stats.paid})
        </button>
      </div>

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-neutral-400" />
              </div>
              <p className="text-sm font-medium text-neutral-600">
                {filter === "all" ? "No table sessions yet" : `No ${filter} sessions`}
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                {filter === "all" ? "Sessions will appear when customers start dining" : "Try another filter"}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50/50">
              <h2 className="text-sm font-semibold text-neutral-900">All sessions</h2>
              <p className="text-xs text-neutral-500 mt-0.5">View details or filter by status above</p>
            </div>
            <div className="w-full overflow-x-auto -mx-1">
              <table className="table-professional w-full">
                <thead>
                  <tr>
                    <th>Table</th>
                    <th>Customer</th>
                    <th>Started</th>
                    <th>Orders</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredSessions.map((session) => (
                    <tr key={session.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary-700">{session.tableNumber}</span>
                          </div>
                          <span className="font-medium text-neutral-900">Table {session.tableNumber}</span>
                        </div>
                      </td>
                      <td>
                        <div>
                          {session.customerName && (
                            <div className="font-medium text-neutral-900">{session.customerName}</div>
                          )}
                          {session.customerPhone && (
                            <div className="text-xs text-neutral-500">{session.customerPhone}</div>
                          )}
                          {!session.customerName && !session.customerPhone && (
                            <span className="text-sm text-neutral-500">—</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="text-sm text-neutral-600" suppressHydrationWarning>
                          {formatIndianDateTime(session.startedAt)}
                        </div>
                        {session.closedAt && (
                          <div className="text-xs text-neutral-500" suppressHydrationWarning>
                            Closed: {formatIndianDateTime(session.closedAt)}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                          {session.ordersCount} {session.ordersCount === 1 ? 'order' : 'orders'}
                        </span>
                      </td>
                      <td>
                        <span className="font-semibold text-neutral-900">₹{Number(session.totalAmount).toFixed(2)}</span>
                      </td>
                      <td>
                        {session.paymentMethod && session.paymentMethod !== "pending" ? (
                          <div className="flex items-center gap-1.5">
                            {session.paymentMethod === "online" ? (
                              <>
                                <CreditCard className="w-3.5 h-3.5 text-primary-600" />
                                <span className="text-sm text-neutral-700">Online</span>
                              </>
                            ) : (
                              <>
                                <Store className="w-3.5 h-3.5 text-warning-600" />
                                <span className="text-sm text-neutral-700">Counter</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-neutral-500">—</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            session.status === "active"
                              ? "bg-success-50 text-success-700"
                              : session.status === "paid"
                              ? "bg-primary-50 text-primary-700"
                              : "bg-warning-50 text-warning-700"
                          }`}
                        >
                          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <Button
                          onClick={() => fetchSessionDetails(session)}
                          disabled={isLoadingDetails}
                          variant="outline"
                          className="btn-secondary text-sm"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-1.5" />
                          {isLoadingDetails && selectedSession?.id === session.id ? "..." : "View"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Session Details Modal */}
      {selectedSession && sessionDetails && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={closeSessionModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  Table {sessionDetails.session.tableNumber} — Session details
                </h2>
                <p className="text-sm text-neutral-600 mt-0.5">
                  Started: {formatIndianDateTime(sessionDetails.session.startedAt)}
                </p>
              </div>
              <button
                onClick={closeSessionModal}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-600" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Session Info */}
              <div className="bg-neutral-50 rounded-xl border border-neutral-100 p-4">
                <h3 className="text-sm font-semibold text-neutral-900 mb-3">Session information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-500">Status</p>
                    <p className="font-medium text-neutral-900 capitalize">{sessionDetails.session.status}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Total amount</p>
                    <p className="font-medium text-neutral-900">₹{Number(sessionDetails.session.totalAmount).toFixed(2)}</p>
                  </div>
                  {sessionDetails.session.customerName && (
                    <div>
                      <p className="text-neutral-500">Customer name</p>
                      <p className="font-medium text-neutral-900">{sessionDetails.session.customerName}</p>
                    </div>
                  )}
                  {sessionDetails.session.customerPhone && (
                    <div>
                      <p className="text-neutral-500">Customer phone</p>
                      <p className="font-medium text-neutral-900">{sessionDetails.session.customerPhone}</p>
                    </div>
                  )}
                  {sessionDetails.session.paymentMethod && sessionDetails.session.paymentMethod !== "pending" && (
                    <div>
                      <p className="text-neutral-500">Payment method</p>
                      <p className="font-medium text-neutral-900 capitalize">
                        {sessionDetails.session.paymentMethod === "online" ? "Online" : "Counter"}
                      </p>
                    </div>
                  )}
                  {sessionDetails.session.paymentStatus && sessionDetails.session.paymentStatus !== "pending" && (
                    <div>
                      <p className="text-neutral-500">Payment status</p>
                      <p className="font-medium text-neutral-900 capitalize">{sessionDetails.session.paymentStatus}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Orders List */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Orders ({sessionDetails.orders.length})
                </h3>
                {sessionDetails.orders.length === 0 ? (
                  <div className="bg-white border border-neutral-200 rounded-xl p-6 text-center">
                    <p className="text-sm text-neutral-500">No orders in this session</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessionDetails.orders.map((order, index) => (
                      <div key={order.id} className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-neutral-900">Order #{index + 1}</h4>
                              <p className="text-xs text-neutral-500">
                                {formatIndianDateTime(order.createdAt)}
                              </p>
                            </div>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                order.status === "pending"
                                  ? "bg-warning-50 text-warning-700"
                                  : order.status === "cooking"
                                  ? "bg-primary-50 text-primary-700"
                                  : order.status === "ready"
                                  ? "bg-success-50 text-success-700"
                                  : order.status === "served"
                                  ? "bg-neutral-100 text-neutral-700"
                                  : order.status === "paid"
                                  ? "bg-neutral-100 text-neutral-700"
                                  : "bg-error-50 text-error-700"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>

                          <div className="space-y-1.5 mb-3">
                            {(order.items as Array<{ itemId: string; name: string; quantity: number; price: number }>).map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-neutral-600">
                                  {item.quantity}× {item.name}
                                </span>
                                <span className="font-medium text-neutral-900">
                                  ₹{(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {order.notes && (
                            <div className="mb-3 text-sm text-warning-700 bg-warning-50 border border-warning-200 p-2 rounded-lg">
                              <strong>Note:</strong> {order.notes}
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-3 border-t border-neutral-100">
                            <span className="text-sm text-neutral-500">Order total</span>
                            <span className="font-semibold text-neutral-900">
                              ₹{Number(order.totalAmount).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
