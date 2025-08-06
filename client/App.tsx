import "./global.css";

// Comprehensive suppression of Recharts defaultProps warnings
if (typeof window !== 'undefined') {
  // Override console methods
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalLog = console.log;

  const shouldSuppressMessage = (message: string) => {
    return (
      message.includes('defaultProps will be removed from function components') ||
      message.includes('Support for defaultProps will be removed') ||
      (message.includes('XAxis') && message.includes('defaultProps')) ||
      (message.includes('YAxis') && message.includes('defaultProps'))
    );
  };

  console.warn = (...args) => {
    const message = args.map(arg => String(arg)).join(' ');
    if (shouldSuppressMessage(message)) return;
    originalWarn.apply(console, args);
  };

  console.error = (...args) => {
    const message = args.map(arg => String(arg)).join(' ');
    if (shouldSuppressMessage(message)) return;
    originalError.apply(console, args);
  };

  console.log = (...args) => {
    const message = args.map(arg => String(arg)).join(' ');
    if (shouldSuppressMessage(message)) return;
    originalLog.apply(console, args);
  };

  // Also suppress React's internal warning system
  const originalConsoleWarn = window.console.warn;
  window.console.warn = (...args) => {
    const message = args.map(arg => String(arg)).join(' ');
    if (shouldSuppressMessage(message)) return;
    originalConsoleWarn.apply(window.console, args);
  };
}

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ExactDashboard } from "./components/ExactDashboard";
import { DeviceManagement } from "./pages/DeviceManagement";
import { Recordings } from "./pages/Recordings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ExactDashboard />} />
          <Route path="/recordings" element={<Recordings />} />
          <Route path="/devices" element={<DeviceManagement />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
