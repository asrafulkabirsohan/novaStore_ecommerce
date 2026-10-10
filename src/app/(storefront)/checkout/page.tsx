"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { CreditCard, Truck, CheckCircle2, ShieldCheck, MapPin } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { formatPrice } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, subtotal, clearCart } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [guestEmail, setGuestEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "bKash" | "Stripe">("COD");

  const [addressForm, setAddressForm] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    postalCode: "",
    country: "Bangladesh",
  });

  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | "new">("new");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Autofill user details if available
  useEffect(() => {
    if (session?.user) {
      if (session.user.name) setAddressForm((prev) => ({ ...prev, fullName: session.user.name || "" }));
    }
  }, [session]);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Your Cart is Empty</h2>
        <p className="text-gray-500">Please add items to your cart before proceeding to checkout.</p>
        <Link href="/products" className="inline-flex items-center text-emerald-600 font-bold hover:underline">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const cartSubtotal = subtotal();
  const shippingFee = cartSubtotal > 3000 ? 0 : 100;
  const grandTotal = cartSubtotal + shippingFee;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!session && !guestEmail.trim()) {
      setError("Please enter your email address for order updates.");
      return;
    }

    if (!addressForm.fullName || !addressForm.phone || !addressForm.street || !addressForm.city) {
      setError("Please fill in all required address fields.");
      return;
    }

    setSubmitting(true);

    try {
      const formattedItems = items.map((item) => ({
        productId: typeof item.product._id === "object" ? item.product._id.toString() : item.product._id,
        title: item.product.title,
        quantity: item.quantity,
        price: item.product.discountPrice || item.product.price,
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: formattedItems,
          shippingAddress: addressForm,
          paymentMethod,
          guestEmail: session ? undefined : guestEmail.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to place order.");
        setSubmitting(false);
      } else {
        clearCart();
        router.push(`/order-success?orderNumber=${data.orderNumber}`);
      }
    } catch (err: any) {
      setError("An error occurred while placing your order.");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight border-b border-gray-100 pb-4">
        Checkout & Shipping
      </h1>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-md">
          <p className="text-sm text-rose-700 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Section: Address & Payment */}
        <div className="lg:col-span-2 space-y-8">
          {/* Guest Email Input */}
          {!session && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Contact Information (Guest Checkout)
              </h2>
              <Input
                label="Email Address"
                type="email"
                required
                placeholder="you@example.com"
                helperText="We will send your order confirmation and invoice to this email."
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
              />
            </div>
          )}

          {/* Shipping Address Section */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              Delivery Address
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Recipient Full Name"
                required
                placeholder="e.g. Tanvir Hossain"
                value={addressForm.fullName}
                onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
              />
              <Input
                label="Phone Number"
                required
                placeholder="e.g. +8801700000000"
                value={addressForm.phone}
                onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Street Address / House / Flat No."
                  required
                  placeholder="e.g. House 12, Road 5, Block B, Dhanmondi"
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                />
              </div>
              <Input
                label="City / District"
                required
                placeholder="e.g. Dhaka"
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
              />
              <Input
                label="Postal Code"
                required
                placeholder="e.g. 1205"
                value={addressForm.postalCode}
                onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
              />
            </div>
          </div>

          {/* Payment Method Section */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Payment Method
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`p-4 rounded-xl border-2 cursor-pointer flex items-center space-x-3 transition-colors ${
                  paymentMethod === "COD" ? "border-emerald-600 bg-emerald-50/50" : "border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-gray-900 text-sm block">Cash on Delivery (COD)</span>
                  <span className="text-xs text-gray-500">Pay cash upon receiving products</span>
                </div>
              </label>

              <label
                className={`p-4 rounded-xl border-2 cursor-pointer flex items-center space-x-3 transition-colors ${
                  paymentMethod === "bKash" ? "border-emerald-600 bg-emerald-50/50" : "border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="bKash"
                  checked={paymentMethod === "bKash"}
                  onChange={() => setPaymentMethod("bKash")}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-pink-700 text-sm block">bKash / Mobile Wallet</span>
                  <span className="text-xs text-gray-500">Fast digital payment</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Section: Order Summary */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6 sticky top-24">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
            Order Review
          </h2>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.product._id?.toString()} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-medium line-clamp-1 flex-1 pr-2">
                  {item.product.title} <span className="text-gray-400 font-normal">x{item.quantity}</span>
                </span>
                <span className="font-bold text-gray-900">
                  {formatPrice((item.product.discountPrice || item.product.price) * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-3 text-sm border-t border-gray-100 pt-4">
            <div className="flex justify-between text-gray-600">
              <span>Items Subtotal</span>
              <span className="font-bold text-gray-900">{formatPrice(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping Fee</span>
              <span className="font-bold text-gray-900">
                {shippingFee === 0 ? "FREE" : formatPrice(shippingFee)}
              </span>
            </div>
            <div className="flex justify-between text-base font-black text-gray-900 border-t border-gray-100 pt-3">
              <span>Total Payable</span>
              <span className="text-emerald-600">{formatPrice(grandTotal)}</span>
            </div>
          </div>

          <Button type="submit" disabled={submitting} variant="primary" fullWidth size="lg">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            {submitting ? "Processing Order..." : "Place Order Now"}
          </Button>
        </div>
      </form>
    </div>
  );
}
