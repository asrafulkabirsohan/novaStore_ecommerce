"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Star, Filter, Search as SearchIcon, RefreshCw } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Drawer } from "@/components/ui/Drawer";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { ICategory, IProduct } from "@/types";

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") || "";
  const currentCategory = searchParams.get("category") || "";
  const currentSort = searchParams.get("sort") || "createdAt_desc";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const [categories, setCategories] = useState<ICategory[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(currentSearch);

  // Fetch Categories
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error(err));
  }, []);

  // Fetch Products based on URL params
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentSearch) params.set("search", currentSearch);
      if (currentCategory) params.set("category", currentCategory);
      if (currentSort) params.set("sort", currentSort);
      params.set("page", currentPage.toString());
      params.set("limit", "12");

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();

      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error("Fetch products error:", err);
    } finally {
      setLoading(false);
    }
  }, [currentSearch, currentCategory, currentSort, currentPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Update URL helper
  const updateUrlParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1"); // Reset page on filter change
    router.push(`/products?${params.toString()}`);
  };

  // Debounced search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParam("search", searchInput.trim());
  };

  const handleClearFilters = () => {
    setSearchInput("");
    router.push("/products");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Product Catalog
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Showing {totalCount} items {currentCategory ? `in category "${currentCategory}"` : ""}
          </p>
        </div>

        {/* Top Controls: Search & Mobile Filter Toggle */}
        <div className="flex items-center space-x-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Search catalog..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg min-h-[44px] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
          </form>

          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold min-h-[44px] shrink-0"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Sidebar (Desktop) + Products (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Sidebar Filter (Desktop) */}
        <div className="hidden lg:block bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6 sticky top-24">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h3 className="font-bold text-gray-900 text-base">Filter Products</h3>
            {(currentCategory || currentSearch || currentSort !== "createdAt_desc") && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-rose-600 font-semibold hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
              Sort By
            </label>
            <select
              value={currentSort}
              onChange={(e) => updateUrlParam("sort", e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white font-medium focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="createdAt_desc">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="title_asc">Name: A to Z</option>
            </select>
          </div>

          {/* Category Filter List */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
              Categories
            </label>
            <div className="space-y-1">
              <button
                onClick={() => updateUrlParam("category", "")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !currentCategory ? "bg-emerald-50 text-emerald-600 font-bold" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id?.toString()}
                  onClick={() => updateUrlParam("category", cat.slug)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentCategory === cat.slug
                      ? "bg-emerald-50 text-emerald-600 font-bold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section: Products Grid */}
        <div className="lg:col-span-3 space-y-8">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
                <SearchIcon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No products found</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                We couldn't find any products matching your active filters or search term.
              </p>
              <button
                onClick={handleClearFilters}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
              {products.map((product) => {
                const isLowStock = product.stock <= product.lowStockThreshold && product.stock > 0;
                const isOutOfStock = product.stock === 0;

                return (
                  <div
                    key={product._id?.toString()}
                    className="group bg-white rounded-2xl border border-gray-100 hover:border-emerald-500/20 shadow-xs hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-40 sm:h-48 w-full bg-gray-50 overflow-hidden">
                        <Image
                          src={product.images[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"}
                          alt={product.title}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1">
                          {product.discountPrice && (
                            <span className="bg-rose-600 text-white text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full uppercase">
                              Sale
                            </span>
                          )}
                          {isLowStock && <Badge variant="low-stock">Low Stock</Badge>}
                          {isOutOfStock && <Badge variant="cancelled">Out of Stock</Badge>}
                        </div>
                      </div>

                      <div className="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                        <Link href={`/products/${product.slug}`}>
                          <h3 className="font-bold text-gray-900 text-sm sm:text-base line-clamp-1 hover:text-emerald-600 transition-colors">
                            {product.title}
                          </h3>
                        </Link>

                        <div className="flex items-center space-x-1 pt-0.5">
                          <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
                          <span className="text-[11px] sm:text-xs font-bold text-gray-800">
                            {product.avgRating.toFixed(1)}
                          </span>
                          <span className="text-[11px] sm:text-xs text-gray-400">
                            ({product.reviewCount})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 sm:p-4 pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                      <div>
                        <div className="text-base sm:text-lg font-black text-gray-900">
                          {formatPrice(product.discountPrice || product.price)}
                        </div>
                        {product.discountPrice && (
                          <div className="text-[10px] sm:text-xs text-gray-400 line-through">
                            {formatPrice(product.price)}
                          </div>
                        )}
                      </div>
                      <Link
                        href={`/products/${product.slug}`}
                        className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 text-white rounded-lg font-semibold text-xs hover:bg-emerald-700 transition-colors min-h-[38px] sm:min-h-[44px] flex items-center justify-center"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => updateUrlParam("page", page.toString())}
            />
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      <Drawer
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="Filter Products"
        position="right"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500 uppercase">
              Sort By
            </label>
            <select
              value={currentSort}
              onChange={(e) => {
                updateUrlParam("sort", e.target.value);
                setMobileFilterOpen(false);
              }}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="createdAt_desc">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="title_asc">Name: A to Z</option>
            </select>
          </div>

          <div className="space-y-2 border-t border-gray-100 pt-4">
            <label className="block text-xs font-bold text-gray-500 uppercase">
              Categories
            </label>
            <button
              onClick={() => {
                updateUrlParam("category", "");
                setMobileFilterOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                !currentCategory ? "bg-emerald-50 text-emerald-600 font-bold" : "text-gray-700"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id?.toString()}
                onClick={() => {
                  updateUrlParam("category", cat.slug);
                  setMobileFilterOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                  currentCategory === cat.slug
                    ? "bg-emerald-50 text-emerald-600 font-bold"
                    : "text-gray-700"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </Drawer>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading product catalog...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
