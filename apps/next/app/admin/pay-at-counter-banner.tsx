"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Store, ChevronDown, ChevronUp, CheckCircle2, ExternalLink } from "lucide-react";
import { Button, useToast } from "@menumate/app";

const POLL_INTERVAL_MS = 15000;

interface PendingPayment {
  id: string;
  sessionToken: string;
  tableNumber: string;
  totalAmount: string;
  startedAt: string;
}

export function PayAtCounterBanner() {
  const [pending, setPending] = useState<PendingPayment[]>([]);
  const [markingToken, setMarkingToken] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const { showToast } = useToast();

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/pending-counter-payments", {
        credentials: "include",
      });
      if (res.ok) {
        const json = await res.json();
        setPending(json.data ?? []);
      }
    } catch {
      setPending([]);
    }
  }, []);

  useEffect(() => {
    fetchPending();
    const id = setInterval(fetchPending, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchPending]);

  const handleMarkPaid = async (sessionToken: string) => {
    setMarkingToken(sessionToken);
    try {
      const res = await fetch(`/api/sessions/${sessionToken}/mark-paid`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Payment marked as received", "success");
        setPending((prev) => prev.filter((p) => p.sessionToken !== sessionToken));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("admin:payment-marked-paid"));
        }
      } else {
        showToast(data.error || "Failed to mark as paid", "error");
      }
    } catch {
      showToast("Request failed", "error");
    } finally {
      setMarkingToken(null);
    }
  };

  if (pending.length === 0) return null;

  const count = pending.length;

  return (
    <div
      role="alert"
      className="fixed top-4 right-4 z-50 w-[320px] max-w-[calc(100vw-2rem)] rounded-xl border border-warning-200 bg-white shadow-lg"
    >
      {/* Header - always visible */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center gap-3 rounded-t-xl border-b border-warning-100 bg-warning-50 px-4 py-3 text-left hover:bg-warning-100/80"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning-200">
          <Store className="h-4 w-4 text-warning-700" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-warning-900">
            {count === 1 ? "1 payment at counter" : `${count} payments at counter`}
          </p>
          <p className="text-xs text-warning-700">Stays until marked paid</p>
        </div>
        {collapsed ? (
          <ChevronDown className="h-5 w-5 shrink-0 text-warning-600" />
        ) : (
          <ChevronUp className="h-5 w-5 shrink-0 text-warning-600" />
        )}
      </button>

      {/* List - expandable */}
      {!collapsed && (
        <div className="max-h-[280px] overflow-y-auto rounded-b-xl bg-white p-2">
          <p className="mb-2 px-2 text-xs text-neutral-500">
            Mark as paid when received to avoid walkouts.
          </p>
          <ul className="space-y-1.5">
            {pending.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-2 rounded-lg border border-neutral-100 bg-neutral-50/50 px-3 py-2 text-sm"
              >
                <span className="min-w-0 flex-1 font-medium text-neutral-900">
                  Table {p.tableNumber}
                </span>
                <span className="shrink-0 text-neutral-600">
                  ₹{Number(p.totalAmount).toFixed(0)}
                </span>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleMarkPaid(p.sessionToken)}
                  disabled={markingToken === p.sessionToken}
                  className="!min-w-0 shrink-0"
                >
                  {markingToken === p.sessionToken ? "…" : "Mark paid"}
                </Button>
              </li>
            ))}
          </ul>
          <Link
            href="/admin/sessions"
            className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-warning-200 bg-warning-50 py-2 text-sm font-medium text-warning-800 hover:bg-warning-100"
          >
            <ExternalLink className="h-4 w-4" />
            View all in Sessions
          </Link>
        </div>
      )}
    </div>
  );
}
