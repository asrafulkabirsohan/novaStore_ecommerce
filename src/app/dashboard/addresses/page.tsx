"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Plus, CheckCircle2 } from "lucide-react";
import { IAddress } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function CustomerAddressBookPage() {
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    label: "Home",
    fullName: "",
    phone: "",
    street: "",
    city: "",
    postalCode: "",
    country: "Bangladesh",
    isDefault: false,
  });

  const fetchAddresses = async () => {
    try {
      const res = await fetch("/api/user/addresses");
      const data = await res.json();
      if (Array.isArray(data)) setAddresses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to add address.");
      } else {
        setAddresses(data);
        setModalOpen(false);
        setForm({
          label: "Home",
          fullName: "",
          phone: "",
          street: "",
          city: "",
          postalCode: "",
          country: "Bangladesh",
          isDefault: false,
        });
      }
    } catch (err) {
      setError("An error occurred while adding address.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Address Book</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your saved shipping & delivery addresses.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} variant="primary" size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> Add Address
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500 font-medium">Loading addresses...</div>
      ) : addresses.length === 0 ? (
        <div className="py-12 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <MapPin className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg">No saved addresses</h3>
          <p className="text-sm text-gray-500">Save your shipping address for faster checkout!</p>
          <Button onClick={() => setModalOpen(true)} variant="primary">
            <Plus className="w-4 h-4 mr-1.5" /> Add New Address
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr._id?.toString() || addr.label}
              className={`p-5 rounded-2xl border-2 transition-colors relative space-y-2 ${
                addr.isDefault ? "border-emerald-600 bg-emerald-50/30" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-sm uppercase tracking-wider">
                  {addr.label}
                </span>
                {addr.isDefault && <Badge variant="active">Default</Badge>}
              </div>

              <div className="text-xs text-gray-700 space-y-1">
                <p className="font-bold text-sm text-gray-900">{addr.fullName}</p>
                <p>Phone: {addr.phone}</p>
                <p>{addr.street}</p>
                <p>{addr.city}, {addr.postalCode}</p>
                <p>{addr.country}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Address Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Delivery Address"
      >
        <form onSubmit={handleAddAddress} className="space-y-4">
          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Address Label"
              required
              placeholder="e.g. Home, Office"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
            <Input
              label="Recipient Name"
              required
              placeholder="e.g. John Doe"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>

          <Input
            label="Phone Number"
            required
            placeholder="e.g. +8801700000000"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <Input
            label="Street Address"
            required
            placeholder="e.g. 45 Green Road, Flat 3B"
            value={form.street}
            onChange={(e) => setForm({ ...form, street: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              required
              placeholder="e.g. Dhaka"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <Input
              label="Postal Code"
              required
              placeholder="e.g. 1205"
              value={form.postalCode}
              onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
            />
          </div>

          <label className="flex items-center space-x-2 pt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="text-emerald-600 focus:ring-emerald-500 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Set as default shipping address</span>
          </label>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Address"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
