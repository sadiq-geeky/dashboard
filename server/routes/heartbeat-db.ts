import { RequestHandler } from "express";
import { HeartbeatRecord } from "@shared/api";
import { executeQuery } from "../config/database";
import { v4 as uuidv4 } from "uuid";
import { heartbeatLogger } from "../utils/logger";

// Get heartbeats with status calculation
export const getHeartbeats: RequestHandler = async (req: any, res) => {
  const startTime = Date.now();
  const requestId = uuidv4();
  const clientIp = req.ip || req.connection.remoteAddress || "unknown";
  const userAgent = req.get("User-Agent") || "unknown";

  heartbeatLogger.info("heartbeat-db", "get_heartbeats_request", {
    request_id: requestId,
    ip_address: clientIp,
    user_agent: userAgent,
  });

  try {
    // Get branch filter from middleware
    const branchFilter = req.branchFilter;

    let whereClause = "";
    let queryParams: any[] = [];

    if (branchFilter) {
      whereClause = `WHERE ldbu.${branchFilter.field} = ?`;
      queryParams.push(branchFilter.value);
    }

    // Simplified and optimized heartbeat query with deduplication
    const query = `
      SELECT
        COALESCE(ANY_VALUE(b.branch_name), 'Not linked to branch') AS branch_name,
        COALESCE(ANY_VALUE(b.branch_code), 'Not linked to branch') AS branch_code,
        h.ip_address,
        h.mac_address as device_id,
        h.last_seen,
        CASE
          WHEN TIMESTAMPDIFF(MINUTE, h.last_seen, NOW()) <= 5 THEN 'online'
          WHEN TIMESTAMPDIFF(MINUTE, h.last_seen, NOW()) <= 15 THEN 'problematic'
          ELSE 'offline'
        END AS status,
        CONCAT(
          FLOOR(IFNULL(ANY_VALUE(h.uptime_count), 0) * 30 / 3600), 'h ',
          FLOOR(MOD(IFNULL(ANY_VALUE(h.uptime_count), 0) * 30, 3600) / 60), 'm'
        ) AS uptime_duration_24h
      FROM (
        SELECT
          h1.mac_address,
          h1.ip_address,
          MAX(h1.created_on) AS last_seen,
          (
            SELECT COUNT(*)
            FROM heartbeat h2
            WHERE h2.mac_address = h1.mac_address
              AND h2.created_on >= DATE_SUB(NOW(), INTERVAL 1 DAY)
          ) AS uptime_count
        FROM heartbeat h1
        WHERE h1.mac_address IS NOT NULL
        GROUP BY h1.mac_address, h1.ip_address
      ) h
      LEFT JOIN devices d ON d.device_mac = h.mac_address
      LEFT JOIN link_device_branch_user ldbu ON ldbu.device_id = d.id
      LEFT JOIN branches b ON b.id = ldbu.branch_id
      ${whereClause ? (whereClause.includes("WHERE") ? whereClause.replace("WHERE", "AND") : `AND ${whereClause}`) : ""}
      GROUP BY h.mac_address, h.ip_address, h.last_seen
      ORDER BY h.last_seen DESC
      LIMIT 100
    `;

    let heartbeats;
    try {
      heartbeats = await executeQuery<HeartbeatRecord>(query, queryParams);
    } catch (queryError) {
      // Fallback to simpler query if main query fails
      console.warn("Main heartbeat query failed, using fallback:", queryError);

      const fallbackQuery = `
        SELECT
          CONCAT('Device-', h.mac_address) AS branch_name,
          h.ip_address AS branch_code,
          h.ip_address,
          MAX(h.created_on) AS last_seen,
          CASE
            WHEN TIMESTAMPDIFF(MINUTE, MAX(h.created_on), NOW()) <= 5 THEN 'online'
            WHEN TIMESTAMPDIFF(MINUTE, MAX(h.created_on), NOW()) <= 15 THEN 'problematic'
            ELSE 'offline'
          END AS status,
          '0h 0m' AS uptime_duration_24h
        FROM heartbeat h
        LEFT JOIN devices d ON d.device_mac = h.mac_address
        WHERE h.mac_address IS NOT NULL
        GROUP BY h.mac_address, h.ip_address
        ORDER BY MAX(h.created_on) DESC
        LIMIT 50
      `;

      heartbeats = await executeQuery<HeartbeatRecord>(
        fallbackQuery,
        branchFilter ? [] : [],
      );
    }

    const duration = Date.now() - startTime;

    heartbeatLogger.info("heartbeat-db", "get_heartbeats_success", {
      request_id: requestId,
      ip_address: clientIp,
      duration_ms: duration,
      details: { records_count: heartbeats.length },
    });

    res.json(heartbeats);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    heartbeatLogger.error(
      "heartbeat-db",
      "get_heartbeats_error",
      errorMessage,
      {
        request_id: requestId,
        ip_address: clientIp,
        duration_ms: duration,
        details: {
          error_stack: error instanceof Error ? error.stack : undefined,
          query_failed: true,
        },
      },
    );

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
  const startTime = Date.now();
  const requestId = uuidv4();
  const clientIp = req.ip || req.connection.remoteAddress || "unknown";
  const userAgent = req.get("User-Agent") || "unknown";
  const { ip_address, mac_address } = req.body;

  heartbeatLogger.info("heartbeat-db", "post_heartbeat_request", {
    request_id: requestId,
    ip_address: clientIp,
    mac_address: mac_address?.trim(),
    user_agent: userAgent,
    details: {
      body_ip_address: ip_address,
      body_mac_address: mac_address?.trim(),
    },
  });

  try {
    if (!ip_address) {
      heartbeatLogger.warn("heartbeat-db", "post_heartbeat_validation_failed", {
        request_id: requestId,
        ip_address: clientIp,
        mac_address: mac_address?.trim(),
        details: { missing_field: "ip_address" },
      });
      return res.status(400).json({ error: "IP address is required" });
    }

    const uuid = uuidv4(); // Generate a new UUID

    // Check if device exists for this MAC address, if not create one
    if (mac_address?.trim()) {
      const deviceCheckQuery = `
        SELECT id FROM devices WHERE device_mac = ?
      `;
      const existingDevice = await executeQuery(deviceCheckQuery, [
        mac_address.trim(),
      ]);

      if (existingDevice.length === 0) {
        // Create new device with inactive status
        const deviceUuid = uuidv4();
        const createDeviceQuery = `
          INSERT INTO devices (
            id, device_name, device_mac, ip_address, device_type,
            device_status, notes, created_on, updated_on
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

        await executeQuery(createDeviceQuery, [
          deviceUuid,
          `Device-${mac_address.trim().slice(-6)}`, // Use last 6 chars of MAC as name
          mac_address.trim(),
          ip_address,
          "recorder",
          "inactive",
          "Auto-created from heartbeat",
        ]);

        heartbeatLogger.info("heartbeat-db", "auto_device_created", {
          request_id: requestId,
          uuid: deviceUuid,
          mac_address: mac_address.trim(),
          ip_address: ip_address,
        });
      }
    }

    // Insert heartbeat into database
    const query = `
      INSERT INTO heartbeat (uuid, ip_address, mac_address, created_on)
      VALUES (?, ?, ?, NOW())
    `;

    await executeQuery(query, [uuid, ip_address, mac_address?.trim() || null]);

    const duration = Date.now() - startTime;

    heartbeatLogger.info("heartbeat-db", "post_heartbeat_success", {
      request_id: requestId,
      ip_address: clientIp,
      mac_address: mac_address?.trim(),
      duration_ms: duration,
      details: {
        heartbeat_uuid: uuid,
        device_ip: ip_address,
        device_mac: mac_address?.trim() || null,
      },
    });

    res.json({
      success: true,
      message: "Heartbeat recorded",
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    heartbeatLogger.error(
      "heartbeat-db",
      "post_heartbeat_error",
      errorMessage,
      {
        request_id: requestId,
        ip_address: clientIp,
        mac_address: mac_address?.trim(),
        duration_ms: duration,
        details: {
          error_stack: error instanceof Error ? error.stack : undefined,
          device_ip: ip_address,
          device_mac: mac_address?.trim() || null,
          database_insert_failed: true,
        },
      },
    );

    console.error("Error recording heartbeat:", error);
    res.status(500).json({ error: "Failed to record heartbeat" });
  }
};

// Get device status summary
export const getDeviceStatus: RequestHandler = async (req, res) => {
  const startTime = Date.now();
  const requestId = uuidv4();
  const clientIp = req.ip || req.connection.remoteAddress || "unknown";
  const userAgent = req.get("User-Agent") || "unknown";

  heartbeatLogger.info("heartbeat-db", "get_device_status_request", {
    request_id: requestId,
    ip_address: clientIp,
    user_agent: userAgent,
  });

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
    const duration = Date.now() - startTime;

    heartbeatLogger.info("heartbeat-db", "get_device_status_success", {
      request_id: requestId,
      ip_address: clientIp,
      duration_ms: duration,
      details: {
        total: status.total,
        online: status.online,
        problematic: status.problematic,
        offline: status.offline,
      },
    });

    res.json(status);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    heartbeatLogger.error(
      "heartbeat-db",
      "get_device_status_error",
      errorMessage,
      {
        request_id: requestId,
        ip_address: clientIp,
        duration_ms: duration,
        details: {
          error_stack: error instanceof Error ? error.stack : undefined,
          query_failed: true,
        },
      },
    );

    console.error("Error fetching device status:", error);
    res.status(500).json({ error: "Failed to fetch device status" });
  }
};
