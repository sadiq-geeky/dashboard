import { RequestHandler } from "express";
import { executeQuery } from "../config/database";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import { parseFile } from "music-metadata";
import path from "path";
import fs from "fs";
import { voiceLogger } from "../utils/logger";

// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const newFilename = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${extension}`;
    cb(null, newFilename);
  },
});

const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedExtensions = [".mp3", ".wav"];
  const extension = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(extension)) {
    cb(null, true);
  } else {
    cb(new Error("Only MP3 and WAV file extensions are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Upload voice recording
export const uploadVoice: RequestHandler = async (req, res) => {
  const startTime = Date.now();
  const requestId = uuidv4();
  const clientIp = req.ip || req.connection.remoteAddress || "unknown";
  const userAgent = req.get("User-Agent") || "unknown";
  const { ip_address, start_time, end_time, cnic, mac_address } = req.body;
  const file = req.file;

  voiceLogger.info("voice-upload", "upload_voice_request", {
    request_id: requestId,
    ip_address: clientIp,
    user_agent: userAgent,
    cnic: cnic,
    mac_address: mac_address?.trim(),
    details: {
      body_ip_address: ip_address,
      body_mac_address: mac_address?.trim(),
      start_time: start_time,
      end_time: end_time,
      file_received: !!file,
      original_filename: file?.originalname,
      file_mimetype: file?.mimetype,
    },
  });

  try {
    // Validate required parameters
    if (!ip_address?.trim()) {
      voiceLogger.warn("voice-upload", "validation_failed", {
        request_id: requestId,
        ip_address: clientIp,
        cnic: cnic,
        details: { missing_field: "ip_address" },
      });
      return res.status(400).json({ error: "IP address is required" });
    }
    if (!start_time) {
      voiceLogger.warn("voice-upload", "validation_failed", {
        request_id: requestId,
        ip_address: clientIp,
        cnic: cnic,
        details: { missing_field: "start_time" },
      });
      return res.status(400).json({ error: "Start time is required" });
    }
    if (!end_time) {
      voiceLogger.warn("voice-upload", "validation_failed", {
        request_id: requestId,
        ip_address: clientIp,
        cnic: cnic,
        details: { missing_field: "end_time" },
      });
      return res.status(400).json({ error: "End time is required" });
    }
    if (!cnic) {
      voiceLogger.warn("voice-upload", "validation_failed", {
        request_id: requestId,
        ip_address: clientIp,
        details: { missing_field: "cnic" },
      });
      return res.status(400).json({ error: "CNIC is required" });
    }
    if (!file) {
      voiceLogger.warn("voice-upload", "validation_failed", {
        request_id: requestId,
        ip_address: clientIp,
        cnic: cnic,
        details: { missing_field: "audio_file" },
      });
      return res.status(400).json({ error: "Audio file is required" });
    }

    voiceLogger.info("voice-upload", "file_processing_start", {
      request_id: requestId,
      ip_address: clientIp,
      cnic: cnic,
      file_name: file.filename,
      file_size: file.size,
      details: {
        original_filename: file.originalname,
        file_mimetype: file.mimetype,
        file_path: file.path,
      },
    });

    // Parse audio metadata
    const metadata = await parseFile(file.path);
    const durationSeconds = metadata.format.duration || 0;
    const audioBitrate = metadata.format.bitrate || 0;
    const sampleRate = metadata.format.sampleRate || 0;
    const audioFormat = metadata.format.container || file.mimetype;

    voiceLogger.info("voice-upload", "metadata_extracted", {
      request_id: requestId,
      ip_address: clientIp,
      cnic: cnic,
      file_name: file.filename,
      details: {
        duration_seconds: durationSeconds,
        audio_bitrate: audioBitrate,
        sample_rate: sampleRate,
        audio_format: audioFormat,
      },
    });

    // Generate UUID and insert into database
    const id = uuidv4();
    const query = `
      INSERT INTO recordings
      (id, cnic, start_time, end_time, file_name, ip_address, mac_address, CREATED_ON,
       duration_seconds, audio_bitrate, sample_rate, audio_format, file_size_bytes)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)
    `;

    await executeQuery(query, [
      id,
      cnic,
      start_time,
      end_time,
      file.filename,
      ip_address.trim(),
      mac_address?.trim() || null,
      durationSeconds,
      audioBitrate,
      sampleRate,
      audioFormat,
      file.size,
    ]);

    const duration = Date.now() - startTime;

    voiceLogger.info("voice-upload", "upload_voice_success", {
      request_id: requestId,
      ip_address: clientIp,
      cnic: cnic,
      mac_address: mac_address?.trim(),
      file_name: file.filename,
      file_size: file.size,
      duration_ms: duration,
      details: {
        recording_id: id,
        device_ip: ip_address.trim(),
        device_mac: mac_address?.trim() || null,
        start_time: start_time,
        end_time: end_time,
        duration_seconds: durationSeconds,
        audio_bitrate: audioBitrate,
        sample_rate: sampleRate,
        audio_format: audioFormat,
        playback_url: `/api/audio/${file.filename}`,
      },
    });

    res.status(201).json({
      success: true,
      id,
      message: "File uploaded successfully",
      playback_url: `/api/audio/${file.filename}`,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    voiceLogger.error("voice-upload", "upload_voice_error", errorMessage, {
      request_id: requestId,
      ip_address: clientIp,
      cnic: cnic,
      mac_address: mac_address?.trim(),
      file_name: file?.filename,
      file_size: file?.size,
      duration_ms: duration,
      details: {
        error_stack: error instanceof Error ? error.stack : undefined,
        device_ip: ip_address,
        device_mac: mac_address?.trim() || null,
        original_filename: file?.originalname,
        file_mimetype: file?.mimetype,
        error_type:
          error instanceof Error && error.message.includes("Only MP3 and WAV")
            ? "file_format_error"
            : "general_error",
      },
    });

    console.error("Error uploading voice:", error);

    if (error instanceof Error && error.message.includes("Only MP3 and WAV")) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Failed to upload voice recording" });
  }
};

// Serve audio files for playback
export const serveAudio: RequestHandler = (req, res) => {
  const startTime = Date.now();
  const requestId = uuidv4();
  const clientIp = req.ip || req.connection.remoteAddress || "unknown";
  const userAgent = req.get("User-Agent") || "unknown";
  const { filename } = req.params;

  // Log the request
  console.log(`🎵 Audio request: ${filename} from ${clientIp}`);
  console.log(`📁 Upload directory: ${uploadDir}`);

  voiceLogger.info("voice-upload", "serve_audio_request", {
    request_id: requestId,
    ip_address: clientIp,
    user_agent: userAgent,
    file_name: filename,
  });

  try {
    const filepath = path.join(uploadDir, filename);
    console.log(`🔍 Looking for file at: ${filepath}`);

    // Check if uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      console.error(`❌ Uploads directory does not exist: ${uploadDir}`);
      return res.status(500).json({
        error: "Server configuration error: uploads directory not found",
        debug: { uploadDir, exists: false }
      });
    }

    // List all files in uploads directory for debugging
    try {
      const files = fs.readdirSync(uploadDir);
      console.log(`📂 Files in uploads directory (${files.length}):`, files);
    } catch (err) {
      console.error(`❌ Cannot read uploads directory:`, err);
    }

    if (!fs.existsSync(filepath)) {
      console.log(`❌ File not found: ${filename}`);
      voiceLogger.warn("voice-upload", "audio_file_not_found", {
        request_id: requestId,
        ip_address: clientIp,
        file_name: filename,
        details: { file_path: filepath, upload_dir: uploadDir },
      });
      return res.status(404).json({
        error: "Audio file not found",
        debug: {
          requested_file: filename,
          full_path: filepath,
          upload_dir: uploadDir,
          upload_dir_exists: fs.existsSync(uploadDir)
        }
      });
    }

    // Get file stats for logging
    const stats = fs.statSync(filepath);

    // Set appropriate headers for audio streaming
    const extension = path.extname(filename).toLowerCase();
    const mimeType = extension === ".mp3" ? "audio/mpeg" : "audio/wav";

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Accept-Ranges", "bytes");

    voiceLogger.info("voice-upload", "audio_streaming_start", {
      request_id: requestId,
      ip_address: clientIp,
      file_name: filename,
      file_size: stats.size,
      details: {
        mime_type: mimeType,
        file_extension: extension,
        file_path: filepath,
      },
    });

    // Stream the file
    const stream = fs.createReadStream(filepath);

    stream.on("end", () => {
      const duration = Date.now() - startTime;
      voiceLogger.info("voice-upload", "audio_streaming_success", {
        request_id: requestId,
        ip_address: clientIp,
        file_name: filename,
        file_size: stats.size,
        duration_ms: duration,
      });
    });

    stream.on("error", (streamError) => {
      const duration = Date.now() - startTime;
      voiceLogger.error(
        "voice-upload",
        "audio_streaming_error",
        streamError.message,
        {
          request_id: requestId,
          ip_address: clientIp,
          file_name: filename,
          duration_ms: duration,
          details: {
            error_stack: streamError.stack,
            stream_error: true,
          },
        },
      );
    });

    stream.pipe(res);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    voiceLogger.error("voice-upload", "serve_audio_error", errorMessage, {
      request_id: requestId,
      ip_address: clientIp,
      file_name: filename,
      duration_ms: duration,
      details: {
        error_stack: error instanceof Error ? error.stack : undefined,
        general_error: true,
      },
    });

    console.error("Error serving audio:", error);
    res.status(500).json({ error: "Failed to serve audio file" });
  }
};

// Middleware for handling multer upload
export const uploadMiddleware = upload.single("mp3");
