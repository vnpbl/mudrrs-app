import { supabase } from './client';
import type { RoomRow } from './types';

// Convert DB room to frontend room
const toRoomRow = (dbRoom: any): RoomRow => ({
  room_id: dbRoom.room_id,
  room_name: dbRoom.room_name,
  campus: dbRoom.campus,
  capacity: dbRoom.capacity,
  status: dbRoom.status || 'Active', // if no status column, default
  id: String(dbRoom.room_id),
  name: dbRoom.room_name,
});

export async function fetchRooms(filters?: {
  campus?: string;
  minCapacity?: number;
  maxCapacity?: number;
}): Promise<{ rooms: RoomRow[]; error: string | null }> {
  try {
    let query = supabase.from('rooms').select('*');
    if (filters?.campus && filters.campus !== 'All') {
      query = query.eq('campus', filters.campus);
    }
    if (filters?.minCapacity) {
      query = query.gte('capacity', filters.minCapacity);
    }
    if (filters?.maxCapacity) {
      query = query.lte('capacity', filters.maxCapacity);
    }
    query = query.order('room_name', { ascending: true });

    const { data, error } = await query;
    if (error) return { rooms: [], error: error.message };
    const rooms = (data || []).map(toRoomRow);
    return { rooms, error: null };
  } catch {
    return { rooms: [], error: 'Failed to fetch rooms.' };
  }
}

export async function fetchRoomById(
  roomId: number
): Promise<{ room: RoomRow | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_id', roomId)
      .single();
    if (error) return { room: null, error: error.message };
    return { room: data ? toRoomRow(data) : null, error: null };
  } catch {
    return { room: null, error: 'Failed to fetch room details.' };
  }
}

export async function checkRoomAvailability(
  roomId: number,
  startTime: string,
  endTime: string,
  excludeReservationId?: number
): Promise<{ isAvailable: boolean; error: string | null }> {
  try {
    let query = supabase
      .from('reservations')
      .select('reservation_id')
      .eq('room_id', roomId)
      .in('status', ['Pending', 'Approved', 'Active'])
      .lt('start_time', endTime)
      .gt('end_time', startTime);

    if (excludeReservationId) {
      query = query.neq('reservation_id', excludeReservationId);
    }

    const { data, error } = await query;
    if (error) return { isAvailable: false, error: error.message };
    return { isAvailable: data.length === 0, error: null };
  } catch {
    return { isAvailable: false, error: 'Failed to check availability.' };
  }
}

export async function createRoom(room: {
  room_name: string;
  campus: string;
  capacity: number;
}): Promise<{ room: RoomRow | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .insert(room)
      .select()
      .single();
    if (error) return { room: null, error: error.message };
    return { room: data ? toRoomRow(data) : null, error: null };
  } catch {
    return { room: null, error: 'Failed to create room.' };
  }
}

export async function updateRoom(
  roomId: number,
  updates: Partial<{ room_name: string; campus: string; capacity: number; status: string }>
): Promise<{ room: RoomRow | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .update(updates)
      .eq('room_id', roomId)
      .select()
      .single();
    if (error) return { room: null, error: error.message };
    return { room: data ? toRoomRow(data) : null, error: null };
  } catch {
    return { room: null, error: 'Failed to update room.' };
  }
}

export async function deleteRoom(
  roomId: number
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('room_id', roomId);
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch {
    return { success: false, error: 'Failed to delete room.' };
  }
}

export async function getAvailableTimeSlots(
  roomId: number,
  date: string,
  operatingHours: { open: string; close: string } = { open: '07:00', close: '21:00' }
): Promise<{ availableSlots: string[]; error: string | null }> {
  try {
    const startBoundary = `${date}T${operatingHours.open}:00`;
    const endBoundary = `${date}T${operatingHours.close}:00`;
    const { data: reservations, error: resError } = await supabase
      .from('reservations')
      .select('start_time, end_time')
      .eq('room_id', roomId)
      .gte('start_time', startBoundary)
      .lte('end_time', endBoundary)
      .in('status', ['Pending', 'Approved', 'Active']);

    if (resError) {
      console.error('getAvailableTimeSlots error:', resError);
      return { availableSlots: [], error: resError.message };
    }

    const allSlots: string[] = [];
    const openMinutes = timeToMinutes(operatingHours.open);
    const closeMinutes = timeToMinutes(operatingHours.close);
    for (let m = openMinutes; m < closeMinutes; m += 30) {
      allSlots.push(minutesToTime(m));
    }

    const bookedSlots = new Set<number>();
    for (const res of reservations || []) {
      const resStart = new Date(res.start_time);
      const resEnd = new Date(res.end_time);
      const startMinutes = resStart.getHours() * 60 + resStart.getMinutes();
      const endMinutes = resEnd.getHours() * 60 + resEnd.getMinutes();
      for (let m = startMinutes; m < endMinutes; m += 30) {
        bookedSlots.add(m);
      }
    }

    const availableSlots = allSlots.filter((slot) => {
      const slotMinutes = timeToMinutes(slot);
      return !bookedSlots.has(slotMinutes);
    });

    return { availableSlots, error: null };
  } catch (err) {
    console.error('Unexpected error in getAvailableTimeSlots:', err);
    return { availableSlots: [], error: 'Failed to get available slots.' };
  }
}

// Helpers (unchanged)
// roomService.ts – corrected timeToMinutes
function timeToMinutes(timeStr: string): number {
  // Handle 12-hour format: "10:00 AM", "12:30 PM", etc.
  const parts = timeStr.trim().split(' ');
  let hours = 0;
  let minutes = 0;
  let modifier = '';

  if (parts.length === 2) {
    // It's "HH:MM AM/PM"
    const [time, mod] = parts;
    modifier = mod.toUpperCase();
    const [h, m] = time.split(':').map(Number);
    hours = h;
    minutes = m;
  } else if (parts.length === 1) {
    // It's "HH:MM" (24-hour)
    const [h, m] = timeStr.split(':').map(Number);
    hours = h;
    minutes = m;
  } else {
    return 0; // fallback
  }

  // Convert to 24-hour
  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const modifier = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${modifier}`;
}

export type { RoomRow };