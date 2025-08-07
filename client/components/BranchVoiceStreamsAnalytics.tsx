import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { authFetch } from "@/lib/api";
import {
  RefreshCw,
  Mic,
  Calendar,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";

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

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-xl p-4 min-w-[200px]">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" />
            <p className="font-semibold text-gray-900 text-sm">{label}</p>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {payload[0].value} voice streams
            </p>
          </div>
        </div>
      );
    }
    return null;
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
            <span className="text-gray-600 font-medium">Loading voice stream analytics...</span>
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
                <h4 className="font-semibold text-red-800">Failed to load voice stream analytics</h4>
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
  const growthPercentage = data.previous_month_streams > 0
    ? ((data.current_month_streams - data.previous_month_streams) / data.previous_month_streams) * 100
    : data.current_month_streams > 0 ? 100 : 0;

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
                <p className="text-sm font-medium text-blue-700">Total Voice Streams</p>
                <p className="text-2xl font-bold text-blue-900">{data.total_streams.toLocaleString()}</p>
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
                <p className="text-sm font-medium text-emerald-700">This Month</p>
                <p className="text-2xl font-bold text-emerald-900">{data.current_month_streams.toLocaleString()}</p>
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
                <p className="text-sm font-medium text-purple-700">Monthly Growth</p>
                <p className={`text-2xl font-bold ${growthPercentage >= 0 ? 'text-purple-900' : 'text-red-600'}`}>
                  {growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-purple-600">vs. previous month</p>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-lg border border-gray-100/50 p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Voice Streams per Month
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Recording activity over the last 12 months
              </p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80 bg-gradient-to-b from-gray-50/30 to-white/30 rounded-xl p-4 border border-gray-100/50">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data.monthly_data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <defs>
                <linearGradient id="voiceStreamGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="2 4"
                stroke="#e5e7eb"
                strokeOpacity={0.5}
                vertical={false}
              />
              <XAxis
                dataKey="formatted_month"
                fontSize={11}
                fontWeight={500}
                tick={{ fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                tickLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
              />
              <YAxis
                fontSize={11}
                fontWeight={500}
                tick={{ fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                tickLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="voice_streams"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#voiceStreamGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Footer */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50/70 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Peak Month</p>
            <p className="font-semibold text-gray-900">
              {data.monthly_data.reduce((max, curr) =>
                curr.voice_streams > max.voice_streams ? curr : max,
                data.monthly_data[0]
              )?.formatted_month || '—'}
            </p>
          </div>
          <div className="bg-gray-50/70 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Peak Count</p>
            <p className="font-semibold text-gray-900">
              {Math.max(...data.monthly_data.map(d => d.voice_streams)).toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50/70 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Average/Month</p>
            <p className="font-semibold text-gray-900">
              {Math.round(data.monthly_data.reduce((sum, d) => sum + d.voice_streams, 0) / data.monthly_data.length).toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50/70 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Total Period</p>
            <p className="font-semibold text-gray-900">12 Months</p>
          </div>
        </div>
      </div>

      {/* Daily Current Month Chart */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-lg border border-gray-100/50 p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-md">
              <Calendar className="h-7 w-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Voice Streams This Month
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Daily recording activity for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Daily Chart */}
        <div className="h-80 bg-gradient-to-b from-gray-50/30 to-white/30 rounded-xl p-4 border border-gray-100/50">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.daily_current_month}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <defs>
                <linearGradient id="dailyVoiceStreamGradient" x1="0" y1="0" x2="0" y2="1">
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
                dataKey="formatted_date"
                fontSize={10}
                fontWeight={500}
                tick={{ fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                tickLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                interval="preserveStartEnd"
              />
              <YAxis
                fontSize={11}
                fontWeight={500}
                tick={{ fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                tickLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="voice_streams"
                fill="url(#dailyVoiceStreamGradient)"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Chart Footer */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50/70 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Peak Day</p>
            <p className="font-semibold text-gray-900">
              {data.daily_current_month.reduce((max, curr) =>
                curr.voice_streams > max.voice_streams ? curr : max,
                data.daily_current_month[0]
              )?.formatted_date || '—'}
            </p>
          </div>
          <div className="bg-gray-50/70 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Peak Count</p>
            <p className="font-semibold text-gray-900">
              {Math.max(...data.daily_current_month.map(d => d.voice_streams)).toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50/70 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Average/Day</p>
            <p className="font-semibold text-gray-900">
              {Math.round(data.daily_current_month.reduce((sum, d) => sum + d.voice_streams, 0) / data.daily_current_month.length).toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50/70 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Active Days</p>
            <p className="font-semibold text-gray-900">
              {data.daily_current_month.filter(d => d.voice_streams > 0).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
