import { supabase } from './client';
import { checkRoomAvailability } from './roomService';
import type { ReservationRow, ReservationWithRoom, ReservationStatus } from './types';

export type { ReservationStatus };

export interface ReservationInsert {
  user_id: string;      // frontend sends this (mapped to student_id)
  room_id: string;      // frontend sends as string
  date: string;         // YYYY-MM-DD
  start_time: string;   // "10:00 AM"
  end_time: string;     // "11:30 AM"
  status?: ReservationStatus;
  activity?: string;
  equipment?: string[];
  group_members?: string[];
  group_size?: number;
}

export interface ReservationUpdate {
  status?: ReservationStatus;
  check_in_time?: string | null;
  check_out_time?: string | null;
}

// Convert DB reservation to frontend reservation
const toReservationRow = (dbRes: any): ReservationRow => {
  const start = new Date(dbRes.start_time);
  // const end = new Date(dbRes.end_time);
  const dateStr = start.toISOString().split('T')[0];
  /* const timeStr = (d: Date) => {
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  }; */
  return {
    reservation_id: dbRes.reservation_id,
    student_id: dbRes.student_id,
    room_id: dbRes.room_id,
    start_time: dbRes.start_time,
    end_time: dbRes.end_time,
    status: dbRes.status,
    check_in_time: dbRes.check_in_time || null,
    check_out_time: dbRes.check_out_time || null,
    activity: dbRes.activity,
    equipment: dbRes.equipment || [],
    group_members: dbRes.group_members || [],
    group_size: dbRes.group_size || 1,
    id: String(dbRes.reservation_id),
    user_id: dbRes.student_id,
    date: dateStr,
    // we also need the room object separately if joined
  };
};

export async function createReservation(
  reservation: ReservationInsert
): Promise<{ reservation: ReservationRow | null; error: string | null }> {
  try {
    // Convert frontend time to full timestamp
    const startISO = `${reservation.date}T${convertTo24Hour(reservation.start_time)}:00`;
    const endISO = `${reservation.date}T${convertTo24Hour(reservation.end_time)}:00`;

    const { isAvailable, error: availabilityError } = await checkRoomAvailability(
      Number(reservation.room_id),
      startISO,
      endISO
    );
    if (availabilityError) return { reservation: null, error: availabilityError };
    if (!isAvailable) {
      return {
        reservation: null,
        error: 'This time slot is no longer available. Please choose a different time or room.',
      };
    }

    const insertData = {
      student_id: reservation.user_id,
      room_id: Number(reservation.room_id),
      start_time: startISO,
      end_time: endISO,
      status: reservation.status || 'Pending',
      activity: reservation.activity,
      equipment: reservation.equipment || [],
      group_members: reservation.group_members || [],
      group_size: reservation.group_size || (reservation.group_members?.length || 0) + 1,
    };

    const { data, error } = await supabase
      .from('reservations')
      .insert(insertData)
      .select()
      .single();

    if (error) return { reservation: null, error: error.message };
    return { reservation: data ? toReservationRow(data) : null, error: null };
  } catch {
    return { reservation: null, error: 'Failed to create reservation.' };
  }
}

