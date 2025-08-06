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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Calculate pagination
  const totalPages = Math.ceil(filteredRecordings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRecordings = filteredRecordings.slice(startIndex, endIndex);

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
                      CNIC
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
                        NA
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
                    {[1, 2, 3, 4].map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "w-6 h-6 flex items-center justify-center rounded text-sm",
                          currentPage === page
                            ? "bg-blue-100 text-blue-600"
                            : "text-gray-500 hover:bg-gray-100"
                        )}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">/ {Math.ceil(filteredRecordings.length / itemsPerPage)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200">
          <div className="p-6">
            {/* Customer Profile Section */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Profile</h2>
              {selectedRecording ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center text-white font-medium">
                      {selectedRecording.cnic?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Ahmad Shah</div>
                      <div className="text-sm text-gray-500">ID: 3-123456</div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4">
                    <div>
                      <div className="text-sm text-gray-500">Gender - Male</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Date of Birth - 06/301986</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">CNIC - 3-1234-2345</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Phone Number - 031-5897123</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Email - ahmadshah@gmail.com</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3"></div>
                  <p className="text-sm text-gray-500">Select a recording to view customer profile</p>
                </div>
              )}
            </div>

            {/* Previous Logs Section */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Previous Logs</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs text-gray-500 border-b pb-2">
                  <span>S.no</span>
                  <span>Branch No</span>
                  <span>Date</span>
                  <span>Action</span>
                </div>

                {recordings.slice(0, 3).map((recording, index) => (
                  <div key={recording.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-900">{index + 1}</span>
                    <span className="text-gray-500">{recording.device_name || recording.ip_address}</span>
                    <span className="text-gray-500">
                      {recording.created_on ? new Date(recording.created_on).toLocaleDateString() : '-'}
                    </span>
                    <button className="text-blue-600 hover:text-blue-700 text-xs">
                      View more
                    </button>
                  </div>
                ))}
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
