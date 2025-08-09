import React, { useState, useEffect } from "react";
import { authFetch } from "@/lib/api";
import { useAuth } from "../contexts/AuthContext";
import { GoogleChart, ChartPresets } from "./ui/google-chart";
import {
  RefreshCw,
  BarChart3,
  Building2,
  MapPin,
  Calendar,
  Users,
  Activity,
} from "lucide-react";

interface BranchAnalytics {
  branch_id: string;
  branch_name: string;
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

interface Branch {
  branch_id: string;
  branch_name: string;
}

interface BranchMonthlyRecordings {
  month: string;
  formatted_month: string;
  count: number;
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
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [branchMonthlyData, setBranchMonthlyData] = useState<BranchMonthlyRecordings[]>([]);

  // UI states
  const [activeChart, setActiveChart] = useState<
    "branch" | "city" | "daily" | "customers"
  >("branch");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all analytics data in parallel
      const [branchRes, cityRes, dailyRes, customerRes] = await Promise.all([
        authFetch("/api/analytics/conversations/branch-monthly"),
        authFetch("/api/analytics/conversations/city"),
        authFetch("/api/analytics/conversations/daily"),
        authFetch("/api/analytics/conversations/cnic"),
      ]);

      // Process branch data
      if (branchRes.ok) {
        const branchAnalytics = await branchRes.json();
        const validBranchData = Array.isArray(branchAnalytics)
          ? branchAnalytics
          : [];
        setBranchData(validBranchData);

        // Extract unique branches for dropdown
        const uniqueBranches = validBranchData.reduce((acc: Branch[], item: any) => {
          if (item?.branch_id && item?.branch_name) {
            const exists = acc.find(b => b.branch_id === item.branch_id);
            if (!exists) {
              acc.push({
                branch_id: item.branch_id,
                branch_name: item.branch_name
              });
            }
          }
          return acc;
        }, []);

        setAvailableBranches(uniqueBranches);

        // Set default branch to first available branch
        if (uniqueBranches.length > 0 && !selectedBranch) {
          setSelectedBranch(uniqueBranches[0].branch_id);
        }

        // Set default period to latest month
        const months = [
          ...new Set(
            validBranchData.map((item: any) => item?.month).filter(Boolean),
          ),
        ]
          .sort()
          .reverse();
        if (months.length > 0 && !selectedPeriod) {
          setSelectedPeriod(months[0]);
        }
      }

      // Process city data
      if (cityRes.ok) {
        const cityAnalytics = await cityRes.json();
        const validCityData = Array.isArray(cityAnalytics) ? cityAnalytics : [];
        setCityData(validCityData);
      }

      // Process daily data
      if (dailyRes.ok) {
        const dailyAnalytics = await dailyRes.json();
        const validDailyData = Array.isArray(dailyAnalytics)
          ? dailyAnalytics
          : [];
        setDailyData(validDailyData);
      }

      // Process customer data
      if (customerRes.ok) {
        const customerAnalytics = await customerRes.json();
        const validCustomerData = Array.isArray(customerAnalytics)
          ? customerAnalytics
          : customerAnalytics
            ? [customerAnalytics]
            : [];
        setCustomerData(validCustomerData.filter((item) => item != null));
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchMonthlyData = async (branchId: string) => {
    if (!branchId) {
      setBranchMonthlyData([]);
      return;
    }

    try {
      setLoading(true);
      const response = await authFetch(`/api/analytics/conversations/branch/${branchId}/monthly`);
      if (response.ok) {
        const data = await response.json();
        const validData = Array.isArray(data) ? data.filter(item => item && typeof item === 'object') : [];
        setBranchMonthlyData(validData);
      } else {
        console.error("Failed to fetch branch monthly data:", response.status, response.statusText);
        setBranchMonthlyData([]);
      }
    } catch (error) {
      console.error("Error fetching branch monthly data:", error);
      setBranchMonthlyData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin()) {
      fetchAnalyticsData();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedBranch && activeChart === "branch") {
      fetchBranchMonthlyData(selectedBranch);
    }
  }, [selectedBranch, activeChart]);

  // Prepare chart data for Google Charts - Monthly recordings for selected branch
  const getBranchChartData = () => {
    try {
      if (!branchMonthlyData || !Array.isArray(branchMonthlyData) || branchMonthlyData.length === 0) {
        return [["Month", "Recordings"], ["No Data", 0]];
      }

      const chartData: (string | number)[][] = [["Month", "Recordings"]];

      branchMonthlyData
        .filter(item => item && item.month) // Filter out any null/undefined items
        .sort((a, b) => (a.month || "").localeCompare(b.month || ""))
        .forEach((item) => {
          const monthLabel = item.formatted_month || item.month || "Unknown";
          const count = typeof item.count === 'number' ? item.count : 0;
          chartData.push([monthLabel, count]);
        });

      return chartData;
    } catch (error) {
      console.error("Error preparing branch chart data:", error);
      return [["Month", "Recordings"], ["Error", 0]];
    }
  };

