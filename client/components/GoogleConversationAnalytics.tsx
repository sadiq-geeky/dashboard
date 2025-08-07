import React, { useState, useEffect } from "react";
import { Chart } from "react-google-charts";
import { MessageSquare, Users, Building2, TrendingUp, RefreshCw } from "lucide-react";
import { authFetch } from "@/lib/api";

interface ConversationAnalytics {
  totalConversations: number;
  uniqueCustomers: number;
  activeBranches: number;
  todayConversations: number;
  conversationsByBranch: Array<{ branch_name: string; conversations: number }>;
  conversationsByCity: Array<{ city: string; conversations: number }>;
  dailyConversations: Array<{ date: string; count: number }>;
  monthlyTrends: Array<{ month: string; conversations: number; customers: number }>;
}

export function GoogleConversationAnalytics() {
  const [analytics, setAnalytics] = useState<ConversationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authFetch("/api/analytics/conversations");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching conversation analytics:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch analytics");
      // Set mock data for demo purposes
      setAnalytics({
        totalConversations: 2156,
        uniqueCustomers: 1847,
        activeBranches: 12,
        todayConversations: 89,
        conversationsByBranch: [
          { branch_name: "Downtown Branch", conversations: 456 },
          { branch_name: "North Branch", conversations: 387 },
          { branch_name: "South Branch", conversations: 332 },
          { branch_name: "East Branch", conversations: 298 },
          { branch_name: "West Branch", conversations: 401 },
          { branch_name: "Central Branch", conversations: 282 },
        ],
        conversationsByCity: [
          { city: "New York", conversations: 678 },
          { city: "Los Angeles", conversations: 543 },
          { city: "Chicago", conversations: 456 },
          { city: "Houston", conversations: 324 },
          { city: "Phoenix", conversations: 155 },
        ],
        dailyConversations: [
          { date: "2024-01-15", count: 87 },
          { date: "2024-01-16", count: 92 },
          { date: "2024-01-17", count: 78 },
          { date: "2024-01-18", count: 95 },
          { date: "2024-01-19", count: 103 },
          { date: "2024-01-20", count: 89 },
          { date: "2024-01-21", count: 94 },
        ],
        monthlyTrends: [
          { month: "Jan", conversations: 2156, customers: 1847 },
          { month: "Dec", conversations: 1987, customers: 1654 },
          { month: "Nov", conversations: 1823, customers: 1532 },
          { month: "Oct", conversations: 1765, customers: 1498 },
          { month: "Sep", conversations: 1698, customers: 1421 },
          { month: "Aug", conversations: 1634, customers: 1387 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

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
        <span className="ml-2 text-gray-600">Loading conversation analytics...</span>
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
  const dailyConversations = analytics.dailyConversations || [];
  const conversationsByBranch = analytics.conversationsByBranch || [];
  const conversationsByCity = analytics.conversationsByCity || [];
  const monthlyTrends = analytics.monthlyTrends || [];

  const dailyChartData = dailyConversations.length > 0 ? [
    ["Date", "Conversations"],
    ...dailyConversations.map(item => [
      formatDate(item.date),
      item.count
    ])
  ] : [
    ["Date", "Conversations"],
    ["No data", 0]
  ];

  const branchChartData = conversationsByBranch.length > 0 ? [
    ["Branch", "Conversations"],
    ...conversationsByBranch.map(item => [
      item.branch_name,
      item.conversations
    ])
  ] : [
    ["Branch", "Conversations"],
    ["No data", 0]
  ];

  const cityChartData = conversationsByCity.length > 0 ? [
    ["City", "Conversations"],
    ...conversationsByCity.map(item => [
      item.city,
      item.conversations
    ])
  ] : [
    ["City", "Conversations"],
    ["No data", 0]
  ];

  const trendsChartData = monthlyTrends.length > 0 ? [
    ["Month", "Conversations", "Unique Customers"],
    ...monthlyTrends.map(item => [
      item.month,
      item.conversations,
      item.customers
    ])
  ] : [
    ["Month", "Conversations", "Unique Customers"],
    ["No data", 0, 0]
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
              <p className="text-sm font-medium text-gray-600">Total Conversations</p>
              <p className="text-2xl font-bold text-gray-900">{(analytics.totalConversations || 0).toLocaleString()}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unique Customers</p>
              <p className="text-2xl font-bold text-gray-900">{(analytics.uniqueCustomers || 0).toLocaleString()}</p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Branches</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.activeBranches || 0}</p>
            </div>
            <Building2 className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Conversations</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.todayConversations || 0}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Daily Conversations Line Chart */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Conversations (Last 7 Days)</h3>
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

        {/* Conversations by City Pie Chart */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversations by City</h3>
          <Chart
            chartType="PieChart"
            width="100%"
            height="300px"
            data={cityChartData}
            options={{
              ...chartOptions,
              title: "",
              legend: { position: "right" },
              pieSliceText: "percentage",
            }}
          />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6">
        {/* Conversations by Branch Bar Chart */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversations by Branch</h3>
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

      {/* Monthly Trends */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends (Last 6 Months)</h3>
        <Chart
          chartType="ComboChart"
          width="100%"
          height="400px"
          data={trendsChartData}
          options={{
            ...chartOptions,
            title: "",
            seriesType: "columns",
            series: { 1: { type: "line" } },
            legend: { position: "top" },
          }}
        />
      </div>
    </div>
  );
}
