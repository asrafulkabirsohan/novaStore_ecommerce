import React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "low-stock"
  | "active"
  | "draft"
  | "archived";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: BadgeVariant;
}

export const Badge: React.FC<BadgeProps> = ({
  variant,
  className,
  children,
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    pending: "bg-amber-100 text-amber-800 border border-amber-200",
    confirmed: "bg-blue-100 text-blue-800 border border-blue-200",
    processing: "bg-indigo-100 text-indigo-800 border border-indigo-200",
    shipped: "bg-purple-100 text-purple-800 border border-purple-200",
    out_for_delivery: "bg-cyan-100 text-cyan-800 border border-cyan-200",
    delivered: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    cancelled: "bg-rose-100 text-rose-800 border border-rose-200",
    "low-stock": "bg-orange-100 text-orange-800 border border-orange-200 animate-pulse",
    active: "bg-green-100 text-green-800 border border-green-200",
    draft: "bg-gray-100 text-gray-800 border border-gray-200",
    archived: "bg-slate-200 text-slate-700 border border-slate-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize tracking-wide transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children || variant.replace(/_/g, " ").replace("-", " ")}
    </span>
  );
};
