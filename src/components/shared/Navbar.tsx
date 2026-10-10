"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  ShoppingBag,
  Menu,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Search,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const items = useCartStore((state) => state.items);

  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalCartCount = mounted
    ? items.reduce((sum, item) => sum + item.quantity, 0)
    : 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Products", href: "/products" },
    { name: "Categories", href: "/categories" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile Left: Hamburger Button */}
            <div className="flex items-center lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                aria-label="Open navigation menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Link
                href="/"
                className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight flex items-center gap-1.5"
              >
                <span className="bg-emerald-600 text-white p-1.5 rounded-lg">
                  <ShoppingBag className="w-5 h-5" />
                </span>
                <span>NovaStore</span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`text-sm font-medium transition-colors hover:text-emerald-600 ${
                      isActive ? "text-emerald-600 font-semibold" : "text-gray-700"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Icons */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Search Icon */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                aria-label="Search products"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Cart Icon with Badge */}
              <Link
                href="/cart"
                className="relative p-2 rounded-lg text-gray-700 hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {totalCartCount > 0 && (
                  <span className="absolute top-1 right-1 bg-emerald-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center animate-in zoom-in-50">
                    {totalCartCount}
                  </span>
                )}
              </Link>

              {/* Desktop User Account / Dropdown */}
              <div className="hidden lg:block relative">
                {session ? (
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center space-x-2 p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 min-h-[44px] transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                        {session.user?.name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <span className="text-sm font-medium text-gray-800 pr-1">
                        {session.user?.name?.split(" ")[0]}
                      </span>
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-xs text-gray-500">Signed in as</p>
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {session.user?.email}
                          </p>
                        </div>
                        {session.user?.role === "admin" && (
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            Admin Dashboard
                          </Link>
                        )}
                        <Link
                          href="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                        >
                          <UserIcon className="w-4 h-4 mr-2" />
                          My Orders
                        </Link>
                        <button
                          onClick={async () => {
                            setUserMenuOpen(false);
                            await signOut({ redirect: false });
                            window.location.href = "/";
                          }}
                          className="w-full flex items-center px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 min-h-[44px] transition-colors"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <Drawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="Menu"
        position="left"
      >
        <div className="flex flex-col space-y-6">
          {session && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-base">
                {session.user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="truncate">
                <p className="text-sm font-bold text-gray-900">{session.user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-emerald-50 text-emerald-600 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-100 flex flex-col space-y-3">
            {session ? (
              <>
                {session.user?.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center px-4 py-3 text-base text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <LayoutDashboard className="w-5 h-5 mr-3 text-emerald-600" />
                    Admin Panel
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 text-base text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <UserIcon className="w-5 h-5 mr-3 text-emerald-600" />
                  My Orders & Profile
                </Link>
                <button
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await signOut({ redirect: false });
                    window.location.href = "/";
                  }}
                  className="w-full flex items-center px-4 py-3 text-base text-rose-600 hover:bg-rose-50 rounded-lg font-medium"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center py-3 px-4 text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </Drawer>

      {/* Search Modal */}
      <Modal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        title="Search Catalog"
      >
        <form onSubmit={handleSearch} className="space-y-4">
          <Input
            placeholder="Type product name, description or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end space-x-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors text-sm min-h-[44px]"
            >
              Search
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};
