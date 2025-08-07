import { RequestHandler } from "express";
import { executeQuery } from "../config/database";

// Analytics interface matching frontend expectations
export interface RecordingAnalytics {
  totalRecordings: number;
  completedRecordings: number;
  failedRecordings: number;
  inProgressRecordings: number;
  avgDuration: number;
  todayRecordings: number;
  dailyRecordings: Array<{ date: string; count: number }>;
  branchStats: Array<{ branch_name: string; total_recordings: number }>;
  statusDistribution: Array<{ status: string; count: number }>;
  monthlyTrends: Array<{
    month: string;
    recordings: number;
    avgDuration: number;
    todayRecordings: number;
  }>;
}

// Get recordings analytics
export const getRecordingsAnalytics: RequestHandler = async (req, res) => {
  try {
    // Get daily recordings for the last 30 days
    const dailyRecordingsQuery = `
      SELECT
        DATE(rh.CREATED_ON) as date,
        COUNT(*) as count
      FROM recordings rh
      WHERE rh.CREATED_ON >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(rh.CREATED_ON)
      ORDER BY date DESC
      LIMIT 30
    `;

    // Get recordings by status
    const statusQuery = `
      SELECT
        CASE
          WHEN rh.end_time IS NOT NULL AND rh.file_name IS NOT NULL THEN 'completed'
          WHEN rh.start_time IS NOT NULL AND rh.end_time IS NULL THEN 'in_progress'
          ELSE 'failed'
        END AS status,
        COUNT(*) as count
      FROM recordings rh
      GROUP BY status
    `;

    // Get recordings by branch
    const branchQuery = `
      SELECT
        COALESCE(b.branch_address, 'Unknown Branch') as branch_name,
        COUNT(*) as count
      FROM recordings rh
      LEFT JOIN devices d ON d.device_mac = rh.mac_address OR d.ip_address = rh.ip_address
      LEFT JOIN link_device_branch_user ldbu ON ldbu.device_id = d.id
      LEFT JOIN branches b ON b.id = ldbu.branch_id
      GROUP BY b.branch_address
      ORDER BY count DESC
      LIMIT 10
    `;

    // Get total statistics
    const totalStatsQuery = `
      SELECT
        COUNT(*) as totalRecordings,
        SUM(CASE WHEN rh.end_time IS NOT NULL AND rh.file_name IS NOT NULL THEN 1 ELSE 0 END) as completedRecordings,
        AVG(CASE WHEN rh.end_time IS NOT NULL THEN TIMESTAMPDIFF(SECOND, rh.start_time, rh.end_time) ELSE NULL END) as avgDuration,
        SUM(CASE WHEN DATE(rh.CREATED_ON) = CURDATE() THEN 1 ELSE 0 END) as todayRecordings
      FROM recordings rh
    `;

    // Execute all queries in parallel
    const [
      dailyRecordings,
      recordingsByStatus,
      recordingsByBranch,
      totalStatsResult,
    ] = await Promise.all([
      executeQuery<{ date: string; count: number }>(dailyRecordingsQuery),
      executeQuery<{ status: string; count: number }>(statusQuery),
      executeQuery<{ branch_name: string; count: number }>(branchQuery),
      executeQuery<{
        totalRecordings: number;
        completedRecordings: number;
        avgDuration: number;
        todayRecordings: number;
      }>(totalStatsQuery),
    ]);

    const totalStats = totalStatsResult[0] || {
      totalRecordings: 0,
      completedRecordings: 0,
      avgDuration: 0,
      todayRecordings: 0,
    };

    const analytics: RecordingAnalytics = {
      dailyRecordings: dailyRecordings.map((row) => ({
        date: row.date,
        count: row.count,
      })),
      recordingsByStatus: recordingsByStatus.map((row) => ({
        status: row.status,
        count: row.count,
      })),
      recordingsByBranch: recordingsByBranch.map((row) => ({
        branch_name: row.branch_name || "Unknown Branch",
        count: row.count,
      })),
      totalStats: {
        totalRecordings: totalStats.totalRecordings,
        completedRecordings: totalStats.completedRecordings,
        avgDuration: Math.round(totalStats.avgDuration || 0),
        todayRecordings: totalStats.todayRecordings,
      },
    };

    res.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};
