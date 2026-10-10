"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Edit, Archive, RotateCcw } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ICategory, IProduct } from "@/types";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  // Archive / Delete Modal
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [productToArchive, setProductToArchive] = useState<IProduct | null>(null);

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    price: 0,
    discountPrice: 0,
    stock: 0,
    category: "",
    status: "active",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products?status=${statusFilter}`);
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [statusFilter]);

  // Open Edit Modal
  const handleOpenEdit = (prod: IProduct) => {
    setEditingProduct(prod);
    setEditForm({
      title: prod.title,
      price: prod.price,
      discountPrice: prod.discountPrice || 0,
      stock: prod.stock,
      category: (prod.category as any)?._id || prod.category || "",
      status: prod.status,
    });
    setEditError(null);
    setEditModalOpen(true);
  };

  // Submit Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setEditLoading(true);
    setEditError(null);

    try {
      const payload: any = {
        title: editForm.title,
        price: Number(editForm.price),
        stock: Number(editForm.stock),
        category: editForm.category,
        status: editForm.status,
      };

      if (editForm.discountPrice && Number(editForm.discountPrice) > 0) {
        payload.discountPrice = Number(editForm.discountPrice);
      } else {
        payload.discountPrice = null;
      }

      const res = await fetch(`/api/admin/products/${editingProduct._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        setEditError(errData.message || "Failed to update product");
      } else {
        setEditModalOpen(false);
        setEditingProduct(null);
        fetchProducts();
      }
    } catch (err) {
      setEditError("An unexpected error occurred.");
    } finally {
      setEditLoading(false);
    }
  };

  // Confirm Archive
  const handleArchiveProduct = async () => {
    if (!productToArchive) return;
    try {
      await fetch(`/api/admin/products/${productToArchive._id}`, {
        method: "DELETE",
      });
      fetchProducts();
      setArchiveModalOpen(false);
      setProductToArchive(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Restore Product (Reactivate)
  const handleRestoreProduct = async (prod: IProduct) => {
    try {
      await fetch(`/api/admin/products/${prod._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Product Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">Manage catalog listings, prices, and stock limits.</p>
        </div>
        <Link href="/admin/products/create">
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-1.5" /> Add New Product
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-gray-100 pb-3">
        {["all", "active", "draft", "archived"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors min-h-[44px] ${
              statusFilter === st
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500 font-medium">Loading catalog...</div>
      ) : products.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No products found for status "{statusFilter}".</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b border-gray-100">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock Badge</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((prod) => {
                const isLowStock = prod.stock <= (prod.lowStockThreshold || 5) && prod.stock > 0;
                const isOutOfStock = prod.stock === 0;
                const isArchived = prod.status === "archived";

                return (
                  <tr key={prod._id?.toString()} className="hover:bg-gray-50/50">
                    <td className="p-3">
                      <div className="flex items-center space-x-3">
                        <div className="relative w-12 h-12 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                          <Image src={prod.images?.[0] || ""} alt="" fill className="object-cover" />
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 block line-clamp-1">{prod.title}</span>
                          <span className="text-xs text-gray-400 font-mono">{prod.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-gray-600">
                      {(prod.category as any)?.name || "General"}
                    </td>
                    <td className="p-3 font-bold text-gray-900">
                      <div>{formatPrice(prod.discountPrice || prod.price)}</div>
                      {prod.discountPrice && (
                        <span className="text-xs text-gray-400 line-through font-normal">
                          {formatPrice(prod.price)}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {isOutOfStock ? (
                        <Badge variant="cancelled">Out of Stock</Badge>
                      ) : isLowStock ? (
                        <Badge variant="low-stock">Low Stock: {prod.stock} left</Badge>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-700">{prod.stock} in stock</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant={prod.status as any}>{prod.status}</Badge>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEdit(prod)}
                        className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg min-h-[44px] min-w-[44px] inline-flex items-center justify-center transition-colors"
                        title="Edit Price & Stock"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* Archive or Restore Toggle Button */}
                      {isArchived ? (
                        <button
                          onClick={() => handleRestoreProduct(prod)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg min-h-[44px] min-w-[44px] inline-flex items-center justify-center transition-colors"
                          title="Restore to Active"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setProductToArchive(prod);
                            setArchiveModalOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg min-h-[44px] min-w-[44px] inline-flex items-center justify-center transition-colors"
                          title="Archive Product"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Product Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Product Details"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {editError && (
            <div className="bg-rose-50 text-rose-700 p-3 rounded-lg text-xs font-semibold">
              {editError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Product Title</label>
            <Input
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Regular Price (৳)</label>
              <Input
                type="number"
                value={editForm.price}
                onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Discount Price (৳)</label>
              <Input
                type="number"
                placeholder="Optional"
                value={editForm.discountPrice || ""}
                onChange={(e) => setEditForm({ ...editForm, discountPrice: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Stock Quantity</label>
              <Input
                type="number"
                value={editForm.stock}
                onChange={(e) => setEditForm({ ...editForm, stock: Number(e.target.value) })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white font-medium"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
            <select
              value={editForm.category}
              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white font-medium"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id?.toString()} value={cat._id?.toString()}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={editLoading}>
              {editLoading ? "Saving Changes..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Archive Modal */}
      <Modal
        isOpen={archiveModalOpen}
        onClose={() => setArchiveModalOpen(false)}
        title="Archive Product"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to archive <strong>{productToArchive?.title}</strong>? It will no longer appear in the public catalog.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setArchiveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleArchiveProduct}>
              Confirm Archive
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
