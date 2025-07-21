import { RequestHandler } from "express";
import { executeQuery } from "../config/database";
import { v4 as uuidv4 } from "uuid";

// Generate UUID v4 (matches PHP function)
function generateUUIDv4(): string {
  return uuidv4();
}

// POST route for heartbeat submission - matches your PHP code exactly
export const submitHeartbeat: RequestHandler = async (req, res) => {
  // Set JSON content type
  res.setHeader("Content-Type", "application/json");

  let response = { success: false } as any;

  // Check request method (Express handles this, but keeping for consistency)
  if (req.method !== "POST") {
    response.error = "Only POST method is allowed";
    return res.json(response);
  }

  try {
    // Extract data from request body (Express already parses JSON)
    const data = req.body;

    // Validate JSON and extract parameters
    if (!data || typeof data !== "object" || !data.ip_address) {
      response.error = "Missing or invalid JSON: ip_address required";
      return res.json(response);
    }

    const ipAddress = data.ip_address;

    // Generate UUID v4
    const uuid = generateUUIDv4();
    const createdOn = new Date().toISOString().slice(0, 19).replace("T", " "); // MySQL datetime format

    // Insert data into database
    const query =
      "INSERT INTO recording_heartbeat (uuid, ip_address, created_on) VALUES (?, ?, ?)";

    await executeQuery(query, [uuid, ipAddress, createdOn]);

    // Success response
    response.success = true;
    response.data = {
      uuid: uuid,
      ip_address: ipAddress,
      created_on: createdOn,
    };

    res.json(response);
  } catch (error) {
    console.error("Error in submitHeartbeat:", error);

    // Handle database errors
    if ((error as any).code) {
      response.error = `Database error: ${(error as any).message}`;
    } else {
      response.error = "Insert failed: " + (error as Error).message;
    }

    res.json(response);
  }
};
