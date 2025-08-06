import React, { useEffect, ReactNode } from 'react';

interface WarningSuppressionWrapperProps {
  children: ReactNode;
}

export function WarningSuppressionWrapper({ children }: WarningSuppressionWrapperProps) {
  useEffect(() => {
    // Store original console methods
    const originalWarn = console.warn;
    const originalError = console.error;

    // Override console.warn and console.error to filter Recharts warnings
    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      
      // Check if this is a Recharts defaultProps warning
      if (
        message.includes('defaultProps will be removed from function components') ||
        message.includes('Support for defaultProps will be removed') ||
        (message.includes('XAxis') && message.includes('defaultProps')) ||
        (message.includes('YAxis') && message.includes('defaultProps')) ||
        message.includes('recharts')
      ) {
        // Suppress these warnings
        return;
      }
      
      // Let other warnings through
      originalWarn.apply(console, args);
    };

    console.error = (...args: any[]) => {
      const message = args.join(' ');
      
      // Check if this is a Recharts defaultProps error
      if (
        message.includes('defaultProps will be removed from function components') ||
        message.includes('Support for defaultProps will be removed') ||
        (message.includes('XAxis') && message.includes('defaultProps')) ||
        (message.includes('YAxis') && message.includes('defaultProps')) ||
        message.includes('recharts')
      ) {
        // Suppress these errors
        return;
      }
      
      // Let other errors through
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
