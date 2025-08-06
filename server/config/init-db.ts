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

    // Create devices table if it doesn't exist
    const createDevicesTable = `
      CREATE TABLE IF NOT EXISTS devices (
        id VARCHAR(36) PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,
        device_name VARCHAR(255) NOT NULL,
        device_mac VARCHAR(17),
        created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_ip_address (ip_address),
        INDEX idx_device_name (device_name),
        INDEX idx_device_mac (device_mac)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await executeQuery(createDevicesTable);
    console.log("✅ Devices table created/verified successfully");

    // Also create device_mappings table for compatibility
    const createDeviceMappingsTable = `
      CREATE TABLE IF NOT EXISTS device_mappings (
        id VARCHAR(36) PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,
        device_name VARCHAR(255) NOT NULL,
        device_mac VARCHAR(17),
        created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_ip_address (ip_address),
        INDEX idx_device_name (device_name),
        INDEX idx_device_mac (device_mac)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await executeQuery(createDevicesTable);
    console.log("✅ Devices table created/verified successfully");

    // Create heartbeats table if it doesn't exist
    const createHeartbeatsTable = `
      CREATE TABLE IF NOT EXISTS heartbeats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        device_name VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45),
        status ENUM('online', 'problematic', 'offline') DEFAULT 'online',
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_device_name (device_name),
        INDEX idx_last_seen (last_seen)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await executeQuery(createHeartbeatsTable);
    console.log("✅ Heartbeats table created/verified successfully");

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

    console.log("🚀 All database tables initialized successfully");
    
  } catch (error) {
    console.error("❌ Error initializing database tables:", error);
    throw error;
  }
}
