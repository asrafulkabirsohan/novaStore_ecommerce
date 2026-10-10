"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { IOrder } from "@/types";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/metrics")
      .then((res) => res.json())
      .then((data) => {
        if (data.recentOrders) setOrders(data.recentOrders);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-xs space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Orders & Dispatch Control</h1>
        <p className="text-sm text-gray-500 mt-1">Review incoming customer orders and update shipment tracking status.</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500 font-medium">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No orders found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b border-gray-100">
              <tr>
                <th className="p-3">Order Ref</th>
                <th className="p-3">Customer Email</th>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Total</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order._id?.toString()} className="hover:bg-gray-50/50">
                  <td className="p-3 font-mono font-bold text-gray-900">{order.orderNumber}</td>
                  <td className="p-3 text-gray-600">{order.guestEmail || "Registered Customer"}</td>
                  <td className="p-3 text-gray-500 text-xs">
                    {formatDateTime(order.createdAt)}
                  </td>
                  <td className="p-3 font-bold text-gray-900">{formatPrice(order.totalAmount)}</td>
                  <td className="p-3">
                    <Badge variant={order.paymentStatus === "paid" ? "delivered" : "pending"}>
                      {order.paymentStatus}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant={order.currentStatus as any}>{order.currentStatus}</Badge>
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/admin/orders/${order._id}`}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors inline-block"
                    >
                      Dispatch & Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
