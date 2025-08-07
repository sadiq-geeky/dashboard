import React, { ReactNode, useEffect } from 'react';

interface RechartsWarningSuppressionWrapperProps {
  children: ReactNode;
}

export function RechartsWarningSuppressionWrapper({ children }: RechartsWarningSuppressionWrapperProps) {
  useEffect(() => {
    // Store original console methods
    const originalWarn = console.warn;
    const originalError = console.error;

    // Override console methods specifically for this component's lifecycle
    console.warn = (...args) => {
      const message = args.join(' ');
      if (
        message.includes('defaultProps will be removed') ||
        message.includes('Support for defaultProps') ||
        message.includes('XAxis') ||
        message.includes('YAxis') ||
        message.includes('recharts') ||
        message.includes('CategoricalChartWrapper')
      ) {
        return; // Suppress recharts warnings
      }
      originalWarn.apply(console, args);
    };

    console.error = (...args) => {
      const message = args.join(' ');
      if (
        message.includes('defaultProps') ||
        message.includes('XAxis') ||
        message.includes('YAxis') ||
        message.includes('recharts')
      ) {
        return; // Suppress recharts errors
      }
      originalError.apply(console, args);
    };

    // Cleanup function to restore original console methods
    return () => {
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  return <>{children}</>;
}
