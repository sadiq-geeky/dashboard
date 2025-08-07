import React, { useState, useEffect } from "react";
import { Chart } from "react-google-charts";
import {
  MessageSquare,
  Users,
  Building2,
  TrendingUp,
  RefreshCw,
  Target,
  Percent,
  Clock,
  CheckCircle,
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
    conversion_count: number;
    total_conversations: number;
  }>;
  dailyConversationsLastMonth: Array<{
    date: string;
    conversion_count: number;
    total_conversations: number;
  }>;
  uniqueCnicsByMonth: Array<{ month: string; unique_cnic_count: number }>;
  totalStats: {
    totalConversations: number;
    uniqueCustomers: number;
    activeBranches: number;
    todayConversations: number;
  };
  // Conversion Analytics
  conversionMetrics: {
    totalConversions: number;
    conversionRate: number;
    avgConversationDuration: number;
    successfulOutcomes: number;
  };
  conversionsByBranch: Array<{
    branch_name: string;
    total_conversations: number;
    successful_conversions: number;
    conversion_rate: number;
  }>;
  conversionTrends: Array<{
    date: string;
    conversations: number;
    conversions: number;
    conversion_rate: number;
  }>;
  conversionFunnel: Array<{
    stage: string;
    count: number;
    percentage: number;
  }>;
}

