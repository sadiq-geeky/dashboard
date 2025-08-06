import { useState, useEffect } from "react";
import { RecordingHistory, PaginatedResponse, HeartbeatRecord } from "@shared/api";
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
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  Shuffle,
  Download,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  Clock,
  Monitor,
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

// Fetch heartbeats from API
const fetchHeartbeats = async (): Promise<HeartbeatRecord[]> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

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

export function ExactDashboard() {
  const [activeTab, setActiveTab] = useState("home");
  const [recordings, setRecordings] = useState<RecordingHistory[]>([]);
  const [filteredRecordings, setFilteredRecordings] = useState<
    RecordingHistory[]
  >([]);
  const [devices, setDevices] = useState<HeartbeatRecord[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecording, setSelectedRecording] =
    useState<RecordingHistory | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const itemsPerPage = 5;

  const loadRecordings = async () => {
    try {
      const recordingData = await fetchRecordings();
      setRecordings(recordingData);
      setFilteredRecordings(recordingData);
    } catch (error) {
      console.error("Failed to load recordings:", error);
    }
  };

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
    loadRecordings();
    const interval = setInterval(loadRecordings, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = recordings.filter(
        (recording) =>
          recording.cnic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          recording.device_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()),
      );
      setFilteredRecordings(filtered);
    } else {
      setFilteredRecordings(recordings);
    }

    // Reset to page 1 if current page exceeds available pages
    const totalPages = Math.ceil(
      (searchQuery ? filteredRecordings.length : recordings.length) /
        itemsPerPage,
    );
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [searchQuery, recordings, currentPage, itemsPerPage]);

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

  // Audio control functions
  const playAudio = () => {
    if (audioRef && selectedRecording?.file_name) {
      audioRef.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef) {
      audioRef.pause();
      setIsPlaying(false);
    }
  };

  const resetAudio = () => {
    if (audioRef) {
      audioRef.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const skipBack = () => {
    if (audioRef) {
      audioRef.currentTime = Math.max(0, audioRef.currentTime - 10);
    }
  };

  const downloadAudio = () => {
    if (selectedRecording?.file_name) {
      const link = document.createElement('a');
      link.href = `/api/audio/${selectedRecording.file_name}`;
      link.download = selectedRecording.file_name;
      link.click();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize audio when recording is selected
  useEffect(() => {
    if (selectedRecording?.file_name) {
      const audio = new Audio(`/api/audio/${selectedRecording.file_name}`);

      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });

      setAudioRef(audio);
      setCurrentTime(0);
      setIsPlaying(false);

      return () => {
        audio.pause();
        audio.removeEventListener('loadedmetadata', () => {});
        audio.removeEventListener('timeupdate', () => {});
        audio.removeEventListener('ended', () => {});
      };
    } else {
      setAudioRef(null);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
    }
  }, [selectedRecording]);

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
            <button
              onClick={() => setActiveTab("home")}
              className={cn(
                "flex flex-col items-center p-3 rounded-md",
                activeTab === "home"
                  ? "text-gray-700 bg-white border border-gray-300"
                  : "text-gray-500 hover:bg-gray-100"
              )}
            >
              <Grid3X3 className="w-5 h-5 mb-1" />
              <span className="text-xs">Home</span>
            </button>
            <button
              onClick={() => setActiveTab("device-status")}
              className={cn(
                "flex flex-col items-center p-3 rounded-md",
                activeTab === "device-status"
                  ? "text-gray-700 bg-white border border-gray-300"
                  : "text-gray-500 hover:bg-gray-100"
              )}
            >
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
            {/* Search and Filter Bar */}
            <div className="flex items-center justify-between mb-4">
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

            {/* Table */}
            <div className="bg-white rounded-md border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      S.no
                    </th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Branch No
                    </th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CNIC
                    </th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Branch Address
                    </th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecordings.map((recording, index) => (
                    <tr
                      key={recording.id}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedRecording(recording)}
                    >
                      <td className="py-2 px-2 text-xs text-gray-900">
                        {startIndex + index + 1}
                      </td>
                      <td className="py-2 px-2 text-xs text-gray-500">
                        {recording.device_name || recording.ip_address}
                      </td>
                      <td className="py-2 px-2 text-xs text-gray-500">
                        {recording.cnic || recording.file_name || "-"}
                      </td>
                      <td className="py-2 px-2 text-xs text-gray-500">
                        {recording.start_time
                          ? new Date(recording.start_time).toLocaleString()
                          : "-"}
                      </td>
                      <td className="py-2 px-2 text-xs text-gray-500">
                        {recording.duration
                          ? `${Math.floor(recording.duration / 60)}:${String(recording.duration % 60).padStart(2, "0")}`
                          : "-"}
                      </td>
                      <td className="py-2 px-2 text-xs text-gray-500">NA</td>
                      <td className="py-2 px-2">
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
                  Showing {startIndex + 1}-
                  {Math.min(endIndex, filteredRecordings.length)} of{" "}
                  {filteredRecordings.length} items
                </div>
                <div className="flex items-center space-x-2">
                  {totalPages > 1 && (
                    <>
                      <div className="flex space-x-1">
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1,
                        ).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={cn(
                              "w-6 h-6 flex items-center justify-center rounded text-sm",
                              currentPage === page
                                ? "bg-blue-100 text-blue-600"
                                : "text-gray-500 hover:bg-gray-100",
                            )}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        / {totalPages}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Only show when a recording is selected */}
        {selectedRecording && (
          <div className="w-80 bg-white border-l border-gray-200">
            <div className="p-6">
              {/* Audio Player Section */}
              {selectedRecording && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h2 className="text-sm font-medium text-gray-900 mb-3">
                    Recording {selectedRecording.id?.slice(-5) || "43543"}
                  </h2>

                  {/* Audio Player */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                      <div className="relative">
                        <div className="w-full h-1.5 bg-gray-200 rounded-full">
                          <div
                            className="h-1.5 bg-blue-500 rounded-full"
                            style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%" }}
                          >
                            <div className="absolute right-0 top-0 w-2.5 h-2.5 bg-blue-500 rounded-full -mt-0.5 -mr-1"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Audio Controls */}
                    <div className="flex items-center justify-center space-x-2">
                      {!isPlaying ? (
                        <button
                          onClick={playAudio}
                          className="p-1 text-gray-600 hover:text-gray-800"
                          disabled={!selectedRecording?.file_name}
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={pauseAudio}
                          className="p-1 text-gray-600 hover:text-gray-800"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={resetAudio}
                        className="p-1 text-gray-600 hover:text-gray-800"
                        disabled={!selectedRecording?.file_name}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={skipBack}
                        className="p-1 text-gray-600 hover:text-gray-800"
                        disabled={!selectedRecording?.file_name}
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>
                      <button
                        onClick={downloadAudio}
                        className="p-1 text-gray-600 hover:text-gray-800"
                        disabled={!selectedRecording?.file_name}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Profile Section - Compact */}
              <div className="mb-6 pb-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-gray-700">
                    Customer Profile
                  </h2>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
                {selectedRecording ? (
                  <div className="flex space-x-4">
                    {/* Left side - Avatar and basic info */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-20 bg-white rounded border border-gray-200 p-2 flex flex-col items-center justify-center">
                        <div className="w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center text-white font-medium text-sm mb-1">
                          {selectedRecording.cnic?.charAt(0).toUpperCase() || "A"}
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-medium text-gray-900">
                            Ahmed Shah
                          </div>
                          <div className="text-xs text-gray-500">ID # 239982</div>
                        </div>
                      </div>
                    </div>

                    {/* Right side - Compact details */}
                    <div className="flex-1 space-y-1 text-xs">
                      <div className="flex">
                        <span className="text-gray-600 w-20">Gender :</span>
                        <span className="text-gray-800">Male</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-20">Date of Birth :</span>
                        <span className="text-gray-800">05/09/1996</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-20">CNIC :</span>
                        <span className="text-gray-800">61901-1234567-1</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-20">Phone Number :</span>
                        <span className="text-gray-800">0321-9876543</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-20">Email ID :</span>
                        <span className="text-gray-800">Ahmed@gmail.com</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2"></div>
                    <p className="text-xs text-gray-500">
                      Select a recording to view customer profile
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
