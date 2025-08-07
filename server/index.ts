import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
console.log("🧪 ENV DB_NAME:", process.env.DB_NAME);

import { initializeDatabase } from "./config/database";
import { verifyEmailConnection } from "./config/email";

// Production database routes only
import { authenticate, addBranchFilter } from "./middleware/auth";
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
import {
  forgotPassword,
  resetPassword,
  validateResetToken,
  initPasswordResetTable,
} from "./routes/auth";
import {
  getDeployments,
  createDeployment,
  deleteDeployment,
  getDeployment,
  updateDeployment,
} from "./routes/deployments-db";
import { populateData } from "./routes/populate-data";

export function createServer() {
  const app = express();

  // Initialize database connection
  initializeDatabase().catch(console.error);

  // Initialize password reset table and verify email connection
  initPasswordResetTable().catch(console.error);
  verifyEmailConnection().catch(console.error);

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

  // Authentication routes (password reset)
  app.post("/api/auth/forgot-password", forgotPassword);
  app.post("/api/auth/reset-password", resetPassword);
  app.get("/api/auth/validate-token/:token", validateResetToken);

  // Heartbeat routes (protected with branch filtering)
  app.get("/api/heartbeats", authenticate, addBranchFilter(), getHeartbeats);
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

  // Device management routes (protected with branch filtering)
  app.get("/api/devices", authenticate, addBranchFilter(), getDevices);
  app.get("/api/devices/:id", authenticate, addBranchFilter(), getDevice);
  app.post("/api/devices", createDevice);
  app.put("/api/devices/:id", updateDevice);
  app.delete("/api/devices/:id", deleteDevice);
  app.get(
    "/api/branches/:branch_id/devices",
    authenticate,
    addBranchFilter(),
    getDevicesByBranch,
  );

  // Recording routes (protected with branch filtering)
  app.get("/api/recordings", authenticate, addBranchFilter(), getRecordings);
  app.get(
    "/api/recordings/device-names",
    authenticate,
    addBranchFilter(),
    getDeviceNames,
  );
  app.get("/api/recordings/:id", authenticate, addBranchFilter(), getRecording);
  app.post("/api/recordings", createRecording);
  app.put("/api/recordings/:id", updateRecording);

  // Analytics routes (protected with branch filtering)
  app.get(
    "/api/analytics/recordings",
    authenticate,
    addBranchFilter(),
    getRecordingsAnalytics,
  );

  // Conversation Analytics routes (protected with branch filtering)
  app.get(
    "/api/analytics/conversations",
    authenticate,
    addBranchFilter(),
    getConversationAnalytics,
  );
  app.get(
    "/api/analytics/conversations/branch",
    authenticate,
    addBranchFilter(),
    getConversationsByBranch,
  );
  app.get(
    "/api/analytics/conversations/city",
    authenticate,
    addBranchFilter(),
    getConversationsByCity,
  );
  app.get(
    "/api/analytics/conversations/daily",
    authenticate,
    addBranchFilter(),
    getDailyConversationsLastMonth,
  );
  app.get(
    "/api/analytics/conversations/cnic",
    authenticate,
    addBranchFilter(),
    getUniqueCnicsByMonth,
  );

  // User Management routes
  app.post("/api/auth/login", loginUser);
  app.get("/api/users", getUsers);
  app.post("/api/users", createUser);
  app.put("/api/users/:uuid", updateUser);
  app.delete("/api/users/:uuid", deleteUser);
  app.get("/api/users/:uuid", getUserProfile);

  // Deployment Management routes (protected with branch filtering)
  app.get("/api/deployments", authenticate, addBranchFilter(), getDeployments);
  app.post("/api/deployments", createDeployment);
  app.get(
    "/api/deployments/:uuid",
    authenticate,
    addBranchFilter(),
    getDeployment,
  );
  app.put("/api/deployments/:uuid", updateDeployment);
  app.delete("/api/deployments/:uuid", deleteDeployment);

  // Sample data population (development/testing only)
  app.post("/api/populate-sample-data", populateData);

  return app;
}
