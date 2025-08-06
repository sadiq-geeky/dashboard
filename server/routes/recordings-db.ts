import { RequestHandler } from "express";
import { RecordingHistory, PaginatedResponse } from "@shared/api";
import { executeQuery } from "../config/database";

// Get recordings with pagination and CNIC search
export const getRecordings: RequestHandler = async (req, res) => {
  try {
    const {
      page = "1",
      limit = "10",
      search,
      device,
      branch_id,
      user_role,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build WHERE clause for CNIC search and device filtering
    let whereClause = "";
    let countWhereClause = "";
    let queryParams: any[] = [];
    let countParams: any[] = [];
    const conditions: string[] = [];
    const countConditions: string[] = [];

    if (search) {
      conditions.push("rh.cnic LIKE ?");
      countConditions.push("rh.cnic LIKE ?");
      queryParams.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    if (device) {
      conditions.push("rh.ip_address = ?");
      countConditions.push("rh.ip_address = ?");
      queryParams.push(device);
      countParams.push(device);
    }

    // Branch filtering for non-admin users
    if (branch_id && user_role !== "admin") {
      conditions.push("ldbu.branch_id = ?");
      queryParams.push(branch_id);
      // For count, we'll do a simpler approach without complex JOINs
    }

    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(" AND ")}`;
    }

    if (countConditions.length > 0) {
      countWhereClause = `WHERE ${countConditions.join(" AND ")}`;
    }

    // Get total count (simplified to avoid collation issues)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM recordings rh
      ${countWhereClause}
    `;
    const [countResult] = await executeQuery<{ total: number }>(
      countQuery,
      countParams,
    );
    const total = countResult.total;

    // Get paginated results
    const dataQuery = `
      SELECT
        rh.id,
        rh.cnic,
        rh.start_time,
        rh.end_time,
        rh.file_name,
        rh.CREATED_ON AS created_on,
        COALESCE(b.branch_code, 'N/A') AS branch_no,
        COALESCE(b.branch_address, 'NA') AS branch_address,
        CASE
            WHEN rh.end_time IS NOT NULL THEN
                TIMESTAMPDIFF(SECOND, rh.start_time, rh.end_time)
            ELSE NULL
        END AS duration,
        duration_seconds,
        CASE
            WHEN rh.end_time IS NOT NULL AND rh.file_name IS NOT NULL THEN 'completed'
            WHEN rh.start_time IS NOT NULL AND rh.end_time IS NULL THEN 'in_progress'
            ELSE 'failed'
        END AS status
      FROM recordings rh
      LEFT JOIN devices d ON d.device_mac = rh.mac_address OR d.ip_address = rh.ip_address
      LEFT JOIN link_device_branch_user ldbu ON ldbu.device_id = d.id
      LEFT JOIN branches b ON b.id = ldbu.branch_id
      ${whereClause}
      ORDER BY rh.CREATED_ON DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const recordings = await executeQuery<RecordingHistory>(
      dataQuery,
      queryParams,
    );

    const totalPages = Math.ceil(total / limitNum);

    const response: PaginatedResponse<RecordingHistory> = {
      data: recordings,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching recordings:", error);
    res.status(500).json({ error: "Failed to fetch recordings" });
  }
};

// Get single recording by ID
export const getRecording: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        id,
        cnic,
        start_time,
        end_time,
        file_name,
        CREATED_ON as created_on,
        ip_address,
        CASE
        WHEN rh.end_time IS NOT NULL THEN
            TIMESTAMPDIFF(SECOND, rh.start_time, rh.end_time)
        ELSE NULL
    END AS duration,
    duration_seconds,
        CASE
          WHEN end_time IS NOT NULL AND file_name IS NOT NULL THEN 'completed'
          WHEN start_time IS NOT NULL AND end_time IS NULL THEN 'in_progress'
          ELSE 'failed'
        END as status
      FROM recordings
      WHERE id = ?
    `;

    const recordings = await executeQuery<RecordingHistory>(query, [id]);

    if (recordings.length === 0) {
      return res.status(404).json({ error: "Recording not found" });
    }

    res.json(recordings[0]);
  } catch (error) {
    console.error("Error fetching recording:", error);
    res.status(500).json({ error: "Failed to fetch recording" });
  }
};

// Create new recording entry
export const createRecording: RequestHandler = async (req, res) => {
  try {
    const { cnic, ip_address, file_name } = req.body;

    const recordingId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const query = `
      INSERT INTO recordings 
      (id, cnic, start_time, file_name, CREATED_ON, ip_address) 
      VALUES (?, ?, NOW(), ?, NOW(), ?)
    `;

    await executeQuery(query, [recordingId, cnic, file_name, ip_address]);

    res.status(201).json({
      success: true,
      recording_id: recordingId,
      message: "Recording started",
    });
  } catch (error) {
    console.error("Error creating recording:", error);
    res.status(500).json({ error: "Failed to create recording" });
  }
};

// Update recording end time
export const updateRecording: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { end_time } = req.body;

    const query = `
      UPDATE recordings 
      SET end_time = ? 
      WHERE id = ?
    `;

    await executeQuery(query, [end_time || new Date(), id]);

    res.json({
      success: true,
      message: "Recording updated",
    });
  } catch (error) {
    console.error("Error updating recording:", error);
    res.status(500).json({ error: "Failed to update recording" });
  }
};

// Get unique device names for filtering
export const getDeviceNames: RequestHandler = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT rh.ip_address AS device_name
      FROM recordings rh
      WHERE rh.ip_address IS NOT NULL
      ORDER BY device_name ASC
    `;

    const devices = await executeQuery<{ device_name: string }>(query);
    const deviceNames = devices.map((d) => d.device_name);

    res.json(deviceNames);
  } catch (error) {
    console.error("Error fetching device names:", error);
    res.status(500).json({ error: "Failed to fetch device names" });
  }
};
