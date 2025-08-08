import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Users,
  Building2,
  Calendar,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { authFetch } from "@/lib/api";
import { Chart } from "react-google-charts";

interface ConversationAnalytics {
  conversationsByBranch: Array<{
    branch_id: string;
    branch_name: string;
    count: number;
    month: string;
  }>;
  conversationsByCity: Array<{
    city: string;
    count: number;
    branch_count: number;
  }>;
  dailyConversationsLastMonth: Array<{ date: string; count: number }>;
  uniqueCnicsByMonth: Array<{ month: string; unique_cnic_count: number }>;
  totalStats: {
    totalConversations: number;
    uniqueCustomers: number;
    activeBranches: number;
    todayConversations: number;
  };
}

export function ConversationAnalytics() {
  const [analytics, setAnalytics] = useState<ConversationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authFetch("/api/analytics/conversations");

      if (!response.ok) {
        throw new Error("Failed to fetch conversation analytics");
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Error fetching conversation analytics:", err);
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Prepare Google Charts data for daily conversations
  const getDailyConversationsData = () => {
    if (!analytics?.dailyConversationsLastMonth?.length) return [["Date", "Conversations"]];
    
    const chartData = [["Date", "Conversations"]];
    analytics.dailyConversationsLastMonth.forEach((item) => {
      chartData.push([item.date, item.count]);
    });
    return chartData;
  };

  // Prepare Google Charts data for city pie chart
  const getCityData = () => {
    if (!analytics?.conversationsByCity?.length) return [["City", "Conversations"]];
    
    const chartData = [["City", "Conversations"]];
    analytics.conversationsByCity.slice(0, 8).forEach((item) => {
      chartData.push([item.city || "Unknown", item.count]);
    });
    return chartData;
  };

  // Prepare Google Charts data for branch bar chart
  const getBranchData = () => {
    if (!analytics?.conversationsByBranch?.length) return [["Branch", "Conversations"]];
    
    const chartData = [["Branch", "Conversations"]];
    analytics.conversationsByBranch.slice(0, 10).forEach((item) => {
      chartData.push([item.branch_name, item.count]);
    });
    return chartData;
  };

  // Prepare Google Charts data for unique CNICs
  const getUniqueCnicsData = () => {
    if (!analytics?.uniqueCnicsByMonth?.length) return [["Month", "Unique Customers"]];
    
    const chartData = [["Month", "Unique Customers"]];
    analytics.uniqueCnicsByMonth.forEach((item) => {
      chartData.push([item.month, item.unique_cnic_count]);
    });
    return chartData;
  };

  // Chart options
  const dailyChartOptions = {
    title: "Daily Conversations (Last 30 Days)",
    titleTextStyle: {
      fontSize: 14,
      fontName: 'system-ui',
      bold: true,
      color: '#1f2937'
    },
    backgroundColor: 'transparent',
    chartArea: {
      left: 60,
      top: 50,
      width: '85%',
      height: '70%',
    },
    hAxis: {
      title: "Date",
      titleTextStyle: { fontSize: 11, fontName: 'system-ui', color: '#6b7280' },
      textStyle: { fontSize: 9, fontName: 'system-ui', color: '#6b7280' },
    },
    vAxis: {
      title: "Conversations",
      titleTextStyle: { fontSize: 11, fontName: 'system-ui', color: '#6b7280' },
      textStyle: { fontSize: 9, fontName: 'system-ui', color: '#6b7280' },
      format: 'short',
      gridlines: { color: '#e5e7eb', count: 5 },
      minorGridlines: { color: 'transparent' }
    },
    colors: ['#3b82f6'],
    legend: { position: 'none' },
    lineWidth: 3,
    pointSize: 5,
    areaOpacity: 0.3,
    animation: { startup: true, easing: 'inAndOut', duration: 1000 },
  };

  const cityChartOptions = {
    title: "Conversations by City",
    titleTextStyle: {
      fontSize: 14,
      fontName: 'system-ui',
      bold: true,
      color: '#1f2937'
    },
    backgroundColor: 'transparent',
    chartArea: {
      left: 20,
      top: 50,
      width: '80%',
      height: '70%',
    },
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'],
    legend: {
      position: 'bottom',
      textStyle: { fontSize: 10, fontName: 'system-ui', color: '#6b7280' }
    },
    pieSliceText: 'percentage',
    pieSliceTextStyle: { fontSize: 10, fontName: 'system-ui', color: '#ffffff' },
    animation: { startup: true, easing: 'inAndOut', duration: 1000 },
  };

  const branchChartOptions = {
    title: "Top 10 Branches by Conversations",
    titleTextStyle: {
      fontSize: 14,
      fontName: 'system-ui',
      bold: true,
      color: '#1f2937'
    },
    backgroundColor: 'transparent',
    chartArea: {
      left: 100,
      top: 50,
      width: '75%',
      height: '70%',
    },
    hAxis: {
      title: "Conversations",
      titleTextStyle: { fontSize: 11, fontName: 'system-ui', color: '#6b7280' },
      textStyle: { fontSize: 9, fontName: 'system-ui', color: '#6b7280' },
      format: 'short',
      gridlines: { color: '#e5e7eb', count: 5 },
      minorGridlines: { color: 'transparent' }
    },
    vAxis: {
      title: "Branch",
      titleTextStyle: { fontSize: 11, fontName: 'system-ui', color: '#6b7280' },
      textStyle: { fontSize: 9, fontName: 'system-ui', color: '#6b7280' },
    },
    colors: ['#10b981'],
    legend: { position: 'none' },
    bar: { groupWidth: '70%' },
    animation: { startup: true, easing: 'inAndOut', duration: 1000 },
  };

  const uniqueCnicsChartOptions = {
    title: "Unique Customers per Month",
    titleTextStyle: {
      fontSize: 14,
      fontName: 'system-ui',
      bold: true,
      color: '#1f2937'
    },
    backgroundColor: 'transparent',
    chartArea: {
      left: 60,
      top: 50,
      width: '85%',
      height: '70%',
    },
    hAxis: {
      title: "Month",
      titleTextStyle: { fontSize: 11, fontName: 'system-ui', color: '#6b7280' },
      textStyle: { fontSize: 9, fontName: 'system-ui', color: '#6b7280' },
    },
    vAxis: {
      title: "Unique Customers",
      titleTextStyle: { fontSize: 11, fontName: 'system-ui', color: '#6b7280' },
      textStyle: { fontSize: 9, fontName: 'system-ui', color: '#6b7280' },
      format: 'short',
      gridlines: { color: '#e5e7eb', count: 5 },
      minorGridlines: { color: 'transparent' }
    },
    colors: ['#8b5cf6'],
    legend: { position: 'none' },
    lineWidth: 3,
    pointSize: 5,
    animation: { startup: true, easing: 'inAndOut', duration: 1000 },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading conversation analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Analytics</h3>
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
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Conversations</p>
              <p className="text-2xl font-bold text-blue-900">
                {analytics.totalStats.totalConversations.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-600 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Unique Customers</p>
              <p className="text-2xl font-bold text-green-900">
                {analytics.totalStats.uniqueCustomers.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Active Branches</p>
              <p className="text-2xl font-bold text-purple-900">
                {analytics.totalStats.activeBranches.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-600 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600">Today</p>
              <p className="text-2xl font-bold text-orange-900">
                {analytics.totalStats.todayConversations.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Conversations Area Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Conversations Trend</h3>
          <div className="h-64">
            {analytics.dailyConversationsLastMonth?.length > 0 && (
              <Chart
                chartType="AreaChart"
                width="100%"
                height="100%"
                data={getDailyConversationsData()}
                options={dailyChartOptions}
              />
            )}
          </div>
        </div>

        {/* City Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversations by City</h3>
          <div className="h-64">
            {analytics.conversationsByCity?.length > 0 && (
              <Chart
                chartType="PieChart"
                width="100%"
                height="100%"
                data={getCityData()}
                options={cityChartOptions}
              />
            )}
          </div>
        </div>

        {/* Unique CNICs Line Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Unique Customers per Month</h3>
          <div className="h-64">
            {analytics.uniqueCnicsByMonth?.length > 0 && (
              <Chart
                chartType="LineChart"
                width="100%"
                height="100%"
                data={getUniqueCnicsData()}
                options={uniqueCnicsChartOptions}
              />
            )}
          </div>
        </div>

        {/* Branches Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Branches by Conversations</h3>
          <div className="h-64">
            {analytics.conversationsByBranch?.length > 0 && (
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
    </div>
  );
}
