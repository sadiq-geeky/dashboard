import { executeQuery } from "../config/database";

export async function addNotesColumnMigration() {
  try {
    console.log("🔄 Adding notes column to complaints table...");

    // Check if notes column already exists
    const checkColumnQuery = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'complaints' 
      AND COLUMN_NAME = 'notes'
    `;

    const columnExists = await executeQuery(checkColumnQuery);

    if (columnExists.length === 0) {
      // Add notes column if it doesn't exist
      const addColumnQuery = `
        ALTER TABLE complaints 
        ADD COLUMN notes TEXT
      `;

      await executeQuery(addColumnQuery);
      console.log("✅ Notes column added to complaints table");
    } else {
      console.log("✅ Notes column already exists in complaints table");
    }

    console.log("✅ Migration completed successfully");
  } catch (error) {
    console.error("❌ Error adding notes column:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addNotesColumnMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
