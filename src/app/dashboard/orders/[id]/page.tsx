"use client";

import React, { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, AlertTriangle, ShieldCheck, XCircle } from "lucide-react";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { Stepper } from "@/components/ui/Stepper";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { IOrder } from "@/types";

const ORDER_STAGES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
];

export default function OrderTrackingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancel Modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/${id}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "Failed to load order.");
        } else {
          setOrder(data);
        }
      } catch (err: any) {
        setError("Error fetching order details.");
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-500 font-medium">Loading tracking data...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Order Access Error</h2>
        <p className="text-sm text-gray-500">{error || "Order not found."}</p>
        <Link href="/dashboard/orders" className="inline-flex items-center text-emerald-600 font-bold hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to My Orders
        </Link>
      </div>
    );
  }

  // Calculate Stepper Index
  const isCancelled = order.currentStatus === "cancelled";
  const currentStageIndex = ORDER_STAGES.indexOf(order.currentStatus);

  const canCancel = ["pending", "confirmed"].includes(order.currentStatus);

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      setCancelError("Please provide a reason for cancelling this order.");
      return;
    }

    setCancelling(true);
    setCancelError(null);

    try {
      const res = await fetch(`/api/orders/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancellationReason: cancelReason.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCancelError(data.message || "Failed to cancel order.");
      } else {
        setOrder(data.order);
        setCancelModalOpen(false);
      }
    } catch (err: any) {
      setCancelError("An error occurred during cancellation.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight font-mono">
              {order.orderNumber}
            </h1>
            <Badge variant={order.currentStatus as any}>{order.currentStatus}</Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Placed on {formatDateTime(order.createdAt)}
          </p>
        </div>

        {canCancel && (
          <button
            onClick={() => setCancelModalOpen(true)}
            className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl text-xs font-bold transition-colors min-h-[44px] flex items-center justify-center shrink-0"
          >
            <XCircle className="w-4 h-4 mr-1.5" /> Request Order Cancellation
          </button>
        )}
      </div>

      {/* Visual Stepper Tracker Card */}
      {!isCancelled ? (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            Live Shipment Tracker
          </h2>
          <Stepper stages={ORDER_STAGES} currentStage={currentStageIndex} />
        </div>
      ) : (
        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200 flex items-start space-x-4">
          <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-rose-900 text-base">This Order Has Been Cancelled</h3>
            <p className="text-sm text-rose-700 mt-1">
              <strong>Reason:</strong> {order.cancellationReason || "N/A"}
            </p>
            <p className="text-xs text-rose-600 mt-1">
              Cancelled by: {order.cancelledBy || "user"} on {formatDateTime(order.cancelledAt)}
            </p>
          </div>
        </div>
      )}

      {/* Grid: Timeline Events (Left) + Order Details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Timeline Log */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <h3 className="font-bold text-gray-900 text-base border-b border-gray-100 pb-3">
            Order Status History
          </h3>
          <div className="space-y-4">
            {[...order.trackingTimeline].reverse().map((event, idx) => (
              <div key={idx} className="flex items-start space-x-3 text-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 capitalize">{event.status.replace(/_/g, " ")}</span>
                    <span className="text-xs text-gray-400">
                      {formatDateTime(event.updatedAt)}
                    </span>
                  </div>
                  {event.note && <p className="text-xs text-gray-600">{event.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Address & Order Summary */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <h3 className="font-bold text-gray-900 text-base border-b border-gray-100 pb-2">
              Shipping Address
            </h3>
            <div className="text-xs text-gray-700 space-y-1">
              <p className="font-bold text-sm text-gray-900">{order.shippingAddress.fullName}</p>
              <p>Phone: {order.shippingAddress.phone}</p>
              <p>{order.shippingAddress.street}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="font-bold text-gray-900 text-base border-b border-gray-100 pb-2">
              Items Purchased
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-3 text-xs">
                  <div className="relative w-12 h-12 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-gray-900 block line-clamp-1">{item.title}</span>
                    <span className="text-gray-400">Qty: {item.quantity}</span>
                  </div>
                  <span className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 text-xs space-y-1.5">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping Fee</span>
                <span>{order.shippingFee === 0 ? "FREE" : formatPrice(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-gray-900 border-t border-gray-100 pt-2">
                <span>Total Amount</span>
                <span className="text-emerald-600">{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Order Confirmation"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to cancel order <strong className="font-mono">{order.orderNumber}</strong>?
            Stock will be automatically released back to our inventory.
          </p>

          {cancelError && <p className="text-xs text-rose-600 font-medium">{cancelError}</p>}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Cancellation Reason *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Please explain why you are requesting cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
              Back
            </Button>
            <Button variant="destructive" onClick={handleCancelOrder} disabled={cancelling}>
              {cancelling ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
