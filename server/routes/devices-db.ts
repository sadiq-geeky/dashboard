import { RequestHandler } from "express";
import { DeviceMapping } from "@shared/api";
import { executeQuery } from "../config/database";

// Get all device mappings
export const getDevices: RequestHandler = async (req, res) => {
  try {
    const { search } = req.query;

    let query = `
      SELECT id, ip_address, device_name, created_on 
      FROM device_mappings
    `;
    let queryParams: any[] = [];

    if (search) {
      query += ` WHERE ip_address LIKE ? OR device_name LIKE ?`;
      queryParams = [`%${search}%`, `%${search}%`];
    }

    query += ` ORDER BY created_on DESC`;

    const devices = await executeQuery<DeviceMapping>(query, queryParams);
    res.json(devices);
  } catch (error) {
    console.error("Error fetching devices:", error);
    res.status(500).json({ error: "Failed to fetch devices" });
  }
};

// Create new device mapping
export const createDevice: RequestHandler = async (req, res) => {
  try {
    const { ip_address, device_name } = req.body;

    if (!ip_address || !device_name) {
      return res
        .status(400)
        .json({ error: "IP address and device name are required" });
    }

    const deviceId = `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const query = `
      INSERT INTO device_mappings (id, ip_address, device_name, created_on) 
      VALUES (?, ?, ?, NOW())
    `;

    await executeQuery(query, [deviceId, ip_address, device_name]);

    // Return the created device
    const newDevice: DeviceMapping = {
      id: deviceId,
      ip_address,
      device_name,
      created_on: new Date().toISOString(),
    };

    res.status(201).json(newDevice);
  } catch (error) {
    console.error("Error creating device:", error);

    // Handle duplicate IP address error
    if ((error as any).code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "Device with this IP address already exists" });
    }

    res.status(500).json({ error: "Failed to create device" });
  }
};

// Update device mapping
export const updateDevice: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { ip_address, device_name } = req.body;

    let updateFields: string[] = [];
    let queryParams: any[] = [];

    if (ip_address) {
      updateFields.push("ip_address = ?");
      queryParams.push(ip_address);
    }

    if (device_name) {
      updateFields.push("device_name = ?");
      queryParams.push(device_name);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    queryParams.push(id);

    const query = `
      UPDATE device_mappings 
      SET ${updateFields.join(", ")} 
      WHERE id = ?
    `;

    const result = await executeQuery(query, queryParams);

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: "Device not found" });
    }

    // Get updated device
    const updatedDevice = await executeQuery<DeviceMapping>(
      "SELECT * FROM device_mappings WHERE id = ?",
      [id],
    );

    res.json(updatedDevice[0]);
  } catch (error) {
    console.error("Error updating device:", error);

    // Handle duplicate IP address error
    if ((error as any).code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "Another device with this IP address already exists" });
    }

    res.status(500).json({ error: "Failed to update device" });
  }
};

// Delete device mapping
export const deleteDevice: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const query = "DELETE FROM device_mappings WHERE id = ?";
    const result = await executeQuery(query, [id]);

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: "Device not found" });
    }

    res.json({ success: true, message: "Device deleted successfully" });
  } catch (error) {
    console.error("Error deleting device:", error);
    res.status(500).json({ error: "Failed to delete device" });
  }
};
