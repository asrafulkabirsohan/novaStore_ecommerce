"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ShoppingBag, ArrowRight, Package } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-in zoom-in-50">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Thank You for Your Order!
        </h1>
        <p className="text-gray-600 text-base">
          Your order has been placed successfully and is now being processed.
        </p>
      </div>

      {orderNumber && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl inline-block text-center">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">
            Order Reference ID
          </span>
          <span className="text-xl font-black text-emerald-800 tracking-wide font-mono">
            {orderNumber}
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Link
          href="/dashboard"
          className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors text-sm min-h-[44px]"
        >
          <Package className="w-4 h-4 mr-2" />
          Track Order Status
        </Link>

        <Link
          href="/products"
          className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors text-sm min-h-[44px]"
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center">Loading order details...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
