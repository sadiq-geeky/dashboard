import { RequestHandler } from "express";
import { executeQuery } from "../config/database";
import path from "path";
import fs from "fs";

const uploadDir = path.resolve(process.cwd(), "uploads");

export const fixAudioMappings: RequestHandler = async (req, res) => {
  try {
    console.log("🔧 Fixing audio file mappings...");

    // Get actual audio files from disk
    const filesOnDisk = fs
      .readdirSync(uploadDir)
      .filter((file) => file.endsWith(".wav") || file.endsWith(".mp3"));

    console.log(`📁 Found ${filesOnDisk.length} audio files on disk`);

    if (filesOnDisk.length === 0) {
      return res.json({
        success: false,
        message: "No audio files found on disk to map",
      });
    }

    // Get recordings that need audio files
    const recordings = await executeQuery<{ id: string }>(`
      SELECT id FROM recordings 
      WHERE file_name IS NOT NULL 
      ORDER BY CREATED_ON DESC 
      LIMIT ${Math.min(filesOnDisk.length, 10)}
    `);

    console.log(`📊 Found ${recordings.length} recordings to update`);

    let updated = 0;
    const updates = [];

    // Map real files to database records
    for (let i = 0; i < Math.min(recordings.length, filesOnDisk.length); i++) {
      const recordingId = recordings[i].id;
      const fileName = filesOnDisk[i];

      await executeQuery("UPDATE recordings SET file_name = ? WHERE id = ?", [
        fileName,
        recordingId,
      ]);

      updates.push({
        recording_id: recordingId,
        file_name: fileName,
      });

      updated++;
      console.log(`✅ Updated recording ${recordingId} with file ${fileName}`);
    }

    res.json({
      success: true,
      message: `Successfully mapped ${updated} recordings to real audio files`,
      updates: updates,
      summary: {
        files_on_disk: filesOnDisk.length,
        recordings_updated: updated,
        files_available: filesOnDisk.slice(0, 10),
      },
    });
  } catch (error) {
    console.error("❌ Error fixing audio mappings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fix audio mappings",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
