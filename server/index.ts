import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
console.log("🧪 ENV DB_NAME:", process.env.DB_NAME);

import { initializeDatabase } from "./config/database";

// Production database routes only
import { getHeartbeats, postHeartbeat } from "./routes/heartbeat-db";
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
  getBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch,
} from "./routes/branches-db";
import {
  getDevices,
  getDevice,
  createDevice,
  updateDevice,
  deleteDevice,
  getDevicesByBranch,
} from "./routes/devices-db";
import { getRecordingsAnalytics } from "./routes/analytics-db";
import {
  getConversationAnalytics,
  getConversationsByBranch,
  getConversationsByCity,
  getDailyConversationsLastMonth,
  getUniqueCnicsByMonth,
} from "./routes/conversation-analytics";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  loginUser,
  getUserProfile,
} from "./routes/users-db";

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

  // Branch management routes
  app.get("/api/branches", getBranches);
  app.get("/api/branches/:id", getBranch);
  app.post("/api/branches", createBranch);
  app.put("/api/branches/:id", updateBranch);
  app.delete("/api/branches/:id", deleteBranch);

  // Device management routes
  app.get("/api/devices", getDevices);
  app.get("/api/devices/:id", getDevice);
  app.post("/api/devices", createDevice);
  app.put("/api/devices/:id", updateDevice);
  app.delete("/api/devices/:id", deleteDevice);
  app.get("/api/branches/:branch_id/devices", getDevicesByBranch);

  // Database fix routes
  app.post("/api/fix-devices-table", async (req, res) => {
    try {
      const { fixDevicesTable } = await import('./fix-devices-table.js');
      await fixDevicesTable();
      res.json({ success: true, message: "Devices table fixed successfully" });
    } catch (error) {
      console.error("Error fixing devices table:", error);
      res.status(500).json({ error: "Failed to fix devices table", details: error.message });
    }
  });

  app.post("/api/migrate-users-table", async (req, res) => {
    try {
      const { migrateUsersTable } = await import('./migrate-users-table.js');
      await migrateUsersTable();
      res.json({ success: true, message: "Users table migrated successfully" });
    } catch (error) {
      console.error("Error migrating users table:", error);
      res.status(500).json({ error: "Failed to migrate users table", details: error.message });
    }
  });

  // Recording routes
  app.get("/api/recordings", getRecordings);
  app.get("/api/recordings/device-names", getDeviceNames);
  app.get("/api/recordings/:id", getRecording);
  app.post("/api/recordings", createRecording);
  app.put("/api/recordings/:id", updateRecording);

  // Analytics routes
  app.get("/api/analytics/recordings", getRecordingsAnalytics);

  // Conversation Analytics routes
  app.get("/api/analytics/conversations", getConversationAnalytics);
  app.get("/api/analytics/conversations/branch", getConversationsByBranch);
  app.get("/api/analytics/conversations/city", getConversationsByCity);
  app.get("/api/analytics/conversations/daily", getDailyConversationsLastMonth);
  app.get("/api/analytics/conversations/cnic", getUniqueCnicsByMonth);

  // User Management routes
  app.post("/api/auth/login", loginUser);
  app.get("/api/users", getUsers);
  app.post("/api/users", createUser);
  app.put("/api/users/:uuid", updateUser);
  app.delete("/api/users/:uuid", deleteUser);
  app.get("/api/users/:uuid", getUserProfile);

  return app;
}
