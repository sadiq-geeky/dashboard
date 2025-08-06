import { executeQuery } from './config/database.js';

export async function fixDevicesTable() {
  try {
    console.log("🔧 Checking and fixing devices table...");
    
    // First check if devices table exists and get its structure
    const checkTableQuery = `SHOW TABLES LIKE 'devices'`;
    const tableExists = await executeQuery(checkTableQuery);
    
    if (tableExists.length === 0) {
      console.log("📝 Devices table doesn't exist, creating it...");
      
      const createDevicesTable = `
        CREATE TABLE devices (
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
          INDEX idx_device_name (device_name),
          INDEX idx_device_mac (device_mac),
          INDEX idx_ip_address (ip_address),
          INDEX idx_branch_id (branch_id),
          INDEX idx_device_status (device_status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
      `;
      
      await executeQuery(createDevicesTable);
      console.log("✅ Devices table created successfully");
    } else {
      console.log("📋 Devices table exists, checking columns...");
      
      // Check if branch_id column exists
      const checkColumnQuery = `SHOW COLUMNS FROM devices LIKE 'branch_id'`;
      const columnExists = await executeQuery(checkColumnQuery);
      
      if (columnExists.length === 0) {
        console.log("➕ Adding missing branch_id column...");
        const addColumnQuery = `ALTER TABLE devices ADD COLUMN branch_id VARCHAR(36) AFTER device_type`;
        await executeQuery(addColumnQuery);
        
        const addIndexQuery = `ALTER TABLE devices ADD INDEX idx_branch_id (branch_id)`;
        await executeQuery(addIndexQuery);
        
        console.log("✅ branch_id column added successfully");
      } else {
        console.log("✅ branch_id column already exists");
      }
    }
    
    // Add some sample data if table is empty
    const countQuery = `SELECT COUNT(*) as count FROM devices`;
    const [countResult] = await executeQuery<{count: number}>(countQuery);
    
    if (countResult.count === 0) {
      console.log("📝 Adding sample device data...");
      const sampleDevices = [
        {
          id: 'device-001',
          device_name: 'Recording Device 001',
          device_mac: '00:11:22:33:44:55',
          ip_address: '192.168.1.100',
          device_type: 'recorder',
          device_status: 'active'
        },
        {
          id: 'device-002', 
          device_name: 'Recording Device 002',
          device_mac: '00:11:22:33:44:56',
          ip_address: '192.168.1.101',
          device_type: 'recorder',
          device_status: 'offline'
        }
      ];
      
      for (const device of sampleDevices) {
        const insertQuery = `
          INSERT INTO devices (id, device_name, device_mac, ip_address, device_type, device_status)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        await executeQuery(insertQuery, [
          device.id,
          device.device_name,
          device.device_mac,
          device.ip_address,
          device.device_type,
          device.device_status
        ]);
      }
      
      console.log("✅ Sample device data added successfully");
    }
    
    console.log("🎉 Devices table fix completed successfully!");
    
  } catch (error) {
    console.error("❌ Error fixing devices table:", error);
    throw error;
  }
}

// Run the fix if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixDevicesTable().catch(console.error);
}