export function GoogleConversationAnalytics() {
  const [analytics, setAnalytics] = useState<ConversationAnalytics | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching conversation analytics from /api/analytics/conversations");
      const response = await authFetch("/api/analytics/conversations");

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", response.status, errorText);
        throw new Error(`Failed to fetch analytics: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Received analytics data:", data);
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching conversation analytics:", error);
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
        <span className="ml-2 text-gray-600">
          Loading conversation analytics...
        </span>
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
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No conversation analytics data available</p>
          <button
            onClick={fetchAnalytics}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry Loading Data
          </button>
        </div>
      </div>
    );
  }

  // Prepare data for Google Charts with null checks and fallbacks
  const dailyConversations = analytics.dailyConversationsLastMonth || [];
  const conversationsByBranch = analytics.conversationsByBranch || [];
  const conversationsByCity = analytics.conversationsByCity || [];
  const conversionsByBranch = analytics.conversionsByBranch || [];
  const conversionTrends = analytics.conversionTrends || [];
  const conversionFunnel = analytics.conversionFunnel || [];

  // 3. Number of conversions according to date in last month
  const dailyChartData =
    dailyConversations.length > 0
      ? [
          ["Date", "Conversions", "Total Conversations"],
          ...dailyConversations.map((item) => [
            formatDate(item.date),
            item.conversion_count,
            item.total_conversations,
          ]),
        ]
      : [
          ["Date", "Conversions", "Total Conversations"],
          ["No data", 0, 0],
        ];

  // 1. Number of conversations according to branch
  const branchChartData =
    conversationsByBranch.length > 0
      ? [
          ["Branch", "Conversations"],
          ...conversationsByBranch.map((item) => [
            item.branch_name,
            item.count,
          ]),
        ]
      : [
          ["Branch", "Conversations"],
          ["No data", 0],
        ];

  // 2. Conversion number per city
  const cityChartData =
    conversationsByCity.length > 0
      ? [
          ["City", "Conversions", "Total Conversations"],
          ...conversationsByCity.map((item) => [
            item.city,
            item.conversion_count,
            item.total_conversations,
          ]),
        ]
      : [
          ["City", "Conversions", "Total Conversations"],
          ["No data", 0, 0],
        ];

  const conversionTrendsChartData =
    conversionTrends.length > 0
      ? [
          ["Date", "Conversations", "Conversions", "Conversion Rate %"],
          ...conversionTrends.map((item) => [
            formatDate(item.date),
            item.conversations,
            item.conversions,
            item.conversion_rate,
          ]),
        ]
      : [
          ["Date", "Conversations", "Conversions", "Conversion Rate %"],
          ["No data", 0, 0, 0],
        ];

  const conversionByBranchChartData =
    conversionsByBranch.length > 0
      ? [
          [
            "Branch",
            "Total Conversations",
            "Successful Conversions",
            "Conversion Rate %",
          ],
          ...conversionsByBranch.map((item) => [
            item.branch_name,
            item.total_conversations,
            item.successful_conversions,
            item.conversion_rate,
          ]),
        ]
      : [
          [
            "Branch",
            "Total Conversations",
            "Successful Conversions",
            "Conversion Rate %",
          ],
          ["No data", 0, 0, 0],
        ];

  const funnelChartData =
    conversionFunnel.length > 0
      ? [
          ["Stage", "Count"],
          ...conversionFunnel.map((item) => [item.stage, item.count]),
        ]
      : [
          ["Stage", "Count"],
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
                Total Conversations
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {(
                  analytics.totalStats?.totalConversations || 0
                ).toLocaleString()}
              </p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Unique Customers
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {(analytics.totalStats?.uniqueCustomers || 0).toLocaleString()}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Active Branches
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.totalStats?.activeBranches || 0}
              </p>
            </div>
            <Building2 className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Today's Conversations
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.totalStats?.todayConversations || 0}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Conversion Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">
                Total Conversions
              </p>
              <p className="text-2xl font-bold text-green-900">
                {(
                  analytics.conversionMetrics?.totalConversions || 0
                ).toLocaleString()}
              </p>
            </div>
            <Target className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">
                Conversion Rate
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {(analytics.conversionMetrics?.conversionRate || 0).toFixed(1)}%
              </p>
            </div>
            <Percent className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">
                Avg Duration
              </p>
              <p className="text-2xl font-bold text-purple-900">
                {Math.floor(
                  (analytics.conversionMetrics?.avgConversationDuration || 0) /
                    60,
                )}
                m{" "}
                {(analytics.conversionMetrics?.avgConversationDuration || 0) %
                  60}
                s
              </p>
            </div>
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700">
                Successful Outcomes
              </p>
              <p className="text-2xl font-bold text-amber-900">
                {(
                  analytics.conversionMetrics?.successfulOutcomes || 0
                ).toLocaleString()}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Specific Conversion Analytics as Requested */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">
          Requested Conversion Analytics
        </h2>

        {/* Charts Row 1: Branch and City Analytics */}
        <div className="grid grid-cols-2 gap-6">
          {/* 1. Number of conversations according to branch */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              1. Number of Conversations by Branch
            </h3>
            <Chart
              chartType="ColumnChart"
              width="100%"
              height="300px"
              data={branchChartData}
              options={{
                ...chartOptions,
                title: "",
                legend: { position: "none" },
                bar: { groupWidth: "75%" },
                colors: ["#3B82F6"],
              }}
            />
          </div>

          {/* 2. Conversion number per city */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              2. Conversion Number per City
            </h3>
            <Chart
              chartType="ComboChart"
              width="100%"
              height="300px"
              data={cityChartData}
              options={{
                ...chartOptions,
                title: "",
                seriesType: "columns",
                series: { 1: { type: "line" } },
                legend: { position: "top" },
                colors: ["#10B981", "#F59E0B"],
              }}
            />
          </div>
        </div>

        {/* Charts Row 2: Date and CNIC Analytics */}
        <div className="grid grid-cols-2 gap-6">
          {/* 3. Number of conversions according to date in last month */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              3. Conversions by Date (Last Month)
            </h3>
            <Chart
              chartType="ComboChart"
              width="100%"
              height="300px"
              data={dailyChartData}
              options={{
                ...chartOptions,
                title: "",
                seriesType: "columns",
                series: { 1: { type: "line" } },
                legend: { position: "top" },
                colors: ["#EF4444", "#8B5CF6"],
              }}
            />
          </div>

          {/* 4. Unique CNIC in current month */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              4. Unique CNICs This Month
            </h3>
            <div className="flex flex-col items-center justify-center h-64">
              <div className="text-center">
                <div className="text-6xl font-bold text-blue-600 mb-4">
                  {analytics.totalStats?.uniqueCustomers || 0}
                </div>
                <div className="text-lg text-gray-600 mb-2">
                  New CNICs in{" "}
                  {new Date().toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                <div className="text-sm text-gray-500">
                  Unique customer identifiers recorded this month
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Analytics Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">
          Conversion Analytics
        </h2>

        {/* Conversion Trends */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Daily Conversion Trends (Last 7 Days)
          </h3>
          <Chart
            chartType="ComboChart"
            width="100%"
            height="400px"
            data={conversionTrendsChartData}
            options={{
              ...chartOptions,
              title: "",
              seriesType: "columns",
              series: { 2: { type: "line", targetAxisIndex: 1 } },
              legend: { position: "top" },
              vAxes: {
                0: { title: "Count" },
                1: {
                  title: "Conversion Rate (%)",
                  textStyle: { color: "#3B82F6" },
                },
              },
            }}
          />
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Conversion Funnel
          </h3>
          <Chart
            chartType="ColumnChart"
            width="100%"
            height="400px"
            data={funnelChartData}
            options={{
              ...chartOptions,
              title: "",
              legend: { position: "none" },
              bar: { groupWidth: "50%" },
              colors: ["#10B981"],
              hAxis: {
                title: "Conversion Stages",
                textStyle: { fontSize: 12 },
              },
              vAxis: { title: "Count" },
            }}
          />
        </div>

        {/* Conversion by Branch */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Conversion Performance by Branch
          </h3>
          <Chart
            chartType="ComboChart"
            width="100%"
            height="400px"
            data={conversionByBranchChartData}
            options={{
              ...chartOptions,
              title: "",
              seriesType: "columns",
              series: { 2: { type: "line", targetAxisIndex: 1 } },
              legend: { position: "top" },
              vAxes: {
                0: { title: "Conversations" },
                1: {
                  title: "Conversion Rate (%)",
                  textStyle: { color: "#EF4444" },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
