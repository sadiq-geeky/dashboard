import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LogOut,
  User,
  ChevronDown,
  Shield,
  Building2,
  ArrowLeft,
  Home,
  Grid3X3,
  BarChart3,
  Monitor,
  Mail,
  Users,
  Settings,
} from "lucide-react";

export function Header() {
  const { user, logout, isAdmin } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const isOnDashboard = location.pathname === "/";
  const goBackToDashboard = () => navigate("/");

  // Get current active page for navigation
  const getCurrentPage = () => {
    const path = location.pathname;
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get("tab");

    if (path === "/" && !tab) return "home";
    if (path === "/" && tab === "analytics") return "analytics";
    if (path === "/" && tab === "device-status") return "device-status";
    if (path === "/complaints") return "complaints";
    if (path === "/branch-management") return "branches";
    if (path === "/device-management") return "devices";
    if (path === "/user-management") return "users";
    if (path === "/deployment") return "deployment";

    return "";
  };

  const currentPage = getCurrentPage();

  const navigationItems = [
    // First group: Core functionality
    {
      id: "home",
      label: "Home",
      icon: Grid3X3,
      onClick: () => navigate("/"),
      group: "core",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      onClick: () => navigate("/?tab=analytics"),
      group: "core",
    },
    {
      id: "device-status",
      label: "Device Status",
      icon: Monitor,
      onClick: () => navigate("/?tab=device-status"),
      group: "core",
      adminOnly: true,
    },
    {
      id: "complaints",
      label: "Complaints",
      icon: Mail,
      onClick: () => navigate("/complaints"),
      group: "core",
    },
    // Second group: Admin management
    {
      id: "branches",
      label: "Branches",
      icon: Building2,
      onClick: () => navigate("/branch-management"),
      group: "admin",
      adminOnly: true,
    },
    {
      id: "devices",
      label: "Devices",
      icon: Monitor,
      onClick: () => navigate("/device-management"),
      group: "admin",
      adminOnly: true,
    },
    {
      id: "users",
      label: "Users",
      icon: Users,
      onClick: () => navigate("/user-management"),
      group: "admin",
      adminOnly: true,
    },
    {
      id: "deployment",
      label: "Deployment",
      icon: Settings,
      onClick: () => navigate("/deployment"),
      group: "admin",
      adminOnly: true,
    },
  ];

  // Filter items based on admin status
  const visibleItems = navigationItems.filter(
    (item) => !item.adminOnly || isAdmin(),
  );

  const coreItems = visibleItems.filter((item) => item.group === "core");
  const adminItems = visibleItems.filter((item) => item.group === "admin");

  return (
    <div
      className="bg-white border-b border-gray-200 px-5 py-1"
      style={{ padding: "5px 24px 5px 20px" }}
    >
      <div
        className="flex items-center justify-between"
        style={{ fontWeight: "300" }}
      >
        <div className="flex items-center space-x-6">
          {/* Clickable logo */}
          <button
            onClick={goBackToDashboard}
            className="flex items-center hover:opacity-80 transition-opacity"
            title="Go to Dashboard"
          >
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F7967a1920bbf4ce0ae781c5d84b92543%2F0958e94a3cce420e957ba5a524dc2794?format=webp&width=800"
              alt="Bank Alfalah Logo"
              className="h-8 w-auto object-contain"
            />
          </button>

          {/* Navigation tabs */}
          <div className="flex items-center space-x-1.5">
            {/* Core functionality group */}
            {coreItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className={cn(
                    "flex flex-col items-center justify-center px-2 py-1.5 rounded-md transition-all duration-200 min-w-[55px]",
                    isActive
                      ? "text-primary bg-primary/5 border-2 border-primary/20 shadow-sm"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50",
                  )}
                >
                  <Icon className="w-4 h-4 mb-0.5" />
                  <span className="text-[10px] font-medium leading-tight text-center">{item.label}</span>
                </button>
              );
            })}

            {/* Admin group separator */}
            {isAdmin() && adminItems.length > 0 && (
              <div className="w-px h-6 bg-gray-300 mx-1.5"></div>
            )}

            {/* Admin management group */}
            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className={cn(
                    "flex flex-col items-center justify-center px-2 py-1.5 rounded-md transition-all duration-200 min-w-[55px]",
                    isActive
                      ? "text-primary bg-primary/5 border-2 border-primary/20 shadow-sm"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50",
                  )}
                >
                  <Icon className="w-4 h-4 mb-0.5" />
                  <span className="text-[10px] font-medium leading-tight text-center">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              {user.branch_city && (
                <div className="flex items-center space-x-1">
                  <Building2 className="h-4 w-4" />
                  <span>Branch: {user.branch_city}</span>
                </div>
              )}
            </div>
          </div>

          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 text-sm bg-white border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <div className="flex items-center space-x-2">
                <div className="h-6 w-6 bg-red-100 rounded-full flex items-center justify-center">
                  {isAdmin() ? (
                    <Shield className="h-3 w-3 text-red-600" />
                  ) : (
                    <User className="h-3 w-3 text-red-600" />
                  )}
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">
                    {user.emp_name || user.username}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {user.role}
                  </div>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">
                      {user.emp_name || user.username}
                    </p>
                    <p className="text-xs text-gray-500">@{user.username}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          isAdmin()
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {isAdmin() ? (
                          <>
                            <Shield className="h-3 w-3 mr-1" />
                            Administrator
                          </>
                        ) : (
                          <>
                            <User className="h-3 w-3 mr-1" />
                            User
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Navigation Menu */}
                  <div className="py-1 border-b border-gray-200">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        navigate("/");
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <Home className="h-4 w-4" />
                      <span>Dashboard</span>
                    </button>

                    {isAdmin() && (
                      <>
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            navigate("/branch-management");
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <Building2 className="h-4 w-4" />
                          <span>Branch Management</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            navigate("/device-management");
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <Shield className="h-4 w-4" />
                          <span>Device Management</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            navigate("/user-management");
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <User className="h-4 w-4" />
                          <span>User Management</span>
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
