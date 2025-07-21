import { useState, useEffect } from "react";
import { HeartbeatRecord } from "@shared/api";
import { cn } from "@/lib/utils";
import {
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  Clock,
  Monitor,
} from "lucide-react";

// Fetch heartbeats from API
const fetchHeartbeats = async (): Promise<HeartbeatRecord[]> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch("/api/heartbeats", {
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
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
      return "text-green-600 bg-green-50";
    case "problematic":
      return "text-yellow-600 bg-yellow-50";
    case "offline":
      return "text-red-600 bg-red-50";
  }
};

const getStatusIcon = (status: HeartbeatRecord["status"]) => {
  switch (status) {
    case "online":
      return <Wifi className="h-4 w-4" />;
    case "problematic":
      return <AlertTriangle className="h-4 w-4" />;
    case "offline":
      return <WifiOff className="h-4 w-4" />;
  }
};

export function DeviceMonitoring() {
  const [devices, setDevices] = useState<HeartbeatRecord[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDevices = async () => {
    setIsRefreshing(true);
    try {
      const heartbeats = await fetchHeartbeats();
      setDevices(heartbeats);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to load devices:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDevices();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDevices, 30000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Device Monitoring
          </h1>
          <p className="text-gray-600">
            Monitor device heartbeats and connection status
          </p>
        </div>
        <button
          onClick={loadDevices}
          disabled={isRefreshing}
          className={cn(
            "flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors",
            isRefreshing && "opacity-50 cursor-not-allowed",
          )}
        >
          <RefreshCw
            className={cn("h-4 w-4", isRefreshing && "animate-spin")}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Monitor className="h-8 w-8 text-gray-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">
                Total Devices
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {devices.length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Wifi className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Online</div>
              <div className="text-2xl font-bold text-green-600">
                {onlineCount}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">
                Problematic
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {problematicCount}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <WifiOff className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Offline</div>
              <div className="text-2xl font-bold text-red-600">
                {offlineCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Device List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Device Status
            </h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Seen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {devices.map((device, index) => (
                <tr
                  key={device.device_name || `device-${index}`}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {device.device_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex items-center space-x-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {devices.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Monitor className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No devices found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No device heartbeats have been recorded yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
