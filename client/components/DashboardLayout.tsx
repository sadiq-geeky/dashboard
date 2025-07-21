import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Monitor,
  Settings,
  PlayCircle,
  Menu,
  X,
  Activity,
  Server,
  FileVideo,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Device Monitoring", href: "/", icon: Monitor },
  { name: "Recordings", href: "/recordings", icon: PlayCircle },
  { name: "Device Management", href: "/devices", icon: Settings },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          sidebarOpen ? "block" : "hidden",
        )}
      >
        <div
          className="fixed inset-0 bg-black/20"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-gray-900">
                CRM Dashboard
              </span>
            </div>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="mt-8 px-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300",
          sidebarCollapsed ? "lg:w-16" : "lg:w-72",
        )}
      >
        <div className="flex grow flex-col gap-y-5 border-r border-gray-200 bg-white pb-4 relative">
          {/* Collapse Toggle Button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-3 top-6 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md hover:bg-gray-50 hover:shadow-lg transition-all duration-200"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            )}
          </button>

          <div
            className={cn(
              "flex h-16 shrink-0 items-center",
              sidebarCollapsed ? "px-3" : "px-6",
            )}
          >
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-primary" />
              {!sidebarCollapsed && (
                <span className="text-xl font-bold text-gray-900">
                  CRM Dashboard
                </span>
              )}
            </div>
          </div>

          <nav
            className={cn(
              "flex flex-1 flex-col",
              sidebarCollapsed ? "px-2" : "px-6",
            )}
          >
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          className={cn(
                            "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-gray-700 hover:bg-gray-50 hover:text-primary",
                            sidebarCollapsed && "justify-center",
                          )}
                          title={sidebarCollapsed ? item.name : undefined}
                        >
                          <item.icon
                            className={cn(
                              "h-6 w-6 shrink-0",
                              isActive
                                ? "text-primary-foreground"
                                : "text-gray-400 group-hover:text-primary",
                            )}
                          />
                          {!sidebarCollapsed && item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div
        className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "lg:pl-16" : "lg:pl-72",
        )}
      >
        {/* Mobile header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-gray-900">
              CRM Dashboard
            </span>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
