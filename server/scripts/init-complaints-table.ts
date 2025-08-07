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

    // Check if we need sample data
    const [countResult] = await executeQuery<{ count: number }>(
      "SELECT COUNT(*) as count FROM complaints"
    );

    if (countResult.count === 0) {
      console.log("📊 No complaints found, creating sample data...");
      await createSampleComplaints();
    } else {
      console.log(`✅ Found ${countResult.count} existing complaints`);
    }

  } catch (error) {
    console.error("❌ Error initializing complaints table:", error);
    throw error;
  }
}

async function createSampleComplaints() {
  try {
    // Get existing branches for realistic sample data
    const branches = await executeQuery<{ id: string; branch_name: string; branch_address: string }>(
      "SELECT id, branch_name, branch_address FROM branches LIMIT 5"
    );

    if (branches.length === 0) {
      console.log("⚠️ No branches found, skipping sample complaints creation");
      return;
    }

    const sampleComplaints = [
      {
        branch_id: branches[0]?.id,
        branch_name: branches[0]?.branch_name || "Downtown Branch",
        customer_data: {
          customer_name: "Ahmed Hassan",
          customer_phone: "+92-300-1234567",
          customer_email: "ahmed.hassan@email.com",
          customer_cnic: "42101-1234567-1",
          device_used: "Recording Device #1",
          issue_category: "Technical Issue"
        },
        complaint_text: "The voice recording device was not working properly during my visit. The microphone seemed to have issues and my recording was very unclear. This caused delays in my application process.",
        status: "pending",
        priority: "high"
      },
      {
        branch_id: branches[1]?.id || branches[0]?.id,
        branch_name: branches[1]?.branch_name || "North Branch",
        customer_data: {
          customer_name: "Fatima Khan",
          customer_phone: "+92-321-9876543",
          customer_cnic: "42201-9876543-2",
          device_used: "Recording Device #2",
          issue_category: "Service Quality"
        },
        complaint_text: "The staff was not properly trained on how to use the recording equipment. I had to wait for 30 minutes while they figured out how to start the recording process.",
        status: "in_progress",
        priority: "medium"
      },
      {
        branch_id: branches[2]?.id || branches[0]?.id,
        branch_name: branches[2]?.branch_name || "South Branch",
        customer_data: {
          customer_name: "Muhammad Ali",
          customer_phone: "+92-333-5555555",
          customer_email: "m.ali@company.com",
          customer_cnic: "42301-5555555-3",
          device_used: "Recording Device #1",
          issue_category: "Equipment Malfunction"
        },
        complaint_text: "The recording device completely stopped working in the middle of my session. I had to reschedule my appointment and come back the next day.",
        status: "resolved",
        priority: "urgent"
      },
      {
        branch_id: branches[0]?.id,
        branch_name: branches[0]?.branch_name || "Downtown Branch",
        customer_data: {
          customer_name: "Sarah Ahmed",
          customer_phone: "+92-345-1111111",
          customer_cnic: "42401-1111111-4",
          device_used: "Recording Device #3",
          issue_category: "Audio Quality"
        },
        complaint_text: "The audio quality of my recording was very poor. There was a lot of background noise and my voice was barely audible in the final recording.",
        status: "pending",
        priority: "medium"
      },
      {
        branch_id: branches[1]?.id || branches[0]?.id,
        branch_name: branches[1]?.branch_name || "North Branch",
        customer_data: {
          customer_name: "Usman Shah",
          customer_phone: "+92-300-7777777",
          customer_email: "usman.shah@email.com",
          customer_cnic: "42501-7777777-5",
          device_used: "Recording Device #2",
          issue_category: "System Error"
        },
        complaint_text: "The system crashed during my recording session and all my data was lost. I had to provide all my information again from the beginning.",
        status: "closed",
        priority: "high"
      }
    ];

    for (const complaint of sampleComplaints) {
      const complaint_id = `complaint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Random time in last 7 days

      await executeQuery(`
        INSERT INTO complaints 
        (complaint_id, branch_id, branch_name, timestamp, customer_data, complaint_text, status, priority, created_on, updated_on)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        complaint_id,
        complaint.branch_id,
        complaint.branch_name,
        timestamp,
        JSON.stringify(complaint.customer_data),
        complaint.complaint_text,
        complaint.status,
        complaint.priority
      ]);
    }

    console.log(`✅ Created ${sampleComplaints.length} sample complaints`);
  } catch (error) {
    console.error("❌ Error creating sample complaints:", error);
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
