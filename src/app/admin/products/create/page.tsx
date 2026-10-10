"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { ICategory } from "@/types";

export default function CreateProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    discountPrice: "",
    stock: "10",
    lowStockThreshold: "5",
    images: [] as string[],
    isFeatured: false,
    status: "active",
  });

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
          if (data.length > 0) setForm((prev) => ({ ...prev, category: data[0]._id }));
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.title || !form.description || !form.category || !form.price) {
      setError("Please fill in all required fields.");
      return;
    }

    if (form.images.length === 0) {
      setError("Please upload at least 1 product image.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
          stock: Number(form.stock),
          lowStockThreshold: Number(form.lowStockThreshold),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to create product.");
        setLoading(false);
      } else {
        router.push("/admin/products");
      }
    } catch (err: any) {
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-xs space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center space-x-3 border-b border-gray-100 pb-4">
        <Link href="/admin/products" className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Add New Product</h1>
          <p className="text-xs text-gray-500">Create a new item in your store inventory.</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-md">
          <p className="text-sm text-rose-700 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Product Title *"
          required
          placeholder="e.g. Wireless Noise-Canceling Headphones"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Description *
          </label>
          <textarea
            rows={4}
            required
            placeholder="Detailed features and product specs..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Category *"
            required
            options={categories.map((c) => ({ label: c.name, value: c._id?.toString() || "" }))}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />

          <Select
            label="Status *"
            options={[
              { label: "Active", value: "active" },
              { label: "Draft", value: "draft" },
              { label: "Archived", value: "archived" },
            ]}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Price (BDT ৳) *"
            type="number"
            required
            placeholder="e.g. 8500"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />

          <Input
            label="Discount Price (Optional)"
            type="number"
            placeholder="e.g. 7900"
            value={form.discountPrice}
            onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Initial Stock Quantity *"
            type="number"
            required
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
          />

          <Input
            label="Low Stock Alert Threshold *"
            type="number"
            required
            helperText="Triggers low stock badge when inventory falls to or below this number."
            value={form.lowStockThreshold}
            onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
          />
        </div>

        {/* Cloudinary Image Uploader */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Product Image *</label>
          <ImageUploader
            value={form.images[0] || ""}
            onChange={(url) => setForm({ ...form, images: url ? [url] : [] })}
          />
        </div>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
            className="text-emerald-600 focus:ring-emerald-500 rounded"
          />
          <span className="text-sm font-semibold text-gray-800">
            Feature this product on homepage carousel
          </span>
        </label>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
          <Link href="/admin/products">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button variant="primary" type="submit" disabled={loading}>
            <Save className="w-4 h-4 mr-1.5" />
            {loading ? "Saving Product..." : "Save Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
