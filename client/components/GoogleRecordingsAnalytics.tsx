import React, { useState, useEffect } from "react";
import { Chart } from "react-google-charts";
import { TrendingUp, Users, Clock, CheckCircle, RefreshCw } from "lucide-react";
import { authFetch } from "@/lib/api";

interface RecordingAnalytics {
  totalRecordings: number;
  completedRecordings: number;
  failedRecordings: number;
  inProgressRecordings: number;
  avgDuration: number;
  todayRecordings: number;
  dailyRecordings: Array<{ date: string; count: number }>;
  branchStats: Array<{ branch_name: string; total_recordings: number }>;
  statusDistribution: Array<{ status: string; count: number }>;
  monthlyTrends: Array<{
    month: string;
    recordings: number;
    avgDuration: number;
    todayRecordings: number;
  }>;
}

export function GoogleRecordingsAnalytics() {
  const [analytics, setAnalytics] = useState<RecordingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(
        "Fetching recordings analytics from /api/analytics/recordings",
      );
      const response = await authFetch("/api/analytics/recordings");

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", response.status, errorText);
        throw new Error(
          `Failed to fetch analytics: ${response.status} - ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("Received recordings analytics data:", data);
      console.log("Total recordings:", data.totalRecordings);
      console.log("Daily recordings length:", data.dailyRecordings?.length);
      console.log("Branch stats length:", data.branchStats?.length);
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching recordings analytics:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch analytics",
      );
      // Don't set mock data - leave analytics as null to show error state
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading analytics: {error}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-12 w-12 text-gray-400 mx-auto mb-2">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <p className="text-gray-600">
            No recordings analytics data available
          </p>
          {error && (
            <p className="text-red-600 text-sm mt-2 mb-2">Error: {error}</p>
          )}
          <button
            onClick={fetchAnalytics}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {loading ? "Loading..." : "Retry Loading Data"}
          </button>
        </div>
      </div>
    );
  }

  // Prepare data for Google Charts with null checks and fallbacks
  const dailyRecordings = analytics.dailyRecordings || [];
  const branchStats = analytics.branchStats || [];
  const statusDistribution = analytics.statusDistribution || [];

  // Check if all data is empty
  const hasNoData =
    dailyRecordings.length === 0 &&
    branchStats.length === 0 &&
    statusDistribution.length === 0 &&
    (!analytics.totalRecordings || analytics.totalRecordings === 0);

  if (hasNoData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-12 w-12 text-gray-400 mx-auto mb-2">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <p className="text-gray-600">No recording data found</p>
          <p className="text-gray-500 text-sm mt-1">
            There are no recordings to analyze yet.
          </p>
          <button
            onClick={fetchAnalytics}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Data
          </button>
        </div>
      </div>
    );
  }

  const dailyChartData =
    dailyRecordings.length > 0
      ? [
          ["Date", "Recordings"],
          ...dailyRecordings.map((item) => [formatDate(item.date), item.count]),
        ]
      : [
          ["Date", "Recordings"],
          ["No data", 0],
        ];

  const branchChartData =
    branchStats.length > 0
      ? [
          ["Branch", "Total Recordings"],
          ...branchStats.map((item) => [
            item.branch_name,
            item.total_recordings,
          ]),
        ]
      : [
          ["Branch", "Total Recordings"],
          ["No data", 0],
        ];

  const statusChartData =
    statusDistribution.length > 0
      ? [
          ["Status", "Count"],
          ...statusDistribution.map((item) => [
            item.status.charAt(0).toUpperCase() + item.status.slice(1),
            item.count,
          ]),
        ]
      : [
          ["Status", "Count"],
          ["No data", 0],
        ];

  const chartOptions = {
    backgroundColor: "transparent",
    titleTextStyle: { color: "#374151", fontSize: 16 },
    legendTextStyle: { color: "#6B7280" },
    hAxis: { textStyle: { color: "#6B7280" } },
    vAxis: { textStyle: { color: "#6B7280" } },
    colors: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Recordings
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {(analytics.totalRecordings || 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Today's Recordings
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.todayRecordings || 0}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatDuration(analytics.avgDuration || 0)}
              </p>
            </div>
            <Clock className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(
                  ((analytics.completedRecordings || 0) /
                    (analytics.totalRecordings || 1)) *
                    100,
                )}
                %
              </p>
            </div>
            <Users className="h-8 w-8 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Daily Recordings Line Chart */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Daily Recordings (Last 7 Days)
          </h3>
          <Chart
            chartType="LineChart"
            width="100%"
            height="300px"
            data={dailyChartData}
            options={{
              ...chartOptions,
              title: "",
              curveType: "function",
              legend: { position: "none" },
              pointSize: 5,
            }}
          />
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recording Status Distribution
          </h3>
          <Chart
            chartType="PieChart"
            width="100%"
            height="300px"
            data={statusChartData}
            options={{
              ...chartOptions,
              title: "",
              legend: { position: "right" },
              pieSliceText: "percentage",
            }}
          />
        </div>
      </div>

      {/* Branch Performance Bar Chart */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recordings by Branch
        </h3>
        <Chart
          chartType="ColumnChart"
          width="100%"
          height="400px"
          data={branchChartData}
          options={{
            ...chartOptions,
            title: "",
            legend: { position: "none" },
            bar: { groupWidth: "75%" },
          }}
        />
      </div>
    </div>
  );
}
