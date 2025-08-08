import { RequestHandler } from "express";
import { executeQuery } from "../config/database";

interface BranchMonthlyTrend {
  branch_code: string;
  yr: number;
  mth: number;
  total_records: number;
}

export const getBranchMonthlyTrend: RequestHandler = async (req, res) => {
  try {
    const query = `
      SELECT
        b.branch_code,
        YEAR(rh.start_time) AS yr,
        MONTH(rh.start_time) AS mth,
        COUNT(*) AS total_records
      FROM recordings rh
      LEFT JOIN devices d ON d.device_mac = rh.mac_address
      LEFT JOIN link_device_branch_user ldbu ON ldbu.device_id = d.id
      LEFT JOIN branches b ON b.id = ldbu.branch_id
      WHERE b.branch_code IS NOT NULL
      GROUP BY b.branch_code, YEAR(rh.start_time), MONTH(rh.start_time)
      ORDER BY b.branch_code, YEAR(rh.start_time), MONTH(rh.start_time)
    `;

    const results = await executeQuery<BranchMonthlyTrend>(query);

    res.json(results);
  } catch (error) {
    console.error("Error fetching branch monthly trend:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch branch monthly trend data" });
  }
};
