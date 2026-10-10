"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LayoutDashboard, Package, FolderTree, ShoppingCart, Users, Shield, LogOut, Store } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Categories", href: "/admin/categories", icon: FolderTree },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Customers", href: "/admin/customers", icon: Users },
  ];

  return (
    <div className="min-h-dvh flex flex-col bg-gray-50/50 font-sans">
      {/* Dedicated Admin Header - NO Storefront Cart or Search */}
      <header className="bg-gray-900 text-white border-b border-gray-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-600 rounded-xl shadow-sm">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight leading-tight">
                NovaStore <span className="text-emerald-400">Admin</span>
              </span>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Management Console</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="inline-flex items-center space-x-1.5 text-xs text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-700 transition-colors font-semibold"
            >
              <Store className="w-3.5 h-3.5 text-emerald-400" />
              <span>Visit Customer Storefront</span>
            </Link>
            <div className="h-4 w-px bg-gray-800" />
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shadow-inner">
                {session?.user?.name?.[0]?.toUpperCase() || "A"}
              </div>
              <button
                onClick={async () => {
                  await signOut({ redirect: false });
                  window.location.href = "/login";
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 transition-colors min-h-[44px]"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Content Shell */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Admin Navigation Sidebar */}
          <aside className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
            <div className="flex items-center space-x-2 border-b border-gray-100 pb-4">
              <Shield className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-gray-900 text-base">Control Panel</span>
            </div>

            <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2.5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-3">{children}</main>
        </div>
      </div>
    </div>
  );
}
