import React, { useState, useEffect } from "react";
import { GoogleChart, ChartPresets } from "./ui/google-chart";
import {
  RefreshCw,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  Target,
  Users,
  Calendar,
  Award,
} from "lucide-react";

interface DemoData {
  monthlyTrends: (string | number)[][];
  performanceByBranch: (string | number)[][];
  customerDistribution: (string | number)[][];
  dailyActivity: (string | number)[][];
  conversionRates: (string | number)[][];
  serviceComparison: (string | number)[][];
}

export function GoogleChartsDemo() {
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<
    | "overview"
    | "trends"
    | "performance"
    | "distribution"
    | "activity"
    | "comparison"
  >("overview");

  // Mock data generator for demonstration
  const generateDemoData = (): DemoData => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const branches = [
      "Downtown Branch", "Mall Branch", "Airport Branch", 
      "University Branch", "Business District", "Suburban Branch"
    ];

    const cities = [
      "Karachi", "Lahore", "Islamabad", "Rawalpindi", 
      "Faisalabad", "Multan", "Peshawar"
    ];

    const services = [
      "Account Opening", "Loan Processing", "Customer Support",
      "Investment Advisory", "Card Services", "Digital Banking"
    ];

    return {
      monthlyTrends: [
        ["Month", "Conversations", "Voice Streams", "Unique Customers"],
        ...months.map(month => [
          month,
          Math.floor(Math.random() * 500) + 100,
          Math.floor(Math.random() * 300) + 50,
          Math.floor(Math.random() * 200) + 30
        ])
      ],

      performanceByBranch: [
        ["Branch", "Conversations"],
        ...branches.map(branch => [
          branch,
          Math.floor(Math.random() * 400) + 50
        ])
      ],

      customerDistribution: [
        ["City", "Customers"],
        ...cities.map(city => [
          city,
          Math.floor(Math.random() * 300) + 20
        ])
      ],

      dailyActivity: [
        ["Date", "Morning", "Afternoon", "Evening"],
        ...Array.from({ length: 30 }, (_, i) => [
          `Day ${i + 1}`,
          Math.floor(Math.random() * 50) + 10,
          Math.floor(Math.random() * 80) + 20,
          Math.floor(Math.random() * 60) + 15
        ])
      ],

      conversionRates: [
        ["Service", "Success Rate"],
        ...services.map(service => [
          service,
          Math.floor(Math.random() * 40) + 60 // 60-100% success rates
        ])
      ],

      serviceComparison: [
        ["Service", "This Month", "Last Month", "Target"],
        ...services.slice(0, 4).map(service => [
          service,
          Math.floor(Math.random() * 150) + 50,
          Math.floor(Math.random() * 120) + 40,
          Math.floor(Math.random() * 50) + 100
        ])
      ]
    };
  };

  const [demoData, setDemoData] = useState<DemoData>(generateDemoData());

  useEffect(() => {
    // Simulate data loading
    setLoading(true);
    const timer = setTimeout(() => {
      setDemoData(generateDemoData());
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => {
      setDemoData(generateDemoData());
      setLoading(false);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-lg border border-gray-100/50 p-8">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <RefreshCw className="h-8 w-8 animate-spin text-white" />
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-indigo-600/20 rounded-2xl blur animate-pulse"></div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Loading Analytics Demo
            </h3>
            <p className="text-gray-600 text-center max-w-md">
              Generating sample data to showcase Google Charts capabilities in your analytics dashboard
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
            <BarChart3 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Google Charts Analytics Demo
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Interactive visualizations powered by Google Charts
            </p>
          </div>
        </div>
        <button
          onClick={refreshData}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          <button
            onClick={() => setSelectedView("overview")}
            className={`p-3 rounded-lg text-sm font-medium transition-all ${
              selectedView === "overview"
                ? "bg-blue-100 text-blue-700 border-2 border-blue-200"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent"
            }`}
          >
            <Activity className="h-4 w-4 mx-auto mb-1" />
            Overview
          </button>
          <button
            onClick={() => setSelectedView("trends")}
            className={`p-3 rounded-lg text-sm font-medium transition-all ${
              selectedView === "trends"
                ? "bg-green-100 text-green-700 border-2 border-green-200"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent"
            }`}
          >
            <TrendingUp className="h-4 w-4 mx-auto mb-1" />
            Trends
          </button>
          <button
            onClick={() => setSelectedView("performance")}
            className={`p-3 rounded-lg text-sm font-medium transition-all ${
              selectedView === "performance"
                ? "bg-purple-100 text-purple-700 border-2 border-purple-200"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent"
            }`}
          >
            <Award className="h-4 w-4 mx-auto mb-1" />
            Performance
          </button>
          <button
            onClick={() => setSelectedView("distribution")}
            className={`p-3 rounded-lg text-sm font-medium transition-all ${
              selectedView === "distribution"
                ? "bg-orange-100 text-orange-700 border-2 border-orange-200"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent"
            }`}
          >
            <PieChart className="h-4 w-4 mx-auto mb-1" />
            Distribution
          </button>
          <button
            onClick={() => setSelectedView("activity")}
            className={`p-3 rounded-lg text-sm font-medium transition-all ${
              selectedView === "activity"
                ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-200"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent"
            }`}
          >
            <Calendar className="h-4 w-4 mx-auto mb-1" />
            Activity
          </button>
          <button
            onClick={() => setSelectedView("comparison")}
            className={`p-3 rounded-lg text-sm font-medium transition-all ${
              selectedView === "comparison"
                ? "bg-red-100 text-red-700 border-2 border-red-200"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent"
            }`}
          >
            <Target className="h-4 w-4 mx-auto mb-1" />
            Comparison
          </button>
        </div>
      </div>

      {/* Chart Display */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {selectedView === "overview" && (
          <>
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Trends</h3>
              <div className="h-80">
                <GoogleChart
                  chartType="LineChart"
                  data={demoData.monthlyTrends}
                  options={ChartPresets.lineChart("Monthly Analytics Overview")}
                />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Performance by Branch</h3>
              <div className="h-80">
                <GoogleChart
                  chartType="ColumnChart"
                  data={demoData.performanceByBranch}
                  options={ChartPresets.columnChart("Branch Performance", ChartPresets.colors.success)}
                />
              </div>
            </div>
          </>
        )}

        {selectedView === "trends" && (
          <>
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 xl:col-span-2">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Yearly Trends - Multi-metric Analysis</h3>
              <div className="h-96">
                <GoogleChart
                  chartType="AreaChart"
                  data={demoData.monthlyTrends}
                  options={ChartPresets.areaChart("Annual Performance Trends", ChartPresets.colors.multi.slice(0, 3))}
                />
              </div>
            </div>
          </>
        )}

        {selectedView === "performance" && (
          <>
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Service Success Rates</h3>
              <div className="h-80">
                <GoogleChart
                  chartType="ColumnChart"
                  data={demoData.conversionRates}
                  options={{
                    ...ChartPresets.columnChart("Success Rates", ChartPresets.colors.success),
                    vAxis: {
                      title: "Success Rate (%)",
                      format: "#'%'",
                      minValue: 0,
                      maxValue: 100,
                    },
                  }}
                />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Branch Performance Ranking</h3>
              <div className="h-80">
                <GoogleChart
                  chartType="BarChart"
                  data={demoData.performanceByBranch}
                  options={{
                    ...ChartPresets.barChart("Branch Conversations", ChartPresets.colors.purple),
                    chartArea: { left: 120, top: 20, width: "70%", height: "85%" },
                  }}
                />
              </div>
            </div>
          </>
        )}

        {selectedView === "distribution" && (
          <>
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Distribution by City</h3>
              <div className="h-80">
                <GoogleChart
                  chartType="PieChart"
                  data={demoData.customerDistribution}
                  options={ChartPresets.pieChart("Customer Distribution")}
                />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Service Usage Distribution</h3>
              <div className="h-80">
                <GoogleChart
                  chartType="PieChart"
                  data={demoData.conversionRates}
                  options={{
                    ...ChartPresets.pieChart("Service Usage"),
                    pieHole: 0.4, // Donut chart
                    sliceVisibilityThreshold: 0.05,
                  }}
                />
              </div>
            </div>
          </>
        )}

        {selectedView === "activity" && (
          <>
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 xl:col-span-2">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Daily Activity Patterns - Last 30 Days</h3>
              <div className="h-96">
                <GoogleChart
                  chartType="ComboChart"
                  data={demoData.dailyActivity}
                  options={{
                    title: "Daily Activity by Time Period",
                    titleTextStyle: {
                      fontSize: 16,
                      fontName: "system-ui",
                      bold: true,
                      color: "#1f2937",
                    },
                    backgroundColor: "transparent",
                    chartArea: { left: 60, top: 50, width: "85%", height: "75%" },
                    colors: ChartPresets.colors.multi.slice(0, 3),
                    vAxes: {
                      0: {
                        title: "Number of Activities",
                        titleTextStyle: { color: "#6b7280", fontSize: 12 },
                        textStyle: { color: "#6b7280", fontSize: 11 },
                      },
                    },
                    hAxis: {
                      title: "Days",
                      titleTextStyle: { color: "#6b7280", fontSize: 12 },
                      textStyle: { color: "#6b7280", fontSize: 10 },
                    },
                    seriesType: "columns",
                    series: {
                      2: { type: "line", targetAxisIndex: 0 },
                    },
                    legend: { position: "bottom" },
                    animation: {
                      startup: true,
                      easing: "inAndOut",
                      duration: 800,
                    },
                  }}
                />
              </div>
            </div>
          </>
        )}

        {selectedView === "comparison" && (
          <>
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 xl:col-span-2">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Service Performance vs Targets</h3>
              <div className="h-96">
                <GoogleChart
                  chartType="ComboChart"
                  data={demoData.serviceComparison}
                  options={{
                    title: "Current vs Previous Month vs Target",
                    titleTextStyle: {
                      fontSize: 16,
                      fontName: "system-ui",
                      bold: true,
                      color: "#1f2937",
                    },
                    backgroundColor: "transparent",
                    chartArea: { left: 60, top: 50, width: "85%", height: "75%" },
                    colors: ["#3B82F6", "#10B981", "#F59E0B"],
                    vAxis: {
                      title: "Performance Score",
                      titleTextStyle: { color: "#6b7280", fontSize: 12 },
                      textStyle: { color: "#6b7280", fontSize: 11 },
                    },
                    hAxis: {
                      title: "Services",
                      titleTextStyle: { color: "#6b7280", fontSize: 12 },
                      textStyle: { color: "#6b7280", fontSize: 11 },
                    },
                    seriesType: "columns",
                    series: {
                      2: { type: "line", lineWidth: 3, pointSize: 7 },
                    },
                    legend: { position: "bottom" },
                    animation: {
                      startup: true,
                      easing: "inAndOut",
                      duration: 800,
                    },
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Features Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <h4 className="text-lg font-bold text-blue-900 mb-3">Google Charts Features Demonstrated</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <span className="font-medium text-blue-800">Interactive Charts:</span>
              <p className="text-blue-700">Hover tooltips, clickable legends, zoom capabilities</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <span className="font-medium text-blue-800">Multiple Chart Types:</span>
              <p className="text-blue-700">Line, Bar, Column, Pie, Area, Combo charts</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <span className="font-medium text-blue-800">Responsive Design:</span>
              <p className="text-blue-700">Adapts to screen sizes and containers</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <span className="font-medium text-blue-800">Animation Effects:</span>
              <p className="text-blue-700">Smooth transitions and startup animations</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <span className="font-medium text-blue-800">Custom Styling:</span>
              <p className="text-blue-700">Consistent theme colors and typography</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <span className="font-medium text-blue-800">Production Ready:</span>
              <p className="text-blue-700">Error handling, loading states, data validation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
