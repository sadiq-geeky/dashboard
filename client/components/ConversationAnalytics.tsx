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

interface City {
  city: string;
}

interface CityMonthlyConversations {
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
  const [branchMonthlyData, setBranchMonthlyData] = useState<
    BranchMonthlyRecordings[]
  >([]);
  const [allBranchesMonthlyData, setAllBranchesMonthlyData] = useState<
    Record<string, BranchMonthlyRecordings[]>
  >({});
  const [availableCities, setAvailableCities] = useState<City[]>([]);
  const [cityMonthlyData, setCityMonthlyData] = useState<
    CityMonthlyConversations[]
  >([]);
  const [allBranchesLastMonthData, setAllBranchesLastMonthData] = useState<
    Array<{ branch_id: string; branch_name: string; count: number }>
  >([]);
  const [selectedBranchForDaily, setSelectedBranchForDaily] =
    useState<string>("");
  const [branchDailyData, setBranchDailyData] = useState<
    Array<{ date: string; count: number; formatted_date: string }>
  >([]);

  // UI states
  const [activeChart, setActiveChart] = useState<
    "branch" | "city" | "daily" | "customers"
  >("branch");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");

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
        const uniqueBranches = validBranchData.reduce(
          (acc: Branch[], item: any) => {
            if (item?.branch_id && item?.branch_name) {
              const exists = acc.find((b) => b.branch_id === item.branch_id);
              if (!exists) {
                acc.push({
                  branch_id: item.branch_id,
                  branch_name: item.branch_name,
                });
              }
            }
            return acc;
          },
          [],
        );

        setAvailableBranches(uniqueBranches);

        // Set default branch to first available branch
        if (uniqueBranches.length > 0 && !selectedBranch) {
          setSelectedBranch(uniqueBranches[0].branch_id);
        }

