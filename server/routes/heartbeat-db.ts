import { RequestHandler } from "express";
import { HeartbeatRecord } from "@shared/api";
import { executeQuery } from "../config/database";
import { v4 as uuidv4 } from "uuid";

// Get heartbeats with status calculation
export const getHeartbeats: RequestHandler = async (req, res) => {
  try {
    // Query the actual heartbeat table
    const query = `
      SELECT
        COALESCE(dm.device_name, ranked.ip_address) AS device_name,
        ranked.last_seen,
        ranked.status
      FROM (
        SELECT
          ip_address,
          created_on AS last_seen,
          CASE
            WHEN TIMESTAMPDIFF(MINUTE, created_on, NOW()) <= 5 THEN 'online'
            WHEN TIMESTAMPDIFF(MINUTE, created_on, NOW()) <= 15 THEN 'problematic'
            ELSE 'offline'
          END AS status,
          ROW_NUMBER() OVER (PARTITION BY ip_address ORDER BY created_on DESC) AS row_num
        FROM recording_heartbeat
      ) AS ranked
      LEFT JOIN device_mappings dm ON dm.ip_address = ranked.ip_address
      WHERE ranked.row_num = 1
      ORDER BY ranked.last_seen DESC
    `;

    const heartbeats = await executeQuery<HeartbeatRecord>(query);
    res.json(heartbeats);
  } catch (error) {
    console.error("Error fetching heartbeats:", error);
    console.error("Query failed:", query);
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
    const { ip_address } = req.body;

    if (!ip_address) {
      return res.status(400).json({ error: "IP address is required" });
    }
    const uuid = uuidv4(); // Generate a new UUID
    // Insert heartbeat into database
    const query = `
      INSERT INTO recording_heartbeat (uuid, ip_address, created_on) 
      VALUES (?, ?, NOW())
    `;

    await executeQuery(query, [uuid, ip_address]);

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
        SELECT uuid, MAX(created_on) as created_on
        FROM recording_heartbeat 
        GROUP BY uuid
      ) latest_heartbeats
    `;

    const [status] = await executeQuery(query);
    res.json(status);
  } catch (error) {
    console.error("Error fetching device status:", error);
    res.status(500).json({ error: "Failed to fetch device status" });
  }
};
