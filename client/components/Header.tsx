import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, ChevronDown, Shield, Building2, ArrowLeft, Home } from 'lucide-react';

export function Header() {
  const { user, logout, isAdmin } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const isOnDashboard = location.pathname === '/';
  const goBackToDashboard = () => navigate('/');

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F7967a1920bbf4ce0ae781c5d84b92543%2F0958e94a3cce420e957ba5a524dc2794?format=webp&width=800"
            alt="Bank Alfalah Logo"
            className="h-8 w-auto object-contain"
          />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Voice Recording System
            </h1>
            <p className="text-sm text-gray-500">Powered by SE TECH (Pvt.) Ltd.</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              {user.branch_id && (
                <div className="flex items-center space-x-1">
                  <Building2 className="h-4 w-4" />
                  <span>Branch: {user.branch_id}</span>
                  {user.branch_city && (
                    <span className="text-gray-400">({user.branch_city})</span>
                  )}
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
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        isAdmin()
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
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
