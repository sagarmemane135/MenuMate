"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { UtensilsCrossed, LayoutDashboard, Menu, Package, UserCheck, LogOut, X, AlignJustify } from "lucide-react";

interface AdminNavProps {
  userRole: string;
  userEmail: string;
}

export function AdminNav({ userRole, userEmail }: AdminNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["super_admin", "owner"]
    },
    {
      href: "/admin/menu",
      label: "Menu",
      icon: Menu,
      roles: ["owner"]
    },
    {
      href: "/admin/orders",
      label: "Orders",
      icon: Package,
      roles: ["owner"]
    },
    {
      href: "/admin/super",
      label: "User Approvals",
      icon: UserCheck,
      roles: ["super_admin"]
    }
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="/admin" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">MenuMate</span>
            </a>

            {/* Nav Links */}
            <div className="flex items-center space-x-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all
                      ${
                        active
                          ? "bg-orange-500 text-white shadow-md"
                          : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {userEmail.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
                  {userEmail}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="/admin" className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">MenuMate</span>
            </a>

            {/* Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
            >
              <AlignJustify className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`
          fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 
          transform transition-transform duration-300 ease-in-out md:hidden
          ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">MenuMate</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 bg-orange-50 border-b border-orange-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">
                  {userEmail.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {userEmail}
                </p>
                <p className="text-xs text-gray-600 capitalize">
                  {userRole.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto py-4">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center space-x-3 px-6 py-4 font-medium transition-all
                    ${
                      active
                        ? "bg-orange-500 text-white border-l-4 border-orange-600"
                        : "text-gray-700 hover:bg-orange-50 hover:text-orange-600 border-l-4 border-transparent"
                    }
                  `}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-base">{item.label}</span>
                </a>
              );
            })}
          </div>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-semibold transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
