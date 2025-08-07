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
    const months = [...new Set(rawData.map(item => item.month))].sort().reverse();
    return months;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authFetch("/api/analytics/conversations/branch-monthly");
      if (!response.ok) {
        throw new Error("Failed to fetch branch monthly data");
      }

      const data: BranchMonthlyData[] = await response.json();
      setRawData(data);

      // Set default month to the latest available
      const availableMonths = [...new Set(data.map(item => item.month))].sort().reverse();
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
    const monthData = rawData.filter(item => item.month === selectedMonth);

    // Group by branch and sum conversations
    const branchTotals = monthData.reduce((acc, item) => {
      const key = item.branch_name;
      if (!acc[key]) {
        acc[key] = {
          name: item.branch_name,
          conversations: 0,
          branch_id: item.branch_id,
          details: []
        };
      }
      acc[key].conversations += item.count;
      acc[key].details.push(item);
      return acc;
    }, {} as Record<string, ChartData>);

    // Sort by conversations count
    const sortedBranches = Object.values(branchTotals).sort((a, b) => b.conversations - a.conversations);

    // Take top 20 and group others
    const top20 = sortedBranches.slice(0, 20);
    const others = sortedBranches.slice(20);

    const chartData: ChartData[] = [...top20];

    // Add "Others" group if there are more than 20 branches
    if (others.length > 0) {
      const othersTotal = others.reduce((sum, branch) => sum + branch.conversations, 0);
      chartData.push({
        name: "Others",
        conversations: othersTotal,
        isOthers: true,
        details: others.flatMap(branch => branch.details || [])
      });
    }

    setChartData(chartData);
  };

  // Handle bar click for drilldown
  const handleBarClick = (data: ChartData) => {
    if (data.isOthers) {
      // Show breakdown of "Others" branches
      const othersBreakdown = rawData
        .filter(item => item.month === selectedMonth)
        .reduce((acc, item) => {
          const existing = acc.find(x => x.name === item.branch_name);
          if (existing) {
            existing.conversations += item.count;
          } else {
            acc.push({
              name: item.branch_name,
              conversations: item.count,
              month: item.month
            });
          }
          return acc;
        }, [] as DrilldownData[])
        .filter(item => !chartData.slice(0, 20).find(c => c.name === item.name))
        .sort((a, b) => b.conversations - a.conversations);

      setDrilldownData(othersBreakdown);
      setDrilldownTitle(`"Others" Branches - ${selectedMonth}`);
      setIsDrilldown(true);
    } else {
      // Show monthly breakdown for specific branch
      const branchMonthly = rawData
        .filter(item => item.branch_name === data.name)
        .map(item => ({
          name: item.month,
          conversations: item.count,
          month: item.month
        }))
        .sort((a, b) => b.month.localeCompare(a.month));

      setDrilldownData(branchMonthly);
      setDrilldownTitle(`${data.name} - Monthly Breakdown`);
      setIsDrilldown(true);
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-medium text-gray-900">{`${label}`}</p>
          <p className="text-blue-600">
            {`Conversations: ${payload[0].value.toLocaleString()}`}
          </p>
          <p className="text-xs text-gray-500 mt-1">Click to drill down</p>
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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Loading branch analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error: {error}</p>
          <button
            onClick={fetchData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const availableMonths = getAvailableMonths();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {isDrilldown && (
            <button
              onClick={() => setIsDrilldown(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
          )}
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isDrilldown ? drilldownTitle : "Conversations by Branch"}
            </h3>
            <p className="text-gray-600">
              {isDrilldown 
                ? "Detailed breakdown view" 
                : "Interactive chart showing top 20 branches + others"}
            </p>
          </div>
        </div>

        {!isDrilldown && (
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-200 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {new Date(month + '-01').toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long' 
                  })}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={isDrilldown ? drilldownData : chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
              interval={0}
            />
            <YAxis fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="conversations" 
              cursor="pointer"
              onClick={isDrilldown ? undefined : handleBarClick}
            >
              {(isDrilldown ? drilldownData : chartData).map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.isOthers ? "#f59e0b" : "#3b82f6"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {isDrilldown ? "Items Shown" : "Branches Shown"}
            </span>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {isDrilldown ? drilldownData.length : chartData.length}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Total Conversations</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {(isDrilldown ? drilldownData : chartData)
              .reduce((sum, item) => sum + item.conversations, 0)
              .toLocaleString()}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Period</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {isDrilldown && drilldownTitle.includes("Monthly") 
              ? "Last 12 Months" 
              : selectedMonth ? new Date(selectedMonth + '-01').toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long' 
                }) : "—"}
          </p>
        </div>
      </div>

      {!isDrilldown && (
        <div className="mt-4 text-xs text-gray-500">
          💡 Click on any bar to see detailed breakdown. "Others" shows remaining branches.
        </div>
      )}
    </div>
  );
}
