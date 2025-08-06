import { RequestHandler } from "express";
import { executeQuery } from "../config/database";
import { v4 as uuidv4 } from "uuid";

export interface Device {
  id: string;
  device_name: string;
  device_mac?: string;
  ip_address?: string;
  device_type: 'recorder' | 'monitor' | 'other';
  branch_id?: string;
  branch_name?: string;
  branch_code?: string;
  installation_date?: string;
  last_maintenance?: string;
  device_status: 'active' | 'inactive' | 'maintenance';
  notes?: string;
  created_on: string;
  updated_on: string;
}

// Get all devices with pagination and branch info
export const getDevices: RequestHandler = async (req, res) => {
  try {
    const { page = "1", limit = "10", search, branch_id, device_status } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = "";
    let queryParams: any[] = [];
    const conditions: string[] = [];

    if (search) {
      conditions.push("(d.device_name LIKE ? OR d.device_mac LIKE ? OR d.ip_address LIKE ?)");
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (branch_id) {
      conditions.push("d.branch_id = ?");
      queryParams.push(branch_id);
    }

    if (device_status) {
      conditions.push("d.device_status = ?");
      queryParams.push(device_status);
    }

    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(" AND ")}`;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM devices d 
      LEFT JOIN branches b ON d.branch_id = b.id 
      ${whereClause}
    `;
    const [countResult] = await executeQuery<{ total: number }>(countQuery, queryParams);
    const total = countResult.total;

    // Get paginated results with branch info
    const dataQuery = `
      SELECT 
        d.*,
        b.branch_name,
        b.branch_code
      FROM devices d 
      LEFT JOIN branches b ON d.branch_id = b.id
      ${whereClause}
      ORDER BY d.device_name ASC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const devices = await executeQuery<Device>(dataQuery, queryParams);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      data: devices,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching devices:", error);
    res.status(500).json({ error: "Failed to fetch devices" });
  }
};

// Get single device by ID
export const getDevice: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        d.*,
        b.branch_name,
        b.branch_code
      FROM devices d 
      LEFT JOIN branches b ON d.branch_id = b.id
      WHERE d.id = ?
    `;
    const devices = await executeQuery<Device>(query, [id]);

    if (devices.length === 0) {
      return res.status(404).json({ error: "Device not found" });
    }

    res.json(devices[0]);
  } catch (error) {
    console.error("Error fetching device:", error);
    res.status(500).json({ error: "Failed to fetch device" });
  }
};

// Create new device
export const createDevice: RequestHandler = async (req, res) => {
  try {
    const {
      device_name,
      device_mac,
      ip_address,
      device_type,
      branch_id,
      installation_date,
      last_maintenance,
      device_status,
      notes,
    } = req.body;

    if (!device_name) {
      return res.status(400).json({ error: "Device name is required" });
    }

    const id = uuidv4();

    const query = `
      INSERT INTO devices 
      (id, device_name, device_mac, ip_address, device_type, branch_id, 
       installation_date, last_maintenance, device_status, notes) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await executeQuery(query, [
      id,
      device_name,
      device_mac || null,
      ip_address || null,
      device_type || 'recorder',
      branch_id || null,
      installation_date || null,
      last_maintenance || null,
      device_status || 'active',
      notes || null,
    ]);

    res.status(201).json({
      success: true,
      id,
      message: "Device created successfully",
    });
  } catch (error: any) {
    console.error("Error creating device:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "Device MAC address already exists" });
    } else if (error.code === "ER_NO_REFERENCED_ROW_2") {
      res.status(400).json({ error: "Invalid branch ID" });
    } else {
      res.status(500).json({ error: "Failed to create device" });
    }
  }
};

// Update device
export const updateDevice: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      device_name,
      device_mac,
      ip_address,
      device_type,
      branch_id,
      installation_date,
      last_maintenance,
      device_status,
      notes,
    } = req.body;

    const query = `
      UPDATE devices 
      SET device_name = ?, device_mac = ?, ip_address = ?, device_type = ?, 
          branch_id = ?, installation_date = ?, last_maintenance = ?, 
          device_status = ?, notes = ?, updated_on = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const result = await executeQuery(query, [
      device_name,
      device_mac || null,
      ip_address || null,
      device_type || 'recorder',
      branch_id || null,
      installation_date || null,
      last_maintenance || null,
      device_status || 'active',
      notes || null,
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Device not found" });
    }

    res.json({
      success: true,
      message: "Device updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating device:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "Device MAC address already exists" });
    } else if (error.code === "ER_NO_REFERENCED_ROW_2") {
      res.status(400).json({ error: "Invalid branch ID" });
    } else {
      res.status(500).json({ error: "Failed to update device" });
    }
  }
};

// Delete device
export const deleteDevice: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `DELETE FROM devices WHERE id = ?`;
    const result = await executeQuery(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Device not found" });
    }

    res.json({
      success: true,
      message: "Device deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting device:", error);
    res.status(500).json({ error: "Failed to delete device" });
  }
};

// Get devices by branch
export const getDevicesByBranch: RequestHandler = async (req, res) => {
  try {
    const { branch_id } = req.params;

    const query = `
      SELECT 
        d.*,
        b.branch_name,
        b.branch_code
      FROM devices d 
      LEFT JOIN branches b ON d.branch_id = b.id
      WHERE d.branch_id = ?
      ORDER BY d.device_name ASC
    `;

    const devices = await executeQuery<Device>(query, [branch_id]);
    res.json(devices);
  } catch (error) {
    console.error("Error fetching devices by branch:", error);
    res.status(500).json({ error: "Failed to fetch devices by branch" });
  }
};
