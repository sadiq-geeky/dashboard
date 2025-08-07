import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Lock, User, Eye, EyeOff, LogIn } from "lucide-react";

export function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      window.location.href = "/";
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!username || !password) {
      setError("Please enter both username and password");
      setIsLoading(false);
      return;
    }

    const success = await login(username, password);

    if (success) {
      window.location.href = "/";
    } else {
      setError("Invalid username or password");
    }

    setIsLoading(false);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-2 overflow-hidden">
      <div className="w-full max-w-6xl flex items-center justify-center">
        <div className="grid lg:grid-cols-2 gap-6 items-center w-full max-w-4xl">
          {/* Left side - Branding */}
          <div className="hidden lg:block space-y-4 px-6">
            <div className="space-y-3">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F7967a1920bbf4ce0ae781c5d84b92543%2F0958e94a3cce420e957ba5a524dc2794?format=webp&width=800"
                alt="Bank Alfalah Logo"
                className="h-16 w-auto object-contain"
              />
              <div className="space-y-3">
                <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                  Voice Recording<br />
                  <span className="text-red-600">Management System</span>
                </h1>
                <p className="text-base text-gray-600 leading-relaxed">
                  Secure access to your voice recording dashboard. Monitor, analyze, and manage all recording activities.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                <span className="text-sm text-gray-600">Real-time monitoring</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                <span className="text-sm text-gray-600">Advanced analytics</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                <span className="text-sm text-gray-600">Secure data handling</span>
              </div>
            </div>
          </div>

          {/* Right side - Login Form */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 space-y-5">
              {/* Mobile logo */}
              <div className="lg:hidden text-center">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F7967a1920bbf4ce0ae781c5d84b92543%2F0958e94a3cce420e957ba5a524dc2794?format=webp&width=800"
                  alt="Bank Alfalah Logo"
                  className="h-12 w-auto mx-auto object-contain"
                />
              </div>

              <div className="text-center lg:text-left space-y-1">
                <h2 className="text-xl font-bold text-gray-900">
                  Welcome back
                </h2>
                <p className="text-sm text-gray-600">
                  Sign in to access your dashboard
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                    <div className="text-sm text-red-800">{error}</div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg bg-white/50 backdrop-blur-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                        placeholder="Enter your username"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg bg-white/50 backdrop-blur-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                        placeholder="Enter your password"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <LogIn className="h-4 w-4 mr-2" />
                  )}
                  {isLoading ? "Signing in..." : "Sign in"}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => (window.location.href = "/forgot-password")}
                    className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                  >
                    Forgot your password?
                  </button>
                </div>
              </form>

              <div className="border-t border-gray-200 pt-3 text-center">
                <p className="text-xs text-gray-500">
                  Powered by SE TECH (Pvt.) Ltd.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Contact your administrator for account access
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
