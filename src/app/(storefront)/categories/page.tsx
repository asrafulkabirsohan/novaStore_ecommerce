import React from "react";
import Link from "next/link";
import { ArrowRight, Cpu, Shirt, Home, BookOpen, Layers, ShoppingBag, ArrowUpRight } from "lucide-react";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";

export const revalidate = 60; // Revalidate every 60 seconds

async function getCategoriesData() {
  await connectDB();
  const categories = await Category.find({}).sort({ name: 1 }).lean();
  
  // Fetch active product count per category
  const categoryCounts = await Promise.all(
    categories.map(async (cat: any) => {
      const count = await Product.countDocuments({ category: cat._id, status: "active" });
      return {
        ...cat,
        productCount: count,
      };
    })
  );

  return JSON.parse(JSON.stringify(categoryCounts));
}

const iconMap: Record<string, any> = {
  Cpu,
  Shirt,
  Home,
  BookOpen,
};

const categoryGradients: Record<string, string> = {
  electronics: "from-blue-600 to-indigo-700",
  fashion: "from-pink-600 to-rose-700",
  "home-kitchen": "from-amber-500 to-emerald-700",
  "books-stationery": "from-purple-600 to-violet-800",
};

export default async function CategoriesPage() {
  const categories = await getCategoriesData();

  return (
    <div className="space-y-12 pb-16">
      {/* Header Banner */}
      <section className="bg-gradient-to-br from-gray-900 via-emerald-950 to-emerald-900 text-white py-16 px-4 sm:px-6 lg:px-8 rounded-b-3xl shadow-lg">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Product Taxonomy</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Explore <span className="text-emerald-400">Categories</span>
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-base sm:text-lg font-light">
            Discover our curated collections across technology, fashion, home essentials, and literature.
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {categories.map((cat: any) => {
            const IconComponent = iconMap[cat.icon] || ShoppingBag;
            const gradient = categoryGradients[cat.slug] || "from-emerald-600 to-teal-800";

            return (
              <Link
                key={cat._id}
                href={`/products?category=${cat.slug}`}
                className="group relative bg-white rounded-3xl border border-gray-100 shadow-md hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between p-8 transform hover:-translate-y-1"
              >
                {/* Background Decorator */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${gradient} opacity-10 rounded-bl-full group-hover:scale-110 transition-transform`} />

                <div className="space-y-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-md group-hover:scale-105 transition-transform`}>
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <span className="px-3.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-xs font-bold">
                      {cat.productCount} {cat.productCount === 1 ? "Product" : "Products"}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors flex items-center gap-2">
                      {cat.name}
                      <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600" />
                    </h2>
                    <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                      {cat.description || "Discover premium products handpicked for quality and value."}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between text-sm font-bold text-emerald-600 group-hover:text-emerald-700 relative z-10">
                  <span>Browse Collection</span>
                  <div className="p-2 rounded-full bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
