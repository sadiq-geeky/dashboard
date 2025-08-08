import { RequestHandler } from "express";
import { executeQuery, executeUpdate } from "../config/database";
import { v4 as uuidv4 } from "uuid";

export interface Branch {
  id: string;
  branch_code: string;
  branch_name: string;
  branch_city?: string;
  branch_address?: string;
  region?: string;
  contact_phone?: string;
  contact_email?: string;
  is_active: boolean;
  created_on: string;
  updated_on: string;
}

// Get all branches with pagination
export const getBranches: RequestHandler = async (req, res) => {
  try {
    const { page = "1", limit = "10", search, active } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = "";
    let queryParams: any[] = [];
    const conditions: string[] = [];

    if (search) {
      conditions.push(
        "(branch_name LIKE ? OR branch_code LIKE ? OR branch_city LIKE ?)",
      );
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (active === "true" || active === "false") {
      conditions.push("is_active = ?");
      queryParams.push(active === "true");
    }

    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(" AND ")}`;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM branches ${whereClause}`;
    const [countResult] = await executeQuery<{ total: number }>(
      countQuery,
      queryParams,
    );
    const total = countResult.total;

    // Get paginated results
    const dataQuery = `
      SELECT * FROM branches 
      ${whereClause}
      ORDER BY branch_name ASC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const branches = await executeQuery<Branch>(dataQuery, queryParams);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      data: branches,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching branches:", error);
    res.status(500).json({ error: "Failed to fetch branches" });
  }
};

// Get single branch by ID
export const getBranch: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `SELECT * FROM branches WHERE id = ?`;
    const branches = await executeQuery<Branch>(query, [id]);

    if (branches.length === 0) {
      return res.status(404).json({ error: "Branch not found" });
    }

    res.json(branches[0]);
  } catch (error) {
    console.error("Error fetching branch:", error);
    res.status(500).json({ error: "Failed to fetch branch" });
  }
};

// Create new branch
export const createBranch: RequestHandler = async (req, res) => {
  try {
    const {
      branch_code,
      branch_name,
      branch_city,
      branch_address,
      region,
      contact_phone,
      contact_email,
    } = req.body;

    if (!branch_code || !branch_name) {
      return res
        .status(400)
        .json({ error: "Branch code and name are required" });
    }

    const id = uuidv4();

    const query = `
      INSERT INTO branches 
      (id, branch_code, branch_name, branch_city, branch_address, region, contact_phone, contact_email) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await executeQuery(query, [
      id,
      branch_code,
      branch_name,
      branch_city || null,
      branch_address || null,
      region || null,
      contact_phone || null,
      contact_email || null,
    ]);

    res.status(201).json({
      success: true,
      id,
      message: "Branch created successfully",
    });
  } catch (error: any) {
    console.error("Error creating branch:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "Branch code already exists" });
    } else {
      res.status(500).json({ error: "Failed to create branch" });
    }
  }
};

// Update branch
export const updateBranch: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      branch_code,
      branch_name,
      branch_city,
      branch_address,
      region,
      contact_phone,
      contact_email,
      is_active,
    } = req.body;

    const query = `
      UPDATE branches 
      SET branch_code = ?, branch_name = ?, branch_city = ?, branch_address = ?, 
          region = ?, contact_phone = ?, contact_email = ?, is_active = ?,
          updated_on = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const result = await executeQuery(query, [
      branch_code,
      branch_name,
      branch_city || null,
      branch_address || null,
      region || null,
      contact_phone || null,
      contact_email || null,
      is_active !== undefined ? is_active : true,
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Branch not found" });
    }

    res.json({
      success: true,
      message: "Branch updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating branch:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "Branch code already exists" });
    } else {
      res.status(500).json({ error: "Failed to update branch" });
    }
  }
};

// Delete branch (soft delete by setting is_active to false)
export const deleteBranch: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `UPDATE branches SET is_active = false WHERE id = ?`;
    const result = await executeQuery(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Branch not found" });
    }

    res.json({
      success: true,
      message: "Branch deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting branch:", error);
    res.status(500).json({ error: "Failed to delete branch" });
  }
};
