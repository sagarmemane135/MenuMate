"use client";

import { useRouter } from "next/navigation";
import { Button } from "@menumate/app";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
    window.location.href = "/login";
  };

  return (
    <Button type="button" variant="outline" onClick={handleLogout}>
      <LogOut className="w-4 h-4 mr-2" />
      Log out
    </Button>
  );
}
