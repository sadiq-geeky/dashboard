/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// Device Heartbeat Types
export interface HeartbeatRecord {
  device_name: string;
  status: "online" | "problematic" | "offline";
  last_seen: string;
}

export interface DeviceMapping {
  id: string;
  ip_address: string;
  device_name: string;
  created_on: string;
}

// Recording Types
export interface RecordingHistory {
  id: string;
  cnic: string | null;
  start_time: string | null;
  end_time: string | null;
  file_name: string | null;
  created_on: string | null;
  device_name: string | null;
  duration?: number;
  duration_seconds?: number;
  status: "completed" | "in_progress" | "failed";
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Contact Types
export interface Contact {
  uuid: string;
  emp_name: string | null;
  device_mac: string | null;
  branch_id: string | null;
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
