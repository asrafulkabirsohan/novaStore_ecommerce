"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingBag, Trash2, ArrowRight, ArrowLeft } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, subtotal } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 font-medium">Loading your shopping cart...</p>
      </div>
    );
  }

  const cartSubtotal = subtotal();
  const shippingFee = cartSubtotal > 3000 || cartSubtotal === 0 ? 0 : 100; // Free shipping over ৳3,000
  const grandTotal = cartSubtotal + shippingFee;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-6">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <div className="space-y-2 max-w-md mx-auto">
          <h2 className="text-2xl font-black text-gray-900">Your Shopping Cart is Empty</h2>
          <p className="text-sm text-gray-500">
            Looks like you haven't added any products to your cart yet. Explore our latest arrivals and deals!
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-32 lg:pb-12">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Shopping Cart ({items.length} items)
        </h1>
        <button
          onClick={clearCart}
          className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Cart Item List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const pId =
              (typeof item.product._id === "object"
                ? item.product._id?.toString()
                : item.product._id) || "";
            const price = item.product.discountPrice || item.product.price;
            const lineTotal = price * item.quantity;

            return (
              <div
                key={pId}
                className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-4 w-full sm:w-auto">
                  <div className="relative w-20 h-20 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                    <Image
                      src={item.product.images?.[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"}
                      alt={item.product.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-1 flex-1">
                    <Link href={`/products/${item.product.slug}`}>
                      <h3 className="font-bold text-gray-900 text-sm hover:text-emerald-600 line-clamp-1">
                        {item.product.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-gray-400">Unit Price: {formatPrice(price)}</p>
                  </div>
                </div>

                {/* Controls & Subtotal */}
                <div className="flex items-center justify-between w-full sm:w-auto sm:space-x-6">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(pId, item.quantity - 1)}
                      className="w-9 h-9 rounded-lg border border-gray-300 font-bold text-sm hover:bg-gray-100 flex items-center justify-center min-h-[44px] min-w-[44px]"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(pId, Math.min(item.product.stock, item.quantity + 1))}
                      className="w-9 h-9 rounded-lg border border-gray-300 font-bold text-sm hover:bg-gray-100 flex items-center justify-center min-h-[44px] min-w-[44px]"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-gray-900 text-base">
                      {formatPrice(lineTotal)}
                    </div>
                  </div>

                  <button
                    onClick={() => removeItem(pId)}
                    className="p-2 text-gray-400 hover:text-rose-600 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary Sidebar (Desktop) */}
        <div className="hidden lg:block bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6 sticky top-24">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
            Order Summary
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-bold text-gray-900">{formatPrice(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping Fee</span>
              <span className="font-bold text-gray-900">
                {shippingFee === 0 ? "FREE" : formatPrice(shippingFee)}
              </span>
            </div>
            {shippingFee > 0 && (
              <p className="text-xs text-emerald-600 bg-emerald-50 p-2 rounded-lg font-medium">
                Add {formatPrice(3000 - cartSubtotal)} more for FREE Shipping!
              </p>
            )}
            <div className="flex justify-between text-base font-black text-gray-900 border-t border-gray-100 pt-3">
              <span>Grand Total</span>
              <span className="text-emerald-600">{formatPrice(grandTotal)}</span>
            </div>
          </div>

          <button
            onClick={() => router.push("/checkout")}
            className="w-full inline-flex items-center justify-center px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-colors text-base min-h-[44px]"
          >
            Proceed to Checkout
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>

      {/* Sticky Bottom Bar (Mobile Layout) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white p-4 shadow-2xl lg:hidden flex items-center justify-between">
        <div>
          <span className="text-xs text-gray-500 block">Total Amount</span>
          <span className="text-xl font-black text-emerald-600">{formatPrice(grandTotal)}</span>
        </div>
        <button
          onClick={() => router.push("/checkout")}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm min-h-[44px] flex items-center"
        >
          Checkout ({items.length})
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </button>
      </div>
    </div>
  );
}
