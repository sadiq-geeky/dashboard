import React, { useState, useEffect } from "react";
import { authFetch } from "@/lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Chart } from "react-google-charts";
import {
  RefreshCw,
  BarChart3,
  Building2,
  MapPin,
  Calendar,
  Users,
  ChevronDown,
  TrendingUp,
  Activity,
} from "lucide-react";

interface BranchAnalytics {
  branch_id: string;
  branch_name: string;
  branch_city: string;
  month: string;
  conversations: number;
}

interface CityAnalytics {
  city: string;
  total_conversations: number;
  branch_count: number;
  branches: string[];
}

interface DailyAnalytics {
  date: string;
  conversations: number;
  day_name: string;
}

interface UniqueCustomerAnalytics {
  month: string;
  unique_customers: number;
  total_conversations: number;
}

export function ConversationAnalytics() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [branchData, setBranchData] = useState<BranchAnalytics[]>([]);
  const [cityData, setCityData] = useState<CityAnalytics[]>([]);
  const [dailyData, setDailyData] = useState<DailyAnalytics[]>([]);
  const [customerData, setCustomerData] = useState<UniqueCustomerAnalytics[]>([]);
  
  // UI states
  const [activeChart, setActiveChart] = useState<'branch' | 'city' | 'daily' | 'customers'>('branch');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all analytics data in parallel
      const [branchRes, cityRes, dailyRes, customerRes] = await Promise.all([
        authFetch("/api/analytics/conversations/by-branch"),
        authFetch("/api/analytics/conversations/by-city"), 
        authFetch("/api/analytics/conversations/daily-last-month"),
        authFetch("/api/analytics/conversations/unique-customers")
      ]);

      // Process branch data
      if (branchRes.ok) {
        const branchAnalytics = await branchRes.json();
        setBranchData(branchAnalytics);
        
        // Set default period to latest month
        const months = [...new Set(branchAnalytics.map((item: BranchAnalytics) => item.month))]
          .sort().reverse();
        if (months.length > 0 && !selectedPeriod) {
          setSelectedPeriod(months[0]);
        }
      }

      // Process city data
      if (cityRes.ok) {
        const cityAnalytics = await cityRes.json();
        setCityData(cityAnalytics);
      }

      // Process daily data
      if (dailyRes.ok) {
        const dailyAnalytics = await dailyRes.json();
        setDailyData(dailyAnalytics);
      }

      // Process customer data
      if (customerRes.ok) {
        const customerAnalytics = await customerRes.json();
        setCustomerData(customerAnalytics);
      }

    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin()) {
      fetchAnalyticsData();
    }
  }, [isAdmin]);

  // Chart data preparation functions
  const getBranchChartData = () => {
    const filtered = branchData.filter(item => item.month === selectedPeriod);
    const chartData = [["Branch", "Conversations", { role: "style" }]];
    
    filtered
      .sort((a, b) => b.conversations - a.conversations)
      .slice(0, 15) // Top 15 branches
      .forEach((item, index) => {
        const color = `hsl(${220 + index * 15}, 70%, ${60 + index * 2}%)`;
        chartData.push([
          item.branch_name.length > 20 
            ? item.branch_name.substring(0, 20) + "..." 
            : item.branch_name,
          item.conversations,
          color
        ]);
      });
    
    return chartData;
  };

  const getCityChartData = () => {
    const chartData = [["City", "Conversations", "Branches", { role: "style" }]];
    
    cityData
      .sort((a, b) => b.total_conversations - a.total_conversations)
      .slice(0, 12) // Top 12 cities
      .forEach((item, index) => {
        const color = `hsl(${140 + index * 20}, 65%, ${50 + index * 3}%)`;
        chartData.push([
          item.city,
          item.total_conversations,
          item.branch_count,
          color
        ]);
      });
    
    return chartData;
  };

  const getDailyChartData = () => {
    const chartData = [["Date", "Conversations", { role: "style" }]];
    
    dailyData
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach((item, index) => {
        const date = new Date(item.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
        const color = item.day_name === 'Saturday' || item.day_name === 'Sunday' 
          ? '#ef4444' : '#3b82f6';
        
        chartData.push([dayName, item.conversations, color]);
      });
    
    return chartData;
  };

  const getCustomerChartData = () => {
    const chartData = [["Month", "Unique Customers", "Total Conversations"]];
    
    customerData
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .forEach(item => {
        const monthName = new Date(item.month + '-01').toLocaleDateString('en-US', {
          month: 'short',
          year: '2-digit'
        });
        chartData.push([monthName, item.unique_customers, item.total_conversations]);
      });
    
    return chartData;
  };

  // Chart options
  const getBranchChartOptions = () => ({
    title: `Conversations by Branch - ${selectedPeriod ? new Date(selectedPeriod + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''}`,
    titleTextStyle: { fontSize: 16, fontName: 'system-ui', bold: true },
    backgroundColor: 'transparent',
    chartArea: { left: 120, top: 60, width: '75%', height: '75%' },
    hAxis: {
      title: 'Number of Conversations',
      textStyle: { fontSize: 11 },
      gridlines: { color: '#e5e7eb' }
    },
    vAxis: {
      title: 'Branch',
      textStyle: { fontSize: 10 },
      titleTextStyle: { fontSize: 12 }
    },
    legend: { position: 'none' },
    animation: { startup: true, easing: 'inAndOut', duration: 1000 }
  });

  const getCityChartOptions = () => ({
    title: 'Conversations by City (with Branch Count)',
    titleTextStyle: { fontSize: 16, fontName: 'system-ui', bold: true },
    backgroundColor: 'transparent',
    chartArea: { left: 80, top: 60, width: '80%', height: '75%' },
    hAxis: {
      title: 'City',
      textStyle: { fontSize: 11 },
      slantedText: true,
      slantedTextAngle: 45
    },
    vAxis: {
      title: 'Conversations',
      textStyle: { fontSize: 11 },
      gridlines: { color: '#e5e7eb' }
    },
    series: {
      0: { type: 'columns', color: '#10b981' },
      1: { type: 'line', color: '#f59e0b', lineWidth: 3, pointSize: 6 }
    },
    legend: { position: 'top', textStyle: { fontSize: 12 } },
    animation: { startup: true, easing: 'inAndOut', duration: 1000 }
  });

  const getDailyChartOptions = () => ({
    title: 'Daily Conversations - Last Month',
    titleTextStyle: { fontSize: 16, fontName: 'system-ui', bold: true },
    backgroundColor: 'transparent',
    chartArea: { left: 60, top: 60, width: '85%', height: '75%' },
    hAxis: {
      title: 'Date',
      textStyle: { fontSize: 10 },
      slantedText: true,
      slantedTextAngle: 45
    },
    vAxis: {
      title: 'Conversations',
      textStyle: { fontSize: 11 },
      gridlines: { color: '#e5e7eb' }
    },
    legend: { position: 'none' },
    animation: { startup: true, easing: 'inAndOut', duration: 1000 }
  });

  const getCustomerChartOptions = () => ({
    title: 'Unique Customers vs Total Conversations by Month',
    titleTextStyle: { fontSize: 16, fontName: 'system-ui', bold: true },
    backgroundColor: 'transparent',
    chartArea: { left: 80, top: 60, width: '80%', height: '75%' },
    hAxis: {
      title: 'Month',
      textStyle: { fontSize: 11 }
    },
    vAxes: {
      0: {
        title: 'Unique Customers',
        textStyle: { color: '#8b5cf6', fontSize: 11 },
        titleTextStyle: { color: '#8b5cf6' }
      },
      1: {
        title: 'Total Conversations',
        textStyle: { color: '#06b6d4', fontSize: 11 },
        titleTextStyle: { color: '#06b6d4' }
      }
    },
    series: {
      0: { type: 'bars', targetAxisIndex: 0, color: '#8b5cf6' },
      1: { type: 'line', targetAxisIndex: 1, color: '#06b6d4', lineWidth: 3, pointSize: 6 }
    },
    legend: { position: 'top', textStyle: { fontSize: 12 } },
    animation: { startup: true, easing: 'inAndOut', duration: 1000 }
  });

  if (!isAdmin()) return null;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mr-3" />
          <span className="text-lg text-gray-600">Loading comprehensive analytics...</span>
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
            onClick={fetchAnalyticsData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const availableMonths = [...new Set(branchData.map(item => item.month))].sort().reverse();

  return (
    <div className="space-y-6">
      {/* Header with Chart Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Conversation Analytics</h2>
              <p className="text-gray-600">Comprehensive insights into recorded conversations</p>
            </div>
          </div>
          
          {activeChart === 'branch' && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableMonths.map(month => (
                  <option key={month} value={month}>
                    {new Date(month + '-01').toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Chart Type Selection */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <button
            onClick={() => setActiveChart('branch')}
            className={`p-4 rounded-lg border-2 transition-all ${
              activeChart === 'branch'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
          >
            <Building2 className="h-5 w-5 mx-auto mb-2" />
            <div className="text-sm font-medium">By Branch</div>
            <div className="text-xs opacity-75">Monthly conversations per branch</div>
          </button>

          <button
            onClick={() => setActiveChart('city')}
            className={`p-4 rounded-lg border-2 transition-all ${
              activeChart === 'city'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
          >
            <MapPin className="h-5 w-5 mx-auto mb-2" />
            <div className="text-sm font-medium">By City</div>
            <div className="text-xs opacity-75">Conversations by city with branch count</div>
          </button>

          <button
            onClick={() => setActiveChart('daily')}
            className={`p-4 rounded-lg border-2 transition-all ${
              activeChart === 'daily'
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
          >
            <Activity className="h-5 w-5 mx-auto mb-2" />
            <div className="text-sm font-medium">Daily Trends</div>
            <div className="text-xs opacity-75">Daily interactions last month</div>
          </button>

          <button
            onClick={() => setActiveChart('customers')}
            className={`p-4 rounded-lg border-2 transition-all ${
              activeChart === 'customers'
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
          >
            <Users className="h-5 w-5 mx-auto mb-2" />
            <div className="text-sm font-medium">Unique Customers</div>
            <div className="text-xs opacity-75">Monthly unique customer visits</div>
          </button>
        </div>

        {/* Chart Display */}
        <div className="h-96 border border-gray-200 rounded-lg p-4 bg-gray-50">
          {activeChart === 'branch' && getBranchChartData().length > 1 && (
            <Chart
              chartType="BarChart"
              width="100%"
              height="100%"
              data={getBranchChartData()}
              options={getBranchChartOptions()}
            />
          )}

          {activeChart === 'city' && getCityChartData().length > 1 && (
            <Chart
              chartType="ComboChart"
              width="100%"
              height="100%"
              data={getCityChartData()}
              options={getCityChartOptions()}
            />
          )}

          {activeChart === 'daily' && getDailyChartData().length > 1 && (
            <Chart
              chartType="ColumnChart"
              width="100%"
              height="100%"
              data={getDailyChartData()}
              options={getDailyChartOptions()}
            />
          )}

          {activeChart === 'customers' && getCustomerChartData().length > 1 && (
            <Chart
              chartType="ComboChart"
              width="100%"
              height="100%"
              data={getCustomerChartData()}
              options={getCustomerChartOptions()}
            />
          )}
        </div>

        {/* Chart Description */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">
            {activeChart === 'branch' && "Number of Conversations by Branch"}
            {activeChart === 'city' && "Number of Conversations by City"}
            {activeChart === 'daily' && "Daily Conversation Trends"}
            {activeChart === 'customers' && "Unique Customer Analysis"}
          </h4>
          <p className="text-sm text-gray-600">
            {activeChart === 'branch' && "Shows the number of conversations based on unique branch ID and organized by months. This helps identify the most active branches for resource allocation."}
            {activeChart === 'city' && "Displays conversations associated with each city having single or multiple branches. The line shows the number of branches per city."}
            {activeChart === 'daily' && "Daily interaction analytics for the last month. Weekends are highlighted in red to show different usage patterns."}
            {activeChart === 'customers' && "Number of unique customers (CNIC) per month visiting the branches, compared with total conversation volume."}
          </p>
        </div>
      </div>
    </div>
  );
}
