import { RequestHandler } from "express";
import { executeQuery } from "../config/database";
import { emailTemplates, sendEmail } from "../config/email";
import bcrypt from "bcrypt";
import crypto from "crypto";

interface User {
  uuid: string;
  username: string;
  password_hash: string;
  email_id: string;
  emp_name: string;
  role: "admin" | "user";
  is_active: boolean;
}

interface PasswordResetToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

// Create password reset tokens table if it doesn't exist
export const initPasswordResetTable = async () => {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(uuid) ON DELETE CASCADE,
        INDEX idx_token (token),
        INDEX idx_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await executeQuery(createTableQuery);
    console.log("✅ Password reset tokens table initialized");
  } catch (error) {
    console.error("❌ Error creating password reset tokens table:", error);
  }
};

// Generate secure random token
const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

// Clean up expired tokens
const cleanupExpiredTokens = async () => {
  try {
    const query = "DELETE FROM password_reset_tokens WHERE expires_at < NOW()";
    await executeQuery(query);
  } catch (error) {
    console.error("Error cleaning up expired tokens:", error);
  }
};

// Forgot password - send reset email
export const forgotPassword: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email address is required" });
    }

    // Clean up expired tokens first
    await cleanupExpiredTokens();

    // Find user by email
    const userQuery =
      "SELECT uuid, username, email_id, emp_name FROM users WHERE email_id = ? AND is_active = true";
    const users = await executeQuery<User>(userQuery, [email]);

    if (users.length === 0) {
      // Don't reveal whether email exists or not for security
      return res.json({
        success: true,
        message:
          "If an account with this email exists, a password reset link has been sent.",
      });
    }

    const user = users[0];

    // Generate reset token
    const resetToken = generateResetToken();
    const tokenId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store token in database
    const insertTokenQuery = `
      INSERT INTO password_reset_tokens (id, user_id, token, expires_at) 
      VALUES (?, ?, ?, ?)
    `;

    await executeQuery(insertTokenQuery, [
      tokenId,
      user.uuid,
      resetToken,
      expiresAt,
    ]);

    // Create reset link
    const resetLink = `${req.protocol}://${req.get("host")}/reset-password?token=${resetToken}`;

    // Send email
    const emailTemplate = emailTemplates.passwordReset(
      resetLink,
      user.emp_name || user.username,
    );
    const emailSent = await sendEmail(
      user.email_id,
      emailTemplate.subject,
      emailTemplate.html,
      emailTemplate.text,
    );

    if (!emailSent) {
      return res
        .status(500)
        .json({ error: "Failed to send reset email. Please try again later." });
    }

    res.json({
      success: true,
      message:
        "Password reset instructions have been sent to your email address.",
    });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Reset password using token
export const resetPassword: RequestHandler = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ error: "Token and new password are required" });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return res.status(400).json({
        error:
          "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      });
    }

    // Clean up expired tokens first
    await cleanupExpiredTokens();

    // Find valid token
    const tokenQuery = `
      SELECT prt.*, u.uuid as user_uuid, u.username 
      FROM password_reset_tokens prt 
      JOIN users u ON prt.user_id = u.uuid 
      WHERE prt.token = ? AND prt.expires_at > NOW() AND u.is_active = true
    `;

    const tokens = await executeQuery<
      PasswordResetToken & { user_uuid: string; username: string }
    >(tokenQuery, [token]);

    if (tokens.length === 0) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const resetTokenData = tokens[0];

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    const updatePasswordQuery =
      "UPDATE users SET password_hash = ? WHERE uuid = ?";
    await executeQuery(updatePasswordQuery, [
      hashedPassword,
      resetTokenData.user_uuid,
    ]);

    // Delete used token
    const deleteTokenQuery =
      "DELETE FROM password_reset_tokens WHERE token = ?";
    await executeQuery(deleteTokenQuery, [token]);

    // Delete all other tokens for this user (invalidate all reset requests)
    const deleteUserTokensQuery =
      "DELETE FROM password_reset_tokens WHERE user_id = ?";
    await executeQuery(deleteUserTokensQuery, [resetTokenData.user_uuid]);

    console.log(
      `✅ Password reset successful for user: ${resetTokenData.username}`,
    );

    res.json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Error in reset password:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Validate reset token (optional endpoint to check if token is still valid)
export const validateResetToken: RequestHandler = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    // Clean up expired tokens first
    await cleanupExpiredTokens();

    // Check if token exists and is valid
    const tokenQuery = `
      SELECT prt.expires_at, u.username, u.email_id 
      FROM password_reset_tokens prt 
      JOIN users u ON prt.user_id = u.uuid 
      WHERE prt.token = ? AND prt.expires_at > NOW() AND u.is_active = true
    `;

    const tokens = await executeQuery<{
      expires_at: string;
      username: string;
      email_id: string;
    }>(tokenQuery, [token]);

    if (tokens.length === 0) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const tokenData = tokens[0];

    res.json({
      success: true,
      message: "Token is valid",
      expires_at: tokenData.expires_at,
      email: tokenData.email_id,
    });
  } catch (error) {
    console.error("Error validating reset token:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
