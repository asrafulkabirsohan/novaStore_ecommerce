import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star, Cpu, Shirt, Home, BookOpen, ShoppingBag, ShieldCheck, Truck, Headphones } from "lucide-react";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export const revalidate = 60; // Revalidate every 60 seconds

async function getHomeData() {
  await connectDB();
  const [categories, featuredProducts] = await Promise.all([
    Category.find({}).sort({ name: 1 }).lean(),
    Product.find({ status: "active", isFeatured: true })
      .populate("category", "name slug")
      .limit(8)
      .lean(),
  ]);

  return {
    categories: JSON.parse(JSON.stringify(categories)),
    featuredProducts: JSON.parse(JSON.stringify(featuredProducts)),
  };
}

const iconMap: Record<string, any> = {
  Cpu,
  Shirt,
  Home,
  BookOpen,
};

export default async function HomePage() {
  const { categories, featuredProducts } = await getHomeData();

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Banner Section */}
      <section className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-gray-900 text-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden rounded-b-3xl shadow-xl">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6 text-center lg:text-left">
            <span className="inline-block px-3.5 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-full text-xs font-semibold uppercase tracking-wider">
              Mega Festive Sale • Up to 40% Off
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Elevate Your Shopping <span className="text-emerald-400">Experience</span>
            </h1>
            <p className="text-lg text-emerald-100/80 max-w-xl mx-auto lg:mx-0 font-light">
              Explore authentic tech gadgets, premium apparel, modern kitchenware, and bestsellers with superfast delivery across Bangladesh.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/products"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 text-base min-h-[44px]"
              >
                Explore Catalog
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href="/categories"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl border border-white/20 backdrop-blur-xs transition-all text-base min-h-[44px]"
              >
                View Categories
              </Link>
            </div>
          </div>

          <div className="relative h-72 sm:h-96 lg:h-[420px] rounded-2xl overflow-hidden shadow-2xl border border-emerald-500/20">
            <Image
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80"
              alt="E-commerce store banner"
              fill
              priority
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center space-x-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Fast Delivery</h4>
              <p className="text-xs text-gray-500">Express delivery across BD</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center space-x-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">100% Authentic</h4>
              <p className="text-xs text-gray-500">Verified quality products</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center space-x-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Cash On Delivery</h4>
              <p className="text-xs text-gray-500">Pay when product arrives</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center space-x-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">24/7 Support</h4>
              <p className="text-xs text-gray-500">Dedicated help desk</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Shop by Category
            </h2>
            <p className="text-sm text-gray-500 mt-1">Browse our curated product collections</p>
          </div>
          <Link
            href="/categories"
            className="text-emerald-600 hover:text-emerald-700 text-sm font-bold flex items-center gap-1 transition-colors"
          >
            See All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat: any) => {
            const IconComponent = iconMap[cat.icon] || ShoppingBag;
            return (
              <Link
                key={cat._id}
                href={`/products?category=${cat.slug}`}
                className="group bg-white p-6 rounded-2xl border border-gray-100 hover:border-emerald-500/30 shadow-xs hover:shadow-md transition-all flex flex-col items-center text-center space-y-3"
              >
                <div className="p-4 bg-emerald-50 group-hover:bg-emerald-600 text-emerald-600 group-hover:text-white rounded-2xl transition-colors">
                  <IconComponent className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 text-base transition-colors">
                  {cat.name}
                </h3>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Featured Products
            </h2>
            <p className="text-sm text-gray-500 mt-1">Top-rated items handpicked for you</p>
          </div>
          <Link
            href="/products"
            className="text-emerald-600 hover:text-emerald-700 text-sm font-bold flex items-center gap-1 transition-colors"
          >
            View All Catalog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {featuredProducts.map((product: any) => {
            const isLowStock = product.stock <= product.lowStockThreshold && product.stock > 0;
            const isOutOfStock = product.stock === 0;

            return (
              <div
                key={product._id}
                className="group bg-white rounded-2xl border border-gray-100 hover:border-emerald-500/20 shadow-xs hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Image container */}
                  <div className="relative h-40 sm:h-56 w-full bg-gray-50 overflow-hidden">
                    <Image
                      src={product.images[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"}
                      alt={product.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1">
                      {product.discountPrice && (
                        <span className="bg-rose-600 text-white text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Sale
                        </span>
                      )}
                      {isLowStock && (
                        <Badge variant="low-stock">
                          Only {product.stock} Left
                        </Badge>
                      )}
                      {isOutOfStock && (
                        <Badge variant="cancelled">Out of Stock</Badge>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3 sm:p-5 space-y-1 sm:space-y-2">
                    <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                      {product.category?.name || "General"}
                    </span>
                    <Link href={`/products/${product.slug}`}>
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base line-clamp-1 hover:text-emerald-600 transition-colors">
                        {product.title}
                      </h3>
                    </Link>

                    {/* Rating stars */}
                    <div className="flex items-center space-x-1.5 pt-0.5 sm:pt-1">
                      <div className="flex text-amber-400">
                        <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                      </div>
                      <span className="text-[11px] sm:text-xs font-bold text-gray-800">
                        {product.avgRating.toFixed(1)}
                      </span>
                      <span className="text-[11px] sm:text-xs text-gray-400">
                        ({product.reviewCount})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer price & CTA */}
                <div className="p-3 sm:p-5 pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
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
                    className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl font-bold text-xs transition-colors min-h-[38px] sm:min-h-[44px] flex items-center justify-center"
                  >
                    Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
