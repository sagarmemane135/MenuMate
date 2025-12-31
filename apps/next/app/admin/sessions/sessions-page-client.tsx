"use client";

import { useState } from "react";
import { Card } from "@menumate/app";
import { Users, Calendar, CreditCard, Store, CheckCircle2, Clock } from "lucide-react";

interface Session {
  id: string;
  tableNumber: string;
  sessionToken: string;
  status: string;
  totalAmount: string;
  paymentMethod: string | null;
  paymentStatus: string | null;
  startedAt: Date;
  closedAt: Date | null;
  ordersCount: number;
}

interface SessionsPageClientProps {
  initialSessions: Session[];
}

export function SessionsPageClient({ initialSessions }: SessionsPageClientProps) {
  const [sessions] = useState<Session[]>(initialSessions);
  const [filter, setFilter] = useState<"all" | "active" | "closed" | "paid">("all");

  const filteredSessions = sessions.filter((session) => {
    if (filter === "all") return true;
    return session.status === filter;
  });

  const stats = {
    active: sessions.filter((s) => s.status === "active").length,
    closed: sessions.filter((s) => s.status === "closed").length,
    paid: sessions.filter((s) => s.status === "paid").length,
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
                            Started: {new Date(session.startedAt).toLocaleString()}
                          </span>
                        </p>
                        {session.closedAt && (
                          <p className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span suppressHydrationWarning>
                              Closed: {new Date(session.closedAt).toLocaleString()}
                            </span>
                          </p>
                        )}
                        <p>Orders: {session.ordersCount}</p>
                        {session.paymentMethod && (
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
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

