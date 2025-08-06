import { RequestHandler } from "express";
import { executeQuery } from "../config/database";

// Conversation Analytics interface
export interface ConversationAnalytics {
  conversationsByBranch: Array<{ branch_id: string; branch_name: string; count: number; month: string }>;
  conversationsByCity: Array<{ city: string; count: number; branch_count: number }>;
  dailyConversationsLastMonth: Array<{ date: string; count: number }>;
  uniqueCnicsByMonth: Array<{ month: string; unique_cnic_count: number }>;
  totalStats: {
    totalConversations: number;
    uniqueCustomers: number;
    activeBranches: number;
    todayConversations: number;
  };
}

// Get conversations analytics by branch
export const getConversationsByBranch: RequestHandler = async (req, res) => {
  try {
    const query = `
      SELECT 
        c.branch_id,
        COALESCE(c.branch_address, 'Unknown Branch') as branch_name,
        COUNT(rh.id) as count,
        DATE_FORMAT(rh.CREATED_ON, '%Y-%m') as month
      FROM recording_history rh
      LEFT JOIN contacts c ON c.device_mac COLLATE utf8mb4_unicode_ci = rh.device_mac COLLATE utf8mb4_unicode_ci
      WHERE rh.CREATED_ON >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
      GROUP BY c.branch_id, c.branch_address, DATE_FORMAT(rh.CREATED_ON, '%Y-%m')
      ORDER BY month DESC, count DESC
    `;

    const result = await executeQuery<{
      branch_id: string;
      branch_name: string;
      count: number;
      month: string;
    }>(query);

    res.json(result);
  } catch (error) {
    console.error("Error fetching conversations by branch:", error);
    res.status(500).json({ error: "Failed to fetch conversations by branch" });
  }
};

// Get conversations analytics by city
export const getConversationsByCity: RequestHandler = async (req, res) => {
  try {
    const query = `
      SELECT 
        SUBSTRING_INDEX(COALESCE(c.branch_address, 'Unknown'), ',', -1) as city,
        COUNT(rh.id) as count,
        COUNT(DISTINCT c.branch_id) as branch_count
      FROM recording_history rh
      LEFT JOIN contacts c ON c.device_mac COLLATE utf8mb4_unicode_ci = rh.device_mac COLLATE utf8mb4_unicode_ci
      WHERE rh.CREATED_ON >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
      GROUP BY city
      ORDER BY count DESC
      LIMIT 15
    `;

    const result = await executeQuery<{
      city: string;
      count: number;
      branch_count: number;
    }>(query);

    res.json(result);
  } catch (error) {
    console.error("Error fetching conversations by city:", error);
    res.status(500).json({ error: "Failed to fetch conversations by city" });
  }
};

// Get daily conversations for last month
export const getDailyConversationsLastMonth: RequestHandler = async (req, res) => {
  try {
    const query = `
      SELECT 
        DATE(rh.CREATED_ON) as date,
        COUNT(rh.id) as count
      FROM recording_history rh
      WHERE rh.CREATED_ON >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
      GROUP BY DATE(rh.CREATED_ON)
      ORDER BY date DESC
    `;

    const result = await executeQuery<{
      date: string;
      count: number;
    }>(query);

    res.json(result);
  } catch (error) {
    console.error("Error fetching daily conversations:", error);
    res.status(500).json({ error: "Failed to fetch daily conversations" });
  }
};

// Get unique CNICs by month
export const getUniqueCnicsByMonth: RequestHandler = async (req, res) => {
  try {
    const query = `
      SELECT 
        DATE_FORMAT(rh.CREATED_ON, '%Y-%m') as month,
        COUNT(DISTINCT rh.cnic) as unique_cnic_count
      FROM recording_history rh
      WHERE rh.cnic IS NOT NULL 
        AND rh.cnic != ''
        AND rh.CREATED_ON >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(rh.CREATED_ON, '%Y-%m')
      ORDER BY month DESC
    `;

    const result = await executeQuery<{
      month: string;
      unique_cnic_count: number;
    }>(query);

    res.json(result);
  } catch (error) {
    console.error("Error fetching unique CNICs by month:", error);
    res.status(500).json({ error: "Failed to fetch unique CNICs by month" });
  }
};

