"use client";

import { useState, useEffect } from "react";
import { Button, useToast } from "@menumate/app";
import {
  CreditCard,
  Save,
  Users,
  Crown,
  Clock,
  CheckCircle,
  XCircle,
  CalendarPlus,
  Search,
  Loader2,
  IndianRupee,
} from "lucide-react";

type Tier = "free" | "pro" | "enterprise";

interface Settings {
  pro_plan_price: string;
  pro_plan_currency: string;
  pro_plan_interval: string;
  pro_plan_name: string;
}

interface Subscriber {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  status: string;
  subscriptionTier: Tier;
  subscriptionExpiresAt: string | null;
  createdAt: string;
  restaurantName: string | null;
}

const defaultSettings: Settings = {
  pro_plan_price: "",
  pro_plan_currency: "",
  pro_plan_interval: "",
  pro_plan_name: "",
};

export function SubscriptionsPageClient() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [users, setUsers] = useState<Subscriber[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [tierFilter, setTierFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);

  const loadSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch("/api/admin/subscriptions/settings");
      const data = await res.json();
      if (data.success && data.data) {
        setSettings({
          pro_plan_price: String(data.data.pro_plan_price ?? ""),
          pro_plan_currency: String(data.data.pro_plan_currency ?? ""),
          pro_plan_interval: String(data.data.pro_plan_interval ?? ""),
          pro_plan_name: String(data.data.pro_plan_name ?? ""),
        });
      }
    } catch (e) {
      showToast("Failed to load settings", "error");
    } finally {
      setSettingsLoading(false);
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (tierFilter) params.set("tier", tierFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/subscriptions/users?${params}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setUsers(data.data);
      }
    } catch (e) {
      showToast("Failed to load users", "error");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);
  useEffect(() => {
    loadUsers();
  }, [tierFilter, search]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      const res = await fetch("/api/admin/subscriptions/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Settings saved", "success");
        if (data.data) setSettings(data.data);
      } else {
        showToast(data.error || "Failed to save", "error");
      }
    } catch (e) {
      showToast("Failed to save settings", "error");
    } finally {
      setSettingsSaving(false);
    }
  };

  const grantPro = async (email: string, months: number = 12) => {
    setActingId(email);
    try {
      const res = await fetch("/api/admin/subscriptions/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, months }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Pro granted to ${email}`, "success");
        loadUsers();
      } else {
        showToast(data.error || "Failed to grant", "error");
      }
    } catch (e) {
      showToast("Failed to grant Pro", "error");
    } finally {
      setActingId(null);
    }
  };

  const revokePro = async (userId: string) => {
    setActingId(userId);
    try {
      const res = await fetch("/api/admin/subscriptions/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Subscription revoked", "success");
        loadUsers();
      } else {
        showToast(data.error || "Failed to revoke", "error");
      }
    } catch (e) {
      showToast("Failed to revoke", "error");
    } finally {
      setActingId(null);
    }
  };

  const extendPro = async (userId: string, months: number = 12) => {
    setActingId(userId);
    try {
      const res = await fetch("/api/admin/subscriptions/extend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, months }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Subscription extended", "success");
        loadUsers();
      } else {
        showToast(data.error || "Failed to extend", "error");
      }
    } catch (e) {
      showToast("Failed to extend", "error");
    } finally {
      setActingId(null);
    }
  };

  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Subscription management</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Configure Pro plan pricing and manage subscriber access
        </p>
      </div>

      {/* Plan settings card */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50/50">
          <h2 className="text-sm font-semibold text-neutral-900">Pro plan settings</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Price and billing interval shown to restaurant owners on the upgrade page
          </p>
        </div>
        <div className="p-5">
          {settingsLoading ? (
            <div className="flex items-center gap-2 text-neutral-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading…
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="max-w-xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">Plan name</label>
                  <input
                    type="text"
                    value={settings.pro_plan_name}
                    onChange={(e) => setSettings((s) => ({ ...s, pro_plan_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g. Pro Plan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">Price (amount)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={settings.pro_plan_price}
                      onChange={(e) => setSettings((s) => ({ ...s, pro_plan_price: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g. 999"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">Currency</label>
                  <select
                    value={settings.pro_plan_currency}
                    onChange={(e) => setSettings((s) => ({ ...s, pro_plan_currency: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">Billing interval</label>
                  <select
                    value={settings.pro_plan_interval}
                    onChange={(e) => setSettings((s) => ({ ...s, pro_plan_interval: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                  </select>
                </div>
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={settingsSaving}
                className="!min-w-0 w-fit justify-center gap-2"
              >
                {settingsSaving ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Save className="w-4 h-4 shrink-0" />}
                Save settings
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Subscribers table */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Subscribers</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Grant, revoke, or extend Pro access for restaurant owners
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by email or name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-neutral-200 rounded-lg text-sm w-48 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-3 py-1.5 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All tiers</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>
        <div className="w-full overflow-x-auto -mx-1">
          {usersLoading ? (
            <div className="p-8 flex items-center justify-center gap-2 text-neutral-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading users…
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-neutral-600">No users match the filters</p>
              <p className="text-xs text-neutral-500 mt-1">Try changing search or tier filter</p>
            </div>
          ) : (
            <table className="w-full table-fixed min-w-[640px]">
              <colgroup>
                <col style={{ width: "22%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "32%" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">User</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Restaurant</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tier</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Expires</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div>
                        <p className="font-medium text-neutral-900 truncate">{u.fullName || u.email}</p>
                        <p className="text-xs text-neutral-500 truncate">{u.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-sm text-neutral-600 truncate">{u.restaurantName || "—"}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          u.subscriptionTier === "pro"
                            ? "bg-primary-50 text-primary-700"
                            : u.subscriptionTier === "enterprise"
                            ? "bg-neutral-800 text-white"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {u.subscriptionTier}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-sm text-neutral-600">{formatDate(u.subscriptionExpiresAt)}</td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-2">
                        {u.subscriptionTier === "free" && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => grantPro(u.email)}
                            disabled={!!actingId}
                            className="inline-flex items-center gap-1"
                          >
                            {actingId === u.email ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crown className="w-3.5 h-3.5" />}
                            Grant Pro
                          </Button>
                        )}
                        {(u.subscriptionTier === "pro" || u.subscriptionTier === "enterprise") && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => extendPro(u.id)}
                              disabled={!!actingId}
                              className="inline-flex items-center gap-1"
                            >
                              {actingId === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarPlus className="w-3.5 h-3.5" />}
                              Extend 12 mo
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => revokePro(u.id)}
                              disabled={!!actingId}
                              className="inline-flex items-center gap-1"
                            >
                              {actingId === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                              Revoke
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
