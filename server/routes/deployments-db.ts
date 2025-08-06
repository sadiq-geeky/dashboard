import { RequestHandler } from "express";
import { executeQuery } from "../config/database";
import { v4 as uuidv4 } from "uuid";

export interface Deployment {
  uuid: string;
  device_id: string;
  branch_id: string;
  user_id: string;
  created_on: string;
  updated_on: string;
  created_by?: string;
  updated_by?: string;
}

// Get all deployments with related data
export const getDeployments: RequestHandler = async (req, res) => {
  try {
    const query = `
      SELECT 
        ldbu.*,
        d.device_name,
        d.device_mac,
        d.ip_address,
        d.device_type,
        d.device_status,
        b.branch_code,
        b.branch_name,
        b.branch_city,
        b.branch_address,
        u.username,
        u.email_id,
        u.role,
        u.emp_name
      FROM link_device_branch_user ldbu
      LEFT JOIN devices d ON d.id = ldbu.device_id
      LEFT JOIN branches b ON b.id = ldbu.branch_id
      LEFT JOIN users u ON u.uuid = ldbu.user_id
      ORDER BY ldbu.created_on DESC
    `;

    const deployments = await executeQuery(query);
    
    // Transform the data to include nested objects
    const transformedDeployments = deployments.map((row: any) => ({
      uuid: row.uuid,
      device_id: row.device_id,
      branch_id: row.branch_id,
      user_id: row.user_id,
      created_on: row.created_on,
      updated_on: row.updated_on,
      created_by: row.created_by,
      updated_by: row.updated_by,
      device: row.device_name ? {
        id: row.device_id,
        device_name: row.device_name,
        device_mac: row.device_mac,
        ip_address: row.ip_address,
        device_type: row.device_type,
        device_status: row.device_status
      } : null,
      branch: row.branch_name ? {
        id: row.branch_id,
        branch_code: row.branch_code,
        branch_name: row.branch_name,
        branch_city: row.branch_city,
        branch_address: row.branch_address
      } : null,
      user: row.username ? {
        uuid: row.user_id,
        username: row.username,
        email: row.email_id,
        role: row.role,
        full_name: row.emp_name
      } : null
    }));

    res.json({
      success: true,
      data: transformedDeployments
    });
  } catch (error) {
    console.error("Error fetching deployments:", error);
    res.status(500).json({ error: "Failed to fetch deployments" });
  }
};

