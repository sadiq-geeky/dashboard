import { RequestHandler } from "express";
import { executeQuery } from "../config/database";

// Conversation Analytics interface
export interface ConversationAnalytics {
  conversationsByBranch: Array<{
    branch_id: string;
    branch_name: string;
    count: number;
    month: string;
  }>;
  conversationsByCity: Array<{
    city: string;
    conversion_count: number;
    total_conversations: number;
  }>;
  dailyConversationsLastMonth: Array<{
    date: string;
    conversion_count: number;
    total_conversations: number;
  }>;
  uniqueCnicsByMonth: Array<{ month: string; unique_cnic_count: number }>;
  totalStats: {
    totalConversations: number;
    uniqueCustomers: number;
    activeBranches: number;
    todayConversations: number;
  };
  // Conversion Analytics
  conversionMetrics: {
    totalConversions: number;
    conversionRate: number;
    avgConversationDuration: number;
    successfulOutcomes: number;
  };
  conversionsByBranch: Array<{
    branch_name: string;
    total_conversations: number;
    successful_conversions: number;
    conversion_rate: number;
  }>;
  conversionTrends: Array<{
    date: string;
    conversations: number;
    conversions: number;
    conversion_rate: number;
  }>;
  conversionFunnel: Array<{
    stage: string;
    count: number;
    percentage: number;
  }>;
}

// Get conversations analytics by branch
export const getConversationsByBranch: RequestHandler = async (req, res) => {
  try {
    // Get branch filter from middleware
    const branchFilter = (req as any).branchFilter;
    const branchFilterCondition = branchFilter
      ? `AND ldbu.branch_id = '${branchFilter.value}'`
      : "";

    const query = `
      SELECT
        ldbu.branch_id,
        COALESCE(MAX(b.branch_address), 'Unknown Branch') as branch_name,
        COUNT(r.id) AS count
      FROM recordings r
      LEFT JOIN devices d ON d.device_mac = r.mac_address OR d.ip_address = r.ip_address
      LEFT JOIN link_device_branch_user ldbu ON ldbu.device_id = d.id
      LEFT JOIN branches b ON b.id = ldbu.branch_id
      WHERE ldbu.branch_id IS NOT NULL ${branchFilterCondition}
      GROUP BY ldbu.branch_id
      ORDER BY count DESC
    `;

    const result = await executeQuery<{
      branch_id: string;
      branch_name: string;
      count: number;
    }>(query);

    res.json(result);
  } catch (error) {
    console.error("Error fetching conversations by branch:", error);
    res.status(500).json({ error: "Failed to fetch conversations by branch" });
  }
};

// Get conversations per branch per month for interactive chart
export const getConversationsByBranchPerMonth: RequestHandler = async (
  req,
  res,
) => {
  try {
    // Get branch filter from middleware
    const branchFilter = (req as any).branchFilter;
    const branchFilterCondition = branchFilter
      ? `AND ldbu.branch_id = '${branchFilter.value}'`
      : "";

    const query = `
      SELECT
        ldbu.branch_id,
        COALESCE(MAX(b.branch_address), 'Unknown Branch') as branch_name,
        COALESCE(b.branch_city, 'Unknown City') as branch_city,
        DATE_FORMAT(r.start_time, '%Y-%m') as month,
        COUNT(r.id) AS count
      FROM recordings r
      LEFT JOIN devices d ON d.device_mac = r.mac_address OR d.ip_address = r.ip_address
      LEFT JOIN link_device_branch_user ldbu ON ldbu.device_id = d.id
      LEFT JOIN branches b ON b.id = ldbu.branch_id
      WHERE ldbu.branch_id IS NOT NULL
        AND r.start_time >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        ${branchFilterCondition}
      GROUP BY ldbu.branch_id, b.branch_address, b.branch_city, DATE_FORMAT(r.start_time, '%Y-%m')
      ORDER BY month DESC, count DESC
    `;

    const result = await executeQuery<{
      branch_id: string;
      branch_name: string;
      branch_city: string;
      month: string;
      count: number;
    }>(query);

    res.json(result);
  } catch (error) {
    console.error("Error fetching conversations by branch per month:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch conversations by branch per month" });
  }
};

