import { RequestHandler } from "express";
import { HeartbeatRecord } from "@shared/api";
import { executeQuery } from "../config/database";
import { v4 as uuidv4 } from "uuid";

// Get heartbeats with status calculation
export const getHeartbeats: RequestHandler = async (req, res) => {
  try {
    // Query the heartbeat table with device and branch info
    const query = `
      SELECT
        COALESCE(b.branch_address, h.mac_address) AS branch_name,
        COALESCE(b.branch_code, h.ip_address) AS branch_code,
        h.last_seen,
        CASE
          WHEN TIMESTAMPDIFF(MINUTE, h.last_seen, NOW()) <= 5 THEN 'online'
          WHEN TIMESTAMPDIFF(MINUTE, h.last_seen, NOW()) <= 15 THEN 'problematic'
          ELSE 'offline'
        END AS status
      FROM (
        SELECT
          mac_address,
          ip_address,
          MAX(created_on) as last_seen
        FROM heartbeat WHERE mac_address IS NOT NULL
        GROUP BY mac_address
      ) h
      LEFT JOIN devices d ON d.device_mac = h.mac_address
      LEFT JOIN link_device_branch_user ldbu ON ldbu.device_id = d.id
      LEFT JOIN branches b ON b.id = ldbu.branch_id
      ORDER BY h.last_seen DESC
    `;

    const heartbeats = await executeQuery<HeartbeatRecord>(query);
    res.json(heartbeats);
  } catch (error) {
    console.error("Error fetching heartbeats:", error);
    res.status(500).json({
      error: "Failed to fetch heartbeats",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Receive heartbeat from device
export const postHeartbeat: RequestHandler = async (req, res) => {
  try {
    const { ip_address, mac_address } = req.body;

    if (!ip_address) {
      return res.status(400).json({ error: "IP address is required" });
    }
    const uuid = uuidv4(); // Generate a new UUID
    // Insert heartbeat into database
    const query = `
      INSERT INTO heartbeat (uuid, ip_address, mac_address, created_on)
      VALUES (?, ?, ?, NOW())
    `;

    await executeQuery(query, [uuid, ip_address, mac_address?.trim() || null]);

    res.json({
      success: true,
      message: "Heartbeat recorded",
    });
  } catch (error) {
    console.error("Error recording heartbeat:", error);
    res.status(500).json({ error: "Failed to record heartbeat" });
  }
};

// Get device status summary
export const getDeviceStatus: RequestHandler = async (req, res) => {
  try {
    const query = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN TIMESTAMPDIFF(MINUTE, created_on, NOW()) <= 5 THEN 1 ELSE 0 END) as online,
        SUM(CASE WHEN TIMESTAMPDIFF(MINUTE, created_on, NOW()) BETWEEN 6 AND 15 THEN 1 ELSE 0 END) as problematic,
        SUM(CASE WHEN TIMESTAMPDIFF(MINUTE, created_on, NOW()) > 15 THEN 1 ELSE 0 END) as offline
      FROM (
        SELECT ip_address, mac_address, MAX(created_on) as created_on
        FROM heartbeat
        GROUP BY ip_address, mac_address
      ) latest_heartbeats
    `;

    const [status] = await executeQuery(query);
    res.json(status);
  } catch (error) {
    console.error("Error fetching device status:", error);
    res.status(500).json({ error: "Failed to fetch device status" });
  }
};
