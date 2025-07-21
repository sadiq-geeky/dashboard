import { useState, useEffect } from "react";
import { DeviceMapping } from "@shared/api";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, Save, X, Settings, Search } from "lucide-react";

// API functions
const fetchDevices = async (search?: string): Promise<DeviceMapping[]> => {
  try {
    const url = search
      ? `/api/devices?search=${encodeURIComponent(search)}`
      : "/api/devices";
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch devices");
    return await response.json();
  } catch (error) {
    console.error("Error fetching devices:", error);
    return [];
  }
};

const createDeviceAPI = async (device: {
  ip_address: string;
  device_name: string;
}): Promise<DeviceMapping | null> => {
  try {
    const response = await fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(device),
    });

    if (!response.ok) {
      if (response.status === 409) {
        const errorData = await response.json();
        alert(errorData.error || "Device with this IP address already exists");
        return null;
      }
      throw new Error("Failed to create device");
    }
    return await response.json();
  } catch (error) {
    console.error("Error creating device:", error);
    alert("Failed to create device. Please try again.");
    return null;
  }
};

const updateDeviceAPI = async (
  id: string,
  updates: Partial<DeviceMapping>,
): Promise<boolean> => {
  try {
    const response = await fetch(`/api/devices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return response.ok;
  } catch (error) {
    console.error("Error updating device:", error);
    return false;
  }
};

const deleteDeviceAPI = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/devices/${id}`, { method: "DELETE" });
    return response.ok;
  } catch (error) {
    console.error("Error deleting device:", error);
    return false;
  }
};

export function DeviceManagement() {
  const [devices, setDevices] = useState<DeviceMapping[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newDevice, setNewDevice] = useState({
    ip_address: "",
    device_name: "",
  });

  const loadDevices = async () => {
    const deviceList = await fetchDevices(searchTerm);
    setDevices(deviceList);
  };

  useEffect(() => {
    loadDevices();
  }, [searchTerm]);

  const filteredDevices = devices.filter(
    (device) =>
      device.ip_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.device_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAdd = async () => {
    if (newDevice.ip_address && newDevice.device_name) {
      const created = await createDeviceAPI(newDevice);
      if (created) {
        setNewDevice({ ip_address: "", device_name: "" });
        setIsAdding(false);
        loadDevices(); // Reload the list
      }
    }
  };

  const handleEdit = (
    id: string,
    field: keyof DeviceMapping,
    value: string,
  ) => {
    setDevices(
      devices.map((device) =>
        device.id === id ? { ...device, [field]: value } : device,
      ),
    );
  };

  const handleDelete = async (id: string) => {
    const success = await deleteDeviceAPI(id);
    if (success) {
      loadDevices(); // Reload the list
    }
  };

  const handleSaveEdit = async () => {
    if (editingId) {
      const device = devices.find((d) => d.id === editingId);
      if (device) {
        const success = await updateDeviceAPI(editingId, {
          ip_address: device.ip_address,
          device_name: device.device_name,
        });
        if (success) {
          setEditingId(null);
          loadDevices(); // Reload the list
        }
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    loadDevices(); // Reload original data
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Device Management
          </h1>
          <p className="text-gray-600">
            Manage IP address to device name mappings
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Device</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by IP address or device name..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Device List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Device Mappings
          </h2>
        </div>

        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created On
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Add New Device Row */}
              {isAdding && (
                <tr className="bg-blue-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      placeholder="192.168.1.xxx"
                      className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={newDevice.ip_address}
                      onChange={(e) =>
                        setNewDevice({
                          ...newDevice,
                          ip_address: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      placeholder="Device Name"
                      className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={newDevice.device_name}
                      onChange={(e) =>
                        setNewDevice({
                          ...newDevice,
                          device_name: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date().toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleAdd}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setIsAdding(false);
                          setNewDevice({ ip_address: "", device_name: "" });
                        }}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Existing Devices */}
              {filteredDevices.map((device) => (
                <tr key={device.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === device.id ? (
                      <input
                        type="text"
                        className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={device.ip_address}
                        onChange={(e) =>
                          handleEdit(device.id, "ip_address", e.target.value)
                        }
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900">
                        {device.ip_address}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === device.id ? (
                      <input
                        type="text"
                        className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={device.device_name}
                        onChange={(e) =>
                          handleEdit(device.id, "device_name", e.target.value)
                        }
                      />
                    ) : (
                      <span className="text-sm text-gray-900">
                        {device.device_name}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(device.created_on).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === device.id ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleSaveEdit}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingId(device.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(device.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDevices.length === 0 && !isAdding && (
          <div className="px-6 py-12 text-center">
            <Settings className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No devices found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? "No devices match your search criteria."
                : "No device mappings have been created yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
