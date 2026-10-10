"use client";

import React, { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Send, CheckCircle2, ShieldAlert } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { IOrder } from "@/types";

const STAGES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

export default function AdminOrderDispatcherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status Dispatcher Form
  const [targetStatus, setTargetStatus] = useState("processing");
  const [note, setNote] = useState("");
  const [updating, setUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/${id}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "Failed to load order.");
        } else {
          setOrder(data);
          setTargetStatus(data.currentStatus);
        }
      } catch (err) {
        setError("Failed to fetch order.");
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-medium">Loading order details...</div>;
  }

  if (error || !order) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-gray-100 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Order Not Found</h2>
        <p className="text-sm text-gray-500">{error}</p>
        <Link href="/admin/orders" className="text-emerald-600 font-bold hover:underline inline-flex items-center">
          <ArrowLeft className="w-4 h-4 mr-1" /> Return to Orders List
        </Link>
      </div>
    );
  }

  const currentIndex = STAGES.indexOf(order.currentStatus);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus, note: note.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusMessage(`Error: ${data.message}`);
      } else {
        setOrder(data.order);
        setNote("");
        setStatusMessage(`Order status successfully updated to "${targetStatus}"!`);
      }
    } catch (err: any) {
      setStatusMessage("Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Bar */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-gray-900 font-mono">{order.orderNumber}</h1>
            <Badge variant={order.currentStatus as any}>{order.currentStatus}</Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Payment: <strong className="uppercase">{order.paymentMethod}</strong> • Status:{" "}
            <strong className="uppercase">{order.paymentStatus}</strong>
          </p>
        </div>

        <Link
          href="/admin/orders"
          className="text-xs font-bold text-emerald-600 hover:underline flex items-center shrink-0"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Orders
        </Link>
      </div>

      {/* Status Dispatcher Card */}
      <div className="bg-gradient-to-br from-gray-900 to-emerald-950 text-white p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Send className="w-5 h-5 text-emerald-400" />
          Status Dispatcher & Dispatch Console
        </h2>

        {statusMessage && (
          <div className="p-3 bg-white/10 rounded-lg text-xs font-semibold text-emerald-300">
            {statusMessage}
          </div>
        )}

        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                Advance Order Status
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-700 bg-gray-800 text-white font-bold text-sm focus:ring-emerald-500"
              >
                {STAGES.map((st, idx) => {
                  const isPast = idx < currentIndex && st !== "cancelled";
                  return (
                    <option key={st} value={st} disabled={isPast}>
                      {st.toUpperCase()} {isPast ? "(Passed)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                Courier / Tracking Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Shipped via Pathao Courier #BD123456"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-700 bg-gray-800 text-white text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={updating} variant="primary" size="md">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              {updating ? "Updating..." : "Dispatch Status Update"}
            </Button>
          </div>
        </form>
      </div>

      {/* Grid: Order Items & Delivery Address */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Items Table */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <h3 className="font-bold text-gray-900 text-base border-b border-gray-100 pb-2">
            Items Ordered
          </h3>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-3 text-xs border-b border-gray-100 pb-3">
                <div className="relative w-12 h-12 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-gray-900 block">{item.title}</span>
                  <span className="text-gray-400">Qty: {item.quantity}</span>
                </div>
                <span className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 text-xs space-y-1 text-right">
            <p className="text-gray-600">Subtotal: <strong>{formatPrice(order.subtotal)}</strong></p>
            <p className="text-gray-600">Shipping: <strong>{order.shippingFee === 0 ? "FREE" : formatPrice(order.shippingFee)}</strong></p>
            <p className="text-sm font-black text-emerald-600">Total: {formatPrice(order.totalAmount)}</p>
          </div>
        </div>

        {/* Customer Account & Delivery Address Details */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <h3 className="font-bold text-gray-900 text-base border-b border-gray-100 pb-2 flex items-center justify-between">
            <span>Customer & Delivery Details</span>
            {order.user ? (
              <Badge variant="active">Registered Customer</Badge>
            ) : (
              <Badge variant="pending">Guest Checkout</Badge>
            )}
          </h3>

          {/* Account Profile Block */}
          {order.user && (
            <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100/60 space-y-1 text-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                User Account Profile
              </span>
              <p className="font-bold text-sm text-gray-900">{(order.user as any).name}</p>
              <p className="text-gray-700"><strong>Email:</strong> {(order.user as any).email}</p>
              {(order.user as any).phone && (
                <p className="text-gray-700"><strong>Account Phone:</strong> {(order.user as any).phone}</p>
              )}
            </div>
          )}

          {/* Shipping Address Block */}
          <div className="text-xs text-gray-700 space-y-1.5 pt-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
              Shipping Recipient Address
            </span>
            <p className="font-bold text-sm text-gray-900">{order.shippingAddress.fullName}</p>
            <p><strong>Contact Phone:</strong> {order.shippingAddress.phone}</p>
            <p><strong>Email Address:</strong> {order.guestEmail || (order.user as any)?.email || "N/A"}</p>
            <p><strong>Street:</strong> {order.shippingAddress.street}</p>
            <p><strong>City & Postal Code:</strong> {order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
            <p><strong>Country:</strong> {order.shippingAddress.country}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
