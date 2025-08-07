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
      const response = await authFetch("/api/analytics/recordings");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch analytics");
      // Set mock data for demo purposes with all required fields
      setAnalytics({
        totalRecordings: 1234,
        completedRecordings: 1156,
        failedRecordings: 45,
        inProgressRecordings: 33,
        avgDuration: 204, // seconds
        todayRecordings: 48,
        dailyRecordings: [
          { date: "2024-01-15", count: 42 },
          { date: "2024-01-16", count: 38 },
          { date: "2024-01-17", count: 55 },
          { date: "2024-01-18", count: 47 },
          { date: "2024-01-19", count: 61 },
          { date: "2024-01-20", count: 48 },
          { date: "2024-01-21", count: 52 },
        ],
        branchStats: [
          { branch_name: "Downtown Branch", total_recordings: 324 },
          { branch_name: "North Branch", total_recordings: 256 },
          { branch_name: "South Branch", total_recordings: 198 },
          { branch_name: "East Branch", total_recordings: 187 },
          { branch_name: "West Branch", total_recordings: 269 },
        ],
        statusDistribution: [
          { status: "completed", count: 1156 },
          { status: "failed", count: 45 },
          { status: "in_progress", count: 33 },
        ],
        monthlyTrends: [
          { month: "Jan", recordings: 1234, avgDuration: 204, todayRecordings: 48 },
          { month: "Dec", recordings: 1098, avgDuration: 198, todayRecordings: 42 },
          { month: "Nov", recordings: 987, avgDuration: 201, todayRecordings: 39 },
        ],
      });
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
      day: "numeric" 
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
    return <div>No analytics data available</div>;
  }

  // Prepare data for Google Charts with null checks and fallbacks
  const dailyRecordings = analytics.dailyRecordings || [];
  const branchStats = analytics.branchStats || [];
  const statusDistribution = analytics.statusDistribution || [];

  const dailyChartData = dailyRecordings.length > 0 ? [
    ["Date", "Recordings"],
    ...dailyRecordings.map(item => [
      formatDate(item.date),
      item.count
    ])
  ] : [
    ["Date", "Recordings"],
    ["No data", 0]
  ];

  const branchChartData = branchStats.length > 0 ? [
    ["Branch", "Total Recordings"],
    ...branchStats.map(item => [
      item.branch_name,
      item.total_recordings
    ])
  ] : [
    ["Branch", "Total Recordings"],
    ["No data", 0]
  ];

  const statusChartData = statusDistribution.length > 0 ? [
    ["Status", "Count"],
    ...statusDistribution.map(item => [
      item.status.charAt(0).toUpperCase() + item.status.slice(1),
      item.count
    ])
  ] : [
    ["Status", "Count"],
    ["No data", 0]
  ];

  const chartOptions = {
    backgroundColor: 'transparent',
    titleTextStyle: { color: '#374151', fontSize: 16 },
    legendTextStyle: { color: '#6B7280' },
    hAxis: { textStyle: { color: '#6B7280' } },
    vAxis: { textStyle: { color: '#6B7280' } },
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Recordings</p>
              <p className="text-2xl font-bold text-gray-900">{(analytics.totalRecordings || 0).toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Recordings</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.todayRecordings || 0}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(analytics.avgDuration || 0)}</p>
            </div>
            <Clock className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(((analytics.completedRecordings || 0) / (analytics.totalRecordings || 1)) * 100)}%
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Recordings (Last 7 Days)</h3>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recording Status Distribution</h3>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recordings by Branch</h3>
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
