import { RequestHandler } from "express";
import { executeQuery } from "../config/database";
import { v4 as uuidv4 } from "uuid";

export interface Contact {
  uuid: string;
  emp_name: string | null;
  device_mac: string | null;
  branch_id: string | null;
  branch_city: string | null;
  branch_address: string | null;
  gender: string | null;
  date_of_birth: string | null;
  cnic: string | null;
  phone_no: string | null;
  designation: string | null;
  department: string | null;
  joining_date: string | null;
  email_id: string | null;
  created_on: string | null;
  updated_on: string | null;
}

// Get all contacts
export const getContacts: RequestHandler = async (req, res) => {
  try {
    const { limit = "50", page = "1", search } = req.query;
    const limitNum = parseInt(limit as string, 10);
    const pageNum = parseInt(page as string, 10);
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT uuid, emp_name, device_mac, branch_id, branch_city, branch_address, gender,
             date_of_birth, cnic, phone_no, designation, department,
             joining_date, email_id, created_on, updated_on
      FROM contacts
    `;

    const queryParams: any[] = [];

    if (search && typeof search === "string" && search.trim()) {
      query += ` WHERE emp_name LIKE ? OR cnic LIKE ? OR phone_no LIKE ? OR email_id LIKE ?`;
      const searchTerm = `%${search.trim()}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY created_on DESC LIMIT ${limitNum} OFFSET ${offset}`;

    const contacts = await executeQuery<Contact>(query, queryParams);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM contacts`;
    const countParams: any[] = [];

    if (search && typeof search === "string" && search.trim()) {
      countQuery += ` WHERE emp_name LIKE ? OR cnic LIKE ? OR phone_no LIKE ? OR email_id LIKE ?`;
      const searchTerm = `%${search.trim()}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const countResult = await executeQuery<{ total: number }>(
      countQuery,
      countParams,
    );
    const total = countResult[0]?.total || 0;

    res.json({
      data: contacts,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
};

// Create new contact
export const createContact: RequestHandler = async (req, res) => {
  try {
    const {
      emp_name,
      device_mac,
      branch_id,
      branch_city,
      branch_address,
      gender,
      date_of_birth,
      cnic,
      phone_no,
      designation,
      department,
      joining_date,
      email_id,
    } = req.body;

    // Validate required fields
    const requiredFields = {
      emp_name,
      cnic,
      phone_no,
      email_id,
      designation,
      department,
      branch_id,
      branch_city,
      gender,
      date_of_birth,
      joining_date,
      device_mac,
      branch_address,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(
        ([key, value]) =>
          !value || (typeof value === "string" && value.trim() === ""),
      )
      .map(([key]) => key.replace("_", " "));

    if (missingFields.length > 0) {
      return res
        .status(400)
        .json({
          error: `The following fields are required: ${missingFields.join(", ")}`,
        });
    }

    const uuid = uuidv4();
    const query = `
      INSERT INTO contacts (
        uuid, emp_name, device_mac, branch_id, branch_city, branch_address, gender,
        date_of_birth, cnic, phone_no, designation, department,
        joining_date, email_id, created_on, updated_on
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    await executeQuery(query, [
      uuid,
      emp_name,
      device_mac,
      branch_id,
      branch_address,
      gender,
      date_of_birth,
      cnic,
      phone_no,
      designation,
      department,
      joining_date,
      email_id,
    ]);

    res.status(201).json({
      success: true,
      uuid,
      message: "Contact created successfully",
    });
  } catch (error) {
    console.error("Error creating contact:", error);
    res.status(500).json({ error: "Failed to create contact" });
  }
};

// Update contact
export const updateContact: RequestHandler = async (req, res) => {
  try {
    const { uuid } = req.params;
    const {
      emp_name,
      device_mac,
      branch_id,
      branch_address,
      gender,
      date_of_birth,
      cnic,
      phone_no,
      designation,
      department,
      joining_date,
      email_id,
    } = req.body;

    const query = `
      UPDATE contacts SET
        emp_name = ?, device_mac = ?, branch_id = ?, branch_address = ?,
        gender = ?, date_of_birth = ?, cnic = ?, phone_no = ?,
        designation = ?, department = ?, joining_date = ?, email_id = ?,
        updated_on = NOW()
      WHERE uuid = ?
    `;

    await executeQuery(query, [
      emp_name,
      device_mac,
      branch_id,
      branch_address,
      gender,
      date_of_birth,
      cnic,
      phone_no,
      designation,
      department,
      joining_date,
      email_id,
      uuid,
    ]);

    res.json({
      success: true,
      message: "Contact updated successfully",
    });
  } catch (error) {
    console.error("Error updating contact:", error);
    res.status(500).json({ error: "Failed to update contact" });
  }
};

// Delete contact
export const deleteContact: RequestHandler = async (req, res) => {
  try {
    const { uuid } = req.params;

    const query = `DELETE FROM contacts WHERE uuid = ?`;
    await executeQuery(query, [uuid]);

    res.json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({ error: "Failed to delete contact" });
  }
};
