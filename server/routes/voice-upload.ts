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
  try {
    const { ip_address, start_time, end_time, cnic } = req.body;
    const file = req.file;

    // Validate required parameters
    if (!ip_address?.trim()) {
      return res.status(400).json({ error: "IP address is required" });
    }
    if (!start_time) {
      return res.status(400).json({ error: "Start time is required" });
    }
    if (!end_time) {
      return res.status(400).json({ error: "End time is required" });
    }
    if (!cnic) {
      return res.status(400).json({ error: "CNIC is required" });
    }
    if (!file) {
      return res.status(400).json({ error: "Audio file is required" });
    }

    // Parse audio metadata
    const metadata = await parseFile(file.path);
    const durationSeconds = metadata.format.duration || 0;
    const audioBitrate = metadata.format.bitrate || 0;
    const sampleRate = metadata.format.sampleRate || 0;
    const audioFormat = metadata.format.container || file.mimetype;

    // Generate UUID and insert into database
    const id = uuidv4();
    const query = `
      INSERT INTO recording_history 
      (id, cnic, start_time, end_time, file_name, ip_address, CREATED_ON, 
       duration_seconds, audio_bitrate, sample_rate, audio_format, file_size_bytes) 
      VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)
    `;

    await executeQuery(query, [
      id,
      cnic,
      start_time,
      end_time,
      file.filename,
      ip_address.trim(),
      durationSeconds,
      audioBitrate,
      sampleRate,
      audioFormat,
      file.size,
    ]);

    res.status(201).json({
      success: true,
      id,
      message: "File uploaded successfully",
      playback_url: `/api/audio/${file.filename}`,
    });
  } catch (error) {
    console.error("Error uploading voice:", error);
    
    if (error instanceof Error && error.message.includes("Only MP3 and WAV")) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: "Failed to upload voice recording" });
  }
};

// Serve audio files for playback
export const serveAudio: RequestHandler = (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(uploadDir, filename);

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

// Middleware for handling multer upload
export const uploadMiddleware = upload.single("mp3");
