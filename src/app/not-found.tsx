import React from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-4xl font-black text-emerald-600 font-mono">404</span>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Page Not Found</h1>
          <p className="text-sm text-gray-500">
            The page you are looking for might have been moved, deleted, or does not exist.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors text-sm min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Storefront
        </Link>
      </div>
    </div>
  );
}
