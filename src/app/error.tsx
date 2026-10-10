"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center space-y-6">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Something went wrong!</h1>
          <p className="text-sm text-gray-500">
            An unexpected error occurred while rendering this page. Our engineers have been notified.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button onClick={reset} variant="primary" size="md">
            <RefreshCw className="w-4 h-4 mr-1.5" /> Try Again
          </Button>

          <Link href="/">
            <Button variant="outline" size="md">
              <Home className="w-4 h-4 mr-1.5" /> Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
