"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, MapPin, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Orders", href: "/dashboard/orders", icon: ShoppingBag },
    { name: "Address Book", href: "/dashboard/addresses", icon: MapPin },
  ];

  return (
    <div className="min-h-dvh flex flex-col bg-gray-50/50">
      <Navbar />
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Dashboard Sidebar */}
          <aside className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-gray-100 pb-4">
              <span className="font-extrabold text-gray-900 text-lg">Customer Portal</span>
            </div>

            <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2.5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-gray-100">
              <Link
                href="/products"
                className="text-xs text-gray-500 hover:text-emerald-600 flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Shopping
              </Link>
            </div>
          </aside>

          {/* Main Dashboard Content Area */}
          <main className="lg:col-span-3">{children}</main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
