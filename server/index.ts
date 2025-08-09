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
  getConversationsByBranchPerMonth,
  getConversationsByCity,
  getDailyConversationsLastMonth,
  getUniqueCnicsByMonth,
  getBranchRecordingsByMonth,
  getCityConversationsByMonth,
  getAllBranchesLastMonthConversations,
  getBranchDailyConversations,
} from "./routes/conversation-analytics";
import { getVoiceStreamsAnalytics } from "./routes/voice-streams-analytics";
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

import { debugAudioFiles } from "./routes/debug-audio";
import { fixAudioMappings } from "./routes/fix-audio";
import {
  getComplaints,
  getComplaint,
  createComplaint,
  updateComplaint,
  deleteComplaint,
  getComplaintsStats,
  getComplaintsAnalytics,
} from "./routes/complaints-db";
import { promoteToManager } from "./routes/debug-manager";
import { getBranchMonthlyTrend } from "./routes/branch-monthly-trend";

export function createServer() {
  const app = express();

  // Initialize database connection
  initializeDatabase().catch(console.error);

  // Initialize password reset table and verify email connection
  initPasswordResetTable().catch(console.error);
  verifyEmailConnection().catch(console.error);

  // Middleware
  app.use(
    cors({
      origin: [
        "http://localhost:8080",
        "http://localhost:3000",
        /\.fly\.dev$/,
        /\.vercel\.app$/,
        /\.netlify\.app$/,
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
    }),
  );
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
  app.post("/api/devices", authenticate, createDevice);
  app.put("/api/devices/:id", authenticate, updateDevice);
  app.delete("/api/devices/:id", authenticate, deleteDevice);
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
    "/api/analytics/conversations/branch-monthly",
    authenticate,
    addBranchFilter(),
    getConversationsByBranchPerMonth,
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
  app.get(
    "/api/analytics/conversations/branch/:branchId/monthly",
    authenticate,
    getBranchRecordingsByMonth,
  );
  app.get(
    "/api/analytics/conversations/city/:cityName/monthly",
    authenticate,
    getCityConversationsByMonth,
  );
  app.get(
    "/api/analytics/conversations/all-branches-last-month",
    authenticate,
    getAllBranchesLastMonthConversations,
  );
  app.get(
    "/api/analytics/conversations/branch/:branchId/daily",
    authenticate,
    getBranchDailyConversations,
  );
  app.get(
    "/api/analytics/branch-monthly-trend",
    authenticate,
    addBranchFilter(),
    getBranchMonthlyTrend,
  );
  app.get(
    "/api/analytics/voice-streams",
    authenticate,
    addBranchFilter(),
    getVoiceStreamsAnalytics,
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

  // Debug endpoint for audio files (development only)
  app.get("/api/debug/audio-files", debugAudioFiles);

  // Fix audio file mappings (development only)
  app.post("/api/fix/audio-mappings", fixAudioMappings);

  // Debug endpoint to promote user to manager (development only)
  app.post("/api/debug/promote-to-manager", promoteToManager);

  // Complaints Management routes (admin only)
  app.get("/api/complaints", authenticate, addBranchFilter(), getComplaints);
  app.get("/api/complaints/stats", authenticate, getComplaintsStats);
  app.get("/api/complaints/analytics", authenticate, getComplaintsAnalytics);
  app.get("/api/complaints/:complaint_id", authenticate, getComplaint);
  app.post("/api/complaints", authenticate, createComplaint);
  app.put("/api/complaints/:complaint_id", authenticate, updateComplaint);
  app.delete("/api/complaints/:complaint_id", authenticate, deleteComplaint);

  return app;
}
