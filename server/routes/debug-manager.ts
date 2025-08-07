import { RequestHandler } from "express";
import { executeQuery } from "../config/database";

// Debug endpoint to promote user to manager (development only)
export const promoteToManager: RequestHandler = async (req, res) => {
  try {
    // Find first regular user
    const users = await executeQuery<{
      uuid: string;
      username: string;
      role: string;
    }>(
      "SELECT uuid, username, role FROM users WHERE role = 'user' AND is_active = true LIMIT 1",
    );

    if (users.length === 0) {
      return res.json({
        success: false,
        message: "No regular users found to promote",
      });
    }

    const user = users[0];

    // Promote to manager
    await executeQuery("UPDATE users SET role = 'manager' WHERE uuid = ?", [
      user.uuid,
    ]);

    res.json({
      success: true,
      message: "User promoted to manager successfully",
      user: {
        username: user.username,
        uuid: user.uuid,
        newRole: "manager",
      },
    });
  } catch (error) {
    console.error("Error promoting user to manager:", error);
    res.status(500).json({
      success: false,
      error: "Failed to promote user to manager",
    });
  }
};
