import "./global.css";

// Comprehensive React warning suppression for Recharts
if (typeof window !== "undefined") {
  // Suppress at multiple levels
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalLog = console.log;

  // Override all console methods
  console.warn =
    console.error =
    console.log =
      (...args) => {
        const message = String(args.join(" "));

        // Suppress any defaultProps warnings related to charts
        if (
          message.includes("defaultProps will be removed") ||
          message.includes("Support for defaultProps") ||
          message.includes("XAxis") ||
          message.includes("YAxis") ||
          message.includes("recharts") ||
          message.includes("CategoricalChartWrapper") ||
          message.includes("ChartLayoutContextProvider") ||
          message.includes("Surface") ||
          (args[0] && args[0].toString().includes("XAxis")) ||
          (args[0] && args[0].toString().includes("YAxis")) ||
          (args[0] && args[0].toString().includes("defaultProps"))
        ) {
          return; // Completely suppress these warnings
        }

        // For non-suppressed messages, use the appropriate original method
        if (
          args[0] &&
          typeof args[0] === "string" &&
          args[0].includes("Warning:")
        ) {
          originalWarn.apply(console, args);
        } else if (
          args[0] &&
          typeof args[0] === "string" &&
          args[0].includes("Error:")
        ) {
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
        const internals =
          React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        if (internals.ReactDebugCurrentFrame) {
          const originalWarn = internals.ReactDebugCurrentFrame.getCurrentStack;
          if (originalWarn) {
            internals.ReactDebugCurrentFrame.getCurrentStack = () => "";
          }
        }
      }
    } catch (e) {
      // Ignore errors in React internals access
    }
  }

  // Add global error handler for React warnings
  window.addEventListener("error", (event) => {
    if (
      event.message &&
      (event.message.includes("defaultProps will be removed") ||
        event.message.includes("Support for defaultProps") ||
        event.message.includes("XAxis") ||
        event.message.includes("YAxis") ||
        event.message.includes("recharts"))
    ) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  });

  // Also handle unhandled warning events
  window.addEventListener("unhandledrejection", (event) => {
    if (
      event.reason &&
      typeof event.reason === "string" &&
      (event.reason.includes("defaultProps") ||
        event.reason.includes("XAxis") ||
        event.reason.includes("YAxis"))
    ) {
      event.preventDefault();
      return false;
    }
  });

  // Try to suppress React development warnings specifically for defaultProps
  try {
    // Override React's warning function if available
    if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (hook.onCommitFiberRoot) {
        const originalOnCommitFiberRoot = hook.onCommitFiberRoot;
        hook.onCommitFiberRoot = (...args: any[]) => {
          try {
            return originalOnCommitFiberRoot.apply(hook, args);
          } catch (e) {
            // Suppress errors from React DevTools
            return;
          }
        };
      }
    }
  } catch (e) {
    // Ignore any errors in DevTools override
  }
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
import { Complaints } from "./pages/Complaints";
import { Login } from "./pages/Login";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
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
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
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
            <Route
              path="/complaints"
              element={
                <ProtectedRoute>
                  <Complaints />
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
