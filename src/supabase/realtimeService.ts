import { supabase } from './client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { RoomRow, ReservationWithRoom } from './types';

type ReservationCallback = (reservation: ReservationWithRoom) => void;
type RoomCallback = (room: RoomRow) => void;

let reservationChannel: ReturnType<typeof supabase.channel> | null = null;
let roomChannel: ReturnType<typeof supabase.channel> | null = null;

export function subscribeToReservations(callback: ReservationCallback): () => void {
  if (reservationChannel) {
    supabase.removeChannel(reservationChannel);
  }

  reservationChannel = supabase
    .channel('reservations-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reservations',
      },
      async (payload: RealtimePostgresChangesPayload<any>) => {
        try {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const { data } = await supabase
              .from('reservations')
              .select(`*, room:rooms(*)`)
              .eq('reservation_id', payload.new.reservation_id)
              .single();

            if (data) {
              // Convert to frontend shape (same as in reservationService)
              const res = toReservationRow(data);
              if (data.room) {
                res.room = {
                  room_id: data.room.room_id,
                  room_name: data.room.room_name,
                  campus: data.room.campus,
                  capacity: data.room.capacity,
                  status: data.room.status || 'Active',
                  id: String(data.room.room_id),
                  name: data.room.room_name,
                };
              }
              callback(res);
            }
          } else if (payload.eventType === 'DELETE') {
            callback({
              ...payload.old,
              id: String(payload.old.reservation_id),
              user_id: payload.old.student_id,
              room: undefined,
            } as any);
          }
        } catch (err) {
          console.error('Error processing reservation change:', err);
        }
      }
    )
    .subscribe();

  return () => {
    if (reservationChannel) {
      supabase.removeChannel(reservationChannel);
      reservationChannel = null;
    }
  };
}

export function subscribeToRooms(callback: RoomCallback): () => void {
  if (roomChannel) {
    supabase.removeChannel(roomChannel);
  }

  roomChannel = supabase
    .channel('rooms-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rooms',
      },
      (payload: RealtimePostgresChangesPayload<any>) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const room = payload.new;
          const mapped = {
            room_id: room.room_id,
            room_name: room.room_name,
            campus: room.campus,
            capacity: room.capacity,
            status: room.status || 'Active',
            id: String(room.room_id),
            name: room.room_name,
          };
          callback(mapped);
        } else if (payload.eventType === 'DELETE') {
          const room = payload.old;
          const mapped = {
            room_id: room.room_id,
            room_name: room.room_name,
            campus: room.campus,
            capacity: room.capacity,
            status: room.status || 'Active',
            id: String(room.room_id),
            name: room.room_name,
          };
          callback(mapped);
        }
      }
    )
    .subscribe();

  return () => {
    if (roomChannel) {
      supabase.removeChannel(roomChannel);
      roomChannel = null;
    }
  };
}

export const subscribeToUserReservations = subscribeToStudentReservations;

export function subscribeToStudentReservations(
  studentId: string,
  callback: ReservationCallback
): () => void {
  const channel = supabase
    .channel(`student-reservations-${studentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reservations',
        filter: `student_id=eq.${studentId}`,
      },
      async (payload: RealtimePostgresChangesPayload<any>) => {
        try {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const { data } = await supabase
              .from('reservations')
              .select(`*, room:rooms(*)`)
              .eq('reservation_id', payload.new.reservation_id)
              .single();

            if (data) {
              const res = toReservationRow(data);
              if (data.room) {
                res.room = {
                  room_id: data.room.room_id,
                  room_name: data.room.room_name,
                  campus: data.room.campus,
                  capacity: data.room.capacity,
                  status: data.room.status || 'Active',
                  id: String(data.room.room_id),
                  name: data.room.room_name,
                };
              }
              callback(res);
            }
          } else if (payload.eventType === 'DELETE') {
            callback({
              ...payload.old,
              id: String(payload.old.reservation_id),
              user_id: payload.old.student_id,
              room: undefined,
            } as any);
          }
        } catch (err) {
          console.error('Error processing student reservation change:', err);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function cleanupAllSubscriptions(): void {
  if (reservationChannel) {
    supabase.removeChannel(reservationChannel);
    reservationChannel = null;
  }
  if (roomChannel) {
    supabase.removeChannel(roomChannel);
    roomChannel = null;
  }
}

// Helper to convert DB row to frontend ReservationRow (same as in reservationService)
function toReservationRow(dbRes: any): any {
  const start = new Date(dbRes.start_time);
  // const end = new Date(dbRes.end_time);
  const dateStr = start.toISOString().split('T')[0];
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
  };
}