export interface Booking {
  room: string;
  campus: 'Makati' | 'Intramuros';
  time: string;
  student: string;
}

export interface BookingDatabase {
  [dateKey: string]: Booking[];
}

export interface RegistryRoom {
  name: string;
  campus: 'Makati' | 'Intramuros';
  capacity: number;
  status: 'Active' | 'Maintenance';
}

export interface PendingRequest {
  id: string;
  studentName: string;
  studentId: string;
  roomName: string;
  campus: 'Makati' | 'Intramuros';
  capacity: number;
  date: string;
  timeWindow: string;
}