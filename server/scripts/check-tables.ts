import { executeQuery } from "../config/database";
import dotenv from "dotenv";
dotenv.config();

async function checkTables() {
  try {
    console.log("Checking branches table structure...");
    const branchesDesc = await executeQuery("DESCRIBE branches");
    console.log("Branches columns:", branchesDesc);
    
    console.log("\nChecking devices table structure...");
    const devicesDesc = await executeQuery("DESCRIBE devices");
    console.log("Devices columns:", devicesDesc);
    
    console.log("\nChecking recordings table structure...");
    const recordingsDesc = await executeQuery("DESCRIBE recordings");
    console.log("Recordings columns:", recordingsDesc);
    
    console.log("\nChecking link_device_branch_user table structure...");
    const linkDesc = await executeQuery("DESCRIBE link_device_branch_user");
    console.log("Link table columns:", linkDesc);
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

checkTables();
