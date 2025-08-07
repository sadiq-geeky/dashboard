import React from 'react';
import { XAxis as RechartsXAxis, YAxis as RechartsYAxis } from 'recharts';

// Wrapper for XAxis that suppresses warnings during render
export const XAxis = (props: any) => {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  // Temporarily suppress warnings during render
  console.warn = console.error = () => {};
  
  try {
    const result = <RechartsXAxis {...props} />;
    // Restore console methods
    console.warn = originalWarn;
    console.error = originalError;
    return result;
  } catch (error) {
    // Restore console methods in case of error
    console.warn = originalWarn;
    console.error = originalError;
    throw error;
  }
};

// Wrapper for YAxis that suppresses warnings during render
export const YAxis = (props: any) => {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  // Temporarily suppress warnings during render
  console.warn = console.error = () => {};
  
  try {
    const result = <RechartsYAxis {...props} />;
    // Restore console methods
    console.warn = originalWarn;
    console.error = originalError;
    return result;
  } catch (error) {
    // Restore console methods in case of error
    console.warn = originalWarn;
    console.error = originalError;
    throw error;
  }
};
