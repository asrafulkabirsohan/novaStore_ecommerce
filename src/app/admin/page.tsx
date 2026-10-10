"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DollarSign, ShoppingBag, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { MetricCardSkeleton } from "@/components/ui/Skeleton";

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/metrics")
      .then((res) => res.json())
      .then((data) => setMetrics(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-xs">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          System Overview & Metrics
        </h1>
        <p className="text-sm text-gray-500 mt-1">Real-time revenue, inventory, and order dispatch status.</p>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase">Total Revenue</span>
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">
            {formatPrice(metrics?.totalRevenue || 0)}
          </div>
          <span className="text-xs text-gray-400">Sum of paid orders</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase">Total Orders</span>
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">{metrics?.totalOrdersCount || 0}</div>
          <span className="text-xs text-gray-400">All-time order count</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase">Active / Pending</span>
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">{metrics?.pendingOrdersCount || 0}</div>
          <span className="text-xs text-gray-400">Awaiting processing</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase">Low Stock Alert</span>
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">{metrics?.lowStockCount || 0}</div>
          <span className="text-xs text-gray-400">Stock ≤ Threshold</span>
        </div>
      </div>

      {/* Recent Orders Quick Table */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="text-lg font-bold text-gray-900">Recent Customer Orders</h2>
          <Link href="/admin/orders" className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1">
            View All Orders <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b border-gray-100">
              <tr>
                <th className="p-3">Order Number</th>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Total</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {metrics?.recentOrders?.map((order: any) => (
                <tr key={order._id} className="hover:bg-gray-50/50">
                  <td className="p-3 font-mono font-bold text-gray-900">{order.orderNumber}</td>
                  <td className="p-3 text-gray-500 text-xs">{formatDateTime(order.createdAt)}</td>
                  <td className="p-3 font-bold text-gray-900">{formatPrice(order.totalAmount)}</td>
                  <td className="p-3">
                    <Badge variant={order.paymentStatus === "paid" ? "delivered" : "pending"}>
                      {order.paymentStatus}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant={order.currentStatus}>{order.currentStatus}</Badge>
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/admin/orders/${order._id}`}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold transition-colors inline-block"
                    >
                      Dispatch
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
