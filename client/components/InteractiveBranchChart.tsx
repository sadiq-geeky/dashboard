import React, { useState, useEffect } from "react";
import { authFetch } from "@/lib/api";
import { useAuth } from "../contexts/AuthContext";
import {
  RefreshCw,
  ChevronLeft,
  BarChart3,
  Building2,
  Calendar,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface BranchMonthlyData {
  branch_id: string;
  branch_name: string;
  branch_city: string;
  month: string;
  count: number;
}

interface ChartData {
  name: string;
  conversations: number;
  branch_id?: string;
  isOthers?: boolean;
  details?: BranchMonthlyData[];
}

interface DrilldownData {
  name: string;
  conversations: number;
  month: string;
}

export function InteractiveBranchChart() {
  const { isAdmin } = useAuth();
  const [rawData, setRawData] = useState<BranchMonthlyData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [drilldownData, setDrilldownData] = useState<DrilldownData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [isDrilldown, setIsDrilldown] = useState(false);
  const [drilldownTitle, setDrilldownTitle] = useState("");

  // Get available months from data
  const getAvailableMonths = () => {
    const months = [...new Set(rawData.map((item) => item.month))]
      .sort()
      .reverse();
    return months;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authFetch(
        "/api/analytics/conversations/branch-monthly",
      );
      if (!response.ok) {
        throw new Error("Failed to fetch branch monthly data");
      }

      const data: BranchMonthlyData[] = await response.json();
      setRawData(data);

      // Set default month to the latest available
      const availableMonths = [...new Set(data.map((item) => item.month))]
        .sort()
        .reverse();
      if (availableMonths.length > 0 && !selectedMonth) {
        setSelectedMonth(availableMonths[0]);
      }
    } catch (err) {
      console.error("Error fetching branch monthly data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Process data for chart display
  const processChartData = () => {
    if (!selectedMonth || rawData.length === 0) return;

    // Filter data for selected month
    const monthData = rawData.filter((item) => item.month === selectedMonth);

    // Group by branch and sum conversations
    const branchTotals = monthData.reduce(
      (acc, item) => {
        const key = item.branch_name;
        if (!acc[key]) {
          acc[key] = {
            name: item.branch_name,
            conversations: 0,
            branch_id: item.branch_id,
            details: [],
          };
        }
        acc[key].conversations += item.count;
        acc[key].details.push(item);
        return acc;
      },
      {} as Record<string, ChartData>,
    );

    // Sort by conversations count
    const sortedBranches = Object.values(branchTotals).sort(
      (a, b) => b.conversations - a.conversations,
    );

    // Take top 20 and group others
    const top20 = sortedBranches.slice(0, 20);
    const others = sortedBranches.slice(20);

    const chartData: ChartData[] = [...top20];

    // Add "Others" group if there are more than 20 branches
    if (others.length > 0) {
      const othersTotal = others.reduce(
        (sum, branch) => sum + branch.conversations,
        0,
      );
      chartData.push({
        name: "Others",
        conversations: othersTotal,
        isOthers: true,
        details: others.flatMap((branch) => branch.details || []),
      });
    }

    setChartData(chartData);
  };

  // Handle bar click for drilldown
  const handleBarClick = (data: ChartData) => {
    if (data.isOthers) {
      // Show breakdown of "Others" branches
      const othersBreakdown = rawData
        .filter((item) => item.month === selectedMonth)
        .reduce((acc, item) => {
          const existing = acc.find((x) => x.name === item.branch_name);
          if (existing) {
            existing.conversations += item.count;
          } else {
            acc.push({
              name: item.branch_name,
              conversations: item.count,
              month: item.month,
            });
          }
          return acc;
        }, [] as DrilldownData[])
        .filter(
          (item) => !chartData.slice(0, 20).find((c) => c.name === item.name),
        )
        .sort((a, b) => b.conversations - a.conversations);

      setDrilldownData(othersBreakdown);
      setDrilldownTitle(`"Others" Branches - ${selectedMonth}`);
      setIsDrilldown(true);
    } else {
      // Show monthly breakdown for specific branch
      const branchMonthly = rawData
        .filter((item) => item.branch_name === data.name)
        .map((item) => ({
          name: item.month,
          conversations: item.count,
          month: item.month,
        }))
        .sort((a, b) => b.month.localeCompare(a.month));

      setDrilldownData(branchMonthly);
      setDrilldownTitle(`${data.name} - Monthly Breakdown`);
      setIsDrilldown(true);
    }
  };

  // Custom tooltip with enhanced design
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const isOthers = payload[0].payload?.isOthers;

      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-xl p-4 min-w-[200px]">
          <div className="flex items-center space-x-2 mb-2">
            <div
              className={`w-3 h-3 rounded-full ${isOthers ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-gradient-to-r from-blue-500 to-indigo-600"}`}
            />
            <p className="font-semibold text-gray-900 text-sm">{label}</p>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {value.toLocaleString()} conversations
            </p>
            <p className="text-xs text-gray-500 flex items-center space-x-1">
              <span>🔍</span>
              <span>Click to explore details</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    if (isAdmin()) {
      fetchData();
    }
  }, [isAdmin]);

  useEffect(() => {
    processChartData();
  }, [rawData, selectedMonth]);

  if (!isAdmin()) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-lg border border-gray-100/50 p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
              <RefreshCw className="h-6 w-6 animate-spin text-white" />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-indigo-600/20 rounded-xl blur animate-pulse"></div>
          </div>
          <span className="text-gray-600 font-medium">
            Loading branch analytics...
          </span>
          <div className="mt-3 flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-lg border border-gray-100/50 p-8">
        <div className="bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200/50 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-red-500 rounded-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-red-800">
                Failed to load analytics
              </h4>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="mt-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium shadow-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const availableMonths = getAvailableMonths();

  return (
    <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-lg border border-gray-100/50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          {isDrilldown && (
            <button
              onClick={() => setIsDrilldown(false)}
              className="p-3 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 rounded-xl transition-all duration-200 group"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
            </button>
          )}
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
            <BarChart3 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {isDrilldown ? drilldownTitle : "Conversations by Branch"}
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              {isDrilldown
                ? "Detailed breakdown view"
                : "Interactive chart showing top 20 branches + others"}
            </p>
          </div>
        </div>

        {!isDrilldown && (
          <div className="flex items-center space-x-3 bg-white/70 backdrop-blur-sm rounded-xl px-4 py-2 border border-gray-200/50">
            <Calendar className="h-4 w-4 text-indigo-500" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 cursor-pointer"
            >
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {new Date(month + "-01").toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                  })}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-96 bg-gradient-to-b from-gray-50/30 to-white/30 rounded-xl p-4 border border-gray-100/50">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={isDrilldown ? drilldownData : chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
          >
            <defs>
              <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="othersGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#d97706" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient
                id="drilldownGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="2 4"
              stroke="#e5e7eb"
              strokeOpacity={0.5}
              vertical={false}
            />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={11}
              fontWeight={500}
              interval={0}
              tick={{ fill: "#6b7280" }}
              axisLine={{ stroke: "#d1d5db", strokeWidth: 1 }}
              tickLine={{ stroke: "#d1d5db", strokeWidth: 1 }}
            />
            <YAxis
              fontSize={11}
              fontWeight={500}
              tick={{ fill: "#6b7280" }}
              axisLine={{ stroke: "#d1d5db", strokeWidth: 1 }}
              tickLine={{ stroke: "#d1d5db", strokeWidth: 1 }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(59, 130, 246, 0.05)" }}
            />
            <Bar
              dataKey="conversations"
              cursor="pointer"
              onClick={isDrilldown ? undefined : handleBarClick}
              radius={[4, 4, 0, 0]}
            >
              {(isDrilldown ? drilldownData : chartData).map((entry, index) => {
                let fillColor = "url(#primaryGradient)";
                if (isDrilldown) {
                  fillColor = "url(#drilldownGradient)";
                } else if (entry.isOthers) {
                  fillColor = "url(#othersGradient)";
                }

                return <Cell key={`cell-${index}`} fill={fillColor} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl p-4 border border-blue-100/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-blue-700">
                {isDrilldown ? "Items Shown" : "Branches Shown"}
              </span>
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-900">
            {isDrilldown ? drilldownData.length : chartData.length}
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-green-50/50 rounded-xl p-4 border border-emerald-100/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-emerald-700">
                Total Conversations
              </span>
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-900">
            {(isDrilldown ? drilldownData : chartData)
              .reduce((sum, item) => sum + item.conversations, 0)
              .toLocaleString()}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50/50 rounded-xl p-4 border border-purple-100/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-purple-700">
                Period
              </span>
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-900">
            {isDrilldown && drilldownTitle.includes("Monthly")
              ? "Last 12M"
              : selectedMonth
                ? new Date(selectedMonth + "-01").toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
          </p>
        </div>
      </div>

      {!isDrilldown && (
        <div className="mt-6 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl p-4 border border-blue-100/30">
          <div className="flex items-center space-x-2 text-sm text-blue-700">
            <span className="text-lg">💡</span>
            <span className="font-medium">Pro tip:</span>
            <span>
              Click on any bar to see detailed breakdown. "Others" shows
              remaining branches.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
