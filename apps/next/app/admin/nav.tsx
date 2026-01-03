"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { 
  UtensilsCrossed, LayoutDashboard, Menu, Package, UserCheck, 
  LogOut, X, AlignJustify, Users, ChefHat, Clock 
} from "lucide-react";

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
      href: "/admin/sessions",
      label: "Sessions",
      icon: Users,
      roles: ["owner"]
    },
    {
      href: "/admin/kitchen",
      label: "Kitchen",
      icon: ChefHat,
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
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-neutral-200">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center px-6 border-b border-neutral-200">
            <a href="/admin" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-neutral-900">MenuMate</span>
            </a>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col px-3 py-4 space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                    ${
                      active
                        ? "bg-primary-50 text-primary-700"
                        : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                    }
                  `}
                >
                  <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    active ? "text-primary-600" : "text-neutral-400 group-hover:text-neutral-500"
                  }`} />
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="flex shrink-0 border-t border-neutral-200 p-4">
            <div className="flex items-center w-full">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-700 font-semibold text-sm">
                    {userEmail.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {userEmail}
                </p>
                <p className="text-xs text-neutral-500 capitalize truncate">
                  {userRole.replace('_', ' ')}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="lg:hidden sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-neutral-200 bg-white px-4 sm:gap-x-6 sm:px-6">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-neutral-700 lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <AlignJustify className="h-6 w-6" />
        </button>

        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="flex items-center gap-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-neutral-900">MenuMate</span>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-neutral-900/80 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-neutral-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-neutral-900">MenuMate</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="-m-2 p-2 text-neutral-400 hover:text-neutral-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col px-3 py-4 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                  ${
                    active
                      ? "bg-primary-50 text-primary-700"
                      : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                  }
                `}
              >
                <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  active ? "text-primary-600" : "text-neutral-400 group-hover:text-neutral-500"
                }`} />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="flex shrink-0 border-t border-neutral-200 p-4">
          <div className="flex items-center w-full">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-700 font-semibold text-sm">
                  {userEmail.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">
                {userEmail}
              </p>
              <p className="text-xs text-neutral-500 capitalize truncate">
                {userRole.replace('_', ' ')}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
