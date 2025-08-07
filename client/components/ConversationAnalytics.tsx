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
  ComposedChart,
  Area,
  AreaChart,
  ScatterChart,
  Scatter,
} from "recharts";
import {
  MessageSquare,
  Users,
  Building2,
  Calendar,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { authFetch } from "@/lib/api";

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

const COLORS = {
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.success,
  COLORS.warning,
  COLORS.danger,
  COLORS.info,
  "#f97316",
  "#84cc16",
  "#06b6d4",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
];

export function ConversationAnalytics() {
  const [analytics, setAnalytics] = useState<ConversationAnalytics | null>(
    null,
  );
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
    } catch (error) {
      console.error("Error fetching conversation analytics:", error);
      setError("Failed to load conversation analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  // Process branch data for visualization - group by current month
  const processedBranchData =
    analytics?.conversationsByBranch
      .reduce(
        (acc, item) => {
          const existing = acc.find((b) => b.branch_id === item.branch_id);
          if (existing) {
            existing.count += item.count;
          } else {
            acc.push({ ...item });
          }
          return acc;
        },
        [] as Array<{
          branch_id: string;
          branch_name: string;
          count: number;
          month: string;
        }>,
      )
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
          <span className="text-gray-600">
            Loading conversation analytics...
          </span>
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
        <p className="text-gray-600">
          No conversation analytics data available
        </p>
      </div>
    );
  }

  const {
    totalStats,
    conversationsByCity,
    dailyConversationsLastMonth,
    uniqueCnicsByMonth,
  } = analytics;

  // Safe defaults to prevent undefined errors
  const safeStats = {
    totalConversations: totalStats?.totalConversations || 0,
    uniqueCustomers: totalStats?.uniqueCustomers || 0,
    activeBranches: totalStats?.activeBranches || 0,
    todayConversations: totalStats?.todayConversations || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Conversation Analytics
          </h1>
          <p className="text-gray-600">
            Customer interaction insights and metrics
          </p>
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
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total Conversations
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {safeStats.totalConversations.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Unique Customers
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {safeStats.uniqueCustomers.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Active Branches
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {safeStats.activeBranches.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {safeStats.todayConversations.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid - First Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversations by Branch */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Conversations by Branch (Top 10)
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={processedBranchData}
              margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="branch_name"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 10 }}
              />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [value, "Conversations"]}
                labelFormatter={(label) => `Branch: ${label}`}
              />
              <Bar dataKey="count" fill={COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conversations by City */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Conversations by City
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={conversationsByCity.slice(0, 10)}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="city"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 10 }}
              />
              <YAxis />
              <Tooltip
                formatter={(value: number, name, props) => [
                  `${value} conversations`,
                  `${props.payload.branch_count} branches`,
                ]}
                labelFormatter={(label) => `City: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke={COLORS.secondary}
                strokeWidth={3}
                dot={{ fill: COLORS.secondary, strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Grid - Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Conversations Last Month */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Daily Conversations (Last 30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart
              data={dailyConversationsLastMonth.reverse()}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                type="category"
              />
              <YAxis dataKey="count" type="number" />
              <Tooltip
                labelFormatter={(label) => formatDate(label)}
                formatter={(value: number) => [value, "Conversations"]}
              />
              <Scatter dataKey="count" fill={COLORS.success} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Unique CNICs by Month */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Unique Customers Per Month
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={uniqueCnicsByMonth.reverse()}
              layout="horizontal"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis
                dataKey="month"
                type="category"
                tickFormatter={formatMonth}
                width={70}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                labelFormatter={(label) => formatMonth(label)}
                formatter={(value: number) => [value, "Unique Customers"]}
              />
              <Bar dataKey="unique_cnic_count" fill={COLORS.info} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* City Details Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          City Details
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branches
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg per Branch
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {conversationsByCity.map((city, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {city.city}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {city.count.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {city.branch_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(city.count / city.branch_count).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Key Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Avg Conversations/Day</p>
            <p className="text-xl font-bold text-blue-600">
              {dailyConversationsLastMonth.length > 0
                ? (
                    dailyConversationsLastMonth.reduce(
                      (sum, day) => sum + day.count,
                      0,
                    ) / dailyConversationsLastMonth.length
                  ).toFixed(1)
                : "0"}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Peak Day</p>
            <p className="text-xl font-bold text-green-600">
              {dailyConversationsLastMonth.length > 0
                ? formatDate(
                    dailyConversationsLastMonth.reduce((max, current) =>
                      current.count > max.count ? current : max,
                    ).date,
                  )
                : "N/A"}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Top City</p>
            <p className="text-xl font-bold text-purple-600">
              {conversationsByCity.length > 0
                ? conversationsByCity[0].city
                : "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