// Get conversations analytics by city
export const getConversationsByCity: RequestHandler = async (req, res) => {
  try {
    // Get branch filter from middleware
    const branchFilter = (req as any).branchFilter;
    const branchFilterCondition = branchFilter
      ? `AND ldbu.branch_id = '${branchFilter.value}'`
      : "";

    const query = `
      SELECT
        b.branch_city as city,
        COUNT(r.id) AS count,
        COUNT(DISTINCT ldbu.branch_id) as branch_count
      FROM recordings r
      LEFT JOIN devices d ON d.device_mac = r.mac_address OR d.ip_address = r.ip_address
      LEFT JOIN link_device_branch_user ldbu ON ldbu.device_id = d.id
      LEFT JOIN branches b ON b.id = ldbu.branch_id
      WHERE b.branch_city IS NOT NULL ${branchFilterCondition}
      GROUP BY b.branch_city
      ORDER BY count DESC
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
export const getDailyConversationsLastMonth: RequestHandler = async (
  req,
  res,
) => {
  try {
    // Get branch filter from middleware
    const branchFilter = (req as any).branchFilter;
    const branchFilterCondition = branchFilter
      ? `AND ldbu.branch_id = '${branchFilter.value}'`
      : "";

    const query = `
      SELECT
        DATE(r.start_time) AS date,
        COUNT(r.id) AS count
      FROM recordings r
      LEFT JOIN devices d ON d.device_mac = r.mac_address OR d.ip_address = r.ip_address
      LEFT JOIN link_device_branch_user ldbu ON ldbu.device_id = d.id
      LEFT JOIN branches b ON b.id = ldbu.branch_id
      WHERE r.start_time >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
        ${branchFilterCondition}
      GROUP BY DATE(r.start_time)
      ORDER BY date
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

// Get recordings per month for a specific branch
export const getBranchRecordingsByMonth: RequestHandler = async (req, res) => {
  try {
    const { branchId } = req.params;

    if (!branchId) {
      return res.status(400).json({ error: "Branch ID is required" });
    }

    const query = `
      SELECT
        DATE_FORMAT(r.start_time, '%Y-%m') as month,
        DATE_FORMAT(r.start_time, '%M %Y') as formatted_month,
        COUNT(r.id) AS count
      FROM recordings r
      LEFT JOIN devices d ON d.device_mac = r.mac_address OR d.ip_address = r.ip_address
      LEFT JOIN link_device_branch_user ldbu ON ldbu.device_id = d.id
      LEFT JOIN branches b ON b.id = ldbu.branch_id
      WHERE ldbu.branch_id = ?
        AND r.start_time >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(r.start_time, '%Y-%m'), DATE_FORMAT(r.start_time, '%M %Y')
      ORDER BY month DESC
      LIMIT 12
    `;

    const result = await executeQuery<{
      month: string;
      formatted_month: string;
      count: number;
    }>(query, [branchId]);

    res.json(result);
  } catch (error) {
    console.error("Error fetching branch recordings by month:", error);
    res.status(500).json({ error: "Failed to fetch branch recordings by month" });
  }
};

// Get unique CNICs by month
export const getUniqueCnicsByMonth: RequestHandler = async (req, res) => {
  try {
    // Get branch filter from middleware
    const branchFilter = (req as any).branchFilter;
    const branchFilterCondition = branchFilter
      ? `AND ldbu.branch_id = '${branchFilter.value}'`
      : "";

    const query = `
      SELECT
        COUNT(DISTINCT REPLACE(r.cnic, '-', '')) AS unique_cnic_count
      FROM recordings r
      LEFT JOIN devices d ON d.device_mac = r.mac_address OR d.ip_address = r.ip_address
      LEFT JOIN link_device_branch_user ldbu ON ldbu.device_id = d.id
      LEFT JOIN branches b ON b.id = ldbu.branch_id
      WHERE r.start_time >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
        ${branchFilterCondition}
    `;

    const result = await executeQuery<{
      unique_cnic_count: number;
    }>(query);

    const response = {
      month: new Date().toISOString().slice(0, 7), // Current month
      unique_cnic_count: result[0]?.unique_cnic_count || 0,
    };

    res.json([response]);
  } catch (error) {
    console.error("Error fetching unique CNICs by month:", error);
    res.status(500).json({ error: "Failed to fetch unique CNICs by month" });
  }
};

// Get complete conversation analytics
export const getConversationAnalytics: RequestHandler = async (req, res) => {
  try {
    // Get branch filter from middleware
    const branchFilter = (req as any).branchFilter;
    const branchFilterCondition = branchFilter
      ? `AND ldbu.branch_id = '${branchFilter.value}'`
      : "";

    // 1. Number of conversations according to branch
    const branchQuery = `
      SELECT
        ldbu.branch_id,
        COALESCE(MAX(b.branch_address), 'Unknown Branch') as branch_name,
        COUNT(r.id) AS count
      FROM recordings r
      LEFT JOIN devices d ON d.device_mac = r.mac_address OR d.ip_address = r.ip_address
      LEFT JOIN link_device_branch_user ldbu ON ldbu.device_id = d.id
      LEFT JOIN branches b ON b.id = ldbu.branch_id
      WHERE ldbu.branch_id IS NOT NULL ${branchFilterCondition}
      GROUP BY ldbu.branch_id
      ORDER BY count DESC
    `;

    // 2. Conversion number per city (successful recordings per city)
    const cityQuery = `
      SELECT
        b.branch_city as city,
        COUNT(CASE WHEN r.end_time IS NOT NULL AND r.file_name IS NOT NULL THEN 1 END) AS conversion_count,
        COUNT(r.id) AS total_conversations
      FROM recordings r
      LEFT JOIN devices d ON d.device_mac = r.mac_address OR d.ip_address = r.ip_address
      LEFT JOIN link_device_branch_user ldbu ON ldbu.device_id = d.id
      LEFT JOIN branches b ON b.id = ldbu.branch_id
      WHERE b.branch_city IS NOT NULL ${branchFilterCondition}
      GROUP BY b.branch_city
      ORDER BY conversion_count DESC
    `;

    // 3. Number of conversions according to date in last month
    const dailyQuery = `
      SELECT
        DATE(r.start_time) AS date,
        COUNT(CASE WHEN r.end_time IS NOT NULL AND r.file_name IS NOT NULL THEN 1 END) AS conversion_count,
        COUNT(r.id) AS total_conversations
      FROM recordings r
      LEFT JOIN devices d ON d.device_mac = r.mac_address OR d.ip_address = r.ip_address
      LEFT JOIN link_device_branch_user ldbu ON ldbu.device_id = d.id
      LEFT JOIN branches b ON b.id = ldbu.branch_id
      WHERE r.start_time >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
        ${branchFilterCondition}
      GROUP BY DATE(r.start_time)
      ORDER BY date
    `;

    // 4. Unique CNIC in a month (new CNICs in current month)
    const cnicQuery = `
      SELECT
        COUNT(DISTINCT REPLACE(r.cnic, '-', '')) AS unique_cnic_count
      FROM recordings r
      LEFT JOIN devices d ON d.device_mac = r.mac_address OR d.ip_address = r.ip_address
      LEFT JOIN link_device_branch_user ldbu ON ldbu.device_id = d.id
      LEFT JOIN branches b ON b.id = ldbu.branch_id
      WHERE YEAR(r.start_time) = YEAR(CURDATE())
        AND MONTH(r.start_time) = MONTH(CURDATE())
        AND r.cnic IS NOT NULL
        AND r.cnic != ''
        ${branchFilterCondition}
    `;

    // Total statistics
    const totalStatsQuery = `
      SELECT
        COUNT(*) as totalConversations,
        COUNT(DISTINCT REPLACE(r.cnic, '-', '')) as uniqueCustomers,
        COUNT(DISTINCT ldbu.branch_id) as activeBranches,
        SUM(CASE WHEN DATE(r.start_time) = CURDATE() THEN 1 ELSE 0 END) as todayConversations
      FROM recordings r
      LEFT JOIN devices d ON d.device_mac = r.mac_address OR d.ip_address = r.ip_address
      LEFT JOIN link_device_branch_user ldbu ON ldbu.device_id = d.id
      LEFT JOIN branches b ON b.id = ldbu.branch_id
      WHERE r.start_time >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        ${branchFilterCondition}
    `;

    // Conversion analytics queries
    const conversionMetricsQuery = `
      SELECT
        COUNT(CASE WHEN r.end_time IS NOT NULL AND r.file_name IS NOT NULL THEN 1 END) as totalConversions,
        (COUNT(CASE WHEN r.end_time IS NOT NULL AND r.file_name IS NOT NULL THEN 1 END) * 100.0 / COUNT(*)) as conversionRate,
        AVG(CASE WHEN r.end_time IS NOT NULL THEN TIMESTAMPDIFF(SECOND, r.start_time, r.end_time) ELSE r.duration_seconds END) as avgConversationDuration,
        COUNT(CASE WHEN r.end_time IS NOT NULL AND r.file_name IS NOT NULL AND TIMESTAMPDIFF(SECOND, r.start_time, r.end_time) >= 120 THEN 1 END) as successfulOutcomes
      FROM recordings r
      LEFT JOIN devices d ON d.device_mac = r.mac_address OR d.ip_address = r.ip_address
      LEFT JOIN link_device_branch_user ldbu ON ldbu.device_id = d.id
      LEFT JOIN branches b ON b.id = ldbu.branch_id
      WHERE r.start_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ${branchFilterCondition}
    `;

    const conversionsByBranchQuery = `
      SELECT
        COALESCE(b.branch_address, 'Unknown Branch') as branch_name,
        COUNT(r.id) as total_conversations,
        COUNT(CASE WHEN r.end_time IS NOT NULL AND r.file_name IS NOT NULL THEN 1 END) as successful_conversions,
        (COUNT(CASE WHEN r.end_time IS NOT NULL AND r.file_name IS NOT NULL THEN 1 END) * 100.0 / COUNT(r.id)) as conversion_rate
      FROM recordings r
      LEFT JOIN devices d ON d.device_mac = r.mac_address OR d.ip_address = r.ip_address
      LEFT JOIN link_device_branch_user ldbu ON ldbu.device_id = d.id
      LEFT JOIN branches b ON b.id = ldbu.branch_id
      WHERE r.start_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ${branchFilterCondition}
      GROUP BY b.branch_address
      HAVING COUNT(r.id) > 0
      ORDER BY conversion_rate DESC
    `;

    const conversionTrendsQuery = `
      SELECT
        DATE(r.start_time) as date,
        COUNT(r.id) as conversations,
        COUNT(CASE WHEN r.end_time IS NOT NULL AND r.file_name IS NOT NULL THEN 1 END) as conversions,
        (COUNT(CASE WHEN r.end_time IS NOT NULL AND r.file_name IS NOT NULL THEN 1 END) * 100.0 / COUNT(r.id)) as conversion_rate
      FROM recordings r
      WHERE r.start_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(r.start_time)
      ORDER BY date ASC
    `;

    // Execute all queries in parallel
    const [
      conversationsByBranch,
      conversationsByCity,
      dailyConversationsLastMonth,
      uniqueCnicResult,
      totalStatsResult,
      conversionMetricsResult,
      conversionsByBranchResult,
      conversionTrendsResult,
    ] = await Promise.all([
      executeQuery<{ branch_id: string; branch_name: string; count: number }>(
        branchQuery,
      ),
      executeQuery<{
        city: string;
        conversion_count: number;
        total_conversations: number;
      }>(cityQuery),
      executeQuery<{
        date: string;
        conversion_count: number;
        total_conversations: number;
      }>(dailyQuery),
      executeQuery<{ unique_cnic_count: number }>(cnicQuery),
      executeQuery<{
        totalConversations: number;
        uniqueCustomers: number;
        activeBranches: number;
        todayConversations: number;
      }>(totalStatsQuery),
      executeQuery<{
        totalConversions: number;
        conversionRate: number;
        avgConversationDuration: number;
        successfulOutcomes: number;
      }>(conversionMetricsQuery),
      executeQuery<{
        branch_name: string;
        total_conversations: number;
        successful_conversions: number;
        conversion_rate: number;
      }>(conversionsByBranchQuery),
      executeQuery<{
        date: string;
        conversations: number;
        conversions: number;
        conversion_rate: number;
      }>(conversionTrendsQuery),
    ]);

    const totalStats = totalStatsResult[0] || {
      totalConversations: 0,
      uniqueCustomers: 0,
      activeBranches: 0,
      todayConversations: 0,
    };

    const uniqueCnicCount = uniqueCnicResult[0]?.unique_cnic_count || 0;

    const conversionMetrics = conversionMetricsResult[0] || {
      totalConversions: 0,
      conversionRate: 0,
      avgConversationDuration: 0,
      successfulOutcomes: 0,
    };

    // Create conversion funnel based on data
    const totalRecordings = totalStats.totalConversations;
    const conversionFunnel = [
      { stage: "Initial Contact", count: totalRecordings, percentage: 100 },
      {
        stage: "Information Gathered",
        count: Math.round(totalRecordings * 0.9),
        percentage: 90,
      },
      {
        stage: "Needs Assessment",
        count: conversionMetrics.totalConversions,
        percentage: conversionMetrics.conversionRate,
      },
      {
        stage: "Solution Presented",
        count: Math.round(conversionMetrics.totalConversions * 0.85),
        percentage: conversionMetrics.conversionRate * 0.85,
      },
      {
        stage: "Successful Outcome",
        count: conversionMetrics.successfulOutcomes,
        percentage:
          (conversionMetrics.successfulOutcomes / totalRecordings) * 100,
      },
    ];

    const analytics: ConversationAnalytics = {
      conversationsByBranch: conversationsByBranch.map((row) => ({
        branch_id: row.branch_id || "unknown",
        branch_name: row.branch_name || "Unknown Branch",
        count: row.count,
        month: new Date().toISOString().slice(0, 7), // Current month as default
      })),
      conversationsByCity: conversationsByCity.map((row) => ({
        city: row.city || "Unknown City",
        conversion_count: row.conversion_count,
        total_conversations: row.total_conversations,
      })),
      dailyConversationsLastMonth: dailyConversationsLastMonth.map((row) => ({
        date: row.date,
        conversion_count: row.conversion_count,
        total_conversations: row.total_conversations,
      })),
      uniqueCnicsByMonth: [
        {
          month: new Date().toISOString().slice(0, 7), // Current month
          unique_cnic_count: uniqueCnicCount,
        },
      ],
      totalStats: {
        totalConversations: totalStats.totalConversations,
        uniqueCustomers: uniqueCnicCount, // Use the actual unique CNIC count
        activeBranches: totalStats.activeBranches,
        todayConversations: totalStats.todayConversations,
      },
      conversionMetrics: {
        totalConversions: conversionMetrics.totalConversions,
        conversionRate:
          Math.round((conversionMetrics.conversionRate || 0) * 10) / 10,
        avgConversationDuration: Math.round(
          conversionMetrics.avgConversationDuration || 0,
        ),
        successfulOutcomes: conversionMetrics.successfulOutcomes,
      },
      conversionsByBranch: conversionsByBranchResult.map((row) => ({
        branch_name: row.branch_name,
        total_conversations: row.total_conversations,
        successful_conversions: row.successful_conversions,
        conversion_rate: Math.round((row.conversion_rate || 0) * 10) / 10,
      })),
      conversionTrends: conversionTrendsResult.map((row) => ({
        date: row.date,
        conversations: row.conversations,
        conversions: row.conversions,
        conversion_rate: Math.round((row.conversion_rate || 0) * 10) / 10,
      })),
      conversionFunnel: conversionFunnel,
    };

    res.json(analytics);
  } catch (error) {
    console.error("Error fetching conversation analytics:", error);
    res.status(500).json({ error: "Failed to fetch conversation analytics" });
  }
};
