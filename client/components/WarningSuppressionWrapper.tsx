import React, { useEffect, ReactNode } from "react";

interface WarningSuppressionWrapperProps {
  children: ReactNode;
}

// Global suppression setup
if (typeof window !== "undefined") {
  // Store original console methods globally
  const originalWarn = console.warn;
  const originalError = console.error;

  // Override console methods globally to catch warnings early
  console.warn = (...args: any[]) => {
    const message = args.join(" ");

    // Check if this is a Recharts defaultProps warning
    if (
      message.includes(
        "Support for defaultProps will be removed from function components",
      ) ||
      message.includes(
        "defaultProps will be removed from function components",
      ) ||
      (message.includes("XAxis") &&
        (message.includes("defaultProps") ||
          message.includes("Support for defaultProps"))) ||
      (message.includes("YAxis") &&
        (message.includes("defaultProps") ||
          message.includes("Support for defaultProps"))) ||
      message.includes("recharts")
    ) {
      // Suppress these warnings completely
      return;
    }

    // Let other warnings through
    originalWarn.apply(console, args);
  };

  console.error = (...args: any[]) => {
    const message = args.join(" ");

    // Check if this is a Recharts defaultProps error
    if (
      message.includes(
        "Support for defaultProps will be removed from function components",
      ) ||
      message.includes(
        "defaultProps will be removed from function components",
      ) ||
      (message.includes("XAxis") &&
        (message.includes("defaultProps") ||
          message.includes("Support for defaultProps"))) ||
      (message.includes("YAxis") &&
        (message.includes("defaultProps") ||
          message.includes("Support for defaultProps"))) ||
      message.includes("recharts")
    ) {
      // Suppress these errors completely
      return;
    }

    // Let other errors through
    originalError.apply(console, args);
  };
}

export function WarningSuppressionWrapper({
  children,
}: WarningSuppressionWrapperProps) {
  return <>{children}</>;
}
