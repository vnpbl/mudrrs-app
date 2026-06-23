// types.ts – combines SRS schema with frontend expectations

// ---------- USERS ----------
export interface UserRow {
  user_id: number;
  email: string;
  password: string;
  role: 'student' | 'library_staff';
  // Alias for frontend
  id: string; // user_id as string
}

// ---------- STUDENTS ----------
export interface StudentRow {
  student_id: string;
  user_id: number;
  first_name: string;
  last_name: string;
  program?: string | null;
}

// ---------- LIBRARY STAFF ----------
export interface LibraryStaffRow {
  staff_id: string;
  user_id: number;
  first_name: string;
  last_name: string;
  assigned_campus?: string | null;
}

// ---------- ROOMS ----------
export interface RoomRow {
  room_id: number;
  room_name: string;
  campus: string;
  capacity: number;
  // Additional frontend field (computed)
  status: 'Active' | 'Maintenance'; // For frontend, we can always return 'Active' unless we have a separate status column
  // Alias for frontend
  id: string; // room_id as string
  name: string; // room_name
}

// ---------- RESERVATIONS ----------
export type ReservationStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Active'
  | 'Completed'
  | 'Cancelled'
  | 'Auto-Cancelled';

export interface ReservationRow {
  reservation_id: number;
  student_id: string;
  room_id: number;
  start_time: string; // ISO timestamp
  end_time: string;   // ISO timestamp
  status: ReservationStatus;
  check_in_time?: string | null;
  check_out_time?: string | null;
  // Additional frontend fields (stored in DB)
  activity?: string;
  equipment?: string[];
  group_members?: string[];
  group_size: number;
  // Computed fields for frontend
  id: string;        // reservation_id as string
  user_id: string;   // student_id (to match frontend)
  date: string;      // derived from start_time (YYYY-MM-DD)
  room?: RoomRow; // optional, if joined with room
}

// ---------- COMPOSITE TYPES ----------
export interface ReservationWithRoom extends ReservationRow {
  room?: RoomRow;
}

export interface ReservationWithStudent extends ReservationRow {
  student?: StudentRow;
}

// Frontend helper
export interface RoomInsert {
  name: string;
  campus: 'Makati' | 'Intramuros';
  capacity: number;
  status?: 'Active' | 'Maintenance';
}

export interface RoomUpdate {
  name?: string;
  campus?: string;
  capacity?: number;
  status?: 'Active' | 'Maintenance';
}