import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Monitor,
  Building2,
  Wifi,
  WifiOff,
  AlertTriangle,
  RefreshCw,
  Settings,
} from "lucide-react";

interface Device {
  id: string;
  device_name: string;
  device_mac?: string;
  ip_address?: string;
  device_type: 'recorder' | 'monitor' | 'other';
  branch_id?: string;
  branch_name?: string;
  branch_code?: string;
  installation_date?: string;
  last_maintenance?: string;
  device_status: 'active' | 'inactive' | 'maintenance';
  notes?: string;
  created_on: string;
  updated_on: string;
}

interface Branch {
  id: string;
  branch_code: string;
  branch_name: string;
}

interface DeviceFormData {
  device_name: string;
  device_mac: string;
  ip_address: string;
  device_type: 'recorder' | 'monitor' | 'other';
  branch_id: string;
  installation_date: string;
  last_maintenance: string;
  device_status: 'active' | 'inactive' | 'maintenance';
  notes: string;
}

export function DeviceManagement() {
  const { isAdmin } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState<DeviceFormData>({
    device_name: "",
    device_mac: "",
    ip_address: "",
    device_type: "recorder",
    branch_id: "",
    installation_date: "",
    last_maintenance: "",
    device_status: "active",
    notes: "",
  });

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/devices?limit=50&search=${searchQuery}`);
      if (!response.ok) throw new Error("Failed to fetch devices");
      const data = await response.json();
      setDevices(data.data);
    } catch (error) {
      console.error("Error fetching devices:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await fetch("/api/branches?limit=100&active=true");
      if (!response.ok) throw new Error("Failed to fetch branches");
      const data = await response.json();
      setBranches(data.data);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchBranches();
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingDevice ? `/api/devices/${editingDevice.id}` : "/api/devices";
      const method = editingDevice ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          branch_id: formData.branch_id || null,
          installation_date: formData.installation_date || null,
          last_maintenance: formData.last_maintenance || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to save device");

      await fetchDevices();
      setShowAddModal(false);
      setShowEditModal(false);
      setEditingDevice(null);
      setFormData({
        device_name: "",
        device_mac: "",
        ip_address: "",
        device_type: "recorder",
        branch_id: "",
        installation_date: "",
        last_maintenance: "",
        device_status: "active",
        notes: "",
      });
    } catch (error) {
      console.error("Error saving device:", error);
    }
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      device_name: device.device_name,
      device_mac: device.device_mac || "",
      ip_address: device.ip_address || "",
      device_type: device.device_type,
      branch_id: device.branch_id || "",
      installation_date: device.installation_date || "",
      last_maintenance: device.last_maintenance || "",
      device_status: device.device_status,
      notes: device.notes || "",
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this device?")) return;

    try {
      const response = await fetch(`/api/devices/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete device");
      await fetchDevices();
    } catch (error) {
      console.error("Error deleting device:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Wifi className="h-4 w-4 text-green-600" />;
      case "maintenance":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "inactive":
        return <WifiOff className="h-4 w-4 text-red-600" />;
      default:
        return <Monitor className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "maintenance":
        return "bg-yellow-100 text-yellow-700";
      case "inactive":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (!isAdmin()) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Access denied. Admin privileges required.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Device Management</h1>
            <p className="text-gray-600">Manage recording devices and their assignments</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Device</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center justify-between">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search devices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <button
            onClick={fetchDevices}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Devices Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-red-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <div
                key={device.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Monitor className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {device.device_name}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">{device.device_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(device)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(device.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {device.device_mac && (
                    <div className="text-gray-600">
                      <strong>MAC:</strong> {device.device_mac}
                    </div>
                  )}
                  {device.ip_address && (
                    <div className="text-gray-600">
                      <strong>IP:</strong> {device.ip_address}
                    </div>
                  )}
                  {device.branch_name && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Building2 className="h-4 w-4" />
                      <span>{device.branch_name} ({device.branch_code})</span>
                    </div>
                  )}
                  {device.installation_date && (
                    <div className="text-gray-500">
                      Installed: {new Date(device.installation_date).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(device.device_status)}
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(device.device_status)}`}>
                        {device.device_status.charAt(0).toUpperCase() + device.device_status.slice(1)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(device.created_on).toLocaleDateString()}
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
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">
                {editingDevice ? "Edit Device" : "Add New Device"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Device Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.device_name}
                    onChange={(e) =>
                      setFormData({ ...formData, device_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Device Type
                  </label>
                  <select
                    value={formData.device_type}
                    onChange={(e) =>
                      setFormData({ ...formData, device_type: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="recorder">Recorder</option>
                    <option value="monitor">Monitor</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    MAC Address
                  </label>
                  <input
                    type="text"
                    value={formData.device_mac}
                    onChange={(e) =>
                      setFormData({ ...formData, device_mac: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IP Address
                  </label>
                  <input
                    type="text"
                    value={formData.ip_address}
                    onChange={(e) =>
                      setFormData({ ...formData, ip_address: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Branch
                  </label>
                  <select
                    value={formData.branch_id}
                    onChange={(e) =>
                      setFormData({ ...formData, branch_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.branch_name} ({branch.branch_code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Installation Date
                  </label>
                  <input
                    type="date"
                    value={formData.installation_date}
                    onChange={(e) =>
                      setFormData({ ...formData, installation_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.device_status}
                    onChange={(e) =>
                      setFormData({ ...formData, device_status: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setEditingDevice(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    {editingDevice ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
