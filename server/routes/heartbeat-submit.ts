import { RequestHandler } from "express";
import { executeQuery } from "../config/database";
import { v4 as uuidv4 } from "uuid";

// POST route for heartbeat submission
export const submitHeartbeat: RequestHandler = async (req, res) => {
  try {
    const { ip_address } = req.body;

    if (!ip_address) {
      return res.status(400).json({ error: "IP address is required" });
    }

    const uuid = uuidv4();

    // Insert heartbeat into database
    const query = `
      INSERT INTO heartbeat (uuid, ip_address, created_on)
      VALUES (?, ?, NOW())
    `;

    await executeQuery(query, [uuid, ip_address]);

    res.json({
      success: true,
      message: "Heartbeat recorded",
      data: {
        uuid,
        ip_address,
      },
    });
  } catch (error) {
    console.error("Error recording heartbeat:", error);
    res.status(500).json({ error: "Failed to record heartbeat" });
  }
};
