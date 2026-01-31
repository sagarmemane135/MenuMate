"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Input, useToast } from "@menumate/app";
import { UserCog, Plus, Trash2, ChefHat, KeyRound } from "lucide-react";

interface StaffMember {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  createdAt: string;
}

export function KdsUsersPageClient() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [lastCredentials, setLastCredentials] = useState<{ email: string; password: string } | null>(null);
  const [changePasswordFor, setChangePasswordFor] = useState<StaffMember | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [changingPasswordId, setChangingPasswordId] = useState<string | null>(null);
  const [justChangedPassword, setJustChangedPassword] = useState<{ staffId: string; password: string } | null>(null);
  const { showToast } = useToast();

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/kds-users", { credentials: "include" });
      if (!res.ok) {
        showToast("Failed to load KDS users", "error");
        return;
      }
      const json = await res.json();
      setStaff(json.data?.staff ?? []);
    } catch {
      showToast("Failed to load KDS users", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast("Please enter the staff member's name", "error");
      return;
    }
    setSubmitting(true);
    setLastCredentials(null);
    try {
      const res = await fetch("/api/admin/kds-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: fullName.trim(),
          ...(createPassword.trim().length >= 6 ? { password: createPassword.trim() } : {}),
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setLastCredentials({
          email: json.data?.generatedEmail ?? "",
          password: json.data?.generatedPassword ?? "",
        });
        setFullName("");
        setCreatePassword("");
        await fetchStaff();
        showToast(json.message ?? "KDS user added. Share the credentials below.", "success");
      } else {
        showToast(json.error ?? "Failed to add KDS user", "error");
      }
    } catch {
      showToast("Failed to add KDS user", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => showToast(`${label} copied`, "success"),
      () => showToast("Copy failed", "error")
    );
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    if (!changePasswordFor) return;
    e.preventDefault();
    const passwordToUse = newPassword.trim().length >= 6 ? newPassword.trim() : null;
    setChangingPasswordId(changePasswordFor.id);
    try {
      const res = await fetch("/api/admin/kds-users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: changePasswordFor.id,
          ...(passwordToUse ? { newPassword: passwordToUse } : {}),
        }),
      });
      const json = await res.json();
      if (res.ok) {
        const pwd = json.data?.generatedPassword ?? passwordToUse ?? "";
        setJustChangedPassword({ staffId: changePasswordFor.id, password: pwd });
        setChangePasswordFor(null);
        setNewPassword("");
        showToast(json.message ?? "Password updated. Share it with your staff.", "success");
      } else {
        showToast(json.error ?? "Failed to change password", "error");
      }
    } catch {
      showToast("Failed to change password", "error");
    } finally {
      setChangingPasswordId(null);
    }
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let result = "";
    for (let i = 0; i < 12; i++) result += chars[Math.floor(Math.random() * chars.length)];
    setNewPassword(result);
    copyToClipboard(result, "Password");
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/kds-users?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        await fetchStaff();
        showToast("KDS user removed", "success");
      } else {
        const json = await res.json();
        showToast(json.error ?? "Failed to remove KDS user", "error");
      }
    } catch {
      showToast("Failed to remove KDS user", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleDateString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return s;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
          <UserCog className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">KDS Users</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Add staff who can only access the Kitchen section and update order status. They cannot see dashboard, menu, orders, or analytics.
          </p>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50/50 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary-600" />
          <h2 className="text-base font-semibold text-neutral-900">Add KDS User</h2>
        </div>
        <div className="p-5">
          <p className="text-sm text-neutral-500 mb-4">
            Enter the staff member&apos;s name. Email is generated as <span className="font-mono text-neutral-700">first.last@restaurantdomain.com</span> (e.g. john.doe@testrestro.com). Optionally set a password, or leave blank to auto-generate.
          </p>
          <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-4">
            <div className="min-w-[200px]">
              <label className="block text-sm font-medium text-neutral-600 mb-1">Name</label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="min-w-[200px]">
              <label className="block text-sm font-medium text-neutral-600 mb-1">Password (optional)</label>
              <Input
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="Leave blank to auto-generate"
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" disabled={submitting} size="sm">
              {submitting ? "Adding…" : "Add KDS User"}
            </Button>
          </form>
          {lastCredentials && (
            <div className="mt-4 p-4 rounded-xl bg-primary-50 border border-primary-200">
              <p className="text-sm font-medium text-primary-900 mb-2">Share these login credentials with your staff:</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-neutral-600">Email:</span>
                  <code className="flex-1 font-mono bg-white px-2 py-1 rounded-lg border border-primary-200">{lastCredentials.email}</code>
                  <button type="button" onClick={() => copyToClipboard(lastCredentials.email, "Email")} className="text-primary-600 hover:underline">Copy</button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-neutral-600">Password:</span>
                  <code className="flex-1 font-mono bg-white px-2 py-1 rounded-lg border border-primary-200">{lastCredentials.password}</code>
                  <button type="button" onClick={() => copyToClipboard(lastCredentials.password, "Password")} className="text-primary-600 hover:underline">Copy</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50/50 flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-primary-600" />
          <h2 className="text-base font-semibold text-neutral-900">Current KDS Users</h2>
        </div>
        <div className="p-5">
          {loading ? (
            <p className="text-sm text-neutral-500">Loading…</p>
          ) : staff.length === 0 ? (
            <p className="text-sm text-neutral-500">No KDS users yet. Add one above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Full name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Password</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Added</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {staff.map((s) => (
                    <tr key={s.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-neutral-900">{s.email}</td>
                      <td className="px-4 py-3 text-sm text-neutral-700">{s.fullName}</td>
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {justChangedPassword?.staffId === s.id ? (
                          <span className="inline-flex items-center gap-2">
                            <code className="font-mono bg-primary-50 px-2 py-0.5 rounded-lg text-primary-800">{justChangedPassword.password}</code>
                            <button type="button" onClick={() => copyToClipboard(justChangedPassword.password, "Password")} className="text-primary-600 hover:underline text-xs">Copy</button>
                          </span>
                        ) : (
                          <span className="text-neutral-400">••••••••</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-500">{formatDate(s.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => { setChangePasswordFor(s); setNewPassword(""); setJustChangedPassword((prev) => (prev?.staffId === s.id ? null : prev)); }}
                            className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800"
                            title="Change password"
                          >
                            <KeyRound className="w-4 h-4" />
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(s.id)}
                            disabled={deletingId === s.id}
                            className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                            title="Remove KDS access"
                          >
                            <Trash2 className="w-4 h-4" />
                            {deletingId === s.id ? "Removing…" : "Remove"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {changePasswordFor && (
                <div className="mt-4 p-4 rounded-xl border border-neutral-200 bg-neutral-50/50">
                  <p className="text-sm font-medium text-neutral-900 mb-2">Change password for {changePasswordFor.fullName}</p>
                  <form onSubmit={handleChangePassword} className="flex flex-wrap items-end gap-3">
                    <div className="min-w-[200px]">
                      <label className="block text-xs font-medium text-neutral-600 mb-1">New password (min 6 chars, or leave empty to generate)</label>
                      <Input
                        type="text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Leave empty to generate random"
                        minLength={6}
                        autoComplete="off"
                      />
                    </div>
                    <Button type="button" variant="secondary" size="sm" onClick={generateRandomPassword}>
                      Generate random
                    </Button>
                    <Button type="submit" disabled={changingPasswordId === changePasswordFor.id} size="sm">
                      {changingPasswordId === changePasswordFor.id ? "Saving…" : "Save password"}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setChangePasswordFor(null); setNewPassword(""); }}>
                      Cancel
                    </Button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
