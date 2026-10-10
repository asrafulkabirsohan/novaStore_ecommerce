import React from "react";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { AiChatWidget } from "@/components/shared/AiChatWidget";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-dvh bg-gray-50/50">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <AiChatWidget />
    </div>
  );
}
