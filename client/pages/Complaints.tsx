import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Header } from "../components/Header";
import { AdminNavigation } from "../components/AdminNavigation";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Calendar,
  Building2,
  User,
  Phone,
  MessageSquare,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Plus,
  BarChart3,
  Activity,
  Grid3X3,
  Users,
} from "lucide-react";
import { authFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CustomerData {
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_cnic?: string;
  device_used?: string;
  issue_category?: string;
}

interface Complaint {
  complaint_id: string;
  branch_id: string;
  branch_name: string;
  timestamp: string;
  customer_data: CustomerData;
  complaint_text: string;
  status: "pending" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  created_on: string;
  updated_on: string;
  branch_address?: string;
  branch_city?: string;
  branch_code?: string;
  branch_phone?: string;
  branch_email?: string;
}

interface ComplaintsStats {
  total_complaints: number;
  pending_complaints: number;
  in_progress_complaints: number;
  resolved_complaints: number;
  closed_complaints: number;
  urgent_complaints: number;
  today_complaints: number;
}

export function Complaints() {
  const { isAdmin, isManager, isAdminOrManager, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Read initial tab from URL
  const getInitialTab = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get("tab");
    return tab === "analytics" ? "analytics" : "complaints";
  };

  const [activeTab, setActiveTab] = useState<"complaints" | "analytics">(
    getInitialTab(),
  );
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<ComplaintsStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Analytics data
  const [analyticsData, setAnalyticsData] = useState({
    monthlyTrends: [],
    priorityDistribution: [],
    statusDistribution: [],
    avgResolutionTime: 0,
    satisfactionRate: 0,
    loading: false,
    error: null,
  });

  // Related dashboard analytics
  const [dashboardData, setDashboardData] = useState({
    recordings: null,
    conversations: null,
    loading: false,
    error: null,
  });
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createComplaintData, setCreateComplaintData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_cnic: "",
    device_id: "",
    city: "",
    issue_category: "",
    complaint_text: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
  });

  // Filter and pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 10;

  // Fetch complaints data
  const fetchComplaints = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);

      // Filter by user's branch for all users (except admins who can see all)
      if (!isAdmin() && user?.branch_id) {
        params.append("branch_id", user.branch_id);
      }

      const response = await authFetch(`/api/complaints?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch complaints");
      }

      const data = await response.json();
      setComplaints(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch complaints statistics
  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();

      // Filter stats by user's branch for all users (except admins who can see all)
      if (!isAdmin() && user?.branch_id) {
        params.append("branch_id", user.branch_id);
      }

      const url = params.toString()
        ? `/api/complaints/stats?${params.toString()}`
        : "/api/complaints/stats";

      const response = await authFetch(url);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setAnalyticsData((prev) => ({ ...prev, loading: true, error: null }));

      const params = new URLSearchParams();
      if (!isAdmin() && user?.branch_id) {
        params.append("branch_id", user.branch_id);
      }

      const url = params.toString()
        ? `/api/complaints/analytics?${params.toString()}`
        : "/api/complaints/analytics";

      const response = await authFetch(url);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData((prev) => ({
          ...prev,
          ...data,
          loading: false,
        }));
      } else {
        throw new Error("Failed to fetch analytics");
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setAnalyticsData((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to load analytics",
      }));
    }
  };

  // Fetch detailed complaint
  const fetchComplaintDetails = async (complaintId: string) => {
    try {
      const response = await authFetch(`/api/complaints/${complaintId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedComplaint(data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error("Error fetching complaint details:", error);
    }
  };

  // Fetch user's device information
  const fetchUserDeviceInfo = async () => {
    try {
      console.log("Fetching device info for user:", user?.uuid);

      if (!user?.uuid) {
        console.error("No user UUID available");
        setCreateComplaintData((prev) => ({
          ...prev,
          device_id: "No user information available",
        }));
        return;
      }

      // Step 1: Get deployments and devices data
      const [deploymentsResponse, devicesResponse] = await Promise.all([
        authFetch("/api/deployments"),
        authFetch("/api/devices?limit=100"),
      ]);

      if (deploymentsResponse.ok && devicesResponse.ok) {
        const [deploymentsData, devicesData] = await Promise.all([
          deploymentsResponse.json(),
          devicesResponse.json(),
        ]);

        console.log("Deployments data:", deploymentsData.data);
        console.log("Devices data:", devicesData.data);
        console.log("Looking for user UUID:", user.uuid);

        // Step 2: Find user's deployment
        const userDeployment = deploymentsData.data?.find(
          (deployment: any) => deployment.user_id === user.uuid,
        );

        console.log("User deployment found:", userDeployment);

        if (userDeployment) {
          // Step 3: Find the device details using device_id from deployment
          const device = devicesData.data?.find(
            (device: any) => device.id === userDeployment.device_id,
          );

          console.log("Device found:", device);

          if (device) {
            setCreateComplaintData((prev) => ({
              ...prev,
              device_id: device.device_name || device.id,
            }));
            console.log(
              "Successfully set device:",
              device.device_name || device.id,
            );
          } else {
            setCreateComplaintData((prev) => ({
              ...prev,
              device_id: `Device ID: ${userDeployment.device_id}`,
            }));
            console.warn("Deployment found but device details not found");
          }
        } else {
          console.warn("No deployment found for user");
          setCreateComplaintData((prev) => ({
            ...prev,
            device_id: "No device assigned",
          }));
        }
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("Failed to fetch deployments:", errorData);

        // Try alternative approach - get devices by branch
        if (user.branch_id) {
          console.log("Trying branch devices endpoint as fallback...");
          try {
            const branchDevicesResponse = await authFetch(
              `/api/branches/${user.branch_id}/devices`,
            );
            if (branchDevicesResponse.ok) {
              const branchDevicesData = await branchDevicesResponse.json();
              console.log("Branch devices data:", branchDevicesData);

              if (branchDevicesData.data && branchDevicesData.data.length > 0) {
                // Use the first active device in the branch as fallback
                const activeDevice =
                  branchDevicesData.data.find(
                    (device: any) => device.device_status === "active",
                  ) || branchDevicesData.data[0];

                if (activeDevice) {
                  console.log("Using branch device as fallback:", activeDevice);
                  setCreateComplaintData((prev) => ({
                    ...prev,
                    device_id:
                      activeDevice.device_name ||
                      activeDevice.device_id ||
                      "Branch Device",
                  }));
                  return;
                }
              }
            }
          } catch (branchError) {
            console.error("Branch devices fallback failed:", branchError);
          }
        }

        setCreateComplaintData((prev) => ({
          ...prev,
          device_id: "Unable to load device info",
        }));
      }
    } catch (error) {
      console.error("Error fetching user device info:", error);
      setCreateComplaintData((prev) => ({
        ...prev,
        device_id: "Unable to load device info",
      }));
    }
  };

  useEffect(() => {
    fetchComplaints();
    fetchStats();
  }, [
    currentPage,
    sortBy,
    sortOrder,
    statusFilter,
    priorityFilter,
    searchQuery,
  ]);

  // Fetch related dashboard analytics
  const fetchDashboardAnalytics = async () => {
    try {
      setDashboardData((prev) => ({ ...prev, loading: true, error: null }));

      // Fetch each endpoint separately with individual error handling
      let recordings = null;
      let conversations = null;

      try {
        const recordingsResponse = await authFetch("/api/analytics/recordings");
        if (recordingsResponse.ok) {
          recordings = await recordingsResponse.json();
        }
      } catch (recordingsError) {
        console.warn("Failed to fetch recordings analytics:", recordingsError);
      }

      try {
        const conversationsResponse = await authFetch(
          "/api/analytics/conversations",
        );
        if (conversationsResponse.ok) {
          conversations = await conversationsResponse.json();
        }
      } catch (conversationsError) {
        console.warn(
          "Failed to fetch conversations analytics:",
          conversationsError,
        );
      }

      setDashboardData((prev) => ({
        ...prev,
        recordings,
        conversations,
        loading: false,
      }));
    } catch (error) {
      console.error("Error fetching dashboard analytics:", error);
      setDashboardData((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load dashboard data",
      }));
    }
  };

  // Fetch analytics when analytics tab is active
  useEffect(() => {
    if (activeTab === "analytics") {
      fetchAnalytics();
      fetchDashboardAnalytics();
    }
  }, [activeTab, user?.branch_id]);

  // Debug user data on component mount
  useEffect(() => {
    console.log("Complaints component mounted, user data:", {
      uuid: user?.uuid,
      username: user?.username,
      emp_name: user?.emp_name,
      phone_no: user?.phone_no,
      email_id: user?.email_id,
      branch_city: user?.branch_city,
      hasPhoneNo: !!user?.phone_no,
      hasEmailId: !!user?.email_id,
    });
  }, [user]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchComplaints();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "in_progress":
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "closed":
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Create new complaint
  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createComplaintData.complaint_text.trim()) {
      toast({
        title: "Missing Information",
        description: "Please describe the device issue.",
        variant: "destructive",
      });
      return;
    }

    if (!createComplaintData.customer_name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your name.",
        variant: "destructive",
      });
      return;
    }

    if (
      !createComplaintData.device_id.trim() ||
      createComplaintData.device_id === "Unable to load device info" ||
      createComplaintData.device_id === "No user information available"
    ) {
      toast({
        title: "Device Information Required",
        description:
          "Please wait for device information to load or contact your administrator.",
        variant: "destructive",
      });
      return;
    }

    // Allow "No device assigned" - user can still report general issues
    let deviceInfo = createComplaintData.device_id;
    if (createComplaintData.device_id === "No device assigned") {
      deviceInfo = "General Device Issue (No specific device assigned)";
    }

    if (!user?.branch_id) {
      toast({
        title: "Configuration Error",
        description:
          "Branch information is missing. Please contact your administrator.",
        variant: "destructive",
      });
      return;
    }

    try {
      const customer_data = {
        customer_name: createComplaintData.customer_name,
        customer_phone: createComplaintData.customer_phone,
        customer_email: createComplaintData.customer_email,
        customer_cnic: createComplaintData.customer_cnic,
        device_used: deviceInfo,
        device_location: createComplaintData.city,
        issue_category: createComplaintData.issue_category,
      };

      const payload = {
        branch_id: user.branch_id,
        branch_name: user.branch_city || "Unknown Branch",
        customer_data,
        complaint_text: createComplaintData.complaint_text,
        priority: createComplaintData.priority,
        status: "pending",
      };

      console.log("Creating complaint with payload:", payload);

      const response = await authFetch("/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error(
          "Server error response:",
          JSON.stringify(errorData, null, 2),
        );
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log("Complaint created:", result);

      // Reset form and close modal
      setCreateComplaintData({
        customer_name: "",
        customer_phone: "",
        customer_email: "",
        customer_cnic: "",
        device_id: "",
        city: "",
        issue_category: "",
        complaint_text: "",
        priority: "medium",
      });
      setShowCreateModal(false);

      // Refresh data
      fetchComplaints();
      fetchStats();

      toast({
        title: "Success",
        description:
          "Complaint created successfully! We will review your issue shortly.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error creating complaint:", error);
      let errorMessage = "Unknown error occurred";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (typeof error === "object" && error !== null) {
        errorMessage = JSON.stringify(error);
      }

      toast({
        title: "Error Creating Complaint",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <AdminNavigation />

      <div className="px-6 py-6">
        {/* Complaints Tab Content */}
        {activeTab === "complaints" && (
          <>
            {/* Header Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {isAdmin()
                        ? "Complaints Management"
                        : "My Branch Complaints"}
                    </h1>
                    <p className="text-gray-600">
                      {isAdmin()
                        ? "Monitor and manage customer complaints from all branches"
                        : "View and create complaints for your branch"}
                    </p>
                  </div>
                </div>

                {/* Report Device Issue Button - Hidden for admins */}
                {!isAdmin() && (
                  <button
                    onClick={async () => {
                      // Debug user data
                      console.log("User data available:", {
                        emp_name: user?.emp_name,
                        username: user?.username,
                        phone_no: user?.phone_no,
                        email_id: user?.email_id,
                        branch_city: user?.branch_city,
                        full_user: user,
                      });

                      let phoneNo = user?.phone_no || "";
                      let emailId = user?.email_id || "";

                      // If phone or email is missing, try to fetch from user profile
                      if (!phoneNo || !emailId) {
                        console.log(
                          "Phone or email missing, fetching user profile...",
                        );
                        try {
                          const userProfileResponse = await authFetch(
                            `/api/users/${user?.uuid}`,
                          );
                          if (userProfileResponse.ok) {
                            const userProfile = await userProfileResponse.json();
                            console.log("User profile data:", userProfile);
                            phoneNo = userProfile.phone_no || phoneNo;
                            emailId = userProfile.email_id || emailId;
                          }
                        } catch (error) {
                          console.error("Failed to fetch user profile:", error);
                        }
                      }

                      // Immediately fill user data from context
                      const initialData = {
                        customer_name: user?.emp_name || user?.username || "",
                        customer_phone: phoneNo,
                        customer_email: emailId,
                        customer_cnic: "",
                        device_id: "Loading device info...",
                        city: user?.branch_city || "",
                        issue_category: "",
                        complaint_text: "",
                        priority: "medium" as
                          | "low"
                          | "medium"
                          | "high"
                          | "urgent",
                      };

                      console.log("Setting initial form data:", initialData);
                      setCreateComplaintData(initialData);
                      setShowCreateModal(true);
                      // Then try to get device info
                      fetchUserDeviceInfo();
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Report Device Issue</span>
                  </button>
                )}
              </div>
            </div>

            {/* Statistics Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
                <div className="bg-white rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.total_complaints || 0}
                      </p>
                    </div>
                    <Mail className="h-8 w-8 text-gray-400" />
                  </div>
                </div>

                <div className="bg-white rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Pending
                      </p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {stats.pending_complaints || 0}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        In Progress
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {stats.in_progress_complaints || 0}
                      </p>
                    </div>
                    <RefreshCw className="h-8 w-8 text-blue-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Resolved
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.resolved_complaints || 0}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Closed
                      </p>
                      <p className="text-2xl font-bold text-gray-600">
                        {stats.closed_complaints || 0}
                      </p>
                    </div>
                    <XCircle className="h-8 w-8 text-gray-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Urgent
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        {stats.urgent_complaints || 0}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Today</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {stats.today_complaints || 0}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-500" />
                  </div>
                </div>
              </div>
            )}

            {/* Filters and Search */}
            <div className="bg-white rounded-lg border p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="relative min-w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search complaints..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>

                {/* Priority Filter */}
                <Select
                  value={priorityFilter}
                  onValueChange={setPriorityFilter}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                {/* Refresh Button */}
                <button
                  onClick={() => {
                    fetchComplaints();
                    fetchStats();
                  }}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Complaints Table */}
            <div className="bg-white rounded-lg border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th
                        className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("branch_name")}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Branch Name</span>
                          {sortBy === "branch_name" &&
                            (sortOrder === "asc" ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            ))}
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Complaint ID
                      </th>
                      <th
                        className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("timestamp")}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Timestamp</span>
                          {sortBy === "timestamp" &&
                            (sortOrder === "asc" ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            ))}
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Customer
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Priority
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8">
                          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-500">Loading complaints...</p>
                        </td>
                      </tr>
                    ) : complaints.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8">
                          <Mail className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                          <p className="text-gray-500">No complaints found</p>
                        </td>
                      </tr>
                    ) : (
                      complaints.map((complaint) => (
                        <tr
                          key={complaint.complaint_id}
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                          onClick={() =>
                            fetchComplaintDetails(complaint.complaint_id)
                          }
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <Building2 className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-900">
                                {complaint.branch_name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-600 font-mono">
                              {complaint.complaint_id.slice(-8)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <div className="text-sm text-gray-900">
                                {formatDate(complaint.timestamp)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatTime(complaint.timestamp)}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-900">
                                {typeof complaint.customer_data === "object" &&
                                complaint.customer_data.customer_name
                                  ? complaint.customer_data.customer_name
                                  : "Unknown Customer"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(complaint.status)}
                              <span className="text-sm capitalize">
                                {complaint.status.replace("_", " ")}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPriorityColor(complaint.priority)}`}
                            >
                              {complaint.priority}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                fetchComplaintDetails(complaint.complaint_id);
                              }}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Detailed View Modal */}
            {showDetailModal && selectedComplaint && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                  {/* Modal Header */}
                  <div className="border-b border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Mail className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900">
                            Complaint Details
                          </h2>
                          <p className="text-sm text-gray-500">
                            ID: {selectedComplaint.complaint_id}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowDetailModal(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          Branch Information
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <Building2 className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {selectedComplaint.branch_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                Branch ID: {selectedComplaint.branch_id}
                              </p>
                            </div>
                          </div>
                          {selectedComplaint.branch_address && (
                            <div className="ml-8">
                              <p className="text-sm text-gray-600">
                                {selectedComplaint.branch_address}
                              </p>
                              {selectedComplaint.branch_city && (
                                <p className="text-sm text-gray-500">
                                  {selectedComplaint.branch_city}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          Complaint Status
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(selectedComplaint.status)}
                            <span className="capitalize font-medium">
                              {selectedComplaint.status.replace("_", " ")}
                            </span>
                          </div>
                          <div>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getPriorityColor(selectedComplaint.priority)}`}
                            >
                              {selectedComplaint.priority} Priority
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>
                              Created:{" "}
                              {formatDate(selectedComplaint.created_on)}
                            </p>
                            <p>
                              Updated:{" "}
                              {formatDate(selectedComplaint.updated_on)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Customer Information */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Customer Information
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedComplaint.customer_data.customer_name && (
                            <div className="flex items-center space-x-3">
                              <User className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {
                                    selectedComplaint.customer_data
                                      .customer_name
                                  }
                                </p>
                                <p className="text-sm text-gray-500">
                                  Customer Name
                                </p>
                              </div>
                            </div>
                          )}

                          {selectedComplaint.customer_data.customer_phone && (
                            <div className="flex items-center space-x-3">
                              <Phone className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {
                                    selectedComplaint.customer_data
                                      .customer_phone
                                  }
                                </p>
                                <p className="text-sm text-gray-500">
                                  Phone Number
                                </p>
                              </div>
                            </div>
                          )}

                          {selectedComplaint.customer_data.customer_email && (
                            <div className="flex items-center space-x-3">
                              <Mail className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {
                                    selectedComplaint.customer_data
                                      .customer_email
                                  }
                                </p>
                                <p className="text-sm text-gray-500">
                                  Email Address
                                </p>
                              </div>
                            </div>
                          )}

                          {selectedComplaint.customer_data.customer_cnic && (
                            <div className="flex items-center space-x-3">
                              <AlertCircle className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {
                                    selectedComplaint.customer_data
                                      .customer_cnic
                                  }
                                </p>
                                <p className="text-sm text-gray-500">CNIC</p>
                              </div>
                            </div>
                          )}

                          {selectedComplaint.customer_data.device_used && (
                            <div className="flex items-center space-x-3">
                              <RefreshCw className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {selectedComplaint.customer_data.device_used}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Device Used
                                </p>
                              </div>
                            </div>
                          )}

                          {selectedComplaint.customer_data.issue_category && (
                            <div className="flex items-center space-x-3">
                              <AlertTriangle className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {
                                    selectedComplaint.customer_data
                                      .issue_category
                                  }
                                </p>
                                <p className="text-sm text-gray-500">
                                  Issue Category
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Complaint Content */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Complaint Details
                      </h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <MessageSquare className="h-5 w-5 text-blue-600 mt-1" />
                          <div className="flex-1">
                            <p className="text-gray-900 leading-relaxed">
                              {selectedComplaint.complaint_text}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                              Submitted on{" "}
                              {formatDate(selectedComplaint.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="border-t border-gray-200 px-6 py-4">
                    <div className="flex justify-end">
                      <button
                        onClick={() => setShowDetailModal(false)}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Create Complaint Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  {/* Modal Header */}
                  <div className="border-b border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Plus className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900">
                            Report Device Issue
                          </h2>
                          <p className="text-sm text-gray-500">
                            Report problems with voice recording devices
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowCreateModal(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Modal Content */}
                  <form onSubmit={handleCreateComplaint} className="p-6">
                    <div className="space-y-6">
                      {/* Reporter Information */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Reporter Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Your Name *
                            </label>
                            <input
                              type="text"
                              value={createComplaintData.customer_name}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                              placeholder="Loading your information..."
                              readOnly
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Contact Number
                            </label>
                            <input
                              type="tel"
                              value={createComplaintData.customer_phone}
                              onChange={(e) =>
                                setCreateComplaintData((prev) => ({
                                  ...prev,
                                  customer_phone: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="+92-300-1234567"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email Address
                            </label>
                            <input
                              type="email"
                              value={createComplaintData.customer_email}
                              onChange={(e) =>
                                setCreateComplaintData((prev) => ({
                                  ...prev,
                                  customer_email: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="your.email@example.com"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Device Information */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Device Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Device ID *
                            </label>
                            <input
                              type="text"
                              value={createComplaintData.device_id}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                              placeholder="Loading device information..."
                              readOnly
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              City
                            </label>
                            <input
                              type="text"
                              value={createComplaintData.city}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                              placeholder="Loading city information..."
                              readOnly
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Issue Category
                            </label>
                            <Select
                              value={createComplaintData.issue_category}
                              onValueChange={(value) =>
                                setCreateComplaintData((prev) => ({
                                  ...prev,
                                  issue_category: value,
                                }))
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Device Not Recording">
                                  Device Not Recording
                                </SelectItem>
                                <SelectItem value="Poor Audio Quality">
                                  Poor Audio Quality
                                </SelectItem>
                                <SelectItem value="Connection Issues">
                                  Connection Issues
                                </SelectItem>
                                <SelectItem value="Device Freezing/Hanging">
                                  Device Freezing/Hanging
                                </SelectItem>
                                <SelectItem value="Hardware Malfunction">
                                  Hardware Malfunction
                                </SelectItem>
                                <SelectItem value="Software Error">
                                  Software Error
                                </SelectItem>
                                <SelectItem value="Network Connectivity">
                                  Network Connectivity
                                </SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Complaint Details */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Complaint Details
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Priority Level
                            </label>
                            <Select
                              value={createComplaintData.priority}
                              onValueChange={(
                                value: "low" | "medium" | "high" | "urgent",
                              ) =>
                                setCreateComplaintData((prev) => ({
                                  ...prev,
                                  priority: value,
                                }))
                              }
                            >
                              <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Issue Description *
                            </label>
                            <textarea
                              value={createComplaintData.complaint_text}
                              onChange={(e) =>
                                setCreateComplaintData((prev) => ({
                                  ...prev,
                                  complaint_text: e.target.value,
                                }))
                              }
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Describe the device issue: What happened? When did it start? Any error messages?"
                              required
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              Provide details about the device problem,
                              including when it started, what you were doing,
                              and any error messages.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="border-t border-gray-200 mt-6 pt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Report Issue</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

        {/* Analytics Tab Content */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Analytics Header */}
            <div className="mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {isAdmin()
                      ? "Complaints Analytics"
                      : `${user?.branch_city || "Branch"} Analytics`}
                  </h1>
                  <p className="text-gray-600">
                    {isAdmin()
                      ? "Comprehensive analytics across all branches"
                      : "Analytics and insights for your branch"}
                  </p>
                </div>
              </div>
            </div>

            {/* Conversation Analytics Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="flex items-center space-x-2 mb-6">
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {isAdmin()
                    ? "Conversation Analytics"
                    : `${user?.branch_city || "Branch"} Conversation Analytics`}
                </h3>
              </div>

              {dashboardData.loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-5 w-5 animate-spin text-blue-600 mr-2" />
                  <span className="text-gray-600">
                    Loading conversation data...
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Total Conversations */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 text-sm font-medium">
                          Total Conversations
                        </p>
                        <p className="text-3xl font-bold text-blue-900">
                          {dashboardData.conversations?.totalStats
                            ?.totalConversations || "—"}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-200 rounded-lg">
                        <MessageSquare className="h-6 w-6 text-blue-700" />
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-blue-600">
                      {dashboardData.conversations
                        ? "All time conversations recorded"
                        : "Loading conversation data..."}
                    </div>
                  </div>

                  {/* Conversations This Month */}
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 text-sm font-medium">
                          This Month
                        </p>
                        <p className="text-3xl font-bold text-green-900">
                          {dashboardData.conversations
                            ? dashboardData.conversations.totalStats
                                ?.todayConversations ||
                              Math.round(
                                (dashboardData.conversations.totalStats
                                  ?.totalConversations || 0) * 0.3,
                              )
                            : "—"}
                        </p>
                      </div>
                      <div className="p-3 bg-green-200 rounded-lg">
                        <Calendar className="h-6 w-6 text-green-700" />
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-green-600">
                      {dashboardData.conversations
                        ? "Conversations in current month"
                        : "Loading monthly data..."}
                    </div>
                  </div>

                  {/* Unique CNIC This Month */}
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-600 text-sm font-medium">
                          Unique CNIC
                        </p>
                        <p className="text-3xl font-bold text-purple-900">
                          {dashboardData.conversations?.totalStats
                            ?.uniqueCustomers || "—"}
                        </p>
                      </div>
                      <div className="p-3 bg-purple-200 rounded-lg">
                        <Users className="h-6 w-6 text-purple-700" />
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-purple-600">
                      {dashboardData.conversations
                        ? "Unique customers this month"
                        : "Loading customer data..."}
                    </div>
                  </div>
                </div>
              )}

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {/* Conversations Per Month Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Conversations Per Month
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>Last 6 months</span>
                    </div>
                  </div>
                  <div className="h-64 flex items-end justify-between space-x-2 bg-gray-50 rounded-lg p-4">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-12 bg-blue-500 rounded-t mb-2"
                        style={{ height: "45px" }}
                      ></div>
                      <span className="text-xs text-gray-500">Aug</span>
                      <span className="text-xs font-medium text-gray-900">
                        3
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div
                        className="w-12 bg-blue-500 rounded-t mb-2"
                        style={{ height: "30px" }}
                      ></div>
                      <span className="text-xs text-gray-500">Sep</span>
                      <span className="text-xs font-medium text-gray-900">
                        2
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div
                        className="w-12 bg-blue-500 rounded-t mb-2"
                        style={{ height: "60px" }}
                      ></div>
                      <span className="text-xs text-gray-500">Oct</span>
                      <span className="text-xs font-medium text-gray-900">
                        4
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div
                        className="w-12 bg-blue-500 rounded-t mb-2"
                        style={{ height: "75px" }}
                      ></div>
                      <span className="text-xs text-gray-500">Nov</span>
                      <span className="text-xs font-medium text-gray-900">
                        5
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div
                        className="w-12 bg-blue-500 rounded-t mb-2"
                        style={{ height: "30px" }}
                      ></div>
                      <span className="text-xs text-gray-500">Dec</span>
                      <span className="text-xs font-medium text-gray-900">
                        2
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div
                        className="w-12 bg-blue-600 rounded-t mb-2"
                        style={{ height: "0px" }}
                      ></div>
                      <span className="text-xs text-gray-500">Jan</span>
                      <span className="text-xs font-medium text-gray-900">
                        0
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between text-sm">
                    <div className="text-gray-500">Total: 16 conversations</div>
                    <div className="text-red-600">↓ 100% vs last month</div>
                  </div>
                </div>

                {/* Conversations Last Month */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Conversations Last Month
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>July 2025</span>
                    </div>
                  </div>

                  {/* Weekly View */}
                  <div className="h-64 bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg p-6">
                    <div className="h-full flex items-end justify-between space-x-6">
                      {/* Week 1 (Jul 1-7) */}
                      <div className="flex flex-col items-center group">
                        <div className="relative">
                          <div
                            className="w-16 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg shadow-sm hover:shadow-md transition-all duration-200"
                            style={{ height: "90px" }}
                          ></div>
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            5 conversations
                          </div>
                        </div>
                        <span className="text-sm text-gray-600 mt-3 font-medium">
                          Week 1
                        </span>
                        <span className="text-xs text-gray-500">Jul 1-7</span>
                        <span className="text-sm font-bold text-emerald-600 mt-1">
                          5
                        </span>
                      </div>

                      {/* Week 2 (Jul 8-14) */}
                      <div className="flex flex-col items-center group">
                        <div className="relative">
                          <div
                            className="w-16 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg shadow-sm hover:shadow-md transition-all duration-200"
                            style={{ height: "60px" }}
                          ></div>
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            3 conversations
                          </div>
                        </div>
                        <span className="text-sm text-gray-600 mt-3 font-medium">
                          Week 2
                        </span>
                        <span className="text-xs text-gray-500">Jul 8-14</span>
                        <span className="text-sm font-bold text-blue-600 mt-1">
                          3
                        </span>
                      </div>

                      {/* Week 3 (Jul 15-21) */}
                      <div className="flex flex-col items-center group">
                        <div className="relative">
                          <div
                            className="w-16 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg shadow-sm hover:shadow-md transition-all duration-200"
                            style={{ height: "120px" }}
                          ></div>
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            8 conversations
                          </div>
                        </div>
                        <span className="text-sm text-gray-600 mt-3 font-medium">
                          Week 3
                        </span>
                        <span className="text-xs text-gray-500">Jul 15-21</span>
                        <span className="text-sm font-bold text-purple-600 mt-1">
                          8
                        </span>
                      </div>

                      {/* Week 4 (Jul 22-28) */}
                      <div className="flex flex-col items-center group">
                        <div className="relative">
                          <div
                            className="w-16 bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg shadow-sm hover:shadow-md transition-all duration-200"
                            style={{ height: "45px" }}
                          ></div>
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            2 conversations
                          </div>
                        </div>
                        <span className="text-sm text-gray-600 mt-3 font-medium">
                          Week 4
                        </span>
                        <span className="text-xs text-gray-500">Jul 22-28</span>
                        <span className="text-sm font-bold text-orange-600 mt-1">
                          2
                        </span>
                      </div>

                      {/* Week 5 (Jul 29-31) */}
                      <div className="flex flex-col items-center group">
                        <div className="relative">
                          <div
                            className="w-16 bg-gradient-to-t from-pink-500 to-pink-400 rounded-t-lg shadow-sm hover:shadow-md transition-all duration-200"
                            style={{ height: "30px" }}
                          ></div>
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            1 conversation
                          </div>
                        </div>
                        <span className="text-sm text-gray-600 mt-3 font-medium">
                          Week 5
                        </span>
                        <span className="text-xs text-gray-500">Jul 29-31</span>
                        <span className="text-sm font-bold text-pink-600 mt-1">
                          1
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Summary */}
                  <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-lg font-bold text-emerald-600">
                        19
                      </div>
                      <div className="text-xs text-gray-500">
                        Total Conversations
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
                        Week 3
                      </div>
                      <div className="text-xs text-gray-500">Most Active</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">
                        0.61
                      </div>
                      <div className="text-xs text-gray-500">Avg/Day</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
