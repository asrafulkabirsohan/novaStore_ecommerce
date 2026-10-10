"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ShoppingBag, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { IOrder } from "@/types";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export default function DashboardOverviewPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders/my-orders")
      .then((res) => res.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => ["pending", "confirmed", "processing", "shipped"].includes(o.currentStatus)).length;
  const deliveredOrders = orders.filter((o) => o.currentStatus === "delivered").length;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-xs">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Welcome back, {session?.user?.name || "Valued Customer"} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your active purchases, view order history, and update your shipping addresses.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase">Total Orders</span>
            <div className="text-2xl font-black text-gray-900">{totalOrders}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase">Active / Pending</span>
            <div className="text-2xl font-black text-gray-900">{pendingOrders}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase">Delivered</span>
            <div className="text-2xl font-black text-gray-900">{deliveredOrders}</div>
          </div>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
          <Link
            href="/dashboard/orders"
            className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1"
          >
            View All Orders <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500 py-4">Loading your orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">No recent orders found.</p>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 3).map((order) => (
              <div
                key={order._id?.toString()}
                className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <span className="font-mono font-bold text-gray-900 text-sm block">
                    {order.orderNumber}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDateTime(order.createdAt)} • {order.items.length} item(s)
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant={order.currentStatus as any}>{order.currentStatus}</Badge>
                  <span className="font-bold text-gray-900 text-sm hidden sm:inline">
                    {formatPrice(order.totalAmount)}
                  </span>
                  <Link
                    href={`/dashboard/orders/${order._id}`}
                    className="text-xs font-bold text-emerald-600 hover:underline"
                  >
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
