import { RequestHandler } from "express";
import { executeQuery } from "../config/database";
import { v4 as uuidv4 } from "uuid";

export interface Complaint {
  complaint_id: string;
  branch_id: string;
  branch_name: string;
  timestamp: string;
  customer_data: string; // JSON string containing customer information
  complaint_text: string;
  status: "pending" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  created_on: string;
  updated_on: string;
}

export interface CustomerData {
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_cnic?: string;
  device_used?: string;
  issue_category?: string;
}

export interface PaginatedComplaints {
  data: Complaint[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Get all complaints with pagination, search, and filtering
export const getComplaints: RequestHandler = async (req, res) => {
  try {
    const {
      page = "1",
      limit = "10",
      search,
      branch_id,
      status,
      priority,
      sort_by = "timestamp",
      sort_order = "desc",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build WHERE clause for filtering and search
    let whereClause = "WHERE 1=1";
    let queryParams: any[] = [];

    if (search) {
      whereClause +=
        " AND (c.branch_name LIKE ? OR c.complaint_text LIKE ? OR c.customer_data LIKE ?)";
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (branch_id) {
      whereClause += " AND c.branch_id = ?";
      queryParams.push(branch_id);
    }

    if (status) {
      whereClause += " AND c.status = ?";
      queryParams.push(status);
    }

    if (priority) {
      whereClause += " AND c.priority = ?";
      queryParams.push(priority);
    }

    // Validate sort parameters
    const validSortColumns = [
      "timestamp",
      "branch_name",
      "status",
      "priority",
      "created_on",
    ];
    const sortColumn = validSortColumns.includes(sort_by as string)
      ? sort_by
      : "timestamp";
    const sortDirection = sort_order === "asc" ? "ASC" : "DESC";

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM complaints c
      ${whereClause}
    `;
    const [countResult] = await executeQuery<{ total: number }>(
      countQuery,
      queryParams,
    );
    const total = countResult.total;

    // Get paginated results
    const dataQuery = `
      SELECT
        c.complaint_id,
        c.branch_id,
        c.branch_name,
        c.timestamp,
        c.customer_data,
        c.complaint_text,
        c.status,
        c.priority,
        c.created_on,
        c.updated_on
      FROM complaints c
      ${whereClause}
      ORDER BY c.${sortColumn} ${sortDirection}
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const complaints = await executeQuery<Complaint>(dataQuery, queryParams);
    const totalPages = Math.ceil(total / limitNum);

    const response: PaginatedComplaints = {
      data: complaints,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
};

// Get single complaint by ID with full details
export const getComplaint: RequestHandler = async (req, res) => {
  try {
    const { complaint_id } = req.params;

    const query = `
      SELECT
        c.complaint_id,
        c.branch_id,
        c.branch_name,
        c.timestamp,
        c.customer_data,
        c.complaint_text,
        c.status,
        c.priority,
        c.created_on,
        c.updated_on,
        b.branch_address,
        b.branch_city,
        b.branch_code,
        b.contact_phone as branch_phone,
        b.contact_email as branch_email
      FROM complaints c
      LEFT JOIN branches b ON c.branch_id = b.id
      WHERE c.complaint_id = ?
    `;

    const complaints = await executeQuery<
      Complaint & {
        branch_address?: string;
        branch_city?: string;
        branch_code?: string;
        branch_phone?: string;
        branch_email?: string;
      }
    >(query, [complaint_id]);

    if (complaints.length === 0) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    const complaint = complaints[0];

    // Parse customer data if it's a JSON string
    let customerData = {};
    try {
      customerData =
        typeof complaint.customer_data === "string"
          ? JSON.parse(complaint.customer_data)
          : complaint.customer_data;
    } catch (e) {
      customerData = { raw_data: complaint.customer_data };
    }

    res.json({
      ...complaint,
      customer_data: customerData,
    });
  } catch (error) {
    console.error("Error fetching complaint:", error);
    res.status(500).json({ error: "Failed to fetch complaint" });
  }
};

// Create new complaint
export const createComplaint: RequestHandler = async (req, res) => {
  try {
    console.log("Creating complaint with request body:", JSON.stringify(req.body, null, 2));

    const {
      branch_id,
      branch_name,
      customer_data,
      complaint_text,
      status = "pending",
      priority = "medium",
    } = req.body;

    if (!branch_id || !branch_name || !complaint_text) {
      console.log("Validation failed:", { branch_id, branch_name, complaint_text });
      return res.status(400).json({
        error: "Branch ID, branch name, and complaint text are required",
      });
    }

    const complaint_id = uuidv4();
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Ensure customer_data is stored as JSON string
    const customerDataString =
      typeof customer_data === "object"
        ? JSON.stringify(customer_data)
        : customer_data || "{}";

    const query = `
      INSERT INTO complaints
      (complaint_id, branch_id, branch_name, timestamp, customer_data, complaint_text, status, priority, created_on, updated_on)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    console.log("Executing query with params:", {
      complaint_id,
      branch_id,
      branch_name,
      timestamp,
      customerDataString,
      complaint_text,
      status,
      priority,
    });

    await executeQuery(query, [
      complaint_id,
      branch_id,
      branch_name,
      timestamp,
      customerDataString,
      complaint_text,
      status,
      priority,
    ]);

    console.log("Complaint created successfully:", complaint_id);

    res.status(201).json({
      success: true,
      complaint_id,
      message: "Complaint created successfully",
    });
  } catch (error) {
    console.error("Error creating complaint:", error);
    console.error("Error type:", typeof error);
    console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
    console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

    // Return more specific error information
    let errorMessage = "Failed to create complaint";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    res.status(500).json({
      error: errorMessage,
      details: process.env.NODE_ENV === "development" ? error : undefined
    });
  }
};

// Update complaint status or details
export const updateComplaint: RequestHandler = async (req, res) => {
  try {
    const { complaint_id } = req.params;
    const { status, priority, complaint_text, customer_data } = req.body;

    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (status) {
      updateFields.push("status = ?");
      updateValues.push(status);
    }

    if (priority) {
      updateFields.push("priority = ?");
      updateValues.push(priority);
    }

    if (complaint_text) {
      updateFields.push("complaint_text = ?");
      updateValues.push(complaint_text);
    }

    if (customer_data) {
      updateFields.push("customer_data = ?");
      updateValues.push(
        typeof customer_data === "object"
          ? JSON.stringify(customer_data)
          : customer_data,
      );
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updateFields.push("updated_on = NOW()");
    updateValues.push(complaint_id);

    const query = `
      UPDATE complaints
      SET ${updateFields.join(", ")}
      WHERE complaint_id = ?
    `;

    const result = await executeQuery(query, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    res.json({
      success: true,
      message: "Complaint updated successfully",
    });
  } catch (error) {
    console.error("Error updating complaint:", error);
    res.status(500).json({ error: "Failed to update complaint" });
  }
};

// Delete complaint (admin only)
export const deleteComplaint: RequestHandler = async (req, res) => {
  try {
    const { complaint_id } = req.params;

    const query = `DELETE FROM complaints WHERE complaint_id = ?`;
    const result = await executeQuery(query, [complaint_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    res.json({
      success: true,
      message: "Complaint deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting complaint:", error);
    res.status(500).json({ error: "Failed to delete complaint" });
  }
};

// Get complaints statistics for dashboard
export const getComplaintsStats: RequestHandler = async (req, res) => {
  try {
    const { branch_id } = req.query;

    // Build WHERE clause for branch filtering
    let whereClause = "WHERE 1=1";
    let queryParams: any[] = [];

    if (branch_id) {
      whereClause += " AND branch_id = ?";
      queryParams.push(branch_id);
    }

    const statsQuery = `
      SELECT
        COUNT(*) as total_complaints,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_complaints,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_complaints,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_complaints,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_complaints,
        SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent_complaints,
        SUM(CASE WHEN DATE(created_on) = CURDATE() THEN 1 ELSE 0 END) as today_complaints
      FROM complaints
      ${whereClause}
    `;

    const [stats] = await executeQuery<{
      total_complaints: number;
      pending_complaints: number;
      in_progress_complaints: number;
      resolved_complaints: number;
      closed_complaints: number;
      urgent_complaints: number;
      today_complaints: number;
    }>(statsQuery, queryParams);

    res.json(
      stats || {
        total_complaints: 0,
        pending_complaints: 0,
        in_progress_complaints: 0,
        resolved_complaints: 0,
        closed_complaints: 0,
        urgent_complaints: 0,
        today_complaints: 0,
      },
    );
  } catch (error) {
    console.error("Error fetching complaints stats:", error);
    res.status(500).json({ error: "Failed to fetch complaints statistics" });
  }
};

// Get detailed analytics for complaints (charts, trends, etc.)
export const getComplaintsAnalytics: RequestHandler = async (req, res) => {
  try {
    const { branch_id } = req.query;

    // Build WHERE clause for branch filtering
    let whereClause = "WHERE 1=1";
    let queryParams: any[] = [];

    if (branch_id) {
      whereClause += " AND branch_id = ?";
      queryParams.push(branch_id);
    }

    // Get monthly trends for the last 6 months
    const monthlyTrendsQuery = `
      SELECT
        DATE_FORMAT(created_on, '%Y-%m') as month,
        COUNT(*) as total_complaints,
        SUM(CASE WHEN status = 'resolved' OR status = 'closed' THEN 1 ELSE 0 END) as resolved_complaints
      FROM complaints
      ${whereClause}
      AND created_on >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_on, '%Y-%m')
      ORDER BY month ASC
    `;

    const monthlyTrends = await executeQuery<{
      month: string;
      total_complaints: number;
      resolved_complaints: number;
    }>(monthlyTrendsQuery, queryParams);

    // Get priority distribution
    const priorityQuery = `
      SELECT
        priority,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM complaints ${whereClause})), 1) as percentage
      FROM complaints
      ${whereClause}
      GROUP BY priority
    `;

    // We need to pass queryParams twice - once for the subquery and once for the main query
    const priorityParams = [...queryParams, ...queryParams];
    const priorityDistribution = await executeQuery<{
      priority: string;
      count: number;
      percentage: number;
    }>(priorityQuery, priorityParams);

    // Get status distribution
    const statusQuery = `
      SELECT
        status,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM complaints ${whereClause})), 1) as percentage
      FROM complaints
      ${whereClause}
      GROUP BY status
    `;

    // We need to pass queryParams twice - once for the subquery and once for the main query
    const statusParams = [...queryParams, ...queryParams];
    const statusDistribution = await executeQuery<{
      status: string;
      count: number;
      percentage: number;
    }>(statusQuery, statusParams);

    // Calculate average resolution time (in days)
    const resolutionTimeQuery = `
      SELECT
        AVG(DATEDIFF(updated_on, created_on)) as avg_resolution_days
      FROM complaints
      ${whereClause}
      AND (status = 'resolved' OR status = 'closed')
    `;

    const [resolutionTimeResult] = await executeQuery<{
      avg_resolution_days: number;
    }>(resolutionTimeQuery, queryParams);

    // Get recent activity (last 10 activities)
    const recentActivityQuery = `
      SELECT
        complaint_id,
        complaint_text,
        status,
        priority,
        updated_on,
        branch_name
      FROM complaints
      ${whereClause}
      ORDER BY updated_on DESC
      LIMIT 10
    `;

    const recentActivity = await executeQuery<{
      complaint_id: string;
      complaint_text: string;
      status: string;
      priority: string;
      updated_on: string;
      branch_name: string;
    }>(recentActivityQuery, queryParams);

    // Calculate satisfaction rate (placeholder - in real app this would come from feedback)
    const satisfactionRate = 85; // Mock data

    res.json({
      monthlyTrends: monthlyTrends.map(trend => ({
        month: trend.month,
        totalComplaints: trend.total_complaints,
        resolvedComplaints: trend.resolved_complaints,
        resolutionRate: trend.total_complaints > 0
          ? Math.round((trend.resolved_complaints / trend.total_complaints) * 100)
          : 0
      })),
      priorityDistribution,
      statusDistribution,
      avgResolutionTime: resolutionTimeResult?.avg_resolution_days || 0,
      satisfactionRate,
      recentActivity: recentActivity.map(activity => ({
        id: activity.complaint_id,
        text: activity.complaint_text.substring(0, 50) + '...',
        status: activity.status,
        priority: activity.priority,
        updatedOn: activity.updated_on,
        branchName: activity.branch_name
      }))
    });
  } catch (error) {
    console.error("Error fetching complaints analytics:", error);
    res.status(500).json({ error: "Failed to fetch complaints analytics" });
  }
};