        // Set default branch for daily tab
        if (uniqueBranches.length > 0 && !selectedBranchForDaily) {
          setSelectedBranchForDaily(uniqueBranches[0].branch_id);
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

        // Extract unique cities for dropdown
        const uniqueCities = validCityData.reduce((acc: City[], item: any) => {
          if (item?.city) {
            const exists = acc.find((c) => c.city === item.city);
            if (!exists) {
              acc.push({ city: item.city });
            }
          }
          return acc;
        }, []);

        setAvailableCities(uniqueCities);

        // Set default city to first available city
        if (uniqueCities.length > 0 && !selectedCity) {
          setSelectedCity(uniqueCities[0].city);
        }
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
      const response = await authFetch(
        `/api/analytics/conversations/branch/${branchId}/monthly`,
      );

      if (response.ok) {
        const data = await response.json();
        const validData = Array.isArray(data)
          ? data.filter((item) => item && typeof item === "object")
          : [];
        setBranchMonthlyData(validData);
      } else {
        console.error(
          "Failed to fetch branch monthly data:",
          response.status,
          response.statusText,
        );
        setBranchMonthlyData([]);
      }
    } catch (error) {
      console.error("Error fetching branch monthly data:", error);
      setBranchMonthlyData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBranchesMonthlyData = async () => {
    if (!availableBranches.length) return;

    try {
      setLoading(true);

      // Fetch monthly data for all branches in parallel
      const promises = availableBranches.map(async (branch) => {
        const response = await authFetch(
          `/api/analytics/conversations/branch/${branch.branch_id}/monthly`,
        );

        if (response.ok) {
          const data = await response.json();
          const validData = Array.isArray(data)
            ? data.filter((item) => item && typeof item === "object")
            : [];
          return { branchId: branch.branch_id, data: validData };
        }
        return { branchId: branch.branch_id, data: [] };
      });

      const results = await Promise.all(promises);

      // Convert array to object for easy lookup
      const branchDataMap: Record<string, BranchMonthlyRecordings[]> = {};
      results.forEach(({ branchId, data }) => {
        branchDataMap[branchId] = data;
      });

      setAllBranchesMonthlyData(branchDataMap);
    } catch (error) {
      console.error("Error fetching all branches monthly data:", error);
      setAllBranchesMonthlyData({});
    } finally {
      setLoading(false);
    }
  };

  const fetchCityMonthlyData = async (cityName: string) => {
    if (!cityName) {
      setCityMonthlyData([]);
      return;
    }

    try {
      setLoading(true);
      const response = await authFetch(
        `/api/analytics/conversations/city/${encodeURIComponent(cityName)}/monthly`,
      );

      if (response.ok) {
        const data = await response.json();
        const validData = Array.isArray(data)
          ? data.filter((item) => item && typeof item === "object")
          : [];
        setCityMonthlyData(validData);
      } else {
        console.error(
          "Failed to fetch city monthly data:",
          response.status,
          response.statusText,
        );
        setCityMonthlyData([]);
      }
    } catch (error) {
      console.error("Error fetching city monthly data:", error);
      setCityMonthlyData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBranchesLastMonthData = async () => {
    try {
      setLoading(true);
      const response = await authFetch(
        "/api/analytics/conversations/all-branches-last-month",
      );

      if (response.ok) {
        const data = await response.json();
        const validData = Array.isArray(data)
          ? data.filter((item) => item && typeof item === "object")
          : [];
        setAllBranchesLastMonthData(validData);
      } else {
        console.error(
          "Failed to fetch all branches last month data:",
          response.status,
          response.statusText,
        );
        setAllBranchesLastMonthData([]);
      }
    } catch (error) {
      console.error("Error fetching all branches last month data:", error);
      setAllBranchesLastMonthData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchDailyData = async (branchId: string) => {
    if (!branchId) {
      setBranchDailyData([]);
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching daily data for branch ID:", branchId);
      const response = await authFetch(
        `/api/analytics/conversations/branch/${branchId}/daily`,
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Branch daily data response:", data);
        const validData = Array.isArray(data)
          ? data.filter((item) => item && typeof item === "object")
          : [];
        console.log("Processed branch daily data:", validData);
        setBranchDailyData(validData);
      } else {
        console.error(
          "Failed to fetch branch daily data:",
          response.status,
          response.statusText,
        );
        setBranchDailyData([]);
      }
    } catch (error) {
      console.error("Error fetching branch daily data:", error);
      setBranchDailyData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  useEffect(() => {
    if (selectedBranch && activeChart === "branch") {
      fetchBranchMonthlyData(selectedBranch);
    }
  }, [selectedBranch, activeChart]);

  useEffect(() => {
    if (selectedCity && activeChart === "city") {
      fetchCityMonthlyData(selectedCity);
    }
  }, [selectedCity, activeChart]);

  useEffect(() => {
    if (selectedBranchForDaily && activeChart === "daily") {
      fetchBranchDailyData(selectedBranchForDaily);
    }
  }, [selectedBranchForDaily, activeChart]);

  useEffect(() => {
    if (activeChart === "branch" && availableBranches.length > 0) {
      fetchAllBranchesMonthlyData();
    }
  }, [activeChart, availableBranches]);

  // Prepare chart data for Google Charts - Monthly recordings for selected branch
  const getBranchChartData = () => {
    try {
      if (
        !branchMonthlyData ||
        !Array.isArray(branchMonthlyData) ||
        branchMonthlyData.length === 0
      ) {
        return [
          ["Month", "Recordings"],
          ["No Data", 0],
        ];
      }

      const chartData: (string | number)[][] = [["Month", "Recordings"]];

      branchMonthlyData
        .filter((item) => item && item.month) // Filter out any null/undefined items
        .sort((a, b) => (a.month || "").localeCompare(b.month || ""))
        .forEach((item) => {
          const monthLabel = item.formatted_month || item.month || "Unknown";
          const count = typeof item.count === "number" ? item.count : 0;
          chartData.push([monthLabel, count]);
        });

      return chartData;
    } catch (error) {
      console.error("Error preparing branch chart data:", error);
      return [
        ["Month", "Recordings"],
        ["Error", 0],
      ];
    }
  };

  // Prepare chart data for Google Charts - Monthly conversations for selected city
  const getCityChartData = () => {
    try {
      if (
        !cityMonthlyData ||
        !Array.isArray(cityMonthlyData) ||
        cityMonthlyData.length === 0
      ) {
        return [
          ["Month", "Conversations"],
          ["No Data", 0],
        ];
      }

      const chartData: (string | number)[][] = [["Month", "Conversations"]];

      cityMonthlyData
        .filter((item) => item && item.month) // Filter out any null/undefined items
        .sort((a, b) => (a.month || "").localeCompare(b.month || ""))
        .forEach((item) => {
          const monthLabel = item.formatted_month || item.month || "Unknown";
          const count = typeof item.count === "number" ? item.count : 0;
          chartData.push([monthLabel, count]);
        });

      return chartData;
    } catch (error) {
      console.error("Error preparing city chart data:", error);
      return [
        ["Month", "Conversations"],
        ["Error", 0],
      ];
    }
  };

  const getDailyChartData = () => {
    if (!branchDailyData || branchDailyData.length === 0) {
      return [
        ["Date", "Conversations"],
        ["No Data", 0],
      ];
    }

    const chartData = [["Date", "Conversations"]];
    branchDailyData
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

  const getBranchPieChartData = (branchId: string) => {
    const monthlyData = allBranchesMonthlyData[branchId];
    if (!monthlyData || monthlyData.length === 0) {
      return [
        ["Month", "Recordings"],
        ["No Data", 0],
      ];
    }

    const chartData: (string | number)[][] = [["Month", "Recordings"]];
    monthlyData
      .filter((item) => item && item.month)
      .sort((a, b) => (a.month || "").localeCompare(b.month || ""))
      .forEach((item) => {
        const monthLabel = item.formatted_month || item.month || "Unknown";
        const count = typeof item.count === "number" ? item.count : 0;
        chartData.push([monthLabel, count]);
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

          {isAdmin() && (
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
          )}

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
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Monthly Recordings by Branch
                </h3>
                <div className="text-sm text-gray-500">
                  {availableBranches.length} Branch{availableBranches.length !== 1 ? "es" : ""}
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-80">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                  <span className="text-gray-600">Loading charts...</span>
                </div>
              ) : availableBranches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-96 overflow-y-auto">
                  {availableBranches.map((branch) => {
                    const pieData = getBranchPieChartData(branch.branch_id);
                    const branchData = allBranchesMonthlyData[branch.branch_id];
                    const totalRecordings = branchData?.reduce((sum, item) => sum + (item.count || 0), 0) || 0;

                    return (
                      <div key={branch.branch_id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="mb-3">
                          <h4 className="font-medium text-gray-900 text-sm mb-1">
                            {branch.branch_name}
                          </h4>
                          <div className="text-xs text-gray-500">
                            Total: {totalRecordings} recordings
                          </div>
                        </div>

                        <div className="h-48">
                          {branchData && branchData.length > 0 ? (
                            <GoogleChart
                              chartType="PieChart"
                              data={pieData}
                              options={{
                                ...ChartPresets.pieChart(""),
                                legend: { position: "bottom", textStyle: { fontSize: 10 } },
                                pieSliceTextStyle: { fontSize: 9 },
                                chartArea: { width: "90%", height: "70%" },
                                backgroundColor: "transparent",
                              }}
                              height="100%"
                              width="100%"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center text-gray-400">
                                <Activity className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-xs">No data</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-80">
                  <div className="text-center text-gray-500">
                    <Building2 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No branches available</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeChart === "city" && (
            <div className="h-full w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Monthly Conversations -{" "}
                  {availableCities.find((c) => c.city === selectedCity)?.city ||
                    "Selected City"}
                </h3>
                {availableCities.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    {isAdmin() ? (
                      <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        {availableCities.map((city) => (
                          <option key={city.city} value={city.city}>
                            {city.city}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm font-medium text-gray-700">
                        {availableCities.find((c) => c.city === selectedCity)
                          ?.city || "Your City"}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="h-80">
                {selectedCity ? (
                  <div className="w-full h-full p-4">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <RefreshCw className="h-6 w-6 animate-spin text-green-600 mr-2" />
                        <span className="text-gray-600">Loading chart...</span>
                      </div>
                    ) : cityMonthlyData.length > 0 ? (
                      <div className="w-full h-full">
                        <div className="flex items-end justify-center h-64 space-x-4 mb-4">
                          {cityMonthlyData.map((item, index) => {
                            const maxCount = Math.max(
                              ...cityMonthlyData.map((d) => d.count),
                            );
                            const height = (item.count / maxCount) * 200; // Max height 200px
                            return (
                              <div
                                key={index}
                                className="flex flex-col items-center space-y-2"
                              >
                                <div
                                  className="bg-green-500 hover:bg-green-600 transition-colors duration-200 rounded-t-sm min-w-[60px] flex items-end justify-center relative group"
                                  style={{ height: `${height}px` }}
                                >
                                  <span className="text-white text-xs font-medium mb-1">
                                    {item.count}
                                  </span>
                                  {/* Tooltip */}
                                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                    {item.formatted_month}: {item.count}{" "}
                                    conversations
                                  </div>
                                </div>
                                <div className="text-xs text-gray-600 text-center max-w-[60px] break-words">
                                  {item.formatted_month?.split(" ")[0] ||
                                    item.month}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-700 mb-1">
                            Number of Conversations
                          </div>
                          <div className="text-xs text-gray-500">
                            Monthly data for the last 12 months
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">
                          <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">
                            No conversations found for this city
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">
                        Select a city to view conversations
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeChart === "daily" && (
            <div className="h-full w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Daily Conversations -{" "}
                  {availableBranches.find(
                    (b) => b.branch_id === selectedBranchForDaily,
                  )?.branch_name || "Selected Branch"}
                </h3>
                {availableBranches.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    {isAdmin() ? (
                      <select
                        value={selectedBranchForDaily}
                        onChange={(e) =>
                          setSelectedBranchForDaily(e.target.value)
                        }
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        {availableBranches.map((branch) => (
                          <option
                            key={branch.branch_id}
                            value={branch.branch_id}
                          >
                            {branch.branch_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm font-medium text-gray-700">
                        {availableBranches.find(
                          (b) => b.branch_id === selectedBranchForDaily,
                        )?.branch_name || "Your Branch"}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="h-80">
                {selectedBranchForDaily ? (
                  <div className="w-full h-full p-4">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <RefreshCw className="h-6 w-6 animate-spin text-orange-600 mr-2" />
                        <span className="text-gray-600">Loading chart...</span>
                      </div>
                    ) : branchDailyData.length > 0 ? (
                      <div className="w-full h-full">
                        <div className="overflow-x-auto pb-4">
                          <div
                            className="flex items-end justify-start h-64 space-x-1 mb-4"
                            style={{
                              minWidth: `${branchDailyData.length * 32}px`,
                            }}
                          >
                            {branchDailyData.map((item, index) => {
                              const maxCount = Math.max(
                                ...branchDailyData.map((d) => d.count),
                                1, // Ensure we have at least 1 for scaling
                              );
                              const height =
                                item.count > 0
                                  ? (item.count / maxCount) * 200
                                  : 2; // Min height 2px for zero values
                              return (
                                <div
                                  key={index}
                                  className="flex flex-col items-center space-y-1"
                                >
                                  <div
                                    className={`transition-colors duration-200 rounded-t-sm w-7 flex items-end justify-center relative group ${
                                      item.count > 0
                                        ? "bg-orange-500 hover:bg-orange-600"
                                        : "bg-gray-200 hover:bg-gray-300"
                                    }`}
                                    style={{ height: `${height}px` }}
                                  >
                                    {item.count > 0 && (
                                      <span className="text-white text-xs font-medium mb-1">
                                        {item.count}
                                      </span>
                                    )}
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                                      {item.formatted_date}: {item.count}{" "}
                                      conversations
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-600 text-center w-7">
                                    {new Date(item.date).getDate()}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-700 mb-1">
                            Number of Conversations
                          </div>
                          <div className="text-lg font-semibold text-gray-800 mb-1">
                            {branchDailyData.length > 0
                              ? new Date(
                                  branchDailyData[0].date,
                                ).toLocaleDateString("en-US", {
                                  month: "long",
                                  year: "numeric",
                                })
                              : new Date().toLocaleDateString("en-US", {
                                  month: "long",
                                  year: "numeric",
                                })}
                          </div>
                          <div className="text-xs text-gray-500">
                            Daily data for the current month (
                            {branchDailyData.length} days)
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">
                          <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">
                            No conversations found for this branch in the last
                            month
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <Building2 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">
                        Select a branch to view daily conversations
                      </p>
                    </div>
                  </div>
                )}
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
              "Monthly conversations for the selected city showing conversation trends over the last 12 months."}
            {activeChart === "daily" &&
              "Daily conversation analytics for the selected branch showing trends over the last month."}
            {activeChart === "customers" &&
              "Number of unique customers (CNIC) per month visiting the branches."}
          </p>
        </div>
      </div>
    </div>
  );
}
