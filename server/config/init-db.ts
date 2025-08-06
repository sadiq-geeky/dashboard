import { executeQuery } from "./database";

export async function initializeTables() {
  try {
    console.log("🔄 Initializing database tables...");

    // Create contacts table
    const createContactsTable = `
      CREATE TABLE IF NOT EXISTS contacts (
        uuid VARCHAR(36) PRIMARY KEY,
        emp_name VARCHAR(255),
        device_mac VARCHAR(17),
        branch_id VARCHAR(50),
        branch_city VARCHAR(100),
        branch_address TEXT,
        gender ENUM('Male', 'Female', 'Other'),
        date_of_birth DATE,
        cnic VARCHAR(15),
        phone_no VARCHAR(20),
        designation VARCHAR(100),
        department VARCHAR(100),
        joining_date DATE,
        email_id VARCHAR(255),
        created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_emp_name (emp_name),
        INDEX idx_cnic (cnic),
        INDEX idx_phone_no (phone_no),
        INDEX idx_email_id (email_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await executeQuery(createContactsTable);
    console.log("✅ Contacts table created/verified successfully");


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

    // Create recordings table if it doesn't exist
    const createRecordingsTable = `
      CREATE TABLE IF NOT EXISTS recordings (
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
        created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_cnic (cnic),
        INDEX idx_device_name (device_name),
        INDEX idx_device_mac (device_mac),
        INDEX idx_start_time (start_time),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await executeQuery(createRecordingsTable);
    console.log("✅ Recordings table created/verified successfully");

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
        emp_name VARCHAR(255),
        device_mac VARCHAR(17),
        branch_id VARCHAR(50),
        branch_city VARCHAR(100),
        branch_address TEXT,
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
        INDEX idx_username (username),
        INDEX idx_branch_id (branch_id),
        INDEX idx_role (role),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await executeQuery(createUsersTable);
    console.log("✅ Users table created/verified successfully");

    // Add device_mac column to existing tables if it doesn't exist
    try {
      await executeQuery(
        `ALTER TABLE device_mappings ADD COLUMN device_mac VARCHAR(17)`,
      );
      console.log("✅ Added device_mac column to device_mappings table");
    } catch (error: any) {
      if (error.code === "ER_DUP_FIELDNAME") {
        console.log(
          "✅ device_mac column already exists in device_mappings table",
        );
      } else {
        console.log(
          "⚠️  Could not add device_mac to device_mappings:",
          error.message,
        );
      }
    }

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

    // Add branch_city column to existing contacts table if it doesn't exist
    try {
      await executeQuery(
        `ALTER TABLE contacts ADD COLUMN branch_city VARCHAR(100)`,
      );
      console.log("✅ Added branch_city column to contacts table");
    } catch (error: any) {
      if (error.code === "ER_DUP_FIELDNAME") {
        console.log(
          "✅ branch_city column already exists in contacts table",
        );
      } else {
        console.log(
          "⚠️  Could not add branch_city to contacts:",
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
