import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface User {
  uuid: string;
  username: string;
  role: "admin" | "manager" | "user";
  branch_id: string | null;
  branch_city: string | null;
  emp_name: string | null;
  phone_no: string | null;
  email_id: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isAdminOrManager: () => boolean;
  canAccessBranch: (branchId?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved user session in localStorage
    const savedUser = localStorage.getItem("auth_user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("auth_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (
    username: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const userData = data.user;

        // Check if user has branch assigned (except for admin users)
        if (userData.role !== "admin" && !userData.branch_id) {
          return {
            success: false,
            error: "No branch assigned to your account. Please contact your administrator to assign a branch before you can access the system."
          };
        }

        setUser(userData);
        localStorage.setItem("auth_user", JSON.stringify(userData));
        return { success: true };
      } else {
        console.error("Login failed:", data.error);
        return { success: false, error: data.error || "Invalid username or password" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Login failed. Please try again." };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
    // Redirect to login page
    window.location.href = "/login";
  };

  const isAdmin = (): boolean => {
    return user?.role === "admin";
  };

  const isManager = (): boolean => {
    return user?.role === "manager";
  };

  const isAdminOrManager = (): boolean => {
    return user?.role === "admin" || user?.role === "manager";
  };

  const canAccessBranch = (branchId?: string): boolean => {
    if (isAdmin()) {
      return true; // Admins can access all branches
    }

    if (!branchId || !user?.branch_id) {
      return false;
    }

    return user.branch_id === branchId;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    isAdmin,
    isManager,
    isAdminOrManager,
    canAccessBranch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
