import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "../contexts/AuthContext";
import {
  Grid3X3,
  BarChart3,
  Monitor,
  Mail,
  Building2,
  Users,
  Settings,
} from "lucide-react";

interface AdminNavigationProps {
  className?: string;
}

export function AdminNavigation({ className }: AdminNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();
  
  // Get current active page
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
      group: "core"
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      onClick: () => navigate("/?tab=analytics"),
      group: "core"
    },
    {
      id: "device-status",
      label: "Device Status",
      icon: Monitor,
      onClick: () => navigate("/?tab=device-status"),
      group: "core",
      adminOnly: true
    },
    {
      id: "complaints",
      label: "Complaints",
      icon: Mail,
      onClick: () => navigate("/complaints"),
      group: "core"
    },
    // Second group: Admin management
    {
      id: "branches",
      label: "Branches",
      icon: Building2,
      onClick: () => navigate("/branch-management"),
      group: "admin",
      adminOnly: true
    },
    {
      id: "devices",
      label: "Devices",
      icon: Monitor,
      onClick: () => navigate("/device-management"),
      group: "admin",
      adminOnly: true
    },
    {
      id: "users",
      label: "Users",
      icon: Users,
      onClick: () => navigate("/user-management"),
      group: "admin",
      adminOnly: true
    },
    {
      id: "deployment",
      label: "Deployment",
      icon: Settings,
      onClick: () => navigate("/deployment"),
      group: "admin",
      adminOnly: true
    }
  ];

  // Filter items based on admin status
  const visibleItems = navigationItems.filter(item => 
    !item.adminOnly || isAdmin()
  );

  const coreItems = visibleItems.filter(item => item.group === "core");
  const adminItems = visibleItems.filter(item => item.group === "admin");

  return (
    <div className={cn("bg-white border-b border-gray-200 shadow-sm", className)}>
      <div className="flex items-center justify-start py-4 px-4">
        <div className="flex items-center space-x-3">
          {/* Core functionality group */}
          {coreItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={cn(
                  "flex flex-col items-center px-6 py-4 rounded-lg transition-all duration-200 min-w-[90px]",
                  isActive
                    ? "text-primary bg-primary/5 border-2 border-primary/20 shadow-sm"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50",
                )}
              >
                <Icon className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}

          {/* Admin group separator */}
          {isAdmin() && adminItems.length > 0 && (
            <div className="w-px h-12 bg-gray-300 mx-4"></div>
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
                  "flex flex-col items-center px-6 py-4 rounded-lg transition-all duration-200 min-w-[90px]",
                  isActive
                    ? "text-primary bg-primary/5 border-2 border-primary/20 shadow-sm"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50",
                )}
              >
                <Icon className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
