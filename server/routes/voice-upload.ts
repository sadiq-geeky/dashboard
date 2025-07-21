import { RequestHandler } from "express";
import { executeQuery } from "../config/database";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import { parseFile } from "music-metadata";
import path from "path";
import fs from "fs";

// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Logging function to match PHP behavior
function logRequest(status: string, data: any = {}, error?: string) {
  const log = {
    timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
    ip_address: "SERVER", // Will be populated from request
    status,
    data,
    ...(error && { error }),
  };

  const logPath = path.join(process.cwd(), "upload_log.txt");
  fs.appendFileSync(logPath, JSON.stringify(log) + "\n");
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

// Generate UUID v4 (matches PHP function)
function generateUUIDv4(): string {
  return uuidv4();
}

// Voice upload route - matches your PHP code exactly
export const uploadVoice: RequestHandler = async (req, res) => {
  // Set JSON content type
  res.setHeader("Content-Type", "application/json");

  let response = { success: false } as any;
  const clientIP = req.ip || req.connection.remoteAddress || "UNKNOWN";

  // Check request method
  if (req.method !== "POST") {
    const error = "Only POST method is allowed";
    logRequest("failed", {}, error);
    response.error = error;
    return res.json(response);
  }

  try {
    // Get and validate parameters from form data
    const { ip_address, start_time, end_time, cnic } = req.body;
    const file = req.file;

    // Check for missing parameters
    const missing = [];
    if (!ip_address || ip_address.trim() === "") missing.push("ip_address");
    if (!start_time) missing.push("start_time");
    if (!end_time) missing.push("end_time");
    if (!cnic) missing.push("cnic");
    if (!file) missing.push("mp3 file");

    if (missing.length > 0) {
      const error = `Missing required parameter(s): ${missing.join(", ")}`;
      logRequest("failed", req.body, error);
      response.error = error;
      return res.json(response);
    }

    // File validation is handled by multer fileFilter
    const newFilename = file.filename;
    const filePath = req.file.path;
    const fileSizeBytes = req.file.size;
    const mimeType = req.file.mimetype;

    const metadata = await parseFile(filePath);

    const durationSeconds = metadata.format.duration || 0;
    const audioBitrate = metadata.format.bitrate || 0;
    const sampleRate = metadata.format.sampleRate || 0;
    const audioFormat = metadata.format.container || mimeType;



    // Generate UUID and timestamp
    const id = generateUUIDv4();
    const createdOn = new Date().toISOString().slice(0, 19).replace("T", " ");

    // Insert into database
    const query = `
      INSERT INTO recording_history 
      (id, cnic, start_time, end_time, file_name, ip_address, CREATED_ON, duration_seconds, audio_bitrate, sample_rate, audio_format, file_size_bytes) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await executeQuery(query, [
      id,
      cnic,
      start_time,
      end_time,
      newFilename,
      ip_address.trim(),
      createdOn,
      durationSeconds,
      audioBitrate,
      sampleRate,
      audioFormat,
      fileSizeBytes,
    ]);

    // Log success
    const logEntry = {
      id,
      ip_address: ip_address.trim(),
      start_time,
      end_time,
      cnic,
      file_name: newFilename,
      uploaded_at: createdOn,
      duration_seconds: durationSeconds,
      audio_bitrate: audioBitrate,
      sample_rate: sampleRate,
      audio_format: audioFormat,
      file_size_bytes: fileSizeBytes,
      client_ip: clientIP,
      status: "success",
      message: "File uploaded successfully",
      playback_url: `/api/audio/${newFilename}`, // For UI playback
    };

    logRequest("success", logEntry);

    // Success response
    response.success = true;
    response.playback_url = `/api/audio/${newFilename}`; // For UI playback

    res.json(response);
  } catch (error) {
    console.error("Error in uploadVoice:", error);

    let errorMessage = "Unexpected server error occurred.";
    if (error instanceof Error) {
      if (error.message.includes("Only MP3 and WAV")) {
        errorMessage = error.message;
      } else {
        errorMessage = `Insert failed: ${error.message}`;
      }
    }

    logRequest("failed", req.body, errorMessage);
    response.error = errorMessage;
    res.json(response);
  }
};

// Middleware for handling multer upload
export const uploadMiddleware = upload.single("mp3");

// Route to serve audio files for playback
export const serveAudio: RequestHandler = (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(uploadDir, filename);

    // Check if file exists
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: "Audio file not found" });
    }

    // Set appropriate headers for audio streaming
    const extension = path.extname(filename).toLowerCase();
    const mimeType = extension === ".mp3" ? "audio/mpeg" : "audio/wav";

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Accept-Ranges", "bytes");

    // Stream the file
    const stream = fs.createReadStream(filepath);
    stream.pipe(res);
  } catch (error) {
    console.error("Error serving audio:", error);
    res.status(500).json({ error: "Failed to serve audio file" });
  }
};
