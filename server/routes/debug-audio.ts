import { RequestHandler } from "express";
import { executeQuery } from "../config/database";
import path from "path";
import fs from "fs";

const uploadDir = path.resolve(process.cwd(), "uploads");

export const debugAudioFiles: RequestHandler = async (req, res) => {
  try {
    console.log("🔍 Debug: Checking audio files status...");

    // Get all recordings with file names from database
    const recordings = await executeQuery<{
      id: string;
      file_name: string;
      created_on: string;
    }>(`
      SELECT id, file_name, CREATED_ON as created_on
      FROM recordings
      WHERE file_name IS NOT NULL
      ORDER BY CREATED_ON DESC
      LIMIT 20
    `);

    console.log(
      `📊 Found ${recordings.length} recordings with file names in database`,
    );

    // Check uploads directory
    const uploadDirExists = fs.existsSync(uploadDir);
    let filesOnDisk: string[] = [];

    if (uploadDirExists) {
      try {
        filesOnDisk = fs
          .readdirSync(uploadDir)
          .filter((file) => file.endsWith(".wav") || file.endsWith(".mp3"));
        console.log(`📁 Found ${filesOnDisk.length} audio files on disk`);
      } catch (err) {
        console.error("❌ Error reading uploads directory:", err);
      }
    } else {
      console.log("❌ Uploads directory does not exist");
    }

    // Check which files exist vs missing
    const fileStatus = recordings.map((recording) => {
      const exists = filesOnDisk.includes(recording.file_name);
      const filePath = path.join(uploadDir, recording.file_name);

      return {
        id: recording.id,
        file_name: recording.file_name,
        created_on: recording.created_on,
        exists: exists,
        file_path: filePath,
      };
    });

    const existingFiles = fileStatus.filter((f) => f.exists);
    const missingFiles = fileStatus.filter((f) => !f.exists);

    console.log(`✅ ${existingFiles.length} files exist on disk`);
    console.log(`❌ ${missingFiles.length} files missing from disk`);

    const debugInfo = {
      upload_directory: {
        path: uploadDir,
        exists: uploadDirExists,
        audio_files_count: filesOnDisk.length,
        files: filesOnDisk.slice(0, 10), // First 10 files
      },
      database_recordings: {
        total_with_filenames: recordings.length,
        existing_files: existingFiles.length,
        missing_files: missingFiles.length,
      },
      file_status: fileStatus.slice(0, 10), // First 10 for brevity
      missing_files: missingFiles.slice(0, 5).map((f) => f.file_name), // First 5 missing
      existing_files: existingFiles.slice(0, 5).map((f) => f.file_name), // First 5 existing
    };

    res.json({
      success: true,
      debug_info: debugInfo,
      summary: {
        upload_dir_exists: uploadDirExists,
        audio_files_on_disk: filesOnDisk.length,
        recordings_in_db: recordings.length,
        files_exist: existingFiles.length,
        files_missing: missingFiles.length,
      },
    });
  } catch (error) {
    console.error("❌ Debug audio files error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to debug audio files",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
