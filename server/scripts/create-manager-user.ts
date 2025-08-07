import { executeQuery } from "../config/database";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";

export async function createManagerUser() {
  try {
    console.log("🔄 Creating manager user for testing...");

    // Get a branch to assign to the manager
    const branches = await executeQuery<{ id: string; branch_name: string }>(
      "SELECT id, branch_name FROM branches LIMIT 1",
    );

    if (branches.length === 0) {
      console.log("❌ No branches found. Please create branches first.");
      return;
    }

    const branch = branches[0];
    console.log(`📍 Using branch: ${branch.branch_name} (${branch.id})`);

    // Update an existing regular user to manager role
    const regularUsers = await executeQuery<{ uuid: string; username: string }>(
      "SELECT uuid, username FROM users WHERE role = 'user' LIMIT 1",
    );

    if (regularUsers.length > 0) {
      const user = regularUsers[0];
      await executeQuery("UPDATE users SET role = 'manager' WHERE uuid = ?", [
        user.uuid,
      ]);
      console.log(`✅ Updated user '${user.username}' to manager role`);
      console.log(`📋 Manager login credentials:`);
      console.log(`   Username: ${user.username}`);
      console.log(
        `   Password: user123 (if default) or check existing password`,
      );
    } else {
      console.log("⚠️ No regular users found to convert to manager");
    }

    console.log("🎉 Manager user setup completed!");
  } catch (error) {
    console.error("❌ Error creating manager user:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createManagerUser()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