// Convert 12h time to 24h string
function convertTo24Hour(timeStr: string): string {
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export async function fetchStudentReservations(
  studentId: string
): Promise<{ reservations: ReservationWithRoom[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select(`*, room:rooms(*)`)
      .eq('student_id', studentId)
      .order('start_time', { ascending: false });

    if (error) return { reservations: [], error: error.message };
    const reservations = (data || []).map((item: any) => {
      const res = toReservationRow(item);
      if (item.room) {
        res.room = {
          room_id: item.room.room_id,
          room_name: item.room.room_name,
          campus: item.room.campus,
          capacity: item.room.capacity,
          status: item.room.status || 'Active',
          id: String(item.room.room_id),
          name: item.room.room_name,
        };
      }
      return res;
    });
    return { reservations, error: null };
  } catch {
    return { reservations: [], error: 'Failed to fetch reservations.' };
  }
}

export async function fetchAllReservations(filters?: {
  status?: ReservationStatus;
  date?: string;        // ← Add this
  startDate?: string;
  endDate?: string;
  campus?: string;
  roomId?: number;
}): Promise<{ reservations: ReservationWithRoom[]; error: string | null }> {
  try {
    let query = supabase
      .from('reservations')
      .select(`*, room:rooms(*)`);

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.roomId) query = query.eq('room_id', filters.roomId);
    
    // Handle date filter
    if (filters?.date) {
      query = query.gte('start_time', filters.date).lt('start_time', `${filters.date}T23:59:59`);
    }
    if (filters?.startDate) {
      query = query.gte('start_time', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('start_time', `${filters.endDate}T23:59:59`);
    }

    query = query.order('start_time', { ascending: false });

    const { data, error } = await query;
    if (error) return { reservations: [], error: error.message };

    let result = (data || []).map((item: any) => {
      const res = toReservationRow(item);
      if (item.room) {
        res.room = {
          room_id: item.room.room_id,
          room_name: item.room.room_name,
          campus: item.room.campus,
          capacity: item.room.capacity,
          status: item.room.status || 'Active',
          id: String(item.room.room_id),
          name: item.room.room_name,
        };
      }
      return res;
    });

    if (filters?.campus && filters.campus !== 'All') {
      result = result.filter((r) => r.room?.campus === filters.campus);
    }
    return { reservations: result, error: null };
  } catch {
    return { reservations: [], error: 'Failed to fetch reservations.' };
  }
}

export async function updateReservationStatus(
  reservationId: number,
  updates: ReservationUpdate
): Promise<{ reservation: ReservationRow | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .update(updates)
      .eq('reservation_id', reservationId)
      .select()
      .single();

    if (error) return { reservation: null, error: error.message };
    return { reservation: data ? toReservationRow(data) : null, error: null };
  } catch {
    return { reservation: null, error: 'Failed to update reservation.' };
  }
}

export async function approveReservation(
  reservationId: number
): Promise<{ reservation: ReservationRow | null; error: string | null }> {
  return updateReservationStatus(reservationId, { status: 'Approved' });
}

export async function rejectReservation(
  reservationId: number
): Promise<{ reservation: ReservationRow | null; error: string | null }> {
  return updateReservationStatus(reservationId, { status: 'Rejected' });
}

export async function checkInReservation(
  reservationId: number
): Promise<{ reservation: ReservationRow | null; error: string | null }> {
  const now = new Date().toISOString();
  return updateReservationStatus(reservationId, {
    status: 'Active',
    check_in_time: now,
  });
}

export async function checkOutReservation(
  reservationId: number
): Promise<{ reservation: ReservationRow | null; error: string | null }> {
  const now = new Date().toISOString();
  return updateReservationStatus(reservationId, {
    status: 'Completed',
    check_out_time: now,
  });
}

export async function cancelReservation(
  reservationId: number
): Promise<{ reservation: ReservationRow | null; error: string | null }> {
  return updateReservationStatus(reservationId, { status: 'Cancelled' });
}

export async function getExpiredApprovedReservations(
  currentTime: string = new Date().toISOString()
): Promise<{ reservations: ReservationRow[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('status', 'Approved')
      .is('check_in_time', null)
      .lte('start_time', currentTime);

    if (error) return { reservations: [], error: error.message };
    return { reservations: (data || []).map(toReservationRow), error: null };
  } catch {
    return { reservations: [], error: 'Failed to check expired reservations.' };
  }
}

export async function sendEmailNotification(
  type: 'confirmation' | 'rejection' | 'cancellation' | 'reminder',
  reservationId: string | number
): Promise<void> {
  console.log(`[EMAIL] Type: ${type}, Reservation: ${reservationId}`);
}