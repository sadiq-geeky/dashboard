import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Header } from "../components/Header";
import { cn } from "@/lib/utils";
import { authDelete, authFetch } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { HeartbeatRecord } from "@shared/api";
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
} from "lucide-react";

interface Device {
  id: string;
  device_name: string;
  device_mac?: string;
  device_type: "recorder" | "monitor" | "other";
  branch_id?: string;
  branch_name?: string;
  branch_code?: string;
  installation_date?: string;
  last_maintenance?: string;
  device_status: "active" | "inactive" | "maintenance";
  notes?: string;
  created_on: string;
  updated_on: string;
  // Heartbeat-based status
  heartbeat_status?: "online" | "problematic" | "offline";
  last_seen?: string;
  current_ip?: string; // IP address from heartbeat data
}

interface DeviceFormData {
  device_name: string;
  device_mac: string;
  device_type: "recorder" | "monitor" | "other";
  installation_date: string;
  last_maintenance: string;
  device_status: "active" | "inactive" | "maintenance";
  notes: string;
}

export function DeviceManagement() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [heartbeats, setHeartbeats] = useState<HeartbeatRecord[]>([]);
  const [formData, setFormData] = useState<DeviceFormData>({
    device_name: "",
    device_mac: "",
    device_type: "recorder",
    installation_date: "",
    last_maintenance: "",
    device_status: "active",
    notes: "",
  });

  const fetchHeartbeats = async (): Promise<HeartbeatRecord[]> => {
    try {
      const response = await authFetch("/api/heartbeats");
      if (!response.ok) {
        console.error("Failed to fetch heartbeats:", response.status);
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching heartbeats:", error);
      return [];
    }
  };

  const calculateHeartbeatStatus = (
    lastSeen: string,
  ): "online" | "problematic" | "offline" => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const minutesDiff = Math.floor(
      (now.getTime() - lastSeenDate.getTime()) / (1000 * 60),
    );

    if (minutesDiff <= 5) return "online";
    if (minutesDiff <= 15) return "problematic";
    return "offline";
  };

  const fetchDevices = async () => {
    try {
      setLoading(true);

      // Fetch devices and heartbeats in parallel
      const [devicesResponse, heartbeatsData] = await Promise.all([
        authFetch(
          `/api/devices?limit=50&search=${encodeURIComponent(searchQuery)}`,
        ),
        fetchHeartbeats(),
      ]);

      if (!devicesResponse.ok) {
        const errorText = await devicesResponse.text();
        console.error(`HTTP Error ${devicesResponse.status}:`, errorText);
        throw new Error(
          `Failed to fetch devices: ${devicesResponse.status} ${errorText}`,
        );
      }

      const devicesData = await devicesResponse.json();
      const devicesArray = devicesData.data || [];

      // Merge heartbeat status with devices
      const devicesWithHeartbeatStatus = devicesArray.map((device: Device) => {
        // Find matching heartbeat by MAC address
        const heartbeat = heartbeatsData.find(
          (hb) => device.device_mac && hb.device_id === device.device_mac,
        );

        if (heartbeat) {
          return {
            ...device,
            heartbeat_status: calculateHeartbeatStatus(heartbeat.last_seen),
            last_seen: heartbeat.last_seen,
            current_ip: heartbeat.ip_address, // Add current IP from heartbeat
          };
        }

        return {
          ...device,
          heartbeat_status: "offline" as const,
          last_seen: null,
          current_ip: null, // No current IP if no heartbeat
        };
      });

      setHeartbeats(heartbeatsData);
      setDevices(devicesWithHeartbeatStatus);
      console.log(
        "✅ Devices with heartbeat status fetched successfully:",
        devicesWithHeartbeatStatus,
      );
    } catch (error) {
      console.error("❌ Error fetching devices:", error);
      // Set empty array on error to prevent crashes
      setDevices([]);
      setHeartbeats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();

    // Auto-refresh every 30 seconds to keep heartbeat status current
    const interval = setInterval(fetchDevices, 30000);

    return () => clearInterval(interval);
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingDevice
        ? `/api/devices/${editingDevice.id}`
        : "/api/devices";
      const method = editingDevice ? "PUT" : "POST";

      const response = await authFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          installation_date: formData.installation_date || null,
          last_maintenance: formData.last_maintenance || null,
        }),
      });

      if (!response.ok) {
        let errorText = `HTTP ${response.status} ${response.statusText}`;
        try {
          const text = await response.text();
          if (text) {
            // Try to parse as JSON first, then fallback to text
            try {
              const errorData = JSON.parse(text);
              errorText = errorData.error || errorData.message || text;
            } catch {
              errorText = text;
            }
          }
        } catch (readError) {
          console.warn("Could not read response body:", readError);
        }
        console.error(`Device save failed: ${response.status} - ${errorText}`);
        console.error(
          "Request data:",
          JSON.stringify(
            {
              url: editingDevice
                ? `/api/devices/${editingDevice.id}`
                : "/api/devices",
              method: editingDevice ? "PUT" : "POST",
              formData,
            },
            null,
            2,
          ),
        );
        throw new Error(`Failed to save device: ${errorText}`);
      }

      await fetchDevices();
      setShowAddModal(false);
      setShowEditModal(false);
      setEditingDevice(null);
      setFormData({
        device_name: "",
        device_mac: "",
        device_type: "recorder",
        installation_date: "",
        last_maintenance: "",
        device_status: "active",
        notes: "",
      });
    } catch (error) {
      console.error("Error saving device:", error);

      // Show user-friendly error message
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes("IP address already exists")) {
          alert(
            "Error: The IP address you entered is already being used by another device. Please choose a different IP address.",
          );
        } else if (errorMessage.includes("MAC address already exists")) {
          alert(
            "Error: The MAC address you entered is already being used by another device. Please choose a different MAC address.",
          );
        } else {
          alert(`Error saving device: ${errorMessage}`);
        }
      }
    }
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      device_name: device.device_name,
      device_mac: device.device_mac || "",
      device_type: device.device_type,
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
      const response = await authDelete(`/api/devices/${id}`);

      if (!response.ok) throw new Error("Failed to delete device");
      await fetchDevices();
    } catch (error) {
      console.error("Error deleting device:", error);
    }
  };

  const getHeartbeatStatusIcon = (
    status: "online" | "problematic" | "offline",
  ) => {
    switch (status) {
      case "online":
        return <Wifi className="h-4 w-4 text-green-600" />;
      case "problematic":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "offline":
        return <WifiOff className="h-4 w-4 text-red-600" />;
      default:
        return <Monitor className="h-4 w-4 text-gray-600" />;
    }
  };

  const getHeartbeatStatusColor = (
    status: "online" | "problematic" | "offline",
  ) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-700";
      case "problematic":
        return "bg-yellow-100 text-yellow-700";
      case "offline":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatLastSeen = (lastSeen: string | null) => {
    if (!lastSeen) return "Never";
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
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
      <div className="px-6 py-6 pt-1" style={{ padding: "24px 24px 5px" }}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Device Management
              </h1>
              <p className="text-gray-600">
                Manage recording devices and their assignments
              </p>
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
          ) : devices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
              <Monitor className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                No devices found
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Click "Add Device" to create your first device
              </p>
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
                        <p className="text-sm text-gray-500 capitalize">
                          {device.device_type}
                        </p>
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
                    {device.current_ip && (
                      <div className="text-gray-600">
                        <strong>Current IP:</strong> {device.current_ip}
                      </div>
                    )}
                    {device.branch_name && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Building2 className="h-4 w-4" />
                        <span>
                          {device.branch_name} ({device.branch_code})
                        </span>
                      </div>
                    )}
                    {device.installation_date && (
                      <div className="text-gray-500">
                        Installed:{" "}
                        {new Date(
                          device.installation_date,
                        ).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getHeartbeatStatusIcon(
                          device.heartbeat_status || "offline",
                        )}
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${getHeartbeatStatusColor(device.heartbeat_status || "offline")}`}
                        >
                          {(device.heartbeat_status || "offline")
                            .charAt(0)
                            .toUpperCase() +
                            (device.heartbeat_status || "offline").slice(1)}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          Last seen: {formatLastSeen(device.last_seen || null)}
                        </div>
                        <div className="text-xs text-gray-400">
                          Added:{" "}
                          {new Date(device.created_on).toLocaleDateString()}
                        </div>
                      </div>
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
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">
                      Device Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.device_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          device_name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">
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
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">
                      Installation Date
                    </label>
                    <input
                      type="date"
                      value={formData.installation_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          installation_date: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">
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
      </div>
    </div>
  );
}
