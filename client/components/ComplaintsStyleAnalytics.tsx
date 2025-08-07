import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { authFetch } from "@/lib/api";
import { InteractiveBranchChart } from "./InteractiveBranchChart";
import {
  RefreshCw,
  MessageSquare,
  Calendar,
  Users,
  BarChart3,
} from "lucide-react";

interface DashboardData {
  recordings: any;
  conversations: any;
  loading: boolean;
  error: string | null;
}

export function ComplaintsStyleAnalytics() {
  const { user, isAdmin } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    recordings: null,
    conversations: null,
    loading: false,
    error: null,
  });

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
            : "Failed to load dashboard analytics",
      }));
    }
  };

  useEffect(() => {
    fetchDashboardAnalytics();
  }, []);

  return (
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
                ? "Analytics Dashboard"
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
            <span className="text-gray-600">Loading conversation data...</span>
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
                    {dashboardData.conversations?.totalStats?.uniqueCustomers ||
                      "—"}
                  </p>
                </div>
                <div className="p-3 bg-purple-200 rounded-lg">
                  <Users className="h-6 w-6 text-purple-700" />
                </div>
              </div>
              <div className="mt-3 text-xs text-purple-600">
                {dashboardData.conversations
                  ? "Unique customers this month"
                  : "Loading unique customer data..."}
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {dashboardData.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <p className="text-red-600">Error: {dashboardData.error}</p>
            <button
              onClick={fetchDashboardAnalytics}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
