import { RequestHandler } from "express";
import { executeQuery } from "../config/database";

interface VoiceStreamMonthlyData {
  month: string;
  voice_streams: number;
  formatted_month: string;
}

interface VoiceStreamStats {
  total_streams: number;
  current_month_streams: number;
  previous_month_streams: number;
  monthly_data: VoiceStreamMonthlyData[];
}

// Get voice streams analytics for branch users
export const getVoiceStreamsAnalytics: RequestHandler = async (req, res) => {
  try {
    // Get branch filter from middleware
    const branchFilter = (req as any).branchFilter;
    const branchFilterCondition = branchFilter
      ? `AND ldbu.branch_id = '${branchFilter.value}'`
      : '';

    // Get total voice streams count
    const totalQuery = `
      SELECT COUNT(*) as total_streams
      FROM recordings r
      LEFT JOIN devices d ON d.device_mac = r.mac_address OR d.ip_address = r.ip_address
      LEFT JOIN link_device_branch_user ldbu ON ldbu.device_id = d.id
      LEFT JOIN branches b ON b.id = ldbu.branch_id
      WHERE 1=1 ${branchFilterCondition}
    `;

    // Get current month voice streams
    const currentMonthQuery = `
      SELECT COUNT(*) as current_month_streams
      FROM recordings r
      LEFT JOIN devices d ON d.device_mac = r.mac_address OR d.ip_address = r.ip_address
      LEFT JOIN link_device_branch_user ldbu ON ldbu.device_id = d.id
      LEFT JOIN branches b ON b.id = ldbu.branch_id
      WHERE YEAR(r.start_time) = YEAR(CURDATE())
        AND MONTH(r.start_time) = MONTH(CURDATE())
        ${branchFilterCondition}
    `;

    // Get previous month voice streams
    const previousMonthQuery = `
      SELECT COUNT(*) as previous_month_streams
      FROM recordings r
      LEFT JOIN devices d ON d.device_mac = r.mac_address OR d.ip_address = r.ip_address
      LEFT JOIN link_device_branch_user ldbu ON ldbu.device_id = d.id
      LEFT JOIN branches b ON b.id = ldbu.branch_id
      WHERE YEAR(r.start_time) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
        AND MONTH(r.start_time) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
        ${branchFilterCondition}
    `;

    // Get monthly voice streams for last 12 months
    const monthlyQuery = `
      SELECT
        DATE_FORMAT(r.start_time, '%Y-%m') as month,
        COUNT(*) as voice_streams
      FROM recordings r
      LEFT JOIN devices d ON d.device_mac = r.mac_address OR d.ip_address = r.ip_address
      LEFT JOIN link_device_branch_user ldbu ON ldbu.device_id = d.id
      LEFT JOIN branches b ON b.id = ldbu.branch_id
      WHERE r.start_time >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        ${branchFilterCondition}
      GROUP BY DATE_FORMAT(r.start_time, '%Y-%m')
      ORDER BY month ASC
    `;

    // Execute all queries in parallel
    const [
      totalResult,
      currentMonthResult,
      previousMonthResult,
      monthlyResult
    ] = await Promise.all([
      executeQuery<{ total_streams: number }>(totalQuery),
      executeQuery<{ current_month_streams: number }>(currentMonthQuery),
      executeQuery<{ previous_month_streams: number }>(previousMonthQuery),
      executeQuery<{ month: string; voice_streams: number }>(monthlyQuery)
    ]);

    // Generate last 12 months array to fill missing months with 0
    const last12Months: VoiceStreamMonthlyData[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
      const formattedMonth = date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      });

      const existingData = monthlyResult.find(item => item.month === monthKey);
      last12Months.push({
        month: monthKey,
        voice_streams: existingData ? existingData.voice_streams : 0,
        formatted_month: formattedMonth
      });
    }

    const response: VoiceStreamStats = {
      total_streams: totalResult[0]?.total_streams || 0,
      current_month_streams: currentMonthResult[0]?.current_month_streams || 0,
      previous_month_streams: previousMonthResult[0]?.previous_month_streams || 0,
      monthly_data: last12Months
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching voice streams analytics:", error);
    res.status(500).json({
      error: "Failed to fetch voice streams analytics",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};
