import { executeQuery } from './config/database.js';

export async function migrateUsersTable() {
  try {
    console.log("🔧 Starting users table migration...");
    
    // First, add the missing columns if they don't exist
    try {
      await executeQuery(`ALTER TABLE users ADD COLUMN created_by VARCHAR(36)`);
      console.log("✅ Added created_by column");
    } catch (error: any) {
      if (error.code === "ER_DUP_FIELDNAME") {
        console.log("✅ created_by column already exists");
      } else {
        console.log("⚠️ Could not add created_by:", error.message);
      }
    }
    
    try {
      await executeQuery(`ALTER TABLE users ADD COLUMN updated_by VARCHAR(36)`);
      console.log("✅ Added updated_by column");
    } catch (error: any) {
      if (error.code === "ER_DUP_FIELDNAME") {
        console.log("✅ updated_by column already exists");
      } else {
        console.log("⚠️ Could not add updated_by:", error.message);
      }
    }
    
    // Remove unwanted columns
    const columnsToRemove = ['branch_id', 'branch_city', 'branch_address', 'device_mac'];
    
    for (const column of columnsToRemove) {
      try {
        await executeQuery(`ALTER TABLE users DROP COLUMN ${column}`);
        console.log(`✅ Removed ${column} column`);
      } catch (error: any) {
        if (error.code === "ER_CANT_DROP_FIELD_OR_KEY") {
          console.log(`✅ ${column} column already removed`);
        } else {
          console.log(`⚠️ Could not remove ${column}:`, error.message);
        }
      }
    }
    
    // Remove foreign key constraints if they exist
    try {
      await executeQuery(`ALTER TABLE users DROP FOREIGN KEY users_ibfk_1`);
      console.log("✅ Removed branch foreign key constraint");
    } catch (error: any) {
      console.log("✅ Branch foreign key constraint already removed or doesn't exist");
    }
    
    // Remove indexes for removed columns
    const indexesToRemove = ['idx_branch_id'];
    
    for (const index of indexesToRemove) {
      try {
        await executeQuery(`ALTER TABLE users DROP INDEX ${index}`);
        console.log(`✅ Removed ${index} index`);
      } catch (error: any) {
        console.log(`✅ ${index} index already removed or doesn't exist`);
      }
    }
    
    console.log("🎉 Users table migration completed successfully!");
    
  } catch (error) {
    console.error("❌ Error migrating users table:", error);
    throw error;
  }
}

// Run the migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateUsersTable().catch(console.error);
}
