"use client";

import { useState } from "react";
import { Card, Button, useToast } from "@menumate/app";
import { Users, Calendar, CreditCard, Store, CheckCircle2, Clock, Eye, X, Receipt } from "lucide-react";

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
  const { showToast } = useToast();

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
    <div className="px-4 py-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Table Sessions</h1>
        <p className="text-gray-600 mb-6">
          Track all dining sessions and their payment status
        </p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <div className="p-4 flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-sm text-gray-600">Active Tables</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4 flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <Store className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.closed}</p>
                <p className="text-sm text-gray-600">Pay at Counter</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4 flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.paid}</p>
                <p className="text-sm text-gray-600">Paid Online</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === "all"
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All ({sessions.length})
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === "active"
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Active ({stats.active})
          </button>
          <button
            onClick={() => setFilter("closed")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === "closed"
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Counter ({stats.closed})
          </button>
          <button
            onClick={() => setFilter("paid")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === "paid"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Paid ({stats.paid})
          </button>
        </div>

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Sessions</h3>
              <p className="text-gray-600">
                {filter === "all"
                  ? "No table sessions yet"
                  : `No ${filter} sessions`}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <Card key={session.id}>
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          Table {session.tableNumber}
                        </h3>
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            session.status === "active"
                              ? "bg-green-100 text-green-700"
                              : session.status === "paid"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {session.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span suppressHydrationWarning>
                            Started: {new Date(session.startedAt as string).toLocaleString()}
                          </span>
                        </p>
                        {session.closedAt && (
                          <p className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span suppressHydrationWarning>
                              Closed: {new Date(session.closedAt as string).toLocaleString()}
                            </span>
                          </p>
                        )}
                        <p>Orders: {session.ordersCount}</p>
                        {session.paymentMethod && session.paymentMethod !== "pending" && (
                          <p className="flex items-center space-x-2">
                            {session.paymentMethod === "online" ? (
                              <CreditCard className="w-4 h-4" />
                            ) : (
                              <Store className="w-4 h-4" />
                            )}
                            <span>
                              Payment: {session.paymentMethod === "online" ? "Online" : "Counter"}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                      <p className="text-3xl font-bold text-orange-600">
                        ₹{Number(session.totalAmount).toFixed(2)}
                      </p>
                      <Button
                        onClick={() => fetchSessionDetails(session)}
                        disabled={isLoadingDetails}
                        variant="outline"
                        size="sm"
                        className="mt-3"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {isLoadingDetails && selectedSession?.id === session.id ? "Loading..." : "View Details"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

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
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Table {sessionDetails.session.tableNumber} - Session Details
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Started: {new Date(sessionDetails.session.startedAt as string).toLocaleString()}
                </p>
              </div>
              <button
                onClick={closeSessionModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Session Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Session Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Status</p>
                    <p className="font-semibold text-gray-900 capitalize">{sessionDetails.session.status}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Amount</p>
                    <p className="font-semibold text-orange-600">₹{Number(sessionDetails.session.totalAmount).toFixed(2)}</p>
                  </div>
                  {sessionDetails.session.customerName && (
                    <div>
                      <p className="text-gray-600">Customer Name</p>
                      <p className="font-semibold text-gray-900">{sessionDetails.session.customerName}</p>
                    </div>
                  )}
                  {sessionDetails.session.customerPhone && (
                    <div>
                      <p className="text-gray-600">Customer Phone</p>
                      <p className="font-semibold text-gray-900">{sessionDetails.session.customerPhone}</p>
                    </div>
                  )}
                  {sessionDetails.session.paymentMethod && sessionDetails.session.paymentMethod !== "pending" && (
                    <div>
                      <p className="text-gray-600">Payment Method</p>
                      <p className="font-semibold text-gray-900 capitalize">
                        {sessionDetails.session.paymentMethod === "online" ? "Online" : "Counter"}
                      </p>
                    </div>
                  )}
                  {sessionDetails.session.paymentStatus && sessionDetails.session.paymentStatus !== "pending" && (
                    <div>
                      <p className="text-gray-600">Payment Status</p>
                      <p className="font-semibold text-gray-900 capitalize">{sessionDetails.session.paymentStatus}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Orders List */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Orders ({sessionDetails.orders.length})
                </h3>
                {sessionDetails.orders.length === 0 ? (
                  <Card>
                    <p className="text-gray-600 text-center py-8">No orders in this session</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {sessionDetails.orders.map((order, index) => (
                      <Card key={order.id}>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">Order #{index + 1}</h4>
                              <p className="text-xs text-gray-500">
                                {new Date(order.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <span
                                className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                  order.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : order.status === "cooking"
                                    ? "bg-blue-100 text-blue-800"
                                    : order.status === "ready"
                                    ? "bg-green-100 text-green-800"
                                    : order.status === "served"
                                    ? "bg-purple-100 text-purple-800"
                                    : order.status === "paid"
                                    ? "bg-gray-100 text-gray-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {order.status.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2 mb-3">
                            {(order.items as Array<{ itemId: string; name: string; quantity: number; price: number }>).map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-gray-700">
                                  {item.quantity}x {item.name}
                                </span>
                                <span className="font-semibold text-gray-900">
                                  ₹{(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {order.notes && (
                            <div className="mb-3 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 p-2 rounded">
                              <strong>Note:</strong> {order.notes}
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                            <span className="text-sm text-gray-600">Order Total</span>
                            <span className="font-bold text-orange-600">
                              ₹{Number(order.totalAmount).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </Card>
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
