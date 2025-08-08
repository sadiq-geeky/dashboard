import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { authFetch } from "@/lib/api";
import { RefreshCw, Mic, Calendar, TrendingUp, BarChart3 } from "lucide-react";
import { Chart } from "react-google-charts";

interface MonthlyVoiceStreamData {
  month: string;
  voice_streams: number;
  formatted_month: string;
}

interface DailyVoiceStreamData {
  date: string;
  voice_streams: number;
  formatted_date: string;
}

interface VoiceStreamStats {
  total_streams: number;
  current_month_streams: number;
  previous_month_streams: number;
  monthly_data: MonthlyVoiceStreamData[];
  daily_current_month: DailyVoiceStreamData[];
}

export function BranchVoiceStreamsAnalytics() {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState<VoiceStreamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVoiceStreamData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authFetch("/api/analytics/voice-streams");
      if (!response.ok) {
        let errorMessage = "Failed to fetch voice stream data";
        try {
          const errorResponse = await response.json();
          errorMessage = errorResponse.error || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Error fetching voice stream data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin()) {
      fetchVoiceStreamData();
    }
  }, [isAdmin]);

  // Prepare Google Charts data for monthly chart
  const getMonthlyChartData = () => {
    if (!data?.monthly_data?.length) return [["Month", "Voice Streams"]];
    
    const chartData = [["Month", "Voice Streams"]];
    data.monthly_data.forEach((item) => {
      chartData.push([item.formatted_month, item.voice_streams]);
    });
    return chartData;
  };

  // Prepare Google Charts data for daily chart
  const getDailyChartData = () => {
    if (!data?.daily_current_month?.length) return [["Date", "Voice Streams"]];
    
    const chartData = [["Date", "Voice Streams"]];
    data.daily_current_month.forEach((item) => {
      chartData.push([item.formatted_date, item.voice_streams]);
    });
    return chartData;
  };

  // Chart options for monthly area chart
  const monthlyChartOptions = {
    title: "Voice Streams per Month",
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
      titleTextStyle: {
        fontSize: 11,
        fontName: 'system-ui',
        color: '#6b7280'
      },
      textStyle: {
        fontSize: 9,
        fontName: 'system-ui',
        color: '#6b7280'
      },
    },
    vAxis: {
      title: "Voice Streams",
      titleTextStyle: {
        fontSize: 11,
        fontName: 'system-ui',
        color: '#6b7280'
      },
      textStyle: {
        fontSize: 9,
        fontName: 'system-ui',
        color: '#6b7280'
      },
      format: 'short',
      gridlines: {
        color: '#e5e7eb',
        count: 5
      },
      minorGridlines: {
        color: 'transparent'
      }
    },
    colors: ['#3b82f6'],
    legend: { position: 'none' },
    lineWidth: 3,
    pointSize: 5,
    areaOpacity: 0.3,
    animation: {
      startup: true,
      easing: 'inAndOut',
      duration: 1000,
    },
  };

  // Chart options for daily bar chart
  const dailyChartOptions = {
    title: "Voice Streams This Month",
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
      titleTextStyle: {
        fontSize: 11,
        fontName: 'system-ui',
        color: '#6b7280'
      },
      textStyle: {
        fontSize: 9,
        fontName: 'system-ui',
        color: '#6b7280'
      },
    },
    vAxis: {
      title: "Voice Streams",
      titleTextStyle: {
        fontSize: 11,
        fontName: 'system-ui',
        color: '#6b7280'
      },
      textStyle: {
        fontSize: 9,
        fontName: 'system-ui',
        color: '#6b7280'
      },
      format: 'short',
      gridlines: {
        color: '#e5e7eb',
        count: 5
      },
      minorGridlines: {
        color: 'transparent'
      }
    },
    colors: ['#10b981'],
    legend: { position: 'none' },
    bar: { groupWidth: '75%' },
    animation: {
      startup: true,
      easing: 'inAndOut',
      duration: 1000,
    },
  };

  if (isAdmin()) {
    return null; // Don't show for admin users
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-lg border border-gray-100/50 p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
                <RefreshCw className="h-6 w-6 animate-spin text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-indigo-600/20 rounded-xl blur animate-pulse"></div>
            </div>
            <span className="text-gray-600 font-medium">
              Loading voice stream analytics...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-lg border border-gray-100/50 p-8">
          <div className="bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200/50 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-red-500 rounded-lg">
                <Mic className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-red-800">
                  Failed to load voice stream analytics
                </h4>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
            <button
              onClick={fetchVoiceStreamData}
              className="mt-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium shadow-md"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Calculate growth percentage
  const growthPercentage =
    data.previous_month_streams > 0
      ? ((data.current_month_streams - data.previous_month_streams) /
          data.previous_month_streams) *
        100
      : data.current_month_streams > 0
        ? 100
        : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
            <Mic className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Voice Streams Analytics
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {user?.branch_city || "Your branch"} voice recording streams
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Voice Streams */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl p-6 border border-blue-100/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <Mic className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Total Voice Streams
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {data.total_streams.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-blue-600">All time recordings</p>
        </div>

        {/* This Month */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50/50 rounded-xl p-6 border border-emerald-100/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-700">
                  This Month
                </p>
                <p className="text-2xl font-bold text-emerald-900">
                  {data.current_month_streams.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-emerald-600">Current month recordings</p>
        </div>

        {/* Growth */}
        <div className="bg-gradient-to-br from-purple-50 to-violet-50/50 rounded-xl p-6 border border-purple-100/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-700">
                  Monthly Growth
                </p>
                <p
                  className={`text-2xl font-bold ${growthPercentage >= 0 ? "text-purple-900" : "text-red-600"}`}
                >
                  {growthPercentage >= 0 ? "+" : ""}
                  {growthPercentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-purple-600">vs. previous month</p>
        </div>
      </div>

      {/* Charts Side by Side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Monthly Chart */}
        <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-lg border border-gray-100/50 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Voice Streams per Month
              </h3>
              <p className="text-gray-600 text-xs mt-1">
                Last 12 months activity
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="h-64 bg-gradient-to-b from-gray-50/30 to-white/30 rounded-lg p-3 border border-gray-100/50">
            {data.monthly_data?.length > 0 && (
              <Chart
                chartType="AreaChart"
                width="100%"
                height="100%"
                data={getMonthlyChartData()}
                options={monthlyChartOptions}
              />
            )}
          </div>

          {/* Chart Footer */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-gray-50/70 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500 mb-1">Peak Month</p>
              <p className="text-sm font-semibold text-gray-900">
                {data.monthly_data.reduce(
                  (max, curr) =>
                    curr.voice_streams > max.voice_streams ? curr : max,
                  data.monthly_data[0],
                )?.formatted_month || "—"}
              </p>
            </div>
            <div className="bg-gray-50/70 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500 mb-1">Average/Month</p>
              <p className="text-sm font-semibold text-gray-900">
                {Math.round(
                  data.monthly_data.reduce(
                    (sum, d) => sum + d.voice_streams,
                    0,
                  ) / data.monthly_data.length,
                ).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Daily Current Month Chart */}
        <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-lg border border-gray-100/50 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg shadow-md">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Voice Streams This Month
              </h3>
              <p className="text-gray-600 text-xs mt-1">
                Daily activity for{" "}
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Daily Chart */}
          <div className="h-64 bg-gradient-to-b from-gray-50/30 to-white/30 rounded-lg p-3 border border-gray-100/50">
            {data.daily_current_month?.length > 0 && (
              <Chart
                chartType="ColumnChart"
                width="100%"
                height="100%"
                data={getDailyChartData()}
                options={dailyChartOptions}
              />
            )}
          </div>

          {/* Daily Chart Footer */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-gray-50/70 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500 mb-1">Peak Day</p>
              <p className="text-sm font-semibold text-gray-900">
                {data.daily_current_month.reduce(
                  (max, curr) =>
                    curr.voice_streams > max.voice_streams ? curr : max,
                  data.daily_current_month[0],
                )?.formatted_date || "—"}
              </p>
            </div>
            <div className="bg-gray-50/70 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500 mb-1">Active Days</p>
              <p className="text-sm font-semibold text-gray-900">
                {
                  data.daily_current_month.filter((d) => d.voice_streams > 0)
                    .length
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
