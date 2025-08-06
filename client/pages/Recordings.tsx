import { useState, useEffect } from "react";
import { RecordingHistory, PaginatedResponse } from "@shared/api";
import { cn } from "@/lib/utils";
import {
  Play,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  FileVideo,
  Filter,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { AudioPlayer } from "@/components/AudioPlayer";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "../contexts/AuthContext";
import { Header } from "../components/Header";

// API function to fetch recordings
const fetchRecordings = async (
  page: number,
  limit: number,
  user: any,
  search?: string,
  device?: string,
): Promise<PaginatedResponse<RecordingHistory>> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      user_role: user?.role || 'user',
      ...(search && { search }),
      ...(device && { device }),
    });

    // Add branch filtering for non-admin users
    if (user?.branch_id && user?.role !== 'admin') {
      params.append('branch_id', user.branch_id);
    }

    const response = await fetch(`/api/recordings?${params}`);
    if (!response.ok) throw new Error("Failed to fetch recordings");

    return await response.json();
  } catch (error) {
    console.error("Error fetching recordings:", error);
    return {
      data: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }
};

// API function to fetch device names
const fetchDeviceNames = async (): Promise<string[]> => {
  try {
    const response = await fetch("/api/recordings/device-names");
    if (!response.ok) throw new Error("Failed to fetch device names");
    return await response.json();
  } catch (error) {
    console.error("Error fetching device names:", error);
    return [];
  }
};

const getStatusColor = (status: RecordingHistory["status"]) => {
  switch (status) {
    case "completed":
      return "text-green-600 bg-green-50";
    case "in_progress":
      return "text-blue-600 bg-blue-50";
    case "failed":
      return "text-red-600 bg-red-50";
  }
};

const calculateDuration = (
  startTime: string | null,
  endTime: string | null,
): number | null => {
  if (!startTime || !endTime) return null;

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

  const durationMs = end.getTime() - start.getTime();
  return Math.floor(durationMs / 1000); // Convert to seconds
};

const formatDuration = (seconds: number | null) => {
  if (seconds == null || isNaN(seconds)) return "-";

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const padded = (val: number) => val.toString().padStart(2, "0");

  if (hrs > 0) {
    return `${padded(hrs)}:${padded(mins)}:${padded(secs)}`;
  }

  return `${padded(mins)}:${padded(secs)}`;
};

