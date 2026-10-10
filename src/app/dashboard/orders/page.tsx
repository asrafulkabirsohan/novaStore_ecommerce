"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { IOrder } from "@/types";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders/my-orders")
      .then((res) => res.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-xs space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">My Order History</h1>
        <p className="text-sm text-gray-500 mt-1">Track and manage all your past and active purchases.</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500 font-medium">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg">No orders placed yet</h3>
          <p className="text-sm text-gray-500">Explore our catalog and place your first order today!</p>
          <Link
            href="/products"
            className="inline-flex items-center px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition-colors"
          >
            Start Shopping <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b border-gray-100">
                <tr>
                  <th className="p-4">Order Ref</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order._id?.toString()} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-gray-900">{order.orderNumber}</td>
                    <td className="p-4 text-gray-500 text-xs">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="p-4 font-semibold text-gray-800">{order.items.length}</td>
                    <td className="p-4 font-black text-gray-900">{formatPrice(order.totalAmount)}</td>
                    <td className="p-4">
                      <Badge variant={order.paymentStatus === "paid" ? "delivered" : "pending"}>
                        {order.paymentStatus}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={order.currentStatus as any}>{order.currentStatus}</Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/dashboard/orders/${order._id}`}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold transition-colors inline-block"
                      >
                        Track Order
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Stack */}
          <div className="md:hidden space-y-4">
            {orders.map((order) => (
              <div
                key={order._id?.toString()}
                className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-gray-900 text-sm">{order.orderNumber}</span>
                  <Badge variant={order.currentStatus as any}>{order.currentStatus}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatDateTime(order.createdAt)}</span>
                  <span className="font-black text-gray-900 text-sm">{formatPrice(order.totalAmount)}</span>
                </div>
                <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between">
                  <span className="text-xs text-gray-400">{order.items.length} product(s)</span>
                  <Link
                    href={`/dashboard/orders/${order._id}`}
                    className="text-xs font-bold text-emerald-600 hover:underline"
                  >
                    View Details & Tracking →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
