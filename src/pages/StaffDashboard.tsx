import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchRooms, createRoom, updateRoom } from '../supabase/roomService';
import { 
  fetchAllReservations, 
  approveReservation, 
  rejectReservation, 
  checkInReservation, 
  checkOutReservation,
  cancelReservation
} from '../supabase/reservationService';
import { subscribeToReservations, subscribeToRooms } from '../supabase/realtimeService';
import type { RoomRow, ReservationWithRoom } from '../supabase/types';
import * as XLSX from 'xlsx';

export const StaffDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const [currentTab, setCurrentTab] = useState<'board' | 'analytics' | 'config'>('board');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [campusFilter, setCampusFilter] = useState<string>('all');
  const [configCampusTab, setConfigCampusTab] = useState<'Makati' | 'Intramuros'>('Makati');

  // Real data from Supabase
  const [rooms, setRooms] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Config form state
  const [newRoom, setNewRoom] = useState<{
    name: string;
    campus: 'Makati' | 'Intramuros';
    capacity: string;
  }>({ name: '', campus: 'Makati', capacity: '' });

  // ============ Load data without date filter for pending requests ============
  const loadData = useCallback(async () => {
    setIsLoading(true);
    console.log('🔍 [loadData] Starting data fetch...');
    
    const { rooms: fetchedRooms } = await fetchRooms();
    console.log('🔍 [loadData] Rooms fetched:', fetchedRooms.length);
    
    const { reservations: fetchedReservations } = await fetchAllReservations({
    });
    
    console.log('🔍 [loadData] All reservations fetched:', fetchedReservations.length);
    console.log('🔍 [loadData] Pending count:', fetchedReservations.filter(r => r.status === 'Pending').length);
    
    setRooms(fetchedRooms);
    setReservations(fetchedReservations);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time subscriptions
  useEffect(() => {
    const unsubReservations = subscribeToReservations((updatedReservation) => {
      console.log('🔄 Real-time update received:', updatedReservation);
      setReservations((prev) => {
        const exists = prev.find((r) => r.id === updatedReservation.id);
        if (exists) {
          return prev.map((r) => (r.id === updatedReservation.id ? { ...r, ...updatedReservation } : r));
        }
        return [updatedReservation, ...prev];
      });
    });

    const unsubRooms = subscribeToRooms((updatedRoom) => {
      setRooms((prev) => {
        const exists = prev.find((r) => r.id === updatedRoom.id);
        if (exists) {
          return prev.map((r) => (r.id === updatedRoom.id ? { ...r, ...updatedRoom } : r));
        }
        return [updatedRoom, ...prev];
      });
    });

    return () => {
      unsubReservations();
      unsubRooms();
    };
  }, []);

  // ============ Filter reservations by date for display only ============
  const filteredByDateReservations = useMemo(() => {
    return reservations.filter(r => {
      const reservationDate = new Date(r.start_time).toISOString().split('T')[0];
      return reservationDate === selectedDate;
    });
  }, [reservations, selectedDate]);

  const activeBookingsCount = useMemo(() => {
    return filteredByDateReservations.filter(r => r.status === 'Active').length;
  }, [filteredByDateReservations]);

const liveUtilizationRate = useMemo(() => {
  if (rooms.length === 0) return 0;
  // Count total rooms with active bookings
  const roomsWithActiveBookings = rooms.filter(room => {
    return reservations.some(r => 
      r.room_id === Number(room.id) && 
      r.status === 'Active'
    );
  }).length;
  return Math.round((roomsWithActiveBookings / rooms.length) * 100);
}, [rooms, reservations]);

const campusMetrics = useMemo(() => {
  const calculateForCampus = (campusName: 'Makati' | 'Intramuros') => {
    const campusRooms = rooms.filter(r => r.campus === campusName);
    if (campusRooms.length === 0) return { percent: 0, count: 0 };
    
    const roomsWithActiveBookings = campusRooms.filter(room => {
      return reservations.some(r => 
        r.room_id === Number(room.id) && 
        r.status === 'Active'  // Reservation status
      );
    }).length;
    
    return {
      percent: Math.round((roomsWithActiveBookings / campusRooms.length) * 100),
      count: roomsWithActiveBookings,
    };
  };
  return {
    Makati: calculateForCampus('Makati'),
    Intramuros: calculateForCampus('Intramuros'),
  };
}, [rooms, reservations]);

  // ============ Pending requests from ALL reservations ============
  const pendingRequests = useMemo(() => {
    return reservations.filter(r => r.status === 'Pending');
  }, [reservations]);

  // ============ Approved requests from ALL reservations ============
  const approvedRequests = useMemo(() => {
    return reservations.filter(r => r.status === 'Approved');
  }, [reservations]);

  const handleRequestDecision = async (id: string, action: 'Approved' | 'Rejected') => {
    if (!window.confirm(`Confirm action: ${action} this reservation?`)) return;
    
    if (action === 'Approved') {
      await approveReservation(Number(id));
    } else {
      await rejectReservation(Number(id));
    }
    await loadData();
  };

  const handleStatusToggle = async (roomId: string, nextStatus: 'Active' | 'Maintenance') => {
    await updateRoom(Number(roomId), { status: nextStatus });
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.name || !newRoom.capacity) return;

    const capacity = parseInt(newRoom.capacity);
    if (isNaN(capacity) || capacity < 1) {
      setError('Please enter a valid capacity.');
      return;
    }

    const { error: createError } = await createRoom({
      room_name: newRoom.name,
      campus: newRoom.campus,
      capacity
    });

    if (createError) {
      setError(createError);
      return;
    }

    setConfigCampusTab(newRoom.campus);
    setNewRoom({ name: '', campus: 'Makati', capacity: '' });
    setError('');
    await loadData();
  };

  // ============ handleCheckIn with Grace Period ============
  const handleCheckIn = async (reservationId: string) => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) {
      setError('Reservation not found');
      return;
    }

    const startTime = new Date(reservation.start_time);
    const now = new Date();
    const diffMinutes = (now.getTime() - startTime.getTime()) / 60000;
    const GRACE_PERIOD = 15;

    let confirmMessage = 'Confirm student check-in?';
    
    if (diffMinutes > GRACE_PERIOD) {
      confirmMessage = `❌ Student is ${Math.round(diffMinutes)} minutes late. Grace period (${GRACE_PERIOD} minutes) has expired. This will CANCEL the reservation. Confirm?`;
      if (!window.confirm(confirmMessage)) return;
      
      const { error: cancelError } = await cancelReservation(Number(reservationId));
      if (cancelError) {
        setError(cancelError);
      } else {
        setError(''); 
        alert('❌ Reservation cancelled - student exceeded grace period.');
        await loadData(); 
      }
      return;
    } 
    
    if (diffMinutes > 0 && diffMinutes <= GRACE_PERIOD) {
      confirmMessage = `⚠️ Student is ${Math.round(diffMinutes)} minutes late (within ${GRACE_PERIOD}-minute grace period). Confirm check-in?`;
      if (!window.confirm(confirmMessage)) return;
    } else {
      if (!window.confirm(confirmMessage)) return;
    }

    const { error: checkInError } = await checkInReservation(Number(reservationId));
    if (checkInError) {
      setError(checkInError);
    } else {
      setError('');
      if (diffMinutes > 0 && diffMinutes <= GRACE_PERIOD) {
        alert(`✅ Checked in successfully (${Math.round(diffMinutes)} minutes late - within grace period)`);
      } else {
        alert('✅ Checked in successfully!');
      }
      await loadData(); 
    }
  };

  const handleCheckOut = async (reservationId: string) => {
    const { error: checkOutError } = await checkOutReservation(Number(reservationId));
    if (checkOutError) setError(checkOutError);
    await loadData();
  };

  // ============ Export to Excel ============
  const exportToExcel = () => {
    const dataToExport = reservations;
    
    if (dataToExport.length === 0) {
      alert('No reservations to export.');
      return;
    }

    try {
      console.log('📊 Exporting ALL:', dataToExport.length, 'reservations');

      const exportData = dataToExport.map((r) => ({
        'Reservation ID': r.id || '',
        'Student ID': r.student_id || '',
        'Room': r.room?.name || 'Unknown',
        'Campus': r.room?.campus || 'Unknown',
        'Date': r.date || new Date(r.start_time).toISOString().split('T')[0] || '',
        'Start Time': r.start_time ? new Date(r.start_time).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }) : '',
        'End Time': r.end_time ? new Date(r.end_time).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }) : '',
        'Status': r.status || '',
        'Activity': r.activity || '',
        'Group Size': r.group_size || 1,
        'Equipment': Array.isArray(r.equipment) ? r.equipment.join(', ') : '',
        'Check In Time': r.check_in_time ? new Date(r.check_in_time).toLocaleString() : '',
        'Check Out Time': r.check_out_time ? new Date(r.check_out_time).toLocaleString() : '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const colWidths = Object.keys(exportData[0] || {}).map((key) => ({ 
        wch: Math.max(key.length, 15) 
      }));
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Reservations');

      const filename = `Bookings_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      alert(`✅ Exported ${exportData.length} reservations to ${filename}`);
    } catch (err) {
      console.error('Export error:', err);
      alert('Error exporting to Excel. Please try again.');
    }
  };

  const filteredRegistryView = useMemo(() => {
    return rooms.filter(room => room.campus === configCampusTab);
  }, [rooms, configCampusTab]);

  const filteredLiveMonitorView = useMemo(() => {
    return rooms.filter(room => {
      const matchesCampus = campusFilter === 'all' || room.campus === campusFilter;
      const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCampus && matchesSearch;
    });
  }, [rooms, campusFilter, searchQuery]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const userName = profile?.profile
    ? 'first_name' in profile.profile
      ? `${profile.profile.first_name} ${profile.profile.last_name}`
      : profile.user.email
    : 'Staff';

  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#991b1b] rounded-md"></div>
            <span className="font-bold text-xl tracking-tight text-gray-900">MUDRRS</span>
            <span className="text-[10px] font-bold bg-[#ffc000] text-gray-900 px-2 py-0.5 rounded-full uppercase tracking-wider">Staff Hub</span>
          </div>

          <div className="hidden md:flex gap-6">
            <button
              className={`text-sm font-bold py-5 border-b-2 transition-colors ${currentTab === 'board' ? 'text-[#991b1b] border-[#991b1b]' : 'text-gray-500 border-transparent hover:text-gray-900'}`}
              onClick={() => setCurrentTab('board')}
            >
              Live Board
            </button>
            <button
              className={`text-sm font-bold py-5 border-b-2 transition-colors ${currentTab === 'analytics' ? 'text-[#991b1b] border-[#991b1b]' : 'text-gray-500 border-transparent hover:text-gray-900'}`}
              onClick={() => setCurrentTab('analytics')}
            >
              Analytics
            </button>
            <button
              className={`text-sm font-bold py-5 border-b-2 transition-colors ${currentTab === 'config' ? 'text-[#991b1b] border-[#991b1b]' : 'text-gray-500 border-transparent hover:text-gray-900'}`}
              onClick={() => setCurrentTab('config')}
            >
              Configurations
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 p-1 pr-4 bg-gray-50 rounded-full border border-gray-200">
              <div className="w-8 h-8 rounded-full bg-[#ffc000] text-gray-900 flex justify-center items-center font-bold text-xs">{initials}</div>
              <span className="text-sm font-semibold text-gray-700">{userName}</span>
            </div>
            <button onClick={handleLogout} className="text-xs font-bold text-gray-500 hover:text-[#991b1b] transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <p className="text-sm font-medium text-red-700">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-[#991b1b] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 font-semibold">Loading staff dashboard...</p>
          </div>
        ) : (
          <>
            {currentTab === 'board' && (
              <LiveBoardView
                reservations={filteredByDateReservations}
                pendingRequests={pendingRequests}
                approvedRequests={approvedRequests}
                rooms={rooms}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                campusFilter={campusFilter}
                setCampusFilter={setCampusFilter}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                filteredLiveMonitorView={filteredLiveMonitorView}
                activeBookingsCount={activeBookingsCount}
                liveUtilizationRate={liveUtilizationRate}
                handleRequestDecision={handleRequestDecision}
                handleCheckIn={handleCheckIn}
                handleCheckOut={handleCheckOut}
                onExport={exportToExcel}
              />
            )}

            {currentTab === 'analytics' && (
              <AnalyticsView
                campusMetrics={campusMetrics}
                reservations={reservations}  
              />
            )}

            {currentTab === 'config' && (
              <ConfigurationsView
                newRoom={newRoom}
                setNewRoom={setNewRoom}
                configCampusTab={configCampusTab}
                setConfigCampusTab={setConfigCampusTab}
                filteredRegistryView={filteredRegistryView}
                handleAddRoom={handleAddRoom}
                handleStatusToggle={handleStatusToggle}
                totalRoomsCount={rooms.length}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

// --- LiveBoardView Component ---
interface LiveBoardProps {
  reservations: ReservationWithRoom[];
  pendingRequests: ReservationWithRoom[];
  approvedRequests: ReservationWithRoom[];
  rooms: RoomRow[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  campusFilter: string;
  setCampusFilter: (f: string) => void;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  filteredLiveMonitorView: RoomRow[];
  activeBookingsCount: number;
  liveUtilizationRate: number;
  handleRequestDecision: (id: string, action: 'Approved' | 'Rejected') => void;
  handleCheckIn: (id: string) => void;
  handleCheckOut: (id: string) => void;
  onExport: () => void;
}

function LiveBoardView({
  reservations,
  pendingRequests,
  approvedRequests,
  rooms,
  searchQuery,
  setSearchQuery,
  campusFilter,
  setCampusFilter,
  selectedDate,
  setSelectedDate,
  filteredLiveMonitorView,
  activeBookingsCount,
  liveUtilizationRate,
  handleRequestDecision,
  handleCheckIn,
  handleCheckOut,
  onExport,
}: LiveBoardProps) {
  const [activeTab, setActiveTab] = useState<'monitor' | 'pending' | 'approved'>('monitor');

  // ============ Handle both ISO and time strings ============
  const fmtTime = (t: string) => {
    if (!t) return '';
    
    let date: Date;
    
    if (t.includes('T')) {
      date = new Date(t);
    } else {
      const parts = t.split(':');
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1] || '0');
      date = new Date();
      date.setHours(hours, minutes, 0, 0);
    }
    
    if (isNaN(date.getTime())) return t;
    
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${h12}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  // ============ Time status for ISO timestamps ============
  const getTimeStatus = (startTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    
    if (isNaN(start.getTime())) return null;
    
    const diffMinutes = (now.getTime() - start.getTime()) / 60000;
    const GRACE_PERIOD = 15;
    
    if (diffMinutes > GRACE_PERIOD) {
      return { label: 'EXPIRED', color: 'bg-red-100 text-red-700' };
    } else if (diffMinutes > 0) {
      return { label: `${Math.round(diffMinutes)}m LATE`, color: 'bg-yellow-100 text-yellow-700' };
    }
    return null;
  };

  // ============ Check-in button style ============
  const getCheckInButtonStyle = (startTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    if (isNaN(start.getTime())) return 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100';
    
    const diffMinutes = (now.getTime() - start.getTime()) / 60000;
    const GRACE_PERIOD = 15;
    
    if (diffMinutes > GRACE_PERIOD) {
      return 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100';
    } else if (diffMinutes > 0) {
      return 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100';
    }
    return 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100';
  };

  const getCheckInButtonText = (startTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    if (isNaN(start.getTime())) return 'Check In';
    
    const diffMinutes = (now.getTime() - start.getTime()) / 60000;
    const GRACE_PERIOD = 15;
    
    if (diffMinutes > GRACE_PERIOD) return 'Check In (Expired)';
    if (diffMinutes > 0) return 'Check In (Late)';
    return 'Check In';
  };

  // Check if reservation is already checked in
  const isCheckedIn = (reservation: ReservationWithRoom) => {
    return reservation.check_in_time !== null && reservation.check_in_time !== undefined;
  };

  // Check if reservation is already checked out
  const isCheckedOut = (reservation: ReservationWithRoom) => {
    return reservation.check_out_time !== null && reservation.check_out_time !== undefined;
  };

  // Count approved bookings that are checked in (active)
  const checkedInCount = useMemo(() => {
    return approvedRequests.filter(r => isCheckedIn(r) && !isCheckedOut(r)).length;
  }, [approvedRequests]);

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Rooms</p>
          <p className="text-3xl font-bold text-gray-900">{rooms.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Active Bookings</p>
          <p className="text-3xl font-bold text-[#991b1b]">{activeBookingsCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Pending Requests</p>
          <p className="text-3xl font-bold text-yellow-600">{pendingRequests.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Approved</p>
          <p className="text-3xl font-bold text-blue-600">{approvedRequests.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Checked In</p>
          <p className="text-3xl font-bold text-green-600">{checkedInCount}</p>
        </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Utilization</p>
    <p className="text-3xl font-bold text-gray-900">{liveUtilizationRate}%</p>
  </div>
      </div>

      {/* Tab Navigation + Export Button */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('monitor')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'monitor' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            Room Monitor
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'pending' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            Pending Requests {pendingRequests.length > 0 && <span className="ml-1 bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingRequests.length}</span>}
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'approved' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            Approved Bookings {approvedRequests.length > 0 && <span className="ml-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{approvedRequests.length}</span>}
          </button>
        </div>
        
        <button
          onClick={onExport}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export to Excel
        </button>
      </div>

      {/* ============ TAB 1: Room Monitor ============ */}
      {activeTab === 'monitor' && (
        <div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Search Room</label>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Room name..." className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none mt-1" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Campus</label>
              <select value={campusFilter} onChange={e => setCampusFilter(e.target.value)} className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none mt-1 cursor-pointer">
                <option value="all">All Campuses</option>
                <option value="Makati">Makati</option>
                <option value="Intramuros">Intramuros</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date</label>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none mt-1 cursor-pointer" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <div className="col-span-3">Room</div>
              <div className="col-span-2">Campus</div>
              <div className="col-span-2">Capacity</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3">Current Booking</div>
            </div>
            {filteredLiveMonitorView.length === 0 ? (
              <div className="p-8 text-center text-gray-500 font-medium">No rooms found.</div>
            ) : (
              filteredLiveMonitorView.map(room => {
                const currentBooking = reservations.find(r => r.room_id === Number(room.id) && r.status === 'Active');
                return (
                  <div key={room.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center hover:bg-gray-50 transition-colors">
                    <div className="col-span-3 font-bold text-sm text-gray-900">{room.name}</div>
                    <div className="col-span-2 text-sm text-gray-600">{room.campus}</div>
                    <div className="col-span-2 text-sm text-gray-600">{room.capacity}</div>
                    <div className="col-span-2">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${room.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                        {room.status === 'Active' ? 'Available' : 'Maintenance'}
                      </span>
                    </div>
                    <div className="col-span-3 text-sm text-gray-600">
                      {currentBooking ? (
                        <span className="font-semibold text-[#991b1b]">
                          {fmtTime(currentBooking.start_time)} - {fmtTime(currentBooking.end_time)}
                        </span>
                      ) : (
                        <span className="text-gray-400">No active booking</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ============ TAB 2: Pending Requests ============ */}
      {activeTab === 'pending' && (
        <div>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-xl">
              <p className="text-gray-500 font-medium">No pending requests.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingRequests.map(req => {
                const timeStatus = getTimeStatus(req.start_time);
                
                return (
                  <div key={req.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {req.room?.name || 'Unknown Room'}
                          {timeStatus && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${timeStatus.color}`}>
                              {timeStatus.label}
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {fmtTime(req.start_time)} - {fmtTime(req.end_time)} | {req.date}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">ID: {req.id} | Group Size: {req.group_size}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-yellow-50 text-yellow-700 border border-yellow-200">
                        Pending
                      </span>
                    </div>
                    <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                      <button 
                        onClick={() => handleRequestDecision(req.id, 'Approved')} 
                        className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleRequestDecision(req.id, 'Rejected')} 
                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============ TAB 3: Approved Bookings (with Check In/Out) ============ */}
      {activeTab === 'approved' && (
        <div>
          {approvedRequests.length === 0 ? (
            <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-xl">
              <p className="text-gray-500 font-medium">No approved bookings.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {approvedRequests.map(req => {
                const timeStatus = getTimeStatus(req.start_time);
                const checkedIn = isCheckedIn(req);
                const checkedOut = isCheckedOut(req);
                
                return (
                  <div key={req.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {req.room?.name || 'Unknown Room'}
                          {timeStatus && !checkedIn && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${timeStatus.color}`}>
                              {timeStatus.label}
                            </span>
                          )}
                          {checkedIn && !checkedOut && (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                              ✓ CHECKED IN
                            </span>
                          )}
                          {checkedOut && (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                              ✓ CHECKED OUT
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {fmtTime(req.start_time)} - {fmtTime(req.end_time)} | {req.date}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          ID: {req.id} | Group Size: {req.group_size}
                          {req.check_in_time && (
                            <span className="ml-2 text-green-600">Check-in: {new Date(req.check_in_time).toLocaleTimeString()}</span>
                          )}
                          {req.check_out_time && (
                            <span className="ml-2 text-blue-600">Check-out: {new Date(req.check_out_time).toLocaleTimeString()}</span>
                          )}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                        checkedOut ? 'bg-gray-50 text-gray-500 border-gray-200' :
                        checkedIn ? 'bg-green-50 text-green-700 border-green-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {checkedOut ? 'Completed' : checkedIn ? 'Active' : 'Approved'}
                      </span>
                    </div>
                    <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                      {!checkedIn && (
                        <button 
                          onClick={() => handleCheckIn(req.id)} 
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${getCheckInButtonStyle(req.start_time)}`}
                        >
                          {getCheckInButtonText(req.start_time)}
                        </button>
                      )}
                      
                      {checkedIn && !checkedOut && (
                        <button 
                          onClick={() => handleCheckOut(req.id)} 
                          className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                        >
                          Check Out
                        </button>
                      )}
                      
                      {checkedOut && (
                        <span className="px-4 py-2 text-xs font-bold text-gray-400">
                          ✓ Completed
                        </span>
                      )}
                      
                      {!checkedIn && (
                        <button 
                          onClick={() => handleRequestDecision(req.id, 'Rejected')} 
                          className="px-4 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- AnalyticsView Component ---
interface AnalyticsProps {
  campusMetrics: { Makati: { percent: number; count: number }; Intramuros: { percent: number; count: number } };
  reservations: ReservationWithRoom[];
}

function AnalyticsView({ campusMetrics, reservations }: AnalyticsProps) {
  const statusBreakdown = useMemo(() => {
    return {
      pending: reservations.filter(r => r.status === 'Pending').length,
      approved: reservations.filter(r => r.status === 'Approved').length,
      active: reservations.filter(r => r.status === 'Active').length,
      completed: reservations.filter(r => r.status === 'Completed').length,
      cancelled: reservations.filter(r => r.status === 'Cancelled' || r.status === 'Rejected' || r.status === 'Auto-Cancelled').length,
    };
  }, [reservations]);

  const totalReservations = reservations.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Reservations</p>
          <p className="text-3xl font-bold text-gray-900">{totalReservations}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Pending</p>
          <p className="text-3xl font-bold text-yellow-600">{statusBreakdown.pending}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Approved</p>
          <p className="text-3xl font-bold text-blue-600">{statusBreakdown.approved}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Active Now</p>
          <p className="text-3xl font-bold text-[#991b1b]">{statusBreakdown.active}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Completed</p>
          <p className="text-3xl font-bold text-emerald-600">{statusBreakdown.completed}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Cancelled/Rejected</p>
          <p className="text-3xl font-bold text-red-600">{statusBreakdown.cancelled}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Campus Utilization</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-gray-700">Makati</span>
                <span className="font-bold text-gray-900">{campusMetrics.Makati.percent}% ({campusMetrics.Makati.count} active)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="bg-[#991b1b] h-2.5 rounded-full" style={{ width: `${campusMetrics.Makati.percent}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-gray-700">Intramuros</span>
                <span className="font-bold text-gray-900">{campusMetrics.Intramuros.percent}% ({campusMetrics.Intramuros.count} active)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="bg-[#991b1b] h-2.5 rounded-full" style={{ width: `${campusMetrics.Intramuros.percent}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Reservation Status Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div> Pending
              </span>
              <span className="font-bold text-gray-900">{statusBreakdown.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div> Approved
              </span>
              <span className="font-bold text-gray-900">{statusBreakdown.approved}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <div className="w-3 h-3 rounded-full bg-[#991b1b]"></div> Active
              </span>
              <span className="font-bold text-gray-900">{statusBreakdown.active}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div> Completed
              </span>
              <span className="font-bold text-gray-900">{statusBreakdown.completed}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <div className="w-3 h-3 rounded-full bg-red-400"></div> Cancelled/Rejected
              </span>
              <span className="font-bold text-gray-900">{statusBreakdown.cancelled}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- ConfigurationsView Component ---
interface ConfigProps {
  newRoom: { name: string; campus: 'Makati' | 'Intramuros'; capacity: string };
  setNewRoom: (r: { name: string; campus: 'Makati' | 'Intramuros'; capacity: string }) => void;
  configCampusTab: 'Makati' | 'Intramuros';
  setConfigCampusTab: (c: 'Makati' | 'Intramuros') => void;
  filteredRegistryView: RoomRow[];
  handleAddRoom: (e: React.FormEvent) => void;
  handleStatusToggle: (roomId: string, status: 'Active' | 'Maintenance') => void;
  totalRoomsCount: number;
}

function ConfigurationsView({
  newRoom,
  setNewRoom,
  configCampusTab,
  setConfigCampusTab,
  filteredRegistryView,
  handleAddRoom,
  handleStatusToggle,
  totalRoomsCount,
}: ConfigProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Rooms</p>
        <p className="text-3xl font-bold text-gray-900">{totalRoomsCount}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Room</h3>
        <form onSubmit={handleAddRoom} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Room Name</label>
            <input 
              type="text" 
              value={newRoom.name} 
              onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} 
              placeholder="e.g. Discussion Room A" 
              className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm font-medium outline-none focus:border-[#991b1b] mt-1" 
              required 
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Campus</label>
            <select 
              value={newRoom.campus} 
              onChange={e => setNewRoom({ ...newRoom, campus: e.target.value as 'Makati' | 'Intramuros' })} 
              className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm font-medium outline-none focus:border-[#991b1b] mt-1 cursor-pointer"
            >
              <option value="Makati">Makati</option>
              <option value="Intramuros">Intramuros</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Capacity</label>
            <input 
              type="number" 
              value={newRoom.capacity} 
              onChange={e => setNewRoom({ ...newRoom, capacity: e.target.value })} 
              placeholder="e.g. 4" 
              className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm font-medium outline-none focus:border-[#991b1b] mt-1" 
              min="1" 
              required 
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full bg-[#991b1b] text-white py-2.5 rounded-lg text-sm font-bold hover:bg-[#7f1d1d] transition-colors">
              Add Room
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex border-b border-gray-200">
          <button 
            onClick={() => setConfigCampusTab('Makati')} 
            className={`flex-1 py-3 text-sm font-bold transition-colors ${configCampusTab === 'Makati' ? 'bg-gray-50 text-[#991b1b] border-b-2 border-[#991b1b]' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Makati
          </button>
          <button 
            onClick={() => setConfigCampusTab('Intramuros')} 
            className={`flex-1 py-3 text-sm font-bold transition-colors ${configCampusTab === 'Intramuros' ? 'bg-gray-50 text-[#991b1b] border-b-2 border-[#991b1b]' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Intramuros
          </button>
        </div>
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          <div className="col-span-4">Room Name</div>
          <div className="col-span-2">Capacity</div>
          <div className="col-span-3">Status</div>
          <div className="col-span-3">Action</div>
        </div>
        {filteredRegistryView.length === 0 ? (
          <div className="p-8 text-center text-gray-500 font-medium">No rooms configured for {configCampusTab}.</div>
        ) : (
          filteredRegistryView.map(room => (
            <div key={room.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center hover:bg-gray-50 transition-colors">
              <div className="col-span-4 font-bold text-sm text-gray-900">{room.name}</div>
              <div className="col-span-2 text-sm text-gray-600">{room.capacity}</div>
              <div className="col-span-3">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${room.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                  {room.status}
                </span>
              </div>
              <div className="col-span-3">
                <button
                  onClick={() => handleStatusToggle(room.id, room.status === 'Active' ? 'Maintenance' : 'Active')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${room.status === 'Active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                >
                  {room.status === 'Active' ? 'Set Maintenance' : 'Set Active'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default StaffDashboard;
