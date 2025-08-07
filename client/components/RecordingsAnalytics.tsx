import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { TrendingUp, Users, Clock, CheckCircle, RefreshCw } from "lucide-react";
import { authFetch } from "@/lib/api";

interface RecordingAnalytics {
  dailyRecordings: Array<{ date: string; count: number }>;
  recordingsByStatus: Array<{ status: string; count: number }>;
  recordingsByBranch: Array<{ branch_name: string; count: number }>;
  totalStats: {
    totalRecordings: number;
    completedRecordings: number;
    avgDuration: number;
    todayRecordings: number;
  };
}

const COLORS = {
  completed: "#10b981",
  in_progress: "#f59e0b",
  failed: "#ef4444",
  primary: "#3b82f6",
  secondary: "#8b5cf6",
};

const STATUS_COLORS = [COLORS.completed, COLORS.in_progress, COLORS.failed];

export function RecordingsAnalytics() {
  const [analytics, setAnalytics] = useState<RecordingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authFetch("/api/analytics/recordings");

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setError("Failed to load analytics data");
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
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
          <span className="text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  const {
    totalStats,
    dailyRecordings,
    recordingsByStatus,
    recordingsByBranch,
  } = analytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600">Recording statistics and insights</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total Recordings
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {totalStats.totalRecordings.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalStats.completedRecordings.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatDuration(totalStats.avgDuration)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalStats.todayRecordings.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Recordings Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Daily Recordings (Last 30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={dailyRecordings.reverse()}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                axisLine={true}
                tickLine={true}
                tick={true}
                mirror={false}
                reversed={false}
                type="category"
                allowDataOverflow={false}
                allowDecimals={true}
                allowDuplicatedCategory={true}
                scale="auto"
                orientation="bottom"
                interval="preserveStartEnd"
                domain={[]}
                includeHidden={false}
                hide={false}
              />
              <YAxis
                axisLine={true}
                tickLine={true}
                tick={true}
                mirror={false}
                reversed={false}
                type="number"
                scale="auto"
                orientation="left"
                domain={[]}
                includeHidden={false}
                hide={false}
                allowDataOverflow={false}
                allowDecimals={true}
                allowDuplicatedCategory={true}
              />
              <Tooltip
                labelFormatter={(label) => formatDate(label)}
                formatter={(value: number) => [value, "Recordings"]}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke={COLORS.primary}
                strokeWidth={2}
                dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recordings by Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recordings by Status
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <Pie
                data={recordingsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, percent }) =>
                  `${status}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {recordingsByStatus.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [value, "Recordings"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recordings by Branch */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recordings by Branch (Top 10)
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={recordingsByBranch}
            layout="horizontal"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              axisLine={true}
              tickLine={true}
              tick={true}
              mirror={false}
              reversed={false}
              allowDataOverflow={false}
              allowDecimals={true}
              allowDuplicatedCategory={true}
            />
            <YAxis
              dataKey="branch_name"
              type="category"
              width={150}
              tick={{ fontSize: 12 }}
              axisLine={true}
              tickLine={true}
              mirror={false}
              reversed={false}
              allowDataOverflow={false}
              allowDecimals={true}
              allowDuplicatedCategory={true}
            />
            <Tooltip formatter={(value: number) => [value, "Recordings"]} />
            <Bar dataKey="count" fill={COLORS.secondary} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Additional Insights */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Key Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Success Rate</p>
            <p className="text-xl font-bold text-green-600">
              {totalStats.totalRecordings > 0
                ? (
                    (totalStats.completedRecordings /
                      totalStats.totalRecordings) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Active Branches</p>
            <p className="text-xl font-bold text-blue-600">
              {recordingsByBranch.length}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Peak Recording Day</p>
            <p className="text-xl font-bold text-purple-600">
              {dailyRecordings.length > 0
                ? formatDate(
                    dailyRecordings.reduce((max, current) =>
                      current.count > max.count ? current : max,
                    ).date,
                  )
                : "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
