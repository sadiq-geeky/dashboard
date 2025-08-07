import { executeQuery } from "./database";

export async function initializeTables() {
  try {
    console.log("🔄 Database initialization - checking existing tables...");

    // Only check if admin user exists - no table creation
    try {
      const existingAdmin = await executeQuery<{ uuid: string }>(
        `SELECT uuid FROM users WHERE role = 'admin' LIMIT 1`,
      );

      if (existingAdmin.length === 0) {
        console.log("⚠️  No admin user found in database");
      } else {
        console.log("✅ Admin user exists");
      }
    } catch (error) {
      console.log(
        "⚠️  Could not check admin user existence - tables may not exist",
      );
    }

    // Check if branches exist
    try {
      const branchCount = await executeQuery<{ count: number }>(
        "SELECT COUNT(*) as count FROM branches",
      );
      console.log(
        `✅ Found ${branchCount[0]?.count || 0} branches in database`,
      );
    } catch (error) {
      console.log("⚠️  Could not check branches table - may not exist");
    }

    // Check if devices exist
    try {
      const deviceCount = await executeQuery<{ count: number }>(
        "SELECT COUNT(*) as count FROM devices",
      );
      console.log(`✅ Found ${deviceCount[0]?.count || 0} devices in database`);
    } catch (error) {
      console.log("⚠️  Could not check devices table - may not exist");
    }

    // Check if users exist
    try {
      const userCount = await executeQuery<{ count: number }>(
        "SELECT COUNT(*) as count FROM users",
      );
      console.log(`✅ Found ${userCount[0]?.count || 0} users in database`);
    } catch (error) {
      console.log("⚠️  Could not check users table - may not exist");
    }

    // Initialize complaints table
    try {
      const { initializeComplaintsTable } = await import("../scripts/init-complaints-table");
      await initializeComplaintsTable();
    } catch (error) {
      console.error("⚠️  Could not initialize complaints table:", error);
    }

    console.log("🚀 Database initialization completed - using existing schema");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}
