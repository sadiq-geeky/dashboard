import { useState, useEffect } from "react";
import { HeartbeatRecord } from "@shared/api";
import { cn } from "@/lib/utils";
import { authFetch } from "@/lib/api";
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  Clock,
  Monitor,
  Grid3X3,
  BarChart3,
  Calendar,
  Settings,
  Mail,
  Bell,
  User,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";

// Fetch heartbeats from API
const fetchHeartbeats = async (): Promise<HeartbeatRecord[]> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await authFetch("/api/heartbeats", {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch heartbeats: ${response.status} ${errorText}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching heartbeats:", error);
    if (error.name === "AbortError") {
      console.error("Request timed out after 10 seconds");
    }
    return [];
  }
};

const getStatusColor = (status: HeartbeatRecord["status"]) => {
  switch (status) {
    case "online":
      return "text-green-600 bg-green-50 border-green-200";
    case "problematic":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "offline":
      return "text-red-600 bg-red-50 border-red-200";
  }
};

const getStatusIcon = (status: HeartbeatRecord["status"]) => {
  switch (status) {
    case "online":
      return <Wifi className="h-3 w-3" />;
    case "problematic":
      return <AlertTriangle className="h-3 w-3" />;
    case "offline":
      return <WifiOff className="h-3 w-3" />;
  }
};

export function ModernDashboard() {
  const [devices, setDevices] = useState<HeartbeatRecord[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<HeartbeatRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<HeartbeatRecord | null>(
    null,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadDevices = async () => {
    setIsRefreshing(true);
    try {
      const heartbeats = await fetchHeartbeats();
      setDevices(heartbeats);
      setFilteredDevices(heartbeats);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to load devices:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDevices();
    const interval = setInterval(loadDevices, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = devices.filter((device) =>
        device.device_name?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredDevices(filtered);
    } else {
      setFilteredDevices(devices);
    }
  }, [searchQuery, devices]);

  const onlineCount = devices.filter((d) => d.status === "online").length;
  const problematicCount = devices.filter(
    (d) => d.status === "problematic",
  ).length;
  const offlineCount = devices.filter((d) => d.status === "offline").length;

  const formatLastSeen = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes === 1) return "1 minute ago";
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return "1 hour ago";
    return `${diffHours} hours ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-6">
            {/* Navigation Icons */}
            <div className="flex items-center space-x-1">
              <button className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                <Grid3X3 className="h-5 w-5" />
              </button>
              <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                <BarChart3 className="h-5 w-5" />
              </button>
              <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                <Calendar className="h-5 w-5" />
              </button>
              <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                <Settings className="h-5 w-5" />
              </button>
              <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                <Mail className="h-5 w-5" />
              </button>
              <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                <Monitor className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">Reporting DHFG</div>
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-gray-600" />
              <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Content Area */}
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                Devices
              </h1>

              {/* Search and Filter Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 w-72 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={loadDevices}
                    disabled={isRefreshing}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors",
                      isRefreshing && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <RefreshCw
                      className={cn("h-4 w-4", isRefreshing && "animate-spin")}
                    />
                    <span>Refresh</span>
                  </button>

                  <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Device Name
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Active
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDevices.map((device, index) => (
                      <tr
                        key={device.device_name || `device-${index}`}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedDevice(device)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {device.device_name || `Device ${index + 1}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={cn(
                              "inline-flex items-center space-x-1 rounded-full px-2.5 py-1 text-xs font-medium border",
                              getStatusColor(device.status),
                            )}
                          >
                            {getStatusIcon(device.status)}
                            <span className="capitalize">{device.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatLastSeen(device.last_seen)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Office Floor 2
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button className="text-gray-400 hover:text-gray-600">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-gray-400 hover:text-gray-600">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="text-gray-400 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button className="text-gray-400 hover:text-gray-600">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredDevices.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <Monitor className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No devices found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchQuery
                      ? "Try adjusting your search query."
                      : "No device heartbeats have been recorded yet."}
                  </p>
                </div>
              )}

              {/* Table Footer */}
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {filteredDevices.length} of {devices.length} devices
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>
                        Last updated: {lastUpdate.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-6">
          <div className="space-y-6">
            {/* Device Details Panel */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Device Details
              </h3>
              {selectedDevice ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center">
                        <Monitor className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {selectedDevice.device_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Device ID: {selectedDevice.id}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Status:</span>
                        <span
                          className={cn(
                            "inline-flex items-center space-x-1 rounded-full px-2 py-1 text-xs font-medium border",
                            getStatusColor(selectedDevice.status),
                          )}
                        >
                          {getStatusIcon(selectedDevice.status)}
                          <span className="capitalize">
                            {selectedDevice.status}
                          </span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">
                          Last Seen:
                        </span>
                        <span className="text-sm text-gray-900">
                          {formatLastSeen(selectedDevice.last_seen)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Location:</span>
                        <span className="text-sm text-gray-900">
                          Office Floor 2
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Monitor className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    Select a device to view details
                  </p>
                </div>
              )}
            </div>

            {/* Stats Summary */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Overview
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <Wifi className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      Online
                    </span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {onlineCount}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-900">
                      Problematic
                    </span>
                  </div>
                  <span className="text-lg font-bold text-yellow-600">
                    {problematicCount}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-2">
                    <WifiOff className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium text-red-900">
                      Offline
                    </span>
                  </div>
                  <span className="text-lg font-bold text-red-600">
                    {offlineCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                <div className="text-sm text-gray-500">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Device connected</span>
                  </div>
                  <div className="text-xs text-gray-400 ml-4">
                    2 minutes ago
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span>Performance warning</span>
                  </div>
                  <div className="text-xs text-gray-400 ml-4">
                    15 minutes ago
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span>Device disconnected</span>
                  </div>
                  <div className="text-xs text-gray-400 ml-4">1 hour ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
