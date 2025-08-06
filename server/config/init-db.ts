import { executeQuery } from "./database";

export async function initializeTables() {
  try {
    console.log("🔄 Initializing database tables...");

    // Create branches table
    const createBranchesTable = `
      CREATE TABLE IF NOT EXISTS branches (
        id VARCHAR(36) PRIMARY KEY,
        branch_code VARCHAR(50) UNIQUE NOT NULL,
        branch_name VARCHAR(255) NOT NULL,
        branch_city VARCHAR(100),
        branch_address TEXT,
        region VARCHAR(100),
        contact_phone VARCHAR(20),
        contact_email VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_branch_code (branch_code),
        INDEX idx_branch_name (branch_name),
        INDEX idx_branch_city (branch_city),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `;

    await executeQuery(createBranchesTable);
    console.log("✅ Branches table created/verified successfully");

    // Create devices table
    const createDevicesTable = `
      CREATE TABLE IF NOT EXISTS devices (
        id VARCHAR(36) PRIMARY KEY,
        device_name VARCHAR(255) NOT NULL,
        device_mac VARCHAR(17) UNIQUE,
        ip_address VARCHAR(45),
        device_type ENUM('recorder', 'monitor', 'other') DEFAULT 'recorder',
        branch_id VARCHAR(36),
        installation_date DATE,
        last_maintenance DATE,
        device_status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
        notes TEXT,
        created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
        INDEX idx_device_name (device_name),
        INDEX idx_device_mac (device_mac),
        INDEX idx_ip_address (ip_address),
        INDEX idx_branch_id (branch_id),
        INDEX idx_device_status (device_status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `;

    await executeQuery(createDevicesTable);
    console.log("✅ Devices table created/verified successfully");


    // Create recording_heartbeat table for compatibility
    const createRecordingHeartbeatTable = `
      CREATE TABLE IF NOT EXISTS recording_heartbeat (
        uuid VARCHAR(36) PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,
        mac_address VARCHAR(17),
        created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ip_address (ip_address),
        INDEX idx_mac_address (mac_address),
        INDEX idx_created_on (created_on)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await executeQuery(createRecordingHeartbeatTable);
    console.log("✅ Recording heartbeat table created/verified successfully");


    // Also create recording_history table for compatibility
    const createRecordingHistoryTable = `
      CREATE TABLE IF NOT EXISTS recording_history (
        id VARCHAR(36) PRIMARY KEY,
        cnic VARCHAR(15),
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        file_name VARCHAR(255),
        device_name VARCHAR(255),
        ip_address VARCHAR(45),
        device_mac VARCHAR(17),
        duration_seconds INT,
        status ENUM('completed', 'in_progress', 'failed') DEFAULT 'in_progress',
        CREATED_ON TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_cnic (cnic),
        INDEX idx_device_name (device_name),
        INDEX idx_device_mac (device_mac),
        INDEX idx_start_time (start_time),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await executeQuery(createRecordingHistoryTable);
    console.log("✅ Recording history table created/verified successfully");

    // Create users table if it doesn't exist
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        uuid VARCHAR(36) PRIMARY KEY,
        emp_name VARCHAR(255) NOT NULL,
        branch_id VARCHAR(36),
        gender ENUM('Male', 'Female', 'Other'),
        date_of_birth DATE,
        cnic VARCHAR(15),
        phone_no VARCHAR(20),
        designation VARCHAR(100),
        department VARCHAR(100),
        joining_date DATE,
        email_id VARCHAR(255),
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
        INDEX idx_username (username),
        INDEX idx_branch_id (branch_id),
        INDEX idx_role (role),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `;

    await executeQuery(createUsersTable);
    console.log("✅ Users table created/verified successfully");

    // Add device_mac column to recording_history table if it doesn't exist
    try {
      await executeQuery(
        `ALTER TABLE recording_history ADD COLUMN device_mac VARCHAR(17)`,
      );
      console.log("✅ Added device_mac column to recording_history table");
    } catch (error: any) {
      if (error.code === "ER_DUP_FIELDNAME") {
        console.log(
          "✅ device_mac column already exists in recording_history table",
        );
      } else {
        console.log(
          "⚠️  Could not add device_mac to recording_history:",
          error.message,
        );
      }
    }

    // Create default admin user if none exists
    try {
      const { createDefaultAdmin } = await import("./create-admin");
      await createDefaultAdmin();
    } catch (error) {
      console.error("❌ Error creating default admin user:", error);
    }

    console.log("🚀 All database tables initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing database tables:", error);
    throw error;
  }
}
