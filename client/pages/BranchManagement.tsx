import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Header } from "../components/Header";
import { cn } from "@/lib/utils";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  Monitor,
  RefreshCw,
  Grid3X3,
  BarChart3,
  MessageSquare,
} from "lucide-react";

interface Branch {
  id: string;
  branch_code: string;
  branch_name: string;
  branch_city?: string;
  branch_address?: string;
  region?: string;
  contact_phone?: string;
  contact_email?: string;
  is_active: boolean;
  created_on: string;
  updated_on: string;
}

interface BranchFormData {
  branch_code: string;
  branch_name: string;
  branch_city: string;
  branch_address: string;
  region: string;
  contact_phone: string;
  contact_email: string;
}

export function BranchManagement() {
  const { isAdmin } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<BranchFormData>({
    branch_code: "",
    branch_name: "",
    branch_city: "",
    branch_address: "",
    region: "",
    contact_phone: "",
    contact_email: "",
  });

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/branches?limit=50&search=${searchQuery}`,
      );
      if (!response.ok) throw new Error("Failed to fetch branches");
      const data = await response.json();
      setBranches(data.data);
    } catch (error) {
      console.error("Error fetching branches:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingBranch
        ? `/api/branches/${editingBranch.id}`
        : "/api/branches";
      const method = editingBranch ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save branch");

      await fetchBranches();
      setShowAddModal(false);
      setShowEditModal(false);
      setEditingBranch(null);
      setFormData({
        branch_code: "",
        branch_name: "",
        branch_city: "",
        branch_address: "",
        region: "",
        contact_phone: "",
        contact_email: "",
      });
    } catch (error) {
      console.error("Error saving branch:", error);
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      branch_code: branch.branch_code,
      branch_name: branch.branch_name,
      branch_city: branch.branch_city || "",
      branch_address: branch.branch_address || "",
      region: branch.region || "",
      contact_phone: branch.contact_phone || "",
      contact_email: branch.contact_email || "",
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this branch?")) return;

    try {
      const response = await fetch(`/api/branches/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete branch");
      await fetchBranches();
    } catch (error) {
      console.error("Error deleting branch:", error);
    }
  };

  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">
            Access denied. Admin privileges required.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200" style={{display: "flex", flexDirection: "column"}}>
        <div className="flex items-center justify-between h-16 px-6" style={{margin: "0 auto"}}>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => window.location.href = '/'}
              className="flex flex-col items-center p-3 text-gray-500 hover:bg-gray-100 rounded-md"
            >
              <Grid3X3 className="w-5 h-5 mb-1" />
              <span className="text-xs">Home</span>
            </button>
            <button
              onClick={() => window.location.href = '/?tab=device-status'}
              className="flex flex-col items-center p-3 text-gray-500 hover:bg-gray-100 rounded-md"
            >
              <BarChart3 className="w-5 h-5 mb-1" />
              <span className="text-xs">Device Status</span>
            </button>
            <button className="flex flex-col items-center p-3 text-gray-500 hover:bg-gray-100 rounded-md">
              <MessageSquare className="w-5 h-5 mb-1" />
              <span className="text-xs">Live Conversation</span>
            </button>
            <button className="flex flex-col items-center p-3 rounded-md text-gray-700 bg-white border border-gray-300">
              <Building2 className="w-5 h-5 mb-1" />
              <span className="text-xs">Branches</span>
            </button>
            <button
              onClick={() => window.location.href = '/device-management'}
              className="flex flex-col items-center p-3 text-gray-500 hover:bg-gray-100 rounded-md"
            >
              <Monitor className="w-5 h-5 mb-1" />
              <span className="text-xs">Devices</span>
            </button>
            <button
              onClick={() => window.location.href = '/?tab=analytics'}
              className="flex flex-col items-center p-3 text-gray-500 hover:bg-gray-100 rounded-md"
            >
              <BarChart3 className="w-5 h-5 mb-1" />
              <span className="text-xs">Analytics</span>
            </button>
            <button
              onClick={() => window.location.href = '/user-management'}
              className="flex flex-col items-center p-3 text-gray-500 hover:bg-gray-100 rounded-md"
            >
              <Users className="w-5 h-5 mb-1" />
              <span className="text-xs">User Management</span>
            </button>
            <button className="flex flex-col items-center p-3 text-gray-500 hover:bg-gray-100 rounded-md">
              <Mail className="w-5 h-5 mb-1" />
              <span className="text-xs">Complaints</span>
            </button>
          </div>
          <div className="flex items-center space-x-4" />
        </div>
      </div>

      <div className="px-6 py-6 pt-1" style={{padding: "24px 24px 5px"}}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Branch Management
              </h1>
              <p className="text-gray-600">
                Manage branch locations and information
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Branch</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex items-center justify-between">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search branches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <button
              onClick={fetchBranches}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Branches Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-red-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Building2 className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {branch.branch_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {branch.branch_code}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(branch)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(branch.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {branch.branch_city && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{branch.branch_city}</span>
                      </div>
                    )}
                    {branch.contact_phone && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{branch.contact_phone}</span>
                      </div>
                    )}
                    {branch.contact_email && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{branch.contact_email}</span>
                      </div>
                    )}
                    {branch.region && (
                      <div className="text-gray-500">
                        Region: {branch.region}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span
                        className={`px-2 py-1 rounded-full ${
                          branch.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {branch.is_active ? "Active" : "Inactive"}
                      </span>
                      <span>
                        Created:{" "}
                        {new Date(branch.created_on).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add/Edit Modal */}
          {(showAddModal || showEditModal) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-lg font-semibold mb-4">
                  {editingBranch ? "Edit Branch" : "Add New Branch"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Branch Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.branch_code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          branch_code: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Branch Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.branch_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          branch_name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.branch_city}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          branch_city: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      value={formData.branch_address}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          branch_address: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Region
                    </label>
                    <input
                      type="text"
                      value={formData.region}
                      onChange={(e) =>
                        setFormData({ ...formData, region: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contact_phone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contact_email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setShowEditModal(false);
                        setEditingBranch(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      {editingBranch ? "Update" : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
