import { useState, useEffect } from "react";
import {
  RecordingHistory,
  PaginatedResponse,
  HeartbeatRecord,
} from "@shared/api";
import { cn } from "@/lib/utils";
import { authFetch } from "@/lib/api";
import { RecordingsAnalytics } from "./RecordingsAnalytics";
import { ConversationAnalytics } from "./ConversationAnalytics";
import { WarningSuppressionWrapper } from "./WarningSuppressionWrapper";
import { useAuth } from "../contexts/AuthContext";
import { Header } from "./Header";
import { useNavigate, useLocation } from "react-router-dom";
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
  Users,
  Plus,
  Edit2,
  Trash2,
  Building2,
} from "lucide-react";

// Fetch recordings from API with retry logic
const fetchRecordings = async (
  user: any,
  retries = 2,
): Promise<RecordingHistory[]> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    // Build query parameters with branch filtering for non-admin users
    const params = new URLSearchParams({
      limit: "50",
      user_role: user?.role || "user",
    });

    // Branch filtering is now handled by backend middleware

    const response = await authFetch(`/api/recordings?${params.toString()}`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = "Unknown error";
      }
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

    // Retry logic for development
    if (
      retries > 0 &&
      (error.name === "TypeError" || error.message?.includes("Failed to fetch"))
    ) {
      console.log(
        `Retrying recordings fetch, ${retries} attempts remaining...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return fetchRecordings(user, retries - 1);
    }

    return [];
  }
};

// Fetch heartbeats from API with retry logic
const fetchHeartbeats = async (retries = 2): Promise<HeartbeatRecord[]> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await authFetch("/api/heartbeats", {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return await response.json();
    } else {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = "Unknown error";
      }
      throw new Error(
        `Failed to fetch heartbeats: ${response.status} ${errorText}`,
      );
    }
  } catch (error) {
    console.error("Error fetching heartbeats:", error);
    if (error.name === "AbortError") {
      console.error("Request timed out after 10 seconds");
    }

    // Retry logic for development
    if (
      retries > 0 &&
      (error.name === "TypeError" || error.message?.includes("Failed to fetch"))
    ) {
      console.log(
        `Retrying heartbeats fetch, ${retries} attempts remaining...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return fetchHeartbeats(retries - 1);
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
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize activeTab based on URL parameters
  const getInitialTab = () => {
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get("tab");
    return tab || "home";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [analyticsSubTab, setAnalyticsSubTab] = useState("recordings");
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
  const itemsPerPage = 8;

  const loadRecordings = async () => {
    try {
      const recordingData = await fetchRecordings(user);
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

  // Handle URL parameter changes for tab switching
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get("tab");
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [location.search, activeTab]);

  useEffect(() => {
    loadRecordings();
    loadDevices();
    const recordingsInterval = setInterval(loadRecordings, 30000);
    const devicesInterval = setInterval(loadDevices, 30000);
    return () => {
      clearInterval(recordingsInterval);
      clearInterval(devicesInterval);
    };
  }, []);

  // Device status counts
  const onlineCount = devices.filter((d) => d.status === "online").length;
  const problematicCount = devices.filter(
    (d) => d.status === "problematic",
  ).length;
  const offlineCount = devices.filter((d) => d.status === "offline").length;

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
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;

    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks === 1) return "1 week ago";
    if (diffWeeks < 4) return `${diffWeeks} weeks ago`;

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return "1 month ago";
    if (diffMonths < 12) return `${diffMonths} months ago`;

    const diffYears = Math.floor(diffDays / 365);
    if (diffYears === 1) return "1 year ago";
    return `${diffYears} years ago`;
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
      const link = document.createElement("a");
      link.href = `/api/audio/${selectedRecording.file_name}`;
      link.download = selectedRecording.file_name;
      link.click();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Initialize audio when recording is selected
  useEffect(() => {
    if (selectedRecording?.file_name) {
      const audio = new Audio(`/api/audio/${selectedRecording.file_name}`);

      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration);
      });

      audio.addEventListener("timeupdate", () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });

      setAudioRef(audio);
      setCurrentTime(0);
      setIsPlaying(false);

      return () => {
        audio.pause();
        audio.removeEventListener("loadedmetadata", () => {});
        audio.removeEventListener("timeupdate", () => {});
        audio.removeEventListener("ended", () => {});
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
    <div className="h-screen bg-gray-50 overflow-hidden">
      <Header />

      {/* Navigation Tabs */}
      <div
        className="bg-white border-b border-gray-200"
        style={{ display: "flex", flexDirection: "column" }}
      >
        <div
          className="flex items-center justify-between h-12 px-4"
          style={{ margin: "0 auto" }}
        >
          <div className="flex items-center space-x-0.5">
            <button
              onClick={() => {
                setActiveTab("home");
                navigate("/", { replace: true });
              }}
              className={cn(
                "flex flex-col items-center p-2 rounded-md",
                activeTab === "home"
                  ? "text-gray-700 bg-white border border-gray-300"
                  : "text-gray-500 hover:bg-gray-100",
              )}
            >
              <Grid3X3 className="w-4 h-4 mb-0.5" />
              <span className="text-xs">Home</span>
            </button>
            {isAdmin() && (
              <button
                onClick={() => {
                  setActiveTab("device-status");
                  navigate("/?tab=device-status", { replace: true });
                }}
                className={cn(
                  "flex flex-col items-center p-2 rounded-md",
                  activeTab === "device-status"
                    ? "text-gray-700 bg-white border border-gray-300"
                    : "text-gray-500 hover:bg-gray-100",
                )}
              >
                <BarChart3 className="w-4 h-4 mb-0.5" />
                <span className="text-xs">Device Status</span>
              </button>
            )}
            <button className="flex flex-col items-center p-2 text-gray-500 hover:bg-gray-100 rounded-md">
              <MessageSquare className="w-4 h-4 mb-0.5" />
              <span className="text-xs">Live Conversation</span>
            </button>
            {isAdmin() && (
              <button
                onClick={() => navigate("/branch-management")}
                className="flex flex-col items-center p-3 text-gray-500 hover:bg-gray-100 rounded-md"
              >
                <Building2 className="w-4 h-4 mb-0.5" />
                <span className="text-xs">Branches</span>
              </button>
            )}
            {isAdmin() && (
              <button
                onClick={() => navigate("/device-management")}
                className="flex flex-col items-center p-3 text-gray-500 hover:bg-gray-100 rounded-md"
              >
                <Monitor className="w-4 h-4 mb-0.5" />
                <span className="text-xs">Devices</span>
              </button>
            )}
            {isAdmin() && (
              <button
                onClick={() => navigate("/deployment")}
                className="flex flex-col items-center p-3 text-gray-500 hover:bg-gray-100 rounded-md"
              >
                <Settings className="w-4 h-4 mb-0.5" />
                <span className="text-xs">Deployment</span>
              </button>
            )}
            {isAdmin() && (
              <button
                onClick={() => {
                  setActiveTab("analytics");
                  navigate("/?tab=analytics", { replace: true });
                }}
                className={cn(
                  "flex flex-col items-center p-2 rounded-md",
                  activeTab === "analytics"
                    ? "text-gray-700 bg-white border border-gray-300"
                    : "text-gray-500 hover:bg-gray-100",
                )}
              >
                <BarChart3 className="w-4 h-4 mb-0.5" />
                <span className="text-xs">Analytics</span>
              </button>
            )}
            {isAdmin() && (
              <button
                onClick={() => navigate("/user-management")}
                className="flex flex-col items-center p-3 text-gray-500 hover:bg-gray-100 rounded-md"
              >
                <Users className="w-4 h-4 mb-0.5" />
                <span className="text-xs">User Management</span>
              </button>
            )}
            <button className="flex flex-col items-center p-2 text-gray-500 hover:bg-gray-100 rounded-md">
              <Mail className="w-4 h-4 mb-0.5" />
              <span className="text-xs">Complaints</span>
            </button>
          </div>

          <div className="flex items-center space-x-4" />
        </div>
      </div>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1">
          <div className="px-4 py-3" style={{ padding: "12px 16px 3px" }}>
            {activeTab === "home" && (
              <>
                {/* Search and Filter Bar */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 w-64 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <button className="flex items-center space-x-1.5 px-2.5 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
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
                        <th className="text-left py-1.5 px-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          S.no
                        </th>
                        <th className="text-left py-1.5 px-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Branch No
                        </th>
                        <th className="text-left py-1.5 px-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          CNIC
                        </th>
                        <th className="text-left py-1.5 px-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="text-left py-1.5 px-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="text-left py-1.5 px-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Branch Address
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRecordings.map((recording, index) => (
                        <tr
                          key={recording.id}
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedRecording(recording)}
                        >
                          <td className="py-1 px-1.5 text-xs text-gray-900">
                            {startIndex + index + 1}
                          </td>
                          <td className="py-1 px-1.5 text-xs text-gray-500">
                            {recording.branch_no ||
                              recording.device_name ||
                              recording.ip_address}
                          </td>
                          <td className="py-1 px-1.5 text-xs text-gray-500">
                            {recording.cnic || recording.file_name || "-"}
                          </td>
                          <td className="py-1 px-1.5 text-xs text-gray-500">
                            {recording.start_time
                              ? new Date(recording.start_time).toLocaleString()
                              : "-"}
                          </td>
                          <td className="py-1 px-1.5 text-xs text-gray-500">
                            {recording.duration
                              ? `${Math.floor(recording.duration / 60)}:${String(recording.duration % 60).padStart(2, "0")}`
                              : "-"}
                          </td>
                          <td className="py-1 px-1.5 text-xs text-gray-500">
                            {recording.branch_address || "NA"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Footer */}
                  <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200">
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
                                  "w-5 h-5 flex items-center justify-center rounded text-xs",
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
              </>
            )}

            {activeTab === "device-status" && isAdmin() && (
              <>
                {/* Device Status Header */}
                <div className="flex items-center justify-between mb-6">
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
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
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
                        <div className="text-sm font-medium text-gray-500">
                          Online
                        </div>
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
                        <div className="text-sm font-medium text-gray-500">
                          Offline
                        </div>
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
                        <span>
                          Last updated: {lastUpdate.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Branch Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Branch Code
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
                            key={`${device.branch_code}-${device.branch_name}-${index}`}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {device.branch_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {device.branch_code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={cn(
                                  "inline-flex items-center space-x-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                                  getStatusColor(device.status),
                                )}
                              >
                                {getStatusIcon(device.status)}
                                <span className="capitalize">
                                  {device.status}
                                </span>
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
              </>
            )}

            {activeTab === "analytics" && isAdmin() && (
              <>
                {/* Analytics Sub-navigation */}
                <div className="mb-6 border-b border-gray-200">
                  <div className="flex space-x-8">
                    <button
                      onClick={() => setAnalyticsSubTab("recordings")}
                      className={cn(
                        "py-2 px-1 border-b-2 font-medium text-sm",
                        analyticsSubTab === "recordings"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                      )}
                    >
                      Recording Analytics
                    </button>
                    <button
                      onClick={() => setAnalyticsSubTab("conversations")}
                      className={cn(
                        "py-2 px-1 border-b-2 font-medium text-sm",
                        analyticsSubTab === "conversations"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                      )}
                    >
                      Conversation Analytics
                    </button>
                  </div>
                </div>

                {/* Analytics Content */}
                <WarningSuppressionWrapper>
                  {analyticsSubTab === "recordings" && <RecordingsAnalytics />}
                  {analyticsSubTab === "conversations" && (
                    <ConversationAnalytics />
                  )}
                </WarningSuppressionWrapper>
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar - Only show when a recording is selected and on home tab */}
        {selectedRecording && activeTab === "home" && (
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
                            style={{
                              width:
                                duration > 0
                                  ? `${(currentTime / duration) * 100}%`
                                  : "0%",
                            }}
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
                  <div className="space-y-3">
                    {/* Top section - Avatar and name */}
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {selectedRecording.cnic?.charAt(0).toUpperCase() || "A"}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Ahmed Shah
                        </div>
                        <div className="text-xs text-gray-500">
                          ID # 239982
                        </div>
                      </div>
                    </div>

                    {/* Details section - Two columns for better alignment */}
                    <div className="grid grid-cols-1 gap-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Gender:</span>
                        <span className="text-gray-800">Male</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">DOB:</span>
                        <span className="text-gray-800">05/09/1996</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">CNIC:</span>
                        <span className="text-gray-800">61901-1234567-1</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Phone:</span>
                        <span className="text-gray-800">0321-9876543</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Email:</span>
                        <span className="text-gray-800 break-all">Ahmed@gmail.com</span>
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