// Get complete conversation analytics
export const getConversationAnalytics: RequestHandler = async (req, res) => {
  try {
    // Conversations by branch - using exact user query
    const branchQuery = `
      SELECT
        c.branch_id,
        COALESCE(c.branch_address, 'Unknown Branch') as branch_name,
        COUNT(r.id) AS count
      FROM recording_history r
      JOIN contacts c
        ON r.mac_address COLLATE utf8mb4_unicode_ci = c.device_mac COLLATE utf8mb4_unicode_ci
      GROUP BY c.branch_id
      ORDER BY count DESC
    `;

    // Conversations by city - using exact user query
    const cityQuery = `
      SELECT
        c.branch_city as city,
        COUNT(r.id) AS count,
        COUNT(DISTINCT c.branch_id) as branch_count
      FROM recording_history r
      JOIN contacts c
        ON r.mac_address COLLATE utf8mb4_unicode_ci = c.device_mac COLLATE utf8mb4_unicode_ci
      WHERE c.branch_city IS NOT NULL
      GROUP BY c.branch_city
      ORDER BY count DESC
    `;

    // Daily conversations last month - using exact user query
    const dailyQuery = `
      SELECT
        DATE(r.start_time) AS date,
        COUNT(r.id) AS count
      FROM recording_history r
      WHERE r.start_time >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
      GROUP BY DATE(r.start_time)
      ORDER BY date
    `;

    // Unique CNICs count - using exact user query
    const cnicQuery = `
      SELECT
        COUNT(DISTINCT REPLACE(r.cnic, '-', '')) AS unique_cnic_count
      FROM recording_history r
      WHERE r.start_time >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
    `;

    // Total statistics
    const totalStatsQuery = `
      SELECT
        COUNT(*) as totalConversations,
        COUNT(DISTINCT REPLACE(r.cnic, '-', '')) as uniqueCustomers,
        COUNT(DISTINCT c.branch_id) as activeBranches,
        SUM(CASE WHEN DATE(r.start_time) = CURDATE() THEN 1 ELSE 0 END) as todayConversations
      FROM recording_history r
      LEFT JOIN contacts c ON c.device_mac COLLATE utf8mb4_unicode_ci = r.mac_address COLLATE utf8mb4_unicode_ci
      WHERE r.start_time >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    `;

    // Execute all queries in parallel
    const [
      conversationsByBranch,
      conversationsByCity,
      dailyConversationsLastMonth,
      uniqueCnicResult,
      totalStatsResult,
    ] = await Promise.all([
      executeQuery<{ branch_id: string; branch_name: string; count: number }>(branchQuery),
      executeQuery<{ city: string; count: number; branch_count: number }>(cityQuery),
      executeQuery<{ date: string; count: number }>(dailyQuery),
      executeQuery<{ unique_cnic_count: number }>(cnicQuery),
      executeQuery<{
        totalConversations: number;
        uniqueCustomers: number;
        activeBranches: number;
        todayConversations: number;
      }>(totalStatsQuery),
    ]);

    const totalStats = totalStatsResult[0] || {
      totalConversations: 0,
      uniqueCustomers: 0,
      activeBranches: 0,
      todayConversations: 0,
    };

    const analytics: ConversationAnalytics = {
      conversationsByBranch: conversationsByBranch.map((row) => ({
        branch_id: row.branch_id || 'unknown',
        branch_name: row.branch_name || "Unknown Branch",
        count: row.count,
        month: row.month,
      })),
      conversationsByCity: conversationsByCity.map((row) => ({
        city: row.city || "Unknown City",
        count: row.count,
        branch_count: row.branch_count,
      })),
      dailyConversationsLastMonth: dailyConversationsLastMonth.map((row) => ({
        date: row.date,
        count: row.count,
      })),
      uniqueCnicsByMonth: uniqueCnicsByMonth.map((row) => ({
        month: row.month,
        unique_cnic_count: row.unique_cnic_count,
      })),
      totalStats: {
        totalConversations: totalStats.totalConversations,
        uniqueCustomers: totalStats.uniqueCustomers,
        activeBranches: totalStats.activeBranches,
        todayConversations: totalStats.todayConversations,
      },
    };

    res.json(analytics);
  } catch (error) {
    console.error("Error fetching conversation analytics:", error);
    res.status(500).json({ error: "Failed to fetch conversation analytics" });
  }
};
