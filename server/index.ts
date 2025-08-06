import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
console.log("🧪 ENV DB_NAME:", process.env.DB_NAME);

import { initializeDatabase } from "./config/database";

// Production database routes only
import { getHeartbeats, postHeartbeat } from "./routes/heartbeat-db";
import {
  getDevices,
  createDevice,
  updateDevice,
  deleteDevice,
} from "./routes/devices-db";
import {
  getRecordings,
  getRecording,
  createRecording,
  updateRecording,
  getDeviceNames,
} from "./routes/recordings-db";

// Import the PHP-equivalent heartbeat submit route
import { submitHeartbeat } from "./routes/heartbeat-submit";

// Import voice upload routes
import {
  uploadVoice,
  uploadMiddleware,
  serveAudio,
} from "./routes/voice-upload";
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
} from "./routes/contacts-db";

export function createServer() {
  const app = express();

  // Initialize database connection
  initializeDatabase().catch(console.error);

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check route
  app.get("/api/ping", (_req, res) => {
    res.json({
      message: "CRM Dashboard API - Production Ready",
      timestamp: new Date().toISOString(),
    });
  });

  // Heartbeat routes
  app.get("/api/heartbeats", getHeartbeats);
  app.post("/api/heartbeats", postHeartbeat);

  // PHP-equivalent heartbeat submit route
  app.post("/api/heartbeat/submit", submitHeartbeat);

  // Voice upload route (form-data with file upload)
  app.post("/api/voice/upload", uploadMiddleware, uploadVoice);

  // Audio file serving route for playback
  app.get("/api/audio/:filename", serveAudio);

  // Device management routes
  app.get("/api/devices", getDevices);
  app.post("/api/devices", createDevice);
  app.put("/api/devices/:id", updateDevice);
  app.delete("/api/devices/:id", deleteDevice);

  // Recording routes
  app.get("/api/recordings", getRecordings);
  app.get("/api/recordings/device-names", getDeviceNames);
  app.get("/api/recordings/:id", getRecording);
  app.post("/api/recordings", createRecording);
  app.put("/api/recordings/:id", updateRecording);

  // Contacts routes
  app.get("/api/contacts", getContacts);
  app.post("/api/contacts", createContact);
  app.put("/api/contacts/:uuid", updateContact);
  app.delete("/api/contacts/:uuid", deleteContact);

  return app;
}
