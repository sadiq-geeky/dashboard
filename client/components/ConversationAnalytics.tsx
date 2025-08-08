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
  count: number;
}

interface CityAnalytics {
  city: string;
  count: number;
  branch_count: number;
}

interface DailyAnalytics {
  date: string;
  count: number;
}

interface UniqueCustomerAnalytics {
  month: string;
  unique_cnic_count: number;
}

interface BranchMonthlyTrend {
  branch_code: string;
  yr: number;
  mth: number;
  total_records: number;
}

export function ConversationAnalytics() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [branchData, setBranchData] = useState<BranchAnalytics[]>([]);
  const [cityData, setCityData] = useState<CityAnalytics[]>([]);
  const [dailyData, setDailyData] = useState<DailyAnalytics[]>([]);
  const [customerData, setCustomerData] = useState<UniqueCustomerAnalytics[]>(
    [],
  );
  const [trendData, setTrendData] = useState<BranchMonthlyTrend[]>([]);

  // UI states
  const [activeChart, setActiveChart] = useState<
    "branch" | "city" | "daily" | "customers" | "trend"
  >("branch");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all analytics data in parallel
      const [branchRes, cityRes, dailyRes, customerRes, trendRes] = await Promise.all([
        authFetch("/api/analytics/conversations/branch-monthly"),
        authFetch("/api/analytics/conversations/city"),
        authFetch("/api/analytics/conversations/daily"),
        authFetch("/api/analytics/conversations/cnic"),
        authFetch("/api/analytics/branch-monthly-trend"),
      ]);

      // Process branch data
      try {
        if (branchRes.ok) {
          const branchAnalytics = await branchRes.json();
          const validBranchData = Array.isArray(branchAnalytics)
            ? branchAnalytics
            : [];
          setBranchData(validBranchData);

          // Set default period to latest month
          const months = [
            ...new Set(
              validBranchData
                .filter((item: any) => item && item.month)
                .map((item: BranchAnalytics) => item.month),
            ),
          ]
            .sort()
            .reverse();
          if (months.length > 0 && !selectedPeriod) {
            setSelectedPeriod(months[0]);
          }
        }
      } catch (err) {
        console.warn("Error processing branch data:", err);
        setBranchData([]);
      }

      // Process city data
      try {
        if (cityRes.ok) {
          const cityAnalytics = await cityRes.json();
          const validCityData = Array.isArray(cityAnalytics)
            ? cityAnalytics
            : [];
          setCityData(validCityData);
        }
      } catch (err) {
        console.warn("Error processing city data:", err);
        setCityData([]);
      }

      // Process daily data
      try {
        if (dailyRes.ok) {
          const dailyAnalytics = await dailyRes.json();
          const validDailyData = Array.isArray(dailyAnalytics)
            ? dailyAnalytics
            : [];
          setDailyData(validDailyData);
        }
      } catch (err) {
        console.warn("Error processing daily data:", err);
        setDailyData([]);
      }

      // Process customer data
      try {
        if (customerRes.ok) {
          const customerAnalytics = await customerRes.json();
          // If it's a single object, wrap it in an array
          const validCustomerData = Array.isArray(customerAnalytics)
            ? customerAnalytics
            : [customerAnalytics];
          setCustomerData(
          validCustomerData.filter(
            (item) => item !== null && item !== undefined,
          ),
        );
      }
    } catch (err) {
      console.warn("Error processing customer data:", err);
      setCustomerData([]);
    }

    // Process trend data
    try {
      if (trendRes.ok) {
        const trendAnalytics = await trendRes.json();
        const validTrendData = Array.isArray(trendAnalytics)
          ? trendAnalytics
          : [];
        setTrendData(validTrendData);
      }
    } catch (err) {
      console.warn("Error processing trend data:", err);
      setTrendData([]);
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
    if (!branchData || branchData.length === 0 || !selectedPeriod) {
      return [
        ["Branch", "Conversations", { role: "style" }],
        ["No Data", 0, "#gray"],
      ];
    }

    const filtered = branchData.filter(
      (item) => item && item.month === selectedPeriod,
    );
    const chartData = [["Branch", "Conversations", { role: "style" }]];

    if (filtered.length === 0) {
      chartData.push(["No Data", 0, "#cccccc"]);
      return chartData;
    }

    filtered
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 15) // Top 15 branches
      .forEach((item, index) => {
        const color = `hsl(${220 + index * 15}, 70%, ${60 + index * 2}%)`;
        const branchName = item.branch_name || `Unknown Branch ${index + 1}`;
        chartData.push([
          branchName.length > 20
            ? branchName.substring(0, 20) + "..."
            : branchName,
          item.count || 0,
          color,
        ]);
      });

    return chartData;
  };

  const getCityChartData = () => {
    const chartData = [["City", "Conversations", "Branches"]];

    if (!cityData || cityData.length === 0) {
      chartData.push(["No Data", 0, 0]);
      return chartData;
    }

    cityData
      .filter((item) => item && item.city) // Filter out invalid items
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 12) // Top 12 cities
      .forEach((item, index) => {
        chartData.push([
          item.city || `Unknown City ${index + 1}`,
          item.count || 0,
          item.branch_count || 0,
        ]);
      });

    return chartData;
  };

  const getDailyChartData = () => {
    const chartData = [["Date", "Conversations", { role: "style" }]];

    if (!dailyData || dailyData.length === 0) {
      chartData.push(["No Data", 0, "#cccccc"]);
      return chartData;
    }

    dailyData
      .filter((item) => item && item.date) // Filter out invalid items
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      })
      .forEach((item, index) => {
        try {
          const date = new Date(item.date);
          if (isNaN(date.getTime())) {
            return; // Skip invalid dates
          }

          const dayName = date.toLocaleDateString("en-US", {
            weekday: "short",
            day: "numeric",
          });
          const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Sunday = 0, Saturday = 6
          const color = isWeekend ? "#ef4444" : "#3b82f6";

          chartData.push([dayName, item.count || 0, color]);
        } catch (error) {
          console.warn("Invalid date in daily data:", item.date);
        }
      });

    return chartData;
  };

  const getCustomerChartData = () => {
    const chartData = [["Month", "Unique Customers"]];

    if (!customerData || customerData.length === 0) {
      chartData.push(["No Data", 0]);
      return chartData;
    }

    try {
      const item = customerData[0];
      if (!item || !item.month) {
        chartData.push(["No Data", 0]);
        return chartData;
      }

      const monthName = new Date(item.month + "-01").toLocaleDateString(
        "en-US",
        {
          month: "short",
          year: "numeric",
        },
      );
      chartData.push([monthName, item.unique_cnic_count || 0]);
    } catch (error) {
      console.warn("Error processing customer data:", error);
      chartData.push(["No Data", 0]);
    }

    return chartData;
  };

  const getTrendChartData = () => {
    if (!trendData || trendData.length === 0) {
      return [["Month", "No Data"], ["No Data", 0]];
    }

    // Group data by time period (yr-mth) and branch
    const groupedData: { [key: string]: { [branch: string]: number } } = {};
    const branches = new Set<string>();

    trendData.forEach((item) => {
      const timeKey = `${item.yr}-${String(item.mth).padStart(2, '0')}`;
      if (!groupedData[timeKey]) {
        groupedData[timeKey] = {};
      }
      groupedData[timeKey][item.branch_code] = item.total_records;
      branches.add(item.branch_code);
    });

    // Sort time periods
    const sortedTimes = Object.keys(groupedData).sort();
    const branchArray = Array.from(branches).sort();

    // Create chart data structure
    const chartData = [["Month", ...branchArray]];

    sortedTimes.forEach((timeKey) => {
      const row: any[] = [timeKey];
      branchArray.forEach((branch) => {
        row.push(groupedData[timeKey][branch] || 0);
      });
      chartData.push(row);
    });

    return chartData;
  };

  // Chart options
  const getBranchChartOptions = () => ({
    title: `Conversations by Branch - ${selectedPeriod ? new Date(selectedPeriod + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" }) : ""}`,
    titleTextStyle: { fontSize: 16, fontName: "system-ui", bold: true },
    backgroundColor: "transparent",
    chartArea: { left: 120, top: 60, width: "75%", height: "75%" },
    hAxis: {
      title: "Number of Conversations",
      textStyle: { fontSize: 11 },
      gridlines: { color: "#e5e7eb" },
    },
    vAxis: {
      title: "Branch",
      textStyle: { fontSize: 10 },
      titleTextStyle: { fontSize: 12 },
    },
    legend: { position: "none" },
    animation: { startup: true, easing: "inAndOut", duration: 1000 },
  });

  const getCityChartOptions = () => ({
    title: "Conversations by City (with Branch Count)",
    titleTextStyle: { fontSize: 16, fontName: "system-ui", bold: true },
    backgroundColor: "transparent",
    chartArea: { left: 80, top: 60, width: "80%", height: "75%" },
    hAxis: {
      title: "City",
      textStyle: { fontSize: 11 },
      slantedText: true,
      slantedTextAngle: 45,
    },
    vAxis: {
      title: "Conversations",
      textStyle: { fontSize: 11 },
      gridlines: { color: "#e5e7eb" },
    },
    series: {
      0: { type: "columns", color: "#10b981" },
      1: { type: "line", color: "#f59e0b", lineWidth: 3, pointSize: 6 },
    },
    legend: { position: "top", textStyle: { fontSize: 12 } },
    animation: { startup: true, easing: "inAndOut", duration: 1000 },
  });

  const getDailyChartOptions = () => ({
    title: "Daily Conversations - Last Month",
    titleTextStyle: { fontSize: 16, fontName: "system-ui", bold: true },
    backgroundColor: "transparent",
    chartArea: { left: 60, top: 60, width: "85%", height: "75%" },
    hAxis: {
      title: "Date",
      textStyle: { fontSize: 10 },
      slantedText: true,
      slantedTextAngle: 45,
    },
    vAxis: {
      title: "Conversations",
      textStyle: { fontSize: 11 },
      gridlines: { color: "#e5e7eb" },
    },
    legend: { position: "none" },
    animation: { startup: true, easing: "inAndOut", duration: 1000 },
  });

  const getCustomerChartOptions = () => ({
    title: "Unique Customers This Month",
    titleTextStyle: { fontSize: 16, fontName: "system-ui", bold: true },
    backgroundColor: "transparent",
    chartArea: { left: 80, top: 60, width: "80%", height: "75%" },
    hAxis: {
      title: "Month",
      textStyle: { fontSize: 11 },
    },
    vAxis: {
      title: "Unique Customers",
      textStyle: { fontSize: 11 },
      gridlines: { color: "#e5e7eb" },
    },
    colors: ["#8b5cf6"],
    legend: { position: "none" },
    animation: { startup: true, easing: "inAndOut", duration: 1000 },
  });

  const getTrendChartOptions = () => ({
    title: "Branch Monthly Trends - Recordings Over Time",
    titleTextStyle: { fontSize: 16, fontName: "system-ui", bold: true },
    backgroundColor: "transparent",
    chartArea: { left: 80, top: 60, width: "85%", height: "75%" },
    hAxis: {
      title: "Time (Year-Month)",
      textStyle: { fontSize: 10 },
      slantedText: true,
      slantedTextAngle: 45,
    },
    vAxis: {
      title: "Total Records",
      textStyle: { fontSize: 11 },
      gridlines: { color: "#e5e7eb" },
    },
    curveType: "function",
    legend: { position: "top", alignment: "center", textStyle: { fontSize: 11 } },
    animation: { startup: true, easing: "inAndOut", duration: 1000 },
    series: {},
  });

  if (!isAdmin()) return null;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mr-3" />
          <span className="text-lg text-gray-600">
            Loading comprehensive analytics...
          </span>
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

  const availableMonths = [...new Set(branchData.map((item) => item.month))]
    .sort()
    .reverse();

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
              <h2 className="text-2xl font-bold text-gray-900">
                Conversation Analytics
              </h2>
              <p className="text-gray-600">
                Comprehensive insights into recorded conversations
              </p>
            </div>
          </div>

          {activeChart === "branch" && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {new Date(month + "-01").toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Chart Type Selection */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-6">
          <button
            onClick={() => setActiveChart("branch")}
            className={`p-4 rounded-lg border-2 transition-all ${
              activeChart === "branch"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300 text-gray-600"
            }`}
          >
            <Building2 className="h-5 w-5 mx-auto mb-2" />
            <div className="text-sm font-medium">By Branch</div>
            <div className="text-xs opacity-75">
              Monthly conversations per branch
            </div>
          </button>

          <button
            onClick={() => setActiveChart("city")}
            className={`p-4 rounded-lg border-2 transition-all ${
              activeChart === "city"
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-gray-200 hover:border-gray-300 text-gray-600"
            }`}
          >
            <MapPin className="h-5 w-5 mx-auto mb-2" />
            <div className="text-sm font-medium">By City</div>
            <div className="text-xs opacity-75">
              Conversations by city with branch count
            </div>
          </button>

          <button
            onClick={() => setActiveChart("daily")}
            className={`p-4 rounded-lg border-2 transition-all ${
              activeChart === "daily"
                ? "border-orange-500 bg-orange-50 text-orange-700"
                : "border-gray-200 hover:border-gray-300 text-gray-600"
            }`}
          >
            <Activity className="h-5 w-5 mx-auto mb-2" />
            <div className="text-sm font-medium">Daily Trends</div>
            <div className="text-xs opacity-75">
              Daily interactions last month
            </div>
          </button>

          <button
            onClick={() => setActiveChart("customers")}
            className={`p-4 rounded-lg border-2 transition-all ${
              activeChart === "customers"
                ? "border-purple-500 bg-purple-50 text-purple-700"
                : "border-gray-200 hover:border-gray-300 text-gray-600"
            }`}
          >
            <Users className="h-5 w-5 mx-auto mb-2" />
            <div className="text-sm font-medium">Unique Customers</div>
            <div className="text-xs opacity-75">
              Monthly unique customer visits
            </div>
          </button>

          <button
            onClick={() => setActiveChart("trend")}
            className={`p-4 rounded-lg border-2 transition-all ${
              activeChart === "trend"
                ? "border-teal-500 bg-teal-50 text-teal-700"
                : "border-gray-200 hover:border-gray-300 text-gray-600"
            }`}
          >
            <TrendingUp className="h-5 w-5 mx-auto mb-2" />
            <div className="text-sm font-medium">Monthly Trends</div>
            <div className="text-xs opacity-75">
              Branch recordings over time
            </div>
          </button>
        </div>

        {/* Chart Display */}
        <div className="h-96 border border-gray-200 rounded-lg p-4 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mr-3" />
              <span className="text-gray-600">Loading chart data...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-600 mb-2">Error loading chart</p>
                <button
                  onClick={fetchAnalyticsData}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeChart === "branch" && (
                <Chart
                  chartType="BarChart"
                  width="100%"
                  height="100%"
                  data={getBranchChartData()}
                  options={getBranchChartOptions()}
                />
              )}

              {activeChart === "city" && (
                <Chart
                  chartType="ComboChart"
                  width="100%"
                  height="100%"
                  data={getCityChartData()}
                  options={getCityChartOptions()}
                />
              )}

              {activeChart === "daily" && (
                <Chart
                  chartType="ColumnChart"
                  width="100%"
                  height="100%"
                  data={getDailyChartData()}
                  options={getDailyChartOptions()}
                />
              )}

              {activeChart === "customers" && (
                <Chart
                  chartType="ColumnChart"
                  width="100%"
                  height="100%"
                  data={getCustomerChartData()}
                  options={getCustomerChartOptions()}
                />
              )}

              {activeChart === "trend" && (
                <Chart
                  chartType="LineChart"
                  width="100%"
                  height="100%"
                  data={getTrendChartData()}
                  options={getTrendChartOptions()}
                />
              )}
            </>
          )}
        </div>

        {/* Chart Description */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">
            {activeChart === "branch" && "Number of Conversations by Branch"}
            {activeChart === "city" && "Number of Conversations by City"}
            {activeChart === "daily" && "Daily Conversation Trends"}
            {activeChart === "customers" && "Unique Customer Analysis"}
            {activeChart === "trend" && "Branch Monthly Trends Over Time"}
          </h4>
          <p className="text-sm text-gray-600">
            {activeChart === "branch" &&
              "Shows the number of conversations based on unique branch ID and organized by months. This helps identify the most active branches for resource allocation."}
            {activeChart === "city" &&
              "Displays conversations associated with each city having single or multiple branches. The line shows the number of branches per city."}
            {activeChart === "daily" &&
              "Daily interaction analytics for the last month. Weekends are highlighted in red to show different usage patterns."}
            {activeChart === "customers" &&
              "Number of unique customers (CNIC) per month visiting the branches, compared with total conversation volume."}
          </p>
        </div>
      </div>
    </div>
  );
}
