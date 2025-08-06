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
  branch_name: string;
  branch_code: string;
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
  branch_no?: string | null;
  branch_address?: string | null;
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

// Branch Types
export interface Branch {
  id: string;
  branch_code: string;
  branch_name: string;
  branch_city?: string;
  branch_address?: string;
  region?: string;
  contact_phone?: string;
  contact_email?: string;
  is_active: boolean;
  created_on: string;
  updated_on: string;
}

// Device Types
export interface Device {
  id: string;
  device_name: string;
  device_mac?: string;
  ip_address?: string;
  device_type: 'recorder' | 'monitor' | 'other';
  branch_id?: string;
  branch_name?: string;
  branch_code?: string;
  installation_date?: string;
  last_maintenance?: string;
  device_status: 'active' | 'inactive' | 'maintenance';
  notes?: string;
  created_on: string;
  updated_on: string;
}

// Contact Types (kept for backwards compatibility)
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
