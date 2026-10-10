"use client";

import React, { useState, useEffect } from "react";
import { Users, Search, Mail, Phone, Calendar, ShoppingBag, DollarSign, Eye, ShieldCheck, User, Trash2, RotateCcw, XCircle, AlertTriangle } from "lucide-react";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface ICustomerUser {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  status?: "active" | "trashed";
  phone?: string;
  addresses?: any[];
  createdAt?: string;
  totalOrders: number;
  totalSpent: number;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<ICustomerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"active" | "trashed" | "all">("active");
  const [searchQuery, setSearchQuery] = useState("");

  // Customer Profile Details Modal
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomerUser | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Trash Confirm Modal
  const [trashModalOpen, setTrashModalOpen] = useState(false);
  const [customerToTrash, setCustomerToTrash] = useState<ICustomerUser | null>(null);

  // Permanent Delete Confirm Modal
  const [permDeleteModalOpen, setPermDeleteModalOpen] = useState(false);
  const [customerToPermDelete, setCustomerToPermDelete] = useState<ICustomerUser | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?status=${statusFilter}`);
      const data = await res.json();
      if (Array.isArray(data)) setCustomers(data);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter]);

  // Move Customer to Trash (Soft Delete)
  const handleConfirmTrash = async () => {
    if (!customerToTrash) return;
    try {
      const res = await fetch(`/api/admin/users/${customerToTrash._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchCustomers();
        setTrashModalOpen(false);
        setCustomerToTrash(null);
      }
    } catch (err) {
      console.error("Failed to trash customer:", err);
    }
  };

  // Restore Customer from Trash
  const handleRestoreCustomer = async (cust: ICustomerUser) => {
    try {
      const res = await fetch(`/api/admin/users/${cust._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      if (res.ok) {
        fetchCustomers();
      }
    } catch (err) {
      console.error("Failed to restore customer:", err);
    }
  };

  // Permanently Delete Customer from DB
  const handleConfirmPermanentDelete = async () => {
    if (!customerToPermDelete) return;
    try {
      const res = await fetch(`/api/admin/users/${customerToPermDelete._id}?permanent=true`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchCustomers();
        setPermDeleteModalOpen(false);
        setCustomerToPermDelete(null);
      }
    } catch (err) {
      console.error("Failed to permanently delete customer:", err);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery))
  );

  const totalUsersCount = customers.length;
  const totalRegularCustomers = customers.filter((c) => c.role === "user").length;
  const totalCustomerSpent = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-xs space-y-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" /> Customer Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage registered customer accounts, view address details, move accounts to Trash, or permanently remove them.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-xl min-h-[44px] focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-600 text-white rounded-lg">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase">Accounts ({statusFilter})</span>
            <p className="text-xl font-black text-gray-900">{totalUsersCount}</p>
          </div>
        </div>

        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center space-x-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-lg">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-blue-800 uppercase">Customer Users</span>
            <p className="text-xl font-black text-gray-900">{totalRegularCustomers}</p>
          </div>
        </div>

        <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 flex items-center space-x-3">
          <div className="p-2.5 bg-purple-600 text-white rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-purple-800 uppercase">Total User Spend</span>
            <p className="text-xl font-black text-gray-900">{formatPrice(totalCustomerSpent)}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-gray-100 pb-3">
        {[
          { label: "Active Customers", value: "active" },
          { label: "Trash / Soft Deleted", value: "trashed" },
          { label: "All Accounts", value: "all" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value as any)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors min-h-[44px] ${
              statusFilter === tab.value
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Customer List Table */}
      {loading ? (
        <div className="py-12 text-center text-gray-500 font-medium">Loading customer accounts...</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          No customer accounts found for filter "{statusFilter}".
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b border-gray-100">
              <tr>
                <th className="p-3">Customer User</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Account Role</th>
                <th className="p-3">Total Orders</th>
                <th className="p-3">Lifetime Spent</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.map((c) => {
                const isTrashed = c.status === "trashed";

                return (
                  <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0">
                          {c.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 block">{c.name}</span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Joined {formatDateTime(c.createdAt)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 space-y-0.5 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium text-gray-800">{c.email}</span>
                      </div>
                      {c.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      {c.role === "admin" ? (
                        <Badge variant="active" className="flex items-center w-fit gap-1">
                          <ShieldCheck className="w-3 h-3" /> Admin
                        </Badge>
                      ) : isTrashed ? (
                        <Badge variant="cancelled">Trashed</Badge>
                      ) : (
                        <Badge variant="shipped">Active Customer</Badge>
                      )}
                    </td>
                    <td className="p-3 font-bold text-gray-900">
                      {c.totalOrders} {c.totalOrders === 1 ? "order" : "orders"}
                    </td>
                    <td className="p-3 font-extrabold text-emerald-600">
                      {formatPrice(c.totalSpent)}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCustomer(c);
                          setProfileModalOpen(true);
                        }}
                        className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg min-h-[44px] min-w-[44px] inline-flex items-center justify-center transition-colors"
                        title="View Customer Profile Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Trash, Restore, or Permanent Delete Actions */}
                      {c.role !== "admin" && (
                        isTrashed ? (
                          <>
                            <button
                              onClick={() => handleRestoreCustomer(c)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg min-h-[44px] min-w-[44px] inline-flex items-center justify-center transition-colors"
                              title="Restore Account from Trash"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setCustomerToPermDelete(c);
                                setPermDeleteModalOpen(true);
                              }}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg min-h-[44px] min-w-[44px] inline-flex items-center justify-center transition-colors"
                              title="Permanently Delete Account from DB"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setCustomerToTrash(c);
                              setTrashModalOpen(true);
                            }}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg min-h-[44px] min-w-[44px] inline-flex items-center justify-center transition-colors"
                            title="Move Account to Trash"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Profile Details Modal */}
      <Modal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Customer Profile & Saved Addresses"
      >
        {selectedCustomer && (
          <div className="space-y-6 font-sans">
            {/* Header info */}
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-14 h-14 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xl shadow-md">
                {selectedCustomer.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-gray-900">{selectedCustomer.name}</h3>
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-gray-400" /> {selectedCustomer.email}
                </p>
                {selectedCustomer.phone && (
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400" /> {selectedCustomer.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <span className="text-gray-500 uppercase font-bold block">Lifetime Orders</span>
                <span className="text-lg font-black text-emerald-700">{selectedCustomer.totalOrders} Orders</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <span className="text-gray-500 uppercase font-bold block">Total Amount Spent</span>
                <span className="text-lg font-black text-emerald-700">{formatPrice(selectedCustomer.totalSpent)}</span>
              </div>
            </div>

            {/* Saved Addresses */}
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Saved Shipping Addresses</h4>
              {!selectedCustomer.addresses || selectedCustomer.addresses.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No saved addresses found for this account.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedCustomer.addresses.map((addr: any, idx: number) => (
                    <div key={idx} className="p-3 bg-white border border-gray-200 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-700">{addr.label || "Address"}</span>
                        {addr.isDefault && <Badge variant="active">Default</Badge>}
                      </div>
                      <p className="font-semibold text-gray-900">{addr.fullName} ({addr.phone})</p>
                      <p className="text-gray-600">{addr.street}, {addr.city}, {addr.postalCode}, {addr.country}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Trash Modal */}
      <Modal
        isOpen={trashModalOpen}
        onClose={() => setTrashModalOpen(false)}
        title="Move Customer Account to Trash"
      >
        <div className="space-y-4 font-sans">
          <p className="text-sm text-gray-600">
            Are you sure you want to move customer account <strong>{customerToTrash?.name}</strong> ({customerToTrash?.email}) to <strong>Trash</strong>?
          </p>
          <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
            <strong>Note:</strong> This is a soft delete. The customer data will remain safely saved in the Trash folder, and you can restore them anytime.
          </p>
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="outline" onClick={() => setTrashModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmTrash}>
              Move to Trash
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Permanent Delete Modal */}
      <Modal
        isOpen={permDeleteModalOpen}
        onClose={() => setPermDeleteModalOpen(false)}
        title="Permanently Delete Customer Account"
      >
        <div className="space-y-4 font-sans">
          <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
            <p className="text-xs font-semibold">
              Warning: This action is permanent and cannot be undone!
            </p>
          </div>
          <p className="text-sm text-gray-600">
            Are you sure you want to <strong>PERMANENTLY DELETE</strong> customer account <strong>{customerToPermDelete?.name}</strong> ({customerToPermDelete?.email}) from the database?
          </p>
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="outline" onClick={() => setPermDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmPermanentDelete}>
              Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
