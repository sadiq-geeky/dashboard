import { RequestHandler } from "express";
import { executeQuery } from "../config/database";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";

export interface User {
  uuid: string;
  emp_name: string | null;
  gender: string | null;
  date_of_birth: string | null;
  cnic: string | null;
  phone_no: string | null;
  designation: string | null;
  department: string | null;
  joining_date: string | null;
  email_id: string | null;
  username: string;
  password_hash: string;
  role: "admin" | "user";
  is_active: boolean;
  created_on: string | null;
  updated_on: string | null;
}

export interface UserSession {
  uuid: string;
  username: string;
  role: "admin" | "user";
  emp_name: string | null;
}

// Get all users (admin only)
export const getUsers: RequestHandler = async (req, res) => {
  try {
    const { limit = "50", page = "1", search } = req.query;
    const limitNum = parseInt(limit as string, 10);
    const pageNum = parseInt(page as string, 10);
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT uuid, emp_name, gender, date_of_birth, cnic, phone_no, designation, department,
             joining_date, email_id, username, role, is_active, created_on, updated_on
      FROM users
    `;

    const queryParams: any[] = [];

    if (search && typeof search === "string" && search.trim()) {
      query += ` WHERE emp_name LIKE ? OR username LIKE ? OR cnic LIKE ? OR email_id LIKE ?`;
      const searchTerm = `%${search.trim()}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY created_on DESC LIMIT ${limitNum} OFFSET ${offset}`;

    const users = await executeQuery<Omit<User, "password_hash">>(
      query,
      queryParams,
    );

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM users`;
    const countParams: any[] = [];

    if (search && typeof search === "string" && search.trim()) {
      countQuery += ` WHERE emp_name LIKE ? OR username LIKE ? OR cnic LIKE ? OR email_id LIKE ?`;
      const searchTerm = `%${search.trim()}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const countResult = await executeQuery<{ total: number }>(
      countQuery,
      countParams,
    );
    const total = countResult[0]?.total || 0;

    res.json({
      data: users,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Create new user (admin only)
export const createUser: RequestHandler = async (req, res) => {
  try {
    const {
      emp_name,
      gender,
      date_of_birth,
      cnic,
      phone_no,
      designation,
      department,
      joining_date,
      email_id,
      username,
      password,
      role = "user",
    } = req.body;

    // Validate required fields
    const requiredFields = {
      emp_name,
      username,
      password,
      cnic,
      phone_no,
      email_id,
      designation,
      department,
      gender,
      date_of_birth,
      joining_date,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(
        ([key, value]) =>
          !value || (typeof value === "string" && value.trim() === ""),
      )
      .map(([key]) => key.replace("_", " "));

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `The following fields are required: ${missingFields.join(", ")}`,
      });
    }

    // Check if username already exists
    const existingUser = await executeQuery<{ uuid: string }>(
      `SELECT uuid FROM users WHERE username = ?`,
      [username],
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        error: "Username already exists",
      });
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const uuid = uuidv4();
    const query = `
      INSERT INTO users (
        uuid, emp_name, gender, date_of_birth, cnic, phone_no, designation, department,
        joining_date, email_id, username, password_hash, role, is_active,
        created_on, updated_on
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    await executeQuery(query, [
      uuid,
      emp_name,
      gender,
      date_of_birth,
      cnic,
      phone_no,
      designation,
      department,
      joining_date,
      email_id,
      username,
      password_hash,
      role,
      true, // is_active
    ]);

    res.status(201).json({
      success: true,
      uuid,
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
};

// Update user (admin only)
export const updateUser: RequestHandler = async (req, res) => {
  try {
    const { uuid } = req.params;
    const {
      emp_name,
      gender,
      date_of_birth,
      cnic,
      phone_no,
      designation,
      department,
      joining_date,
      email_id,
      username,
      password,
      role,
      is_active,
    } = req.body;

    // Check if username exists for another user
    if (username) {
      const existingUser = await executeQuery<{ uuid: string }>(
        `SELECT uuid FROM users WHERE username = ? AND uuid != ?`,
        [username, uuid],
      );

      if (existingUser.length > 0) {
        return res.status(400).json({
          error: "Username already exists",
        });
      }
    }

    let query = `
      UPDATE users SET
        emp_name = ?, gender = ?, date_of_birth = ?, cnic = ?, phone_no = ?,
        designation = ?, department = ?, joining_date = ?, email_id = ?,
        username = ?, role = ?, is_active = ?, updated_on = NOW()
    `;

    const queryParams = [
      emp_name,
      gender,
      date_of_birth,
      cnic,
      phone_no,
      designation,
      department,
      joining_date,
      email_id,
      username,
      role,
      is_active,
    ];

    // Update password if provided
    if (password && password.trim() !== "") {
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);
      query += `, password_hash = ?`;
      queryParams.push(password_hash);
    }

    query += ` WHERE uuid = ?`;
    queryParams.push(uuid);

    await executeQuery(query, queryParams);

    res.json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
};

// Delete user (admin only)
export const deleteUser: RequestHandler = async (req, res) => {
  try {
    const { uuid } = req.params;

    await executeQuery(`DELETE FROM users WHERE uuid = ?`, [uuid]);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// Authentication: Login
export const loginUser: RequestHandler = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required",
      });
    }

    // Get user by username with branch info from link table
    const users = await executeQuery<User & {branch_id: string | null, branch_city: string | null}>(
      `SELECT u.*,
              ldbu.branch_id as branch_id,
              b.branch_city as branch_city
       FROM users u
       LEFT JOIN link_device_branch_user ldbu ON ldbu.user_id = u.uuid
       LEFT JOIN branches b ON b.id = ldbu.branch_id
       WHERE u.username = ? AND u.is_active = true
       LIMIT 1`,
      [username],
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: "Invalid username or password",
      });
    }

    const user = users[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: "Invalid username or password",
      });
    }

    // Create session data (excluding password)
    const userSession: UserSession = {
      uuid: user.uuid,
      username: user.username,
      role: user.role,
      branch_id: user.branch_id,
      branch_city: user.branch_city,
      emp_name: user.emp_name,
    };

    // In a real app, you'd create a proper session/JWT token
    // For now, we'll just return user data
    res.json({
      success: true,
      user: userSession,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

// Get current user profile
export const getUserProfile: RequestHandler = async (req, res) => {
  try {
    const { uuid } = req.params;

    const users = await executeQuery<Omit<User, "password_hash">>(
      `SELECT uuid, emp_name, device_mac, branch_id, branch_city, branch_address, gender,
              date_of_birth, cnic, phone_no, designation, department,
              joining_date, email_id, username, role, is_active, created_on, updated_on
       FROM users WHERE uuid = ?`,
      [uuid],
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json(users[0]);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
};