  const getCityChartData = () => {
    if (!cityData || cityData.length === 0) {
      return [["City", "Conversations"], ["No Data", 0]];
    }

    const chartData = [["City", "Conversations"]];
    cityData
      .filter((item) => item?.city)
      .sort((a, b) => (b?.count || 0) - (a?.count || 0))
      .slice(0, 8)
      .forEach((item) => {
        chartData.push([item.city || "Unknown", item.count || 0]);
      });

    return chartData;
  };

  const getDailyChartData = () => {
    if (!dailyData || dailyData.length === 0) {
      return [["Date", "Conversations"], ["No Data", 0]];
    }

    const chartData = [["Date", "Conversations"]];
    dailyData
      .filter((item) => item?.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach((item) => {
        try {
          const date = new Date(item.date);
          if (!isNaN(date.getTime())) {
            const formattedDate = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            chartData.push([formattedDate, item.count || 0]);
          }
        } catch (error) {
          console.warn("Invalid date:", item.date);
        }
      });

    return chartData;
  };

  const getCustomerValue = () => {
    if (!customerData || customerData.length === 0) {
      return 0;
    }
    const item = customerData[0];
    return item?.unique_cnic_count || 0;
  };

  if (!isAdmin()) return null;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mr-3" />
          <span className="text-lg text-gray-600">Loading analytics...</span>
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



  return (
    <div className="space-y-6">
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
                Insights into recorded conversations
              </p>
            </div>
          </div>

          {activeChart === "branch" && availableBranches.length > 0 && (
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-gray-500" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                {availableBranches.map((branch) => (
                  <option key={branch.branch_id} value={branch.branch_id}>
                    {branch.branch_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Chart Type Selection */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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
            <div className="text-sm font-medium">Daily</div>
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
            <div className="text-sm font-medium">Customers</div>
          </button>
        </div>

        {/* Chart Display */}
        <div className="h-96 border border-gray-200 rounded-lg p-4 bg-white">
          {activeChart === "branch" && (
            <div className="h-full w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Monthly Recordings - {availableBranches.find(b => b.branch_id === selectedBranch)?.branch_name || "Selected Branch"}
              </h3>
              <div className="h-80">
                {selectedBranch ? (
                  <GoogleChart
                    chartType="ColumnChart"
                    data={getBranchChartData()}
                    loading={loading}
                    options={{
                    ...ChartPresets.columnChart(""),
                    chartArea: {
                      left: 60,
                      top: 20,
                      width: "85%",
                      height: "75%",
                    },
                    hAxis: {
                      title: "Month",
                      titleTextStyle: {
                        fontSize: 12,
                        fontName: "system-ui",
                        color: "#6b7280",
                      },
                      textStyle: {
                        fontSize: 10,
                        fontName: "system-ui",
                        color: "#6b7280",
                      },
                      slantedText: true,
                      slantedTextAngle: 45,
                    },
                    vAxis: {
                      title: "Number of Recordings",
                      titleTextStyle: {
                        fontSize: 12,
                        fontName: "system-ui",
                        color: "#6b7280",
                      },
                      textStyle: {
                        fontSize: 11,
                        fontName: "system-ui",
                        color: "#6b7280",
                      },
                      gridlines: {
                        color: "#e5e7eb",
                      },
                    },
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <Building2 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Select a branch to view recordings</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeChart === "city" && (
            <div className="h-full w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Conversations by City
              </h3>
              <div className="h-80">
                <GoogleChart
                  chartType="PieChart"
                  data={getCityChartData()}
                  loading={loading}
                  options={ChartPresets.pieChart("")}
                />
              </div>
            </div>
          )}

          {activeChart === "daily" && (
            <div className="h-full w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Daily Conversations - Last Month
              </h3>
              <div className="h-80">
                <GoogleChart
                  chartType="LineChart"
                  data={getDailyChartData()}
                  loading={loading}
                  options={{
                    ...ChartPresets.lineChart("", ChartPresets.colors.warning),
                    hAxis: {
                      title: "Date",
                      slantedText: true,
                      slantedTextAngle: 45,
                    },
                    vAxis: {
                      title: "Conversations",
                    },
                    legend: { position: "none" },
                  }}
                />
              </div>
            </div>
          )}

          {activeChart === "customers" && (
            <div className="h-full w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Unique Customers This Month
              </h3>
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl font-bold text-purple-600 mb-2">
                    {getCustomerValue()}
                  </div>
                  <div className="text-lg text-gray-600">
                    Unique Customers (CNIC)
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Current Month
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            {activeChart === "branch" &&
              "Monthly recordings for the selected branch showing recording trends over the last 12 months."}
            {activeChart === "city" &&
              "Number of conversations associated with each city having single or multiple branches."}
            {activeChart === "daily" &&
              "Daily conversation analytics for the last month from recordings table."}
            {activeChart === "customers" &&
              "Number of unique customers (CNIC) per month visiting the branches."}
          </p>
        </div>
      </div>
    </div>
  );
}
