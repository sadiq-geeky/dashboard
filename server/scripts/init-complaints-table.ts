import { executeQuery } from "../config/database";

export async function initializeComplaintsTable() {
  try {
    console.log("🔄 Initializing complaints table...");

    // Create complaints table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS complaints (
        complaint_id VARCHAR(36) PRIMARY KEY,
        branch_id VARCHAR(36) NOT NULL,
        branch_name VARCHAR(255) NOT NULL,
        timestamp DATETIME NOT NULL,
        customer_data JSON,
        complaint_text TEXT NOT NULL,
        status ENUM('pending', 'in_progress', 'resolved', 'closed') DEFAULT 'pending',
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_branch_id (branch_id),
        INDEX idx_status (status),
        INDEX idx_priority (priority),
        INDEX idx_timestamp (timestamp),
        INDEX idx_created_on (created_on)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await executeQuery(createTableQuery);
    console.log("✅ Complaints table created/verified");

    console.log("✅ Complaints table initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing complaints table:", error);
    throw error;
  }
}


// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeComplaintsTable()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
