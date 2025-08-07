import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Header } from "../components/Header";
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
} from "lucide-react";
import { authFetch } from "@/lib/api";
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
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<ComplaintsStats | null>(null);
  const [loading, setLoading] = useState(true);
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
    device_used: "",
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
      const response = await authFetch("/api/complaints/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
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

  useEffect(() => {
    if (isAdminOrManager()) {
      fetchComplaints();
      fetchStats();
    }
  }, [
    currentPage,
    sortBy,
    sortOrder,
    statusFilter,
    priorityFilter,
    searchQuery,
  ]);

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
      alert("Please enter a complaint description.");
      return;
    }

    if (!createComplaintData.customer_name.trim()) {
      alert("Please enter the customer name.");
      return;
    }

    try {
      const customer_data = {
        customer_name: createComplaintData.customer_name,
        customer_phone: createComplaintData.customer_phone,
        customer_email: createComplaintData.customer_email,
        customer_cnic: createComplaintData.customer_cnic,
        device_used: createComplaintData.device_used,
        issue_category: createComplaintData.issue_category,
      };

      const payload = {
        branch_id: user?.branch_id,
        branch_name: user?.branch_city || "Unknown Branch",
        customer_data,
        complaint_text: createComplaintData.complaint_text,
        priority: createComplaintData.priority,
        status: "pending",
      };

      const response = await authFetch("/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create complaint");
      }

      const result = await response.json();
      console.log("Complaint created:", result);

      // Reset form and close modal
      setCreateComplaintData({
        customer_name: "",
        customer_phone: "",
        customer_email: "",
        customer_cnic: "",
        device_used: "",
        issue_category: "",
        complaint_text: "",
        priority: "medium",
      });
      setShowCreateModal(false);

      // Refresh data
      fetchComplaints();
      fetchStats();

      alert("Complaint created successfully!");
    } catch (error) {
      console.error("Error creating complaint:", error);
      alert("Failed to create complaint. Please try again.");
    }
  };

  if (!isAdminOrManager()) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-red-500" />
            <p className="text-gray-600">
              Access denied. Manager or Administrator privileges required.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="px-6 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isAdmin() ? "Complaints Management" : "My Branch Complaints"}
                </h1>
                <p className="text-gray-600">
                  {isAdmin()
                    ? "Monitor and manage customer complaints from all branches"
                    : "View and create complaints for your branch"}
                </p>
              </div>
            </div>

            {/* Create Complaint Button for Managers */}
            {isManager() && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Complaint</span>
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
                    {stats.total_complaints}
                  </p>
                </div>
                <Mail className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.pending_complaints}
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
                    {stats.in_progress_complaints}
                  </p>
                </div>
                <RefreshCw className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.resolved_complaints}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Closed</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {stats.closed_complaints}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-gray-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Urgent</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.urgent_complaints}
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
                    {stats.today_complaints}
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
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
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
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                          Created: {formatDate(selectedComplaint.created_on)}
                        </p>
                        <p>
                          Updated: {formatDate(selectedComplaint.updated_on)}
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
                              {selectedComplaint.customer_data.customer_name}
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
                              {selectedComplaint.customer_data.customer_phone}
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
                              {selectedComplaint.customer_data.customer_email}
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
                              {selectedComplaint.customer_data.customer_cnic}
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
                            <p className="text-sm text-gray-500">Device Used</p>
                          </div>
                        </div>
                      )}

                      {selectedComplaint.customer_data.issue_category && (
                        <div className="flex items-center space-x-3">
                          <AlertTriangle className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {selectedComplaint.customer_data.issue_category}
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
                          Submitted on {formatDate(selectedComplaint.timestamp)}
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
                        Create New Complaint
                      </h2>
                      <p className="text-sm text-gray-500">
                        Report a device issue or service complaint
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
                  {/* Customer Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Customer Name *
                        </label>
                        <input
                          type="text"
                          value={createComplaintData.customer_name}
                          onChange={(e) =>
                            setCreateComplaintData((prev) => ({
                              ...prev,
                              customer_name: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter customer name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
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
                          placeholder="customer@email.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CNIC
                        </label>
                        <input
                          type="text"
                          value={createComplaintData.customer_cnic}
                          onChange={(e) =>
                            setCreateComplaintData((prev) => ({
                              ...prev,
                              customer_cnic: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="42101-1234567-1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Device Used
                        </label>
                        <input
                          type="text"
                          value={createComplaintData.device_used}
                          onChange={(e) =>
                            setCreateComplaintData((prev) => ({
                              ...prev,
                              device_used: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Recording Device #1"
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
                            <SelectItem value="Technical Issue">
                              Technical Issue
                            </SelectItem>
                            <SelectItem value="Equipment Malfunction">
                              Equipment Malfunction
                            </SelectItem>
                            <SelectItem value="Audio Quality">
                              Audio Quality
                            </SelectItem>
                            <SelectItem value="Service Quality">
                              Service Quality
                            </SelectItem>
                            <SelectItem value="System Error">
                              System Error
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
                          Complaint Description *
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
                          placeholder="Please describe the issue in detail..."
                          required
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Provide a detailed description of the issue, including
                          when it occurred and any relevant circumstances.
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
                    <span>Create Complaint</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