export function Recordings() {
  const { user } = useAuth();
  const [recordings, setRecordings] = useState<
    PaginatedResponse<RecordingHistory>
  >({
    data: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDevice, setSelectedDevice] = useState("");
  const [deviceNames, setDeviceNames] = useState<string[]>([]);
  const [deviceOpen, setDeviceOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string>("");
  const [currentFileName, setCurrentFileName] = useState<string>("");
  const [currentRecording, setCurrentRecording] =
    useState<RecordingHistory | null>(null);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);

  const loadRecordings = async () => {
    setIsLoading(true);
    try {
      const result = await fetchRecordings(
        currentPage,
        10,
        user,
        searchTerm,
        selectedDevice,
      );
      setRecordings(result);
    } catch (error) {
      console.error("Failed to load recordings:", error);
      // Fallback to empty state
      setRecordings({
        data: [],
        total: 0,
        page: currentPage,
        limit: 10,
        totalPages: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadDeviceNames = async () => {
    try {
      const devices = await fetchDeviceNames();
      setDeviceNames(devices);
    } catch (error) {
      console.error("Failed to load device names:", error);
    }
  };

  useEffect(() => {
    loadDeviceNames();
  }, []);

  useEffect(() => {
    loadRecordings();
  }, [currentPage, searchTerm, selectedDevice]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleDeviceChange = (value: string) => {
    setSelectedDevice(value);
    setCurrentPage(1);
    setDeviceOpen(false);
  };

  const clearDeviceFilter = () => {
    setSelectedDevice("");
    setCurrentPage(1);
  };

  const handlePlay = (recording: RecordingHistory) => {
    console.log("handlePlay recording:", recording);
    console.log("duration_seconds:", recording.duration_seconds);
    if (recording.status === "completed" && recording.file_name) {
      setPlayingId(recording.id);

      // Check if it's an audio file (mp3, wav) or video
      const isAudio =
        recording.file_name.toLowerCase().includes(".mp3") ||
        recording.file_name.toLowerCase().includes(".wav");

      if (isAudio) {
        // Open advanced audio player with database metadata
        setCurrentAudioUrl(`/api/audio/${recording.file_name}`);
        setCurrentFileName(recording.file_name);
        setCurrentRecording(recording);
        setShowAudioPlayer(true);
      } else {
        // For video files, show alert (or implement video player)
        alert(
          `Playing: ${recording.file_name}\n\nIn a real implementation, this would open a video player.`,
        );
        setTimeout(() => setPlayingId(null), 2000);
      }
    }
  };

  const handleCloseAudioPlayer = () => {
    setShowAudioPlayer(false);
    setPlayingId(null);
    setCurrentAudioUrl("");
    setCurrentFileName("");
    setCurrentRecording(null);
  };

  const handleDownload = (recording: RecordingHistory) => {
    if (recording.status === "completed" && recording.file_name) {
      // In a real app, this would trigger file download
      alert(
        `Downloading: ${recording.file_name}\n\nIn a real implementation, this would start the file download.`,
      );
    }
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);

    let start = Math.max(1, currentPage - half);
    let end = Math.min(recordings.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recordings</h1>
          <p className="text-gray-600">
            View and manage recording history with playback functionality
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <FileVideo className="h-4 w-4" />
          <span>{recordings.total} total recordings</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by CNIC (e.g., 12345-6789012-3)..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
          <Popover open={deviceOpen} onOpenChange={setDeviceOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={deviceOpen}
                className="w-[200px] justify-between"
              >
                {selectedDevice || "Select device..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search devices..." />
                <CommandList>
                  <CommandEmpty>No devices found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      onSelect={clearDeviceFilter}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedDevice === "" ? "opacity-100" : "opacity-0",
                        )}
                      />
                      All devices
                    </CommandItem>
                    {deviceNames.map((device) => (
                      <CommandItem
                        key={device}
                        onSelect={() => handleDeviceChange(device)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedDevice === device
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {device}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Recordings Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Recording History
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CNIC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recordings.data.map((recording) => (
                <tr key={recording.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {recording.cnic || "-"}
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                      {recording.start_time
                        ? new Date(
                          new Date(recording.start_time).getTime() +
                          (new Date(recording.start_time).getTimezoneOffset() * 60000)
                        ).toLocaleString()
                        : "-"}
                      {" "}
                      </span>
                    </div>
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatDuration(
                          calculateDuration(
                            recording.start_time,
                            recording.end_time,
                          ),
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {recording.device_name || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                        getStatusColor(recording.status),
                      )}
                    >
                      {recording.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePlay(recording)}
                        disabled={
                          recording.status !== "completed" ||
                          playingId === recording.id
                        }
                        className={cn(
                          "text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed",
                          playingId === recording.id && "animate-pulse",
                        )}
                        title="Play recording"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(recording)}
                        disabled={recording.status !== "completed"}
                        className="text-green-600 hover:text-green-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                        title="Download recording"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="px-6 py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading recordings...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && recordings.data.length === 0 && (
          <div className="px-6 py-12 text-center">
            <FileVideo className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No recordings found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? "No recordings match your search criteria."
                : "No recordings have been made yet."}
            </p>
          </div>
        )}

        {/* Pagination */}
        {recordings.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * recordings.limit + 1} to{" "}
                {Math.min(currentPage * recordings.limit, recordings.total)} of{" "}
                {recordings.total} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>

                <div className="flex space-x-1">
                  {generatePageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "px-3 py-1 rounded",
                        page === currentPage
                          ? "bg-primary text-primary-foreground"
                          : "border border-gray-300 hover:bg-gray-50",
                      )}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage(
                      Math.min(recordings.totalPages, currentPage + 1),
                    )
                  }
                  disabled={currentPage === recordings.totalPages}
                  className="flex items-center px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Audio Player Modal */}
      {showAudioPlayer && (
        <AudioPlayer
          audioUrl={currentAudioUrl}
          fileName={currentFileName}
          onClose={handleCloseAudioPlayer}
          databaseDuration={currentRecording?.duration_seconds}
        />
      )}
        </div>
      </div>
    </div>
  );
}
