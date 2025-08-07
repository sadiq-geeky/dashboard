import { executeQuery } from "../config/database";
import { v4 as uuidv4 } from "uuid";

interface SampleBranch {
  id: string;
  branch_code: string;
  branch_name: string;
  branch_address: string;
  branch_city: string;
  region: string;
}

interface SampleDevice {
  id: string;
  device_mac: string;
  ip_address: string;
  device_name: string;
}

interface SampleRecording {
  id: string;
  cnic: string;
  start_time: Date;
  end_time: Date | null;
  file_name: string | null;
  ip_address: string;
  mac_address: string;
  duration_seconds: number | null;
  created_on: Date;
}

export async function populateSampleData() {
  try {
    console.log("🔄 Starting sample data population...");

    // Sample branches
    const branches: SampleBranch[] = [
      {
        id: uuidv4(),
        branch_code: "BR001",
        branch_name: "Downtown Branch",
        branch_address: "123 Main Street, Financial District",
        branch_city: "Karachi",
        region: "Sindh"
      },
      {
        id: uuidv4(),
        branch_code: "BR002", 
        branch_name: "North Branch",
        branch_address: "456 North Avenue, Business Center",
        branch_city: "Lahore",
        region: "Punjab"
      },
      {
        id: uuidv4(),
        branch_code: "BR003",
        branch_name: "South Branch", 
        branch_address: "789 South Road, Commercial Area",
        branch_city: "Islamabad",
        region: "ICT"
      },
      {
        id: uuidv4(),
        branch_code: "BR004",
        branch_name: "East Branch",
        branch_address: "321 East Boulevard, Tech Hub",
        branch_city: "Faisalabad", 
        region: "Punjab"
      },
      {
        id: uuidv4(),
        branch_code: "BR005",
        branch_name: "West Branch",
        branch_address: "654 West Plaza, Shopping District",
        branch_city: "Rawalpindi",
        region: "Punjab"
      }
    ];

    // Insert branches
    for (const branch of branches) {
      try {
        await executeQuery(`
          INSERT IGNORE INTO branches 
          (id, branch_code, branch_name, branch_address, branch_city, region, is_active, created_on, updated_on)
          VALUES (?, ?, ?, ?, ?, ?, true, NOW(), NOW())
        `, [branch.id, branch.branch_code, branch.branch_name, branch.branch_address, branch.branch_city, branch.region]);
      } catch (error) {
        console.log(`Branch ${branch.branch_name} might already exist`);
      }
    }

    // Sample devices
    const devices: SampleDevice[] = [
      { id: uuidv4(), device_mac: "AA:BB:CC:DD:EE:01", ip_address: "192.168.1.101", device_name: "Downtown Device 1" },
      { id: uuidv4(), device_mac: "AA:BB:CC:DD:EE:02", ip_address: "192.168.1.102", device_name: "Downtown Device 2" },
      { id: uuidv4(), device_mac: "AA:BB:CC:DD:EE:03", ip_address: "192.168.1.103", device_name: "North Device 1" },
      { id: uuidv4(), device_mac: "AA:BB:CC:DD:EE:04", ip_address: "192.168.1.104", device_name: "North Device 2" },
      { id: uuidv4(), device_mac: "AA:BB:CC:DD:EE:05", ip_address: "192.168.1.105", device_name: "South Device 1" },
      { id: uuidv4(), device_mac: "AA:BB:CC:DD:EE:06", ip_address: "192.168.1.106", device_name: "East Device 1" },
      { id: uuidv4(), device_mac: "AA:BB:CC:DD:EE:07", ip_address: "192.168.1.107", device_name: "West Device 1" },
    ];

    // Insert devices
    for (const device of devices) {
      try {
        await executeQuery(`
          INSERT IGNORE INTO devices 
          (id, device_mac, ip_address, device_name, is_active, created_on, updated_on)
          VALUES (?, ?, ?, ?, true, NOW(), NOW())
        `, [device.id, device.device_mac, device.ip_address, device.device_name]);
      } catch (error) {
        console.log(`Device ${device.device_name} might already exist`);
      }
    }

    // Link devices to branches (assuming first device goes to first branch, etc.)
    for (let i = 0; i < Math.min(devices.length, branches.length); i++) {
      try {
        await executeQuery(`
          INSERT IGNORE INTO link_device_branch_user 
          (device_id, branch_id, user_id, created_on)
          VALUES (?, ?, NULL, NOW())
        `, [devices[i].id, branches[i % branches.length].id]);
      } catch (error) {
        console.log(`Device-branch link might already exist`);
      }
    }

    console.log("✅ Branches and devices populated");

    // Generate sample recordings for the last 30 days
    const recordings: SampleRecording[] = [];
    const statuses = ['completed', 'failed', 'in_progress'];
    const statusWeights = [0.85, 0.10, 0.05]; // 85% completed, 10% failed, 5% in progress

    for (let day = 29; day >= 0; day--) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      
      // Generate 15-60 recordings per day
      const recordingsPerDay = Math.floor(Math.random() * 45) + 15;
      
      for (let i = 0; i < recordingsPerDay; i++) {
        const deviceIndex = Math.floor(Math.random() * devices.length);
        const device = devices[deviceIndex];
        
        // Random time during the day
        const recordingTime = new Date(date);
        recordingTime.setHours(
          Math.floor(Math.random() * 12) + 8, // 8 AM to 8 PM
          Math.floor(Math.random() * 60),
          Math.floor(Math.random() * 60)
        );

        // Determine status based on weights
        const rand = Math.random();
        let status = 'completed';
        if (rand > statusWeights[0]) {
          status = rand > (statusWeights[0] + statusWeights[1]) ? 'in_progress' : 'failed';
        }

        const recordingId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        let endTime: Date | null = null;
        let fileName: string | null = null;
        let durationSeconds: number | null = null;

        if (status === 'completed') {
          // Completed recordings have end time and file name
          durationSeconds = Math.floor(Math.random() * 300) + 30; // 30-330 seconds
          endTime = new Date(recordingTime.getTime() + durationSeconds * 1000);
          fileName = `recording_${recordingId}.wav`;
        } else if (status === 'failed') {
          // Failed recordings might have a short duration before failing
          durationSeconds = Math.floor(Math.random() * 30) + 5; // 5-35 seconds
          endTime = new Date(recordingTime.getTime() + durationSeconds * 1000);
          fileName = null;
        }
        // in_progress recordings have no end time or file name

        recordings.push({
          id: recordingId,
          cnic: `${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 9000000) + 1000000}-${Math.floor(Math.random() * 9) + 1}`,
          start_time: recordingTime,
          end_time: endTime,
          file_name: fileName,
          ip_address: device.ip_address,
          mac_address: device.device_mac,
          duration_seconds: durationSeconds,
          created_on: recordingTime
        });
      }
    }

    console.log(`🔄 Inserting ${recordings.length} sample recordings...`);

    // Insert recordings in batches
    const batchSize = 100;
    for (let i = 0; i < recordings.length; i += batchSize) {
      const batch = recordings.slice(i, i + batchSize);
      
      for (const recording of batch) {
        try {
          await executeQuery(`
            INSERT IGNORE INTO recordings 
            (id, cnic, start_time, end_time, file_name, ip_address, mac_address, duration_seconds, CREATED_ON)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            recording.id,
            recording.cnic,
            recording.start_time,
            recording.end_time,
            recording.file_name,
            recording.ip_address,
            recording.mac_address,
            recording.duration_seconds,
            recording.created_on
          ]);
        } catch (error) {
          // Skip if recording already exists
        }
      }
    }

    console.log("✅ Sample recordings populated");

    // Verify the data
    const [recordingCount] = await executeQuery<{ count: number }>(`
      SELECT COUNT(*) as count FROM recordings
    `);

    const [branchCount] = await executeQuery<{ count: number }>(`
      SELECT COUNT(*) as count FROM branches
    `);

    const [deviceCount] = await executeQuery<{ count: number }>(`
      SELECT COUNT(*) as count FROM devices
    `);

    console.log(`📊 Data Summary:`);
    console.log(`   Recordings: ${recordingCount.count}`);
    console.log(`   Branches: ${branchCount.count}`);
    console.log(`   Devices: ${deviceCount.count}`);

    console.log("🎉 Sample data population completed successfully!");
    
  } catch (error) {
    console.error("❌ Error populating sample data:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  populateSampleData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