// Create new deployment
export const createDeployment: RequestHandler = async (req, res) => {
  try {
    const { device_id, branch_id, user_id } = req.body;

    if (!device_id || !branch_id || !user_id) {
      return res.status(400).json({ 
        error: "Device ID, Branch ID, and User ID are required" 
      });
    }

    // Check if device is already deployed
    const existingDeviceDeployment = await executeQuery(
      'SELECT uuid FROM link_device_branch_user WHERE device_id = ?',
      [device_id]
    );

    if (existingDeviceDeployment.length > 0) {
      return res.status(400).json({ 
        error: "Device is already deployed to another branch" 
      });
    }

    // Check if branch already has a device
    const existingBranchDeployment = await executeQuery(
      'SELECT uuid FROM link_device_branch_user WHERE branch_id = ?',
      [branch_id]
    );

    if (existingBranchDeployment.length > 0) {
      return res.status(400).json({ 
        error: "Branch already has a device assigned" 
      });
    }

    // Check if user is already assigned
    const existingUserDeployment = await executeQuery(
      'SELECT uuid FROM link_device_branch_user WHERE user_id = ?',
      [user_id]
    );

    if (existingUserDeployment.length > 0) {
      return res.status(400).json({ 
        error: "User is already assigned to another deployment" 
      });
    }

    // Verify that the device, branch, and user exist
    const [deviceCheck, branchCheck, userCheck] = await Promise.all([
      executeQuery('SELECT id FROM devices WHERE id = ?', [device_id]),
      executeQuery('SELECT id FROM branches WHERE id = ?', [branch_id]),
      executeQuery('SELECT uuid FROM users WHERE uuid = ?', [user_id])
    ]);

    if (deviceCheck.length === 0) {
      return res.status(400).json({ error: "Device not found" });
    }
    if (branchCheck.length === 0) {
      return res.status(400).json({ error: "Branch not found" });
    }
    if (userCheck.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const uuid = uuidv4();

    const query = `
      INSERT INTO link_device_branch_user 
      (uuid, device_id, branch_id, user_id, created_on, updated_on) 
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `;

    await executeQuery(query, [uuid, device_id, branch_id, user_id]);

    res.status(201).json({
      success: true,
      uuid,
      message: "Deployment created successfully"
    });
  } catch (error) {
    console.error("Error creating deployment:", error);
    res.status(500).json({ error: "Failed to create deployment" });
  }
};

// Delete deployment
export const deleteDeployment: RequestHandler = async (req, res) => {
  try {
    const { uuid } = req.params;

    const query = `DELETE FROM link_device_branch_user WHERE uuid = ?`;
    const result = await executeQuery(query, [uuid]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    res.json({
      success: true,
      message: "Deployment deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting deployment:", error);
    res.status(500).json({ error: "Failed to delete deployment" });
  }
};

// Get deployment by UUID
export const getDeployment: RequestHandler = async (req, res) => {
  try {
    const { uuid } = req.params;

    const query = `
      SELECT 
        ldbu.*,
        d.device_name,
        d.device_mac,
        d.ip_address,
        d.device_type,
        d.device_status,
        b.branch_code,
        b.branch_name,
        b.branch_city,
        b.branch_address,
        u.username,
        u.email_id,
        u.role,
        u.emp_name
      FROM link_device_branch_user ldbu
      LEFT JOIN devices d ON d.id = ldbu.device_id
      LEFT JOIN branches b ON b.id = ldbu.branch_id
      LEFT JOIN users u ON u.uuid = ldbu.user_id
      WHERE ldbu.uuid = ?
    `;

    const deployments = await executeQuery(query, [uuid]);

    if (deployments.length === 0) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    const row = deployments[0];
    const deployment = {
      uuid: row.uuid,
      device_id: row.device_id,
      branch_id: row.branch_id,
      user_id: row.user_id,
      created_on: row.created_on,
      updated_on: row.updated_on,
      created_by: row.created_by,
      updated_by: row.updated_by,
      device: row.device_name ? {
        id: row.device_id,
        device_name: row.device_name,
        device_mac: row.device_mac,
        ip_address: row.ip_address,
        device_type: row.device_type,
        device_status: row.device_status
      } : null,
      branch: row.branch_name ? {
        id: row.branch_id,
        branch_code: row.branch_code,
        branch_name: row.branch_name,
        branch_city: row.branch_city,
        branch_address: row.branch_address
      } : null,
      user: row.username ? {
        uuid: row.user_id,
        username: row.username,
        email: row.email_id,
        role: row.role,
        full_name: row.emp_name
      } : null
    };

    res.json({
      success: true,
      data: deployment
    });
  } catch (error) {
    console.error("Error fetching deployment:", error);
    res.status(500).json({ error: "Failed to fetch deployment" });
  }
};

// Update deployment
export const updateDeployment: RequestHandler = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { device_id, branch_id, user_id } = req.body;

    if (!device_id || !branch_id || !user_id) {
      return res.status(400).json({ 
        error: "Device ID, Branch ID, and User ID are required" 
      });
    }

    // Check if the deployment exists
    const existingDeployment = await executeQuery(
      'SELECT uuid FROM link_device_branch_user WHERE uuid = ?',
      [uuid]
    );

    if (existingDeployment.length === 0) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    // Check for conflicts (excluding current deployment)
    const [deviceConflict, branchConflict, userConflict] = await Promise.all([
      executeQuery(
        'SELECT uuid FROM link_device_branch_user WHERE device_id = ? AND uuid != ?',
        [device_id, uuid]
      ),
      executeQuery(
        'SELECT uuid FROM link_device_branch_user WHERE branch_id = ? AND uuid != ?',
        [branch_id, uuid]
      ),
      executeQuery(
        'SELECT uuid FROM link_device_branch_user WHERE user_id = ? AND uuid != ?',
        [user_id, uuid]
      )
    ]);

    if (deviceConflict.length > 0) {
      return res.status(400).json({ 
        error: "Device is already deployed to another branch" 
      });
    }
    if (branchConflict.length > 0) {
      return res.status(400).json({ 
        error: "Branch already has a device assigned" 
      });
    }
    if (userConflict.length > 0) {
      return res.status(400).json({ 
        error: "User is already assigned to another deployment" 
      });
    }

    const query = `
      UPDATE link_device_branch_user 
      SET device_id = ?, branch_id = ?, user_id = ?, updated_on = NOW()
      WHERE uuid = ?
    `;

    const result = await executeQuery(query, [device_id, branch_id, user_id, uuid]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    res.json({
      success: true,
      message: "Deployment updated successfully"
    });
  } catch (error) {
    console.error("Error updating deployment:", error);
    res.status(500).json({ error: "Failed to update deployment" });
  }
};
