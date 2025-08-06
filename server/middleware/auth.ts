import { RequestHandler } from "express";
import { executeQuery } from "../config/database";

export interface AuthenticatedRequest extends Request {
  user?: {
    uuid: string;
    username: string;
    role: 'admin' | 'user';
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
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user from database
    const users = await executeQuery<{
      uuid: string;
      username: string;
      role: 'admin' | 'user';
      branch_id: string | null;
      branch_city: string | null;
      emp_name: string | null;
      is_active: boolean;
    }>(
      `SELECT uuid, username, role, branch_id, branch_city, emp_name, is_active 
       FROM users WHERE uuid = ? AND is_active = true`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Middleware to check admin role
export const requireAdmin: RequestHandler = (req: any, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access required' });
  }

  next();
};

// Middleware to add branch filtering for non-admin users
export const addBranchFilter = (userBranchField: string = 'branch_id') => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admin users can access all data
    if (req.user.role === 'admin') {
      req.branchFilter = null;
      return next();
    }

    // Regular users can only access their branch data
    if (!req.user.branch_id) {
      return res.status(403).json({ error: 'No branch assigned to user' });
    }

    req.branchFilter = {
      field: userBranchField,
      value: req.user.branch_id
    };

    next();
  };
};
