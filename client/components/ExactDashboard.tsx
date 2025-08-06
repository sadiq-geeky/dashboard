import { useState, useEffect } from "react";
import { RecordingHistory, PaginatedResponse } from "@shared/api";
import { cn } from "@/lib/utils";
import {
  Search,
  Filter,
  MoreHorizontal,
  Grid3X3,
  BarChart3,
  Calendar,
  Settings,
  Mail,
  MessageSquare,
  Bell,
  User,
  ChevronDown,
} from "lucide-react";

// Fetch recordings from API
const fetchRecordings = async (): Promise<RecordingHistory[]> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch("/api/recordings?limit=50", {
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch recordings: ${response.status} ${errorText}`,
      );
    }

    const result: PaginatedResponse<RecordingHistory> = await response.json();
    return result.data;
  } catch (error) {
    console.error("Error fetching recordings:", error);
    if (error.name === "AbortError") {
      console.error("Request timed out after 10 seconds");
    }
    return [];
  }
};

export function ExactDashboard() {
  const [recordings, setRecordings] = useState<RecordingHistory[]>([]);
  const [filteredRecordings, setFilteredRecordings] = useState<RecordingHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecording, setSelectedRecording] = useState<RecordingHistory | null>(null);

  const loadRecordings = async () => {
    try {
      const recordingData = await fetchRecordings();
      setRecordings(recordingData);
      setFilteredRecordings(recordingData);
    } catch (error) {
      console.error("Failed to load recordings:", error);
    }
  };

  useEffect(() => {
    loadRecordings();
    const interval = setInterval(loadRecordings, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = recordings.filter(recording =>
        recording.cnic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recording.device_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRecordings(filtered);
    } else {
      setFilteredRecordings(recordings);
    }
  }, [searchQuery, recordings]);

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
      {/* Top Navigation - matches the exact design */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center space-x-1">
            <button className="flex flex-col items-center p-3 text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300 bg-white">
              <Grid3X3 className="w-5 h-5 mb-1" />
              <span className="text-xs">Home</span>
            </button>
            <button className="flex flex-col items-center p-3 text-gray-500 hover:bg-gray-100 rounded-md">
              <BarChart3 className="w-5 h-5 mb-1" />
              <span className="text-xs">Device Status</span>
            </button>
            <button className="flex flex-col items-center p-3 text-gray-500 hover:bg-gray-100 rounded-md">
              <MessageSquare className="w-5 h-5 mb-1" />
              <span className="text-xs">Live Conversation</span>
            </button>
            <button className="flex flex-col items-center p-3 text-gray-500 hover:bg-gray-100 rounded-md">
              <Settings className="w-5 h-5 mb-1" />
              <span className="text-xs">Contact List</span>
            </button>
            <button className="flex flex-col items-center p-3 text-gray-500 hover:bg-gray-100 rounded-md">
              <BarChart3 className="w-5 h-5 mb-1" />
              <span className="text-xs">Analytics</span>
            </button>
            <button className="flex flex-col items-center p-3 text-gray-500 hover:bg-gray-100 rounded-md">
              <Mail className="w-5 h-5 mb-1" />
              <span className="text-xs">Complaints</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Reporting DHFG</span>
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <Bell className="w-5 h-5 text-gray-500" />
              <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                A
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-xl font-medium text-gray-900 mb-4">Devices</h1>
              
              {/* Search and Actions Bar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                    <Filter className="w-4 h-4" />
                    <span>Filter</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-md border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      S.no
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Branch No
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recording No
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Branch Address
                    </th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecordings.map((recording, index) => (
                    <tr key={recording.id} className="border-b border-gray-100 hover:bg-gray-50" onClick={() => setSelectedRecording(recording)}>
                      <td className="py-3 px-4 text-sm text-gray-900">{index + 1}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">{recording.device_name || recording.ip_address}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">{recording.cnic || recording.file_name || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {recording.start_time ? new Date(recording.start_time).toLocaleString() : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {recording.duration ? `${Math.floor(recording.duration / 60)}:${String(recording.duration % 60).padStart(2, '0')}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {recording.device_name ? `Floor Plaza, Blue Area` : recording.ip_address}
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {filteredRecordings.length} items
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <button className="w-6 h-6 flex items-center justify-center rounded text-sm text-gray-500 hover:bg-gray-100">1</button>
                    <button className="w-6 h-6 flex items-center justify-center rounded text-sm bg-blue-100 text-blue-600">2</button>
                    <button className="w-6 h-6 flex items-center justify-center rounded text-sm text-gray-500 hover:bg-gray-100">3</button>
                    <button className="w-6 h-6 flex items-center justify-center rounded text-sm text-gray-500 hover:bg-gray-100">4</button>
                  </div>
                  <span className="text-sm text-gray-500">/ 10</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200">
          <div className="p-6">
            {/* Customer Details Section */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Details</h2>
              {selectedDevice ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center text-white font-medium">
                      {selectedDevice.device_name?.charAt(0).toUpperCase() || 'D'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{selectedDevice.device_name}</div>
                      <div className="text-sm text-gray-500">Device</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-4">
                    <div>
                      <div className="text-sm text-gray-500">Status</div>
                      <div className="text-sm text-gray-900 capitalize">{selectedDevice.status}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Last Seen</div>
                      <div className="text-sm text-gray-900">{formatLastSeen(selectedDevice.last_seen)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Device ID</div>
                      <div className="text-sm text-gray-900">{selectedDevice.id}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3"></div>
                  <p className="text-sm text-gray-500">Select a device to view details</p>
                </div>
              )}
            </div>

            {/* Previous Logs Section */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Previous Logs</h2>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium text-gray-900">System Update</span>
                    <span className="text-xs text-gray-500">2h ago</span>
                  </div>
                  <p className="text-sm text-gray-600">Updated system configuration</p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium text-gray-900">Device Connection</span>
                    <span className="text-xs text-gray-500">4h ago</span>
                  </div>
                  <p className="text-sm text-gray-600">Device successfully connected</p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium text-gray-900">Health Check</span>
                    <span className="text-xs text-gray-500">6h ago</span>
                  </div>
                  <p className="text-sm text-gray-600">All systems operational</p>
                </div>
              </div>
              
              <button className="w-full mt-4 py-2 text-sm text-blue-600 hover:text-blue-700">
                View all logs →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
