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
