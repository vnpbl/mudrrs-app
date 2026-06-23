import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchRooms, createRoom, updateRoom } from '../supabase/roomService';
import { fetchAllReservations, approveReservation, rejectReservation, checkInReservation, checkOutReservation } from '../supabase/reservationService';
import { subscribeToReservations, subscribeToRooms } from '../supabase/realtimeService';
import type { RoomRow, ReservationWithRoom } from '../supabase/types';

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

  // Fetch data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    const { rooms: fetchedRooms } = await fetchRooms();
    const { reservations: fetchedReservations } = await fetchAllReservations({
      date: selectedDate,
    });
    setRooms(fetchedRooms);
    setReservations(fetchedReservations);
    setIsLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time subscriptions
  useEffect(() => {
    const unsubReservations = subscribeToReservations((updatedReservation) => {
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

  const activeBookingsCount = useMemo(() => {
    return reservations.filter(r => r.status === 'Active').length;
  }, [reservations]);

  const liveUtilizationRate = useMemo(() => {
    if (rooms.length === 0) return 0;
    const activeRooms = rooms.filter(r => r.status === 'Active').length;
    return Math.round((activeRooms / rooms.length) * 100);
  }, [rooms]);

  const campusMetrics = useMemo(() => {
    const calculateForCampus = (campusName: 'Makati' | 'Intramuros') => {
      const campusRooms = rooms.filter(r => r.campus === campusName);
      if (campusRooms.length === 0) return { percent: 0, count: 0 };
      const activeCount = campusRooms.filter(r => r.status === 'Active').length;
      return {
        percent: Math.round((activeCount / campusRooms.length) * 100),
        count: activeCount,
      };
    };
    return {
      Makati: calculateForCampus('Makati'),
      Intramuros: calculateForCampus('Intramuros'),
    };
  }, [rooms]);

  // Pending requests derived from reservations
  const pendingRequests = useMemo(() => {
    return reservations.filter(r => r.status === 'Pending');
  }, [reservations]);

  const handleRequestDecision = async (id: string, action: 'Approved' | 'Rejected') => {
    if (!window.confirm(`Confirm action: ${action} this reservation?`)) return;
    
    if (action === 'Approved') {
      await approveReservation(Number(id));
    } else {
      await rejectReservation(Number(id));
    }
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
  };

  const handleCheckIn = async (reservationId: string) => {
    const { error: checkInError } = await checkInReservation(Number(reservationId));
    if (checkInError) setError(checkInError);
  };

  const handleCheckOut = async (reservationId: string) => {
    const { error: checkOutError } = await checkOutReservation(Number(reservationId));
    if (checkOutError) setError(checkOutError);
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
                reservations={reservations}
                pendingRequests={pendingRequests}
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
}

function LiveBoardView({
  reservations,
  pendingRequests,
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
}: LiveBoardProps) {
  const [activeTab, setActiveTab] = useState<'monitor' | 'requests'>('monitor');

  const fmtTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Utilization</p>
          <p className="text-3xl font-bold text-gray-900">{liveUtilizationRate}%</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('monitor')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'monitor' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          Room Monitor
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'requests' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          Pending Requests {pendingRequests.length > 0 && <span className="ml-1 bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingRequests.length}</span>}
        </button>
      </div>

      {activeTab === 'monitor' ? (
        <div>
          {/* Filters */}
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

          {/* Room Monitor */}
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
      ) : (
        <div>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-xl">
              <p className="text-gray-500 font-medium">No pending requests.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingRequests.map(req => (
                <div key={req.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{req.room?.name || 'Unknown Room'}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {fmtTime(req.start_time)} - {fmtTime(req.end_time)} | {req.date}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">ID: {req.id} | Group Size: {req.group_size}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">Pending</span>
                  </div>
                  <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                    <button onClick={() => handleRequestDecision(req.id, 'Approved')} className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors">
                      Approve
                    </button>
                    <button onClick={() => handleCheckIn(req.id)} className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors">
                      Check In
                    </button>
                    <button onClick={() => handleCheckOut(req.id)} className="px-4 py-2 bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors">
                      Check Out
                    </button>
                    <button onClick={() => handleRequestDecision(req.id, 'Rejected')} className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- AnalyticsView Component ---
interface AnalyticsProps {
  activeBookingsCount: number;
  rooms: RoomRow[];
  campusMetrics: { Makati: { percent: number; count: number }; Intramuros: { percent: number; count: number } };
  reservations: ReservationWithRoom[];
}

function AnalyticsView({ campusMetrics, reservations }: { campusMetrics: AnalyticsProps['campusMetrics']; reservations: AnalyticsProps['reservations'] }) {
  const statusBreakdown = useMemo(() => {
    return {
      pending: reservations.filter(r => r.status === 'Pending').length,
      active: reservations.filter(r => r.status === 'Active').length,
      completed: reservations.filter(r => r.status === 'Completed').length,
      cancelled: reservations.filter(r => r.status === 'Cancelled' || r.status === 'Rejected').length,
    };
  }, [reservations]);

  const totalReservations = reservations.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Reservations</p>
          <p className="text-3xl font-bold text-gray-900">{totalReservations}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Active Now</p>
          <p className="text-3xl font-bold text-[#991b1b]">{statusBreakdown.active}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Completed</p>
          <p className="text-3xl font-bold text-gray-900">{statusBreakdown.completed}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Cancelled/Rejected</p>
          <p className="text-3xl font-bold text-gray-900">{statusBreakdown.cancelled}</p>
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
                <div className="w-3 h-3 rounded-full bg-blue-500"></div> Pending
              </span>
              <span className="font-bold text-gray-900">{statusBreakdown.pending}</span>
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
            <input type="text" value={newRoom.name} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} placeholder="e.g. Discussion Room A" className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm font-medium outline-none focus:border-[#991b1b] mt-1" required />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Campus</label>
            <select value={newRoom.campus} onChange={e => setNewRoom({ ...newRoom, campus: e.target.value as 'Makati' | 'Intramuros' })} className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm font-medium outline-none focus:border-[#991b1b] mt-1 cursor-pointer">
              <option value="Makati">Makati</option>
              <option value="Intramuros">Intramuros</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Capacity</label>
            <input type="number" value={newRoom.capacity} onChange={e => setNewRoom({ ...newRoom, capacity: e.target.value })} placeholder="e.g. 4" className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm font-medium outline-none focus:border-[#991b1b] mt-1" min="1" required />
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
          <button onClick={() => setConfigCampusTab('Makati')} className={`flex-1 py-3 text-sm font-bold transition-colors ${configCampusTab === 'Makati' ? 'bg-gray-50 text-[#991b1b] border-b-2 border-[#991b1b]' : 'text-gray-500 hover:text-gray-900'}`}>Makati</button>
          <button onClick={() => setConfigCampusTab('Intramuros')} className={`flex-1 py-3 text-sm font-bold transition-colors ${configCampusTab === 'Intramuros' ? 'bg-gray-50 text-[#991b1b] border-b-2 border-[#991b1b]' : 'text-gray-500 hover:text-gray-900'}`}>Intramuros</button>
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