import React from "react";
import { Chart } from "react-google-charts";
import { cn } from "@/lib/utils";

export interface GoogleChartProps {
  chartType:
    | "AreaChart"
    | "BarChart"
    | "ColumnChart"
    | "LineChart"
    | "PieChart"
    | "ScatterChart"
    | "Histogram"
    | "ComboChart";
  data: (string | number)[][];
  options?: google.visualization.ChartOptions;
  width?: string | number;
  height?: string | number;
  className?: string;
  title?: string;
  loading?: boolean;
  error?: string | null;
}

const defaultChartOptions: Partial<google.visualization.ChartOptions> = {
  backgroundColor: "transparent",
  chartArea: {
    left: 60,
    top: 50,
    width: "85%",
    height: "75%",
  },
  titleTextStyle: {
    fontSize: 16,
    fontName: "system-ui",
    bold: true,
    color: "#1f2937",
  },
  hAxis: {
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
  vAxis: {
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
  legend: {
    textStyle: {
      fontSize: 12,
      fontName: "system-ui",
      color: "#6b7280",
    },
  },
  animation: {
    startup: true,
    easing: "inAndOut",
    duration: 800,
  },
};

export function GoogleChart({
  chartType,
  data,
  options = {},
  width = "100%",
  height = "100%",
  className,
  title,
  loading = false,
  error = null,
}: GoogleChartProps) {
  const mergedOptions = {
    ...defaultChartOptions,
    ...options,
    title: title || options.title,
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-sm">Loading chart...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="text-center text-red-500">
          <div className="text-sm font-medium">Failed to load chart</div>
          <div className="text-xs text-gray-500 mt-1">{error}</div>
        </div>
      </div>
    );
  }

  // Validate data format
  if (!data || !Array.isArray(data) || data.length <= 1) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="text-center text-gray-500">
          <div className="text-sm font-medium">No data available</div>
          <div className="text-xs mt-1">Check back later for updates</div>
        </div>
      </div>
    );
  }

  // Validate data structure - ensure all rows have the same number of columns
  try {
    const columnCount = data[0]?.length || 0;
    const validData = data.filter(row =>
      Array.isArray(row) && row.length === columnCount && row.every(cell => cell !== undefined && cell !== null)
    );

    if (validData.length <= 1) {
      return (
        <div className={cn("flex items-center justify-center", className)}>
          <div className="text-center text-gray-500">
            <div className="text-sm font-medium">Invalid data format</div>
            <div className="text-xs mt-1">Please check the data structure</div>
          </div>
        </div>
      );
    }
  } catch (validationError) {
    console.error("Chart data validation error:", validationError);
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="text-center text-red-500">
          <div className="text-sm font-medium">Data validation failed</div>
          <div className="text-xs mt-1">Please check console for details</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full h-full", className)}>
      <Chart
        chartType={chartType}
        width={width}
        height={height}
        data={data}
        options={mergedOptions}
      />
    </div>
  );
}

// Predefined chart configurations for common use cases
export const ChartPresets = {
  // Default color palette
  colors: {
    primary: ["#3B82F6", "#1D4ED8", "#2563EB"],
    success: ["#10B981", "#059669", "#047857"],
    warning: ["#F59E0B", "#D97706", "#B45309"],
    danger: ["#EF4444", "#DC2626", "#B91C1C"],
    purple: ["#8B5CF6", "#7C3AED", "#6D28D9"],
    multi: [
      "#0088FE", "#00C49F", "#FFBB28", "#FF8042",
      "#8884D8", "#82CA9D", "#FFC658", "#FF7C7C"
    ],
  },

  // Bar chart for rankings/comparisons
  barChart: (title: string, colors: string[] = ChartPresets.colors.primary): Partial<google.visualization.ChartOptions> => ({
    title,
    colors,
    bar: { groupWidth: "75%" },
    legend: { position: "none" },
  }),

  // Line chart for trends
  lineChart: (title: string, colors: string[] = ChartPresets.colors.primary): Partial<google.visualization.ChartOptions> => ({
    title,
    colors,
    lineWidth: 3,
    pointSize: 5,
    legend: { position: "bottom" },
  }),

  // Area chart for volume over time
  areaChart: (title: string, colors: string[] = ChartPresets.colors.primary): Partial<google.visualization.ChartOptions> => ({
    title,
    colors,
    lineWidth: 3,
    pointSize: 5,
    areaOpacity: 0.3,
    legend: { position: "bottom" },
  }),

  // Pie chart for distribution
  pieChart: (title: string, colors: string[] = ChartPresets.colors.multi): Partial<google.visualization.ChartOptions> => ({
    title,
    colors,
    pieSliceText: "label",
    pieSliceTextStyle: {
      fontSize: 11,
      fontName: "system-ui",
    },
    legend: { position: "right" },
  }),

  // Column chart for categories
  columnChart: (title: string, colors: string[] = ChartPresets.colors.primary): Partial<google.visualization.ChartOptions> => ({
    title,
    colors,
    bar: { groupWidth: "75%" },
    legend: { position: "bottom" },
  }),
};
