"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed, LayoutDashboard, Menu as MenuIcon, Package, UserCheck, LogOut, X } from "lucide-react";
import { useState } from "react";

interface NavProps {
  userRole: string;
  userEmail: string;
}

export function AdminNav({ userRole, userEmail }: NavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
    });
    if (response.ok) {
      window.location.href = "/login";
    }
  };

  const isActive = (path: string) => {
    if (path === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(path);
  };

  const getLinkClasses = (path: string) => {
    const active = isActive(path);
    return `inline-flex items-center px-1 pt-1 border-b-3 text-sm font-semibold transition-all duration-200 ${
      active
        ? "border-orange-500 text-orange-600"
        : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
    }`;
  };

  const getMobileLinkClasses = (path: string) => {
    const active = isActive(path);
    return `flex items-center space-x-3 px-4 py-3 text-base font-semibold transition-all duration-200 rounded-lg ${
      active
        ? "bg-orange-100 text-orange-600"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;
  };

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/admin" className="flex items-center space-x-2 text-xl sm:text-2xl font-bold text-orange-600 hover:text-orange-700 transition-all">
                <UtensilsCrossed className="w-6 h-6 sm:w-8 sm:h-8" />
                <span className="hidden xs:inline">MenuMate</span>
              </Link>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link href="/admin" className={getLinkClasses("/admin")}>
                <LayoutDashboard className="w-4 h-4 inline-block mr-2" />
                Dashboard
              </Link>
              {userRole !== "super_admin" && (
                <>
                  <Link href="/admin/menu" className={getLinkClasses("/admin/menu")}>
                    <MenuIcon className="w-4 h-4 inline-block mr-2" />
                    Menu
                  </Link>
                  <Link href="/admin/orders" className={getLinkClasses("/admin/orders")}>
                    <Package className="w-4 h-4 inline-block mr-2" />
                    Orders
                  </Link>
                </>
              )}
              {userRole === "super_admin" && (
                <Link href="/admin/super" className={getLinkClasses("/admin/super")}>
                  <UserCheck className="w-4 h-4 inline-block mr-2" />
                  Approvals
                </Link>
              )}
            </div>
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 px-2 sm:px-3 py-1.5 rounded-lg truncate max-w-[200px]">
              {userEmail}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-sm font-semibold text-slate-600 hover:text-orange-600 transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline">Logout</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-600 hover:text-orange-600 hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <MenuIcon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link 
              href="/admin" 
              className={getMobileLinkClasses("/admin")}
              onClick={() => setMobileMenuOpen(false)}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            {userRole !== "super_admin" && (
              <>
                <Link 
                  href="/admin/menu" 
                  className={getMobileLinkClasses("/admin/menu")}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <MenuIcon className="w-5 h-5" />
                  <span>Menu</span>
                </Link>
                <Link 
                  href="/admin/orders" 
                  className={getMobileLinkClasses("/admin/orders")}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Package className="w-5 h-5" />
                  <span>Orders</span>
                </Link>
              </>
            )}
            {userRole === "super_admin" && (
              <Link 
                href="/admin/super" 
                className={getMobileLinkClasses("/admin/super")}
                onClick={() => setMobileMenuOpen(false)}
              >
                <UserCheck className="w-5 h-5" />
                <span>User Approvals</span>
              </Link>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-slate-200">
            <div className="px-4 py-2">
              <p className="text-xs font-medium text-slate-500">Signed in as</p>
              <p className="text-sm font-semibold text-slate-900 truncate">{userEmail}</p>
            </div>
            <div className="px-2 mt-2">
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-2 w-full px-4 py-3 text-base font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
