import React, { useState, useEffect } from "react";
import { TrendingUp, Users, Clock, CheckCircle, RefreshCw } from "lucide-react";
import { authFetch } from "@/lib/api";
import { Chart } from "react-google-charts";

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
        throw new Error("Failed to fetch recordings analytics");
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Error fetching recordings analytics:", err);
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Prepare Google Charts data for daily recordings
  const getDailyRecordingsData = () => {
    if (!analytics?.dailyRecordings?.length) return [["Date", "Recordings"]];

    const chartData = [["Date", "Recordings"]];
    analytics.dailyRecordings.forEach((item) => {
      chartData.push([item.date, item.count]);
    });
    return chartData;
  };

  // Prepare Google Charts data for status pie chart
  const getStatusData = () => {
    if (!analytics?.recordingsByStatus?.length) return [["Status", "Count"]];

    const chartData = [["Status", "Count"]];
    analytics.recordingsByStatus.forEach((item) => {
      chartData.push([item.status, item.count]);
    });
    return chartData;
  };

  // Prepare Google Charts data for branch bar chart
  const getBranchData = () => {
    if (!analytics?.recordingsByBranch?.length)
      return [["Branch", "Recordings"]];

    const chartData = [["Branch", "Recordings"]];
    analytics.recordingsByBranch.slice(0, 10).forEach((item) => {
      chartData.push([item.branch_name, item.count]);
    });
    return chartData;
  };

  // Chart options
  const dailyChartOptions = {
    title: "Daily Recordings Trend",
    titleTextStyle: {
      fontSize: 14,
      fontName: "system-ui",
      bold: true,
      color: "#1f2937",
    },
    backgroundColor: "transparent",
    chartArea: {
      left: 60,
      top: 50,
      width: "85%",
      height: "70%",
    },
    hAxis: {
      title: "Date",
      titleTextStyle: { fontSize: 11, fontName: "system-ui", color: "#6b7280" },
      textStyle: { fontSize: 9, fontName: "system-ui", color: "#6b7280" },
    },
    vAxis: {
      title: "Recordings",
      titleTextStyle: { fontSize: 11, fontName: "system-ui", color: "#6b7280" },
      textStyle: { fontSize: 9, fontName: "system-ui", color: "#6b7280" },
      format: "short",
      gridlines: { color: "#e5e7eb", count: 5 },
      minorGridlines: { color: "transparent" },
    },
    colors: ["#3b82f6"],
    legend: { position: "none" },
    lineWidth: 3,
    pointSize: 5,
    animation: { startup: true, easing: "inAndOut", duration: 1000 },
  };

  const statusChartOptions = {
    title: "Recordings by Status",
    titleTextStyle: {
      fontSize: 14,
      fontName: "system-ui",
      bold: true,
      color: "#1f2937",
    },
    backgroundColor: "transparent",
    chartArea: {
      left: 20,
      top: 50,
      width: "80%",
      height: "70%",
    },
    colors: ["#10b981", "#f59e0b", "#ef4444"],
    legend: {
      position: "bottom",
      textStyle: { fontSize: 10, fontName: "system-ui", color: "#6b7280" },
    },
    pieSliceText: "percentage",
    pieSliceTextStyle: {
      fontSize: 10,
      fontName: "system-ui",
      color: "#ffffff",
    },
    animation: { startup: true, easing: "inAndOut", duration: 1000 },
  };

  const branchChartOptions = {
    title: "Top 10 Branches by Recordings",
    titleTextStyle: {
      fontSize: 14,
      fontName: "system-ui",
      bold: true,
      color: "#1f2937",
    },
    backgroundColor: "transparent",
    chartArea: {
      left: 100,
      top: 50,
      width: "75%",
      height: "70%",
    },
    hAxis: {
      title: "Recordings",
      titleTextStyle: { fontSize: 11, fontName: "system-ui", color: "#6b7280" },
      textStyle: { fontSize: 9, fontName: "system-ui", color: "#6b7280" },
      format: "short",
      gridlines: { color: "#e5e7eb", count: 5 },
      minorGridlines: { color: "transparent" },
    },
    vAxis: {
      title: "Branch",
      titleTextStyle: { fontSize: 11, fontName: "system-ui", color: "#6b7280" },
      textStyle: { fontSize: 9, fontName: "system-ui", color: "#6b7280" },
    },
    colors: ["#8b5cf6"],
    legend: { position: "none" },
    bar: { groupWidth: "70%" },
    animation: { startup: true, easing: "inAndOut", duration: 1000 },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Error Loading Analytics
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-600 rounded-lg">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">
                Total Recordings
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {analytics.totalStats.totalRecordings.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-600 rounded-lg">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Completed</p>
              <p className="text-2xl font-bold text-green-900">
                {analytics.totalStats.completedRecordings.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">
                Avg Duration
              </p>
              <p className="text-2xl font-bold text-purple-900">
                {Math.round(analytics.totalStats.avgDuration)}s
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-600 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600">Today</p>
              <p className="text-2xl font-bold text-orange-900">
                {analytics.totalStats.todayRecordings.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Recordings Line Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Daily Recordings Trend
          </h3>
          <div className="h-64">
            {analytics.dailyRecordings?.length > 0 && (
              <Chart
                chartType="LineChart"
                width="100%"
                height="100%"
                data={getDailyRecordingsData()}
                options={dailyChartOptions}
              />
            )}
          </div>
        </div>

        {/* Status Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recordings by Status
          </h3>
          <div className="h-64">
            {analytics.recordingsByStatus?.length > 0 && (
              <Chart
                chartType="PieChart"
                width="100%"
                height="100%"
                data={getStatusData()}
                options={statusChartOptions}
              />
            )}
          </div>
        </div>
      </div>

      {/* Branch Bar Chart - Full Width */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top Branches by Recordings
        </h3>
        <div className="h-80">
          {analytics.recordingsByBranch?.length > 0 && (
            <Chart
              chartType="BarChart"
              width="100%"
              height="100%"
              data={getBranchData()}
              options={branchChartOptions}
            />
          )}
        </div>
      </div>
    </div>
  );
}
