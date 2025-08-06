import { executeQuery } from "./database";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

export async function createDefaultAdmin() {
  try {
    // Check if admin user already exists
    const existingAdmin = await executeQuery<{ uuid: string }>(
      `SELECT uuid FROM users WHERE role = 'admin' LIMIT 1`
    );

    if (existingAdmin.length > 0) {
      console.log("✅ Admin user already exists");
      return;
    }

    // Create default admin user
    const saltRounds = 10;
    const password_hash = await bcrypt.hash("admin123", saltRounds);
    const uuid = uuidv4();

    const query = `
      INSERT INTO users (
        uuid, emp_name, device_mac, branch_id, branch_city, branch_address, gender,
        date_of_birth, cnic, phone_no, designation, department,
        joining_date, email_id, username, password_hash, role, is_active,
        created_on, updated_on
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    await executeQuery(query, [
      uuid,
      "System Administrator",
      "00:00:00:00:00:00", // device_mac
      "ADMIN", // branch_id
      "Head Office", // branch_city
      "Main Office Building", // branch_address
      "Other", // gender
      "1990-01-01", // date_of_birth
      "00000-0000000-0", // cnic
      "000-0000000", // phone_no
      "System Administrator", // designation
      "IT", // department
      "2024-01-01", // joining_date
      "admin@company.com", // email_id
      "admin", // username
      password_hash,
      "admin", // role
      true, // is_active
    ]);

    console.log("✅ Default admin user created:");
    console.log("   Username: admin");
    console.log("   Password: admin123");
    console.log("   ⚠️  Please change the password after first login!");
  } catch (error) {
    console.error("❌ Error creating default admin user:", error);
  }
}
