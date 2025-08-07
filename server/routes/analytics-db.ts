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
    // Get daily recordings for the last 7 days
    const dailyRecordingsQuery = `
      SELECT
        DATE(rh.CREATED_ON) as date,
        COUNT(*) as count
      FROM recordings rh
      WHERE rh.CREATED_ON >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(rh.CREATED_ON)
      ORDER BY date ASC
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
        COUNT(*) as total_recordings
      FROM recordings rh
      LEFT JOIN devices d ON d.device_mac = rh.mac_address OR d.ip_address = rh.ip_address
      LEFT JOIN link_device_branch_user ldbu ON ldbu.device_id = d.id
      LEFT JOIN branches b ON b.id = ldbu.branch_id
      GROUP BY b.branch_address
      ORDER BY total_recordings DESC
      LIMIT 10
    `;

    // Get total statistics
    const totalStatsQuery = `
      SELECT
        COUNT(*) as totalRecordings,
        SUM(CASE WHEN rh.end_time IS NOT NULL AND rh.file_name IS NOT NULL THEN 1 ELSE 0 END) as completedRecordings,
        SUM(CASE WHEN rh.start_time IS NOT NULL AND rh.end_time IS NULL THEN 1 ELSE 0 END) as inProgressRecordings,
        SUM(CASE WHEN (rh.end_time IS NULL OR rh.file_name IS NULL) AND NOT (rh.start_time IS NOT NULL AND rh.end_time IS NULL) THEN 1 ELSE 0 END) as failedRecordings,
        AVG(CASE WHEN rh.end_time IS NOT NULL THEN TIMESTAMPDIFF(SECOND, rh.start_time, rh.end_time) ELSE rh.duration_seconds END) as avgDuration,
        SUM(CASE WHEN DATE(rh.CREATED_ON) = CURDATE() THEN 1 ELSE 0 END) as todayRecordings
      FROM recordings rh
    `;

    // Get monthly trends for last 3 months
    const monthlyTrendsQuery = `
      SELECT
        DATE_FORMAT(rh.CREATED_ON, '%b') as month,
        COUNT(*) as recordings,
        AVG(CASE WHEN rh.end_time IS NOT NULL THEN TIMESTAMPDIFF(SECOND, rh.start_time, rh.end_time) ELSE rh.duration_seconds END) as avgDuration,
        SUM(CASE WHEN DATE(rh.CREATED_ON) = CURDATE() THEN 1 ELSE 0 END) as todayRecordings
      FROM recordings rh
      WHERE rh.CREATED_ON >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
      GROUP BY YEAR(rh.CREATED_ON), MONTH(rh.CREATED_ON), DATE_FORMAT(rh.CREATED_ON, '%b')
      ORDER BY YEAR(rh.CREATED_ON) DESC, MONTH(rh.CREATED_ON) DESC
      LIMIT 3
    `;

    // Execute all queries in parallel
    const [
      dailyRecordings,
      recordingsByStatus,
      recordingsByBranch,
      totalStatsResult,
      monthlyTrends,
    ] = await Promise.all([
      executeQuery<{ date: string; count: number }>(dailyRecordingsQuery),
      executeQuery<{ status: string; count: number }>(statusQuery),
      executeQuery<{ branch_name: string; total_recordings: number }>(
        branchQuery,
      ),
      executeQuery<{
        totalRecordings: number;
        completedRecordings: number;
        inProgressRecordings: number;
        failedRecordings: number;
        avgDuration: number;
        todayRecordings: number;
      }>(totalStatsQuery),
      executeQuery<{
        month: string;
        recordings: number;
        avgDuration: number;
        todayRecordings: number;
      }>(monthlyTrendsQuery),
    ]);

    const totalStats = totalStatsResult[0] || {
      totalRecordings: 0,
      completedRecordings: 0,
      inProgressRecordings: 0,
      failedRecordings: 0,
      avgDuration: 0,
      todayRecordings: 0,
    };

    const analytics: RecordingAnalytics = {
      totalRecordings: totalStats.totalRecordings,
      completedRecordings: totalStats.completedRecordings,
      failedRecordings: totalStats.failedRecordings,
      inProgressRecordings: totalStats.inProgressRecordings,
      avgDuration: Math.round(totalStats.avgDuration || 0),
      todayRecordings: totalStats.todayRecordings,
      dailyRecordings: dailyRecordings.map((row) => ({
        date: row.date,
        count: row.count,
      })),
      branchStats: recordingsByBranch.map((row) => ({
        branch_name: row.branch_name || "Unknown Branch",
        total_recordings: row.total_recordings,
      })),
      statusDistribution: recordingsByStatus.map((row) => ({
        status: row.status,
        count: row.count,
      })),
      monthlyTrends: monthlyTrends.map((row) => ({
        month: row.month,
        recordings: row.recordings,
        avgDuration: Math.round(row.avgDuration || 0),
        todayRecordings: row.todayRecordings,
      })),
    };

    res.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};
