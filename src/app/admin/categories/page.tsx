"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, FolderTree } from "lucide-react";
import { ICategory } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", description: "", icon: "ShoppingBag" });

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to create category.");
      } else {
        fetchCategories();
        setModalOpen(false);
        setForm({ name: "", description: "", icon: "ShoppingBag" });
      }
    } catch (err) {
      setError("An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Cannot delete category.");
      } else {
        fetchCategories();
      }
    } catch (err) {
      alert("Failed to delete category.");
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Product Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Organize storefront product departments.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} variant="primary" size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> Add Category
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500 font-medium">Loading categories...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <div
              key={cat._id?.toString()}
              className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-emerald-600" />
                  {cat.name}
                </span>
                <span className="text-xs text-gray-400 font-mono block">slug: {cat.slug}</span>
                {cat.description && <p className="text-xs text-gray-600 line-clamp-1">{cat.description}</p>}
              </div>

              <button
                onClick={() => handleDeleteCategory(cat._id?.toString() || "")}
                className="p-2 text-gray-400 hover:text-rose-600 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Delete Category"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Product Category"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

          <Input
            label="Category Name *"
            required
            placeholder="e.g. Electronics, Footwear"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Short category summary..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Category"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
