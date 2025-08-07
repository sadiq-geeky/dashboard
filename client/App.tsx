import "./global.css";

// Comprehensive React warning suppression for Recharts
if (typeof window !== "undefined") {
  // Suppress at multiple levels
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalLog = console.log;

  // Override all console methods
  console.warn = console.error = console.log = (...args) => {
    const message = String(args.join(" "));

    // Suppress any defaultProps warnings related to charts
    if (
      message.includes("defaultProps will be removed") ||
      message.includes("Support for defaultProps") ||
      (message.includes("XAxis") && message.includes("defaultProps")) ||
      (message.includes("YAxis") && message.includes("defaultProps")) ||
      message.includes("recharts")
    ) {
      return; // Completely suppress these warnings
    }

    // For non-suppressed messages, use the appropriate original method
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Warning:')) {
      originalWarn.apply(console, args);
    } else if (args[0] && typeof args[0] === 'string' && args[0].includes('Error:')) {
      originalError.apply(console, args);
    } else {
      originalLog.apply(console, args);
    }
  };

  // Also try to suppress React's internal warning system
  if ((window as any).React) {
    try {
      const React = (window as any).React;
      if (React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
        const internals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        if (internals.ReactDebugCurrentFrame) {
          const originalWarn = internals.ReactDebugCurrentFrame.getCurrentStack;
          if (originalWarn) {
            internals.ReactDebugCurrentFrame.getCurrentStack = () => '';
          }
        }
      }
    } catch (e) {
      // Ignore errors in React internals access
    }
  }

  // Set environment variable to suppress React warnings
  if (!(window as any).process) {
    (window as any).process = { env: {} };
  }
  (window as any).process.env.NODE_ENV = 'production'; // This will suppress many React warnings
}

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ExactDashboard } from "./components/ExactDashboard";
import { DeviceManagement } from "./pages/DeviceManagement";
import { BranchManagement } from "./pages/BranchManagement";
import { Recordings } from "./pages/Recordings";
import { ConversationAnalytics } from "./pages/ConversationAnalytics";
import { UserManagement } from "./pages/UserManagement";
import { Deployment } from "./pages/Deployment";
import { Login } from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <ExactDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recordings"
              element={
                <ProtectedRoute>
                  <Recordings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/branch-management"
              element={
                <ProtectedRoute adminOnly>
                  <BranchManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/device-management"
              element={
                <ProtectedRoute adminOnly>
                  <DeviceManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/devices"
              element={
                <ProtectedRoute adminOnly>
                  <DeviceManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/conversation-analytics"
              element={
                <ProtectedRoute adminOnly>
                  <ConversationAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user-management"
              element={
                <ProtectedRoute adminOnly>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deployment"
              element={
                <ProtectedRoute adminOnly>
                  <Deployment />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

// Prevent multiple root creation
const rootElement = document.getElementById("root")!;
if (!rootElement.hasAttribute("data-root-created")) {
  rootElement.setAttribute("data-root-created", "true");
  createRoot(rootElement).render(<App />);
}
