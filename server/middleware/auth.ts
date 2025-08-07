import { RequestHandler } from "express";
import { executeQuery } from "../config/database";

export interface AuthenticatedRequest extends Request {
  user?: {
    uuid: string;
    username: string;
    role: "admin" | "user";
    branch_id: string | null;
    branch_city: string | null;
    emp_name: string | null;
  };
}

// Simple authentication middleware for demonstration
// In a real app, you'd use JWT tokens or session management
export const authenticate: RequestHandler = async (req: any, res, next) => {
  try {
    // For now, we'll use a simple approach - check for user in headers
    // In production, this would be JWT token validation
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Get user from database with branch info from link table
    const users = await executeQuery<{
      uuid: string;
      username: string;
      role: "admin" | "user";
      branch_id: string | null;
      branch_city: string | null;
      emp_name: string | null;
      is_active: boolean;
    }>(
      `SELECT u.uuid, u.username, u.role,
              ldbu.branch_id as branch_id,
              b.branch_city as branch_city,
              u.emp_name, u.is_active
       FROM users u
       LEFT JOIN link_device_branch_user ldbu ON ldbu.user_id = u.uuid
       LEFT JOIN branches b ON b.id = ldbu.branch_id
       WHERE u.uuid = ? AND u.is_active = true
       LIMIT 1`,
      [userId],
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid user" });
    }

    req.user = users[0];
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

// Middleware to check admin role
export const requireAdmin: RequestHandler = (req: any, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Administrator access required" });
  }

  next();
};

// Middleware to add branch filtering for non-admin users
export const addBranchFilter = (userBranchField: string = "branch_id") => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Admin users can access all data
    if (req.user.role === "admin") {
      req.branchFilter = null;
      return next();
    }

    // Regular users can only access their branch data
    if (!req.user.branch_id) {
      return res.status(403).json({ error: "No branch assigned to user" });
    }

    req.branchFilter = {
      field: userBranchField,
      value: req.user.branch_id,
    };

    next();
  };
};
