import "./global.css";

// Simple Recharts warning suppression
if (
  typeof window !== "undefined" &&
  !(window as any).__WARNING_SUPPRESSION_SETUP__
) {
  (window as any).__WARNING_SUPPRESSION_SETUP__ = true;

  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = String(args[0] || "");
    if (
      message.includes("defaultProps will be removed") &&
      (message.includes("XAxis") || message.includes("YAxis"))
    ) {
      return; // Suppress specific Recharts warnings
    }
    originalWarn.apply(console, args);
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
import { ConversationAnalytics } from "./pages/ConversationAnalytics";
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
          <Route path="/conversation-analytics" element={<ConversationAnalytics />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

// Prevent multiple root creation
const rootElement = document.getElementById("root")!;
if (!rootElement.hasAttribute("data-root-created")) {
  rootElement.setAttribute("data-root-created", "true");
  createRoot(rootElement).render(<App />);
}
