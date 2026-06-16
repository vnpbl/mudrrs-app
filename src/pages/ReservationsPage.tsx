import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

// --- Types ---
type ResStatus = 'Upcoming' | 'Active' | 'Completed' | 'Cancelled';

interface Reservation {
  id: string;
  roomName: string;
  campus: string;
  status: ResStatus;
  date: string;
  time: string;
  duration: string;
  activity: string;
  equipment: string[];
  members: string[];
  groupSize: number;
}

// --- Mock Data ---
const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: "RES-101",
    roomName: "Discussion Room A",
    campus: "Makati",
    status: "Upcoming",
    date: "Jun 15, 2026",
    time: "10:00 AM - 11:30 AM",
    duration: "1.5 Hours",
    activity: "Group Study / Review",
    equipment: ["Whiteboard Marker", "Extension Cord"],
    members: ["Juan Dela Cruz (You)", "Sofia Mendoza", "Miguel Santos"],
    groupSize: 3
  },
  {
    id: "RES-102",
    roomName: "Study Pod 3",
    campus: "Intramuros",
    status: "Upcoming",
    date: "Jun 14, 2026",
    time: "05:30 PM - 07:30 PM", // Example: 5:30 PM reservation
    duration: "2 Hours",
    activity: "Thesis / Capstone Defense",
    equipment: [],
    members: ["Juan Dela Cruz (You)", "Chloe Cruz"],
    groupSize: 2
  },
  {
    id: "RES-103",
    roomName: "Multimedia Lab",
    campus: "Makati",
    status: "Completed",
    date: "Jun 10, 2026",
    time: "01:00 PM - 02:00 PM",
    duration: "1 Hour",
    activity: "Project Meeting",
    equipment: ["Projector Remote", "HDMI Cable"],
    members: ["Juan Dela Cruz (You)", "Professor Reyes"],
    groupSize: 2
  },
  {
    id: "RES-104",
    roomName: "Conference Room C",
    campus: "Intramuros",
    status: "Cancelled",
    date: "Jun 05, 2026",
    time: "09:00 AM - 10:00 AM",
    duration: "1 Hour",
    activity: "Online Class / Webinar",
    equipment: [],
    members: ["Juan Dela Cruz (You)"],
    groupSize: 1
  }
];

export default function ReservationsPage() {
  // App States
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [campusFilter, setCampusFilter] = useState<string>('All');
  const [currentTab, setCurrentTab] = useState<'upcoming' | 'history'>('upcoming');

  // Modal States
  const [cancelModalRes, setCancelModalRes] = useState<Reservation | null>(null);
  const [detailsModalRes, setDetailsModalRes] = useState<Reservation | null>(null);

  // --- Derived Data & Features ---
  const processedReservations = useMemo(() => {
    return reservations.filter(res => {
      // 1. Tab / Status Filter
      const matchesTab = currentTab === 'upcoming' 
        ? (res.status === 'Upcoming' || res.status === 'Active')
        : (res.status === 'Completed' || res.status === 'Cancelled');
      
      // 2. Search Filter
      const matchesSearch = res.roomName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            res.id.toLowerCase().includes(searchQuery.toLowerCase());

      // 3. Campus Filter
      const matchesCampus = campusFilter === 'All' ? true : res.campus === campusFilter;

      return matchesTab && matchesSearch && matchesCampus;
    });
  }, [reservations, currentTab, searchQuery, campusFilter]);

  const stats = useMemo(() => {
    return {
      active: reservations.filter(r => r.status === 'Active').length,
      upcoming: reservations.filter(r => r.status === 'Upcoming').length,
      completed: reservations.filter(r => r.status === 'Completed').length,
    };
  }, [reservations]);

  // --- Handlers & Logic ---

  // Checks if current time is strictly before the reservation start time
  const isCancelable = (dateStr: string, timeWindow: string) => {
    try {
      const cleanDate = dateStr.replace('Today, ', '').trim(); // Remove "Today, " if it exists
      const startTimeStr = timeWindow.split(' - ')[0]; // Gets "05:30 PM"
      const reservationStartDateTime = new Date(`${cleanDate} ${startTimeStr}`);
      const currentTime = new Date();
      
      return currentTime < reservationStartDateTime;
    } catch (e) {
      return false; // Fallback 
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCampusFilter('All');
  };

  const handleConfirmCancel = () => {
    if (!cancelModalRes) return;
    setReservations(prev => prev.map(r => 
      r.id === cancelModalRes.id ? { ...r, status: 'Cancelled' } : r
    ));
    alert('Reservation cancelled successfully.');
    setCancelModalRes(null);
    setCurrentTab('history'); 
  };

  const getStatusBadgeStyle = (status: ResStatus) => {
    switch (status) {
      case 'Active': return 'bg-red-50 text-[#991b1b] border-red-200';
      case 'Upcoming': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Completed': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'Cancelled': return 'bg-red-50 text-red-600 border-red-200 opacity-80';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-gray-900 font-sans antialiased pb-12">
      
      {/* --- Navigation Bar - Matches BookingPage exactly --- */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#991b1b] rounded-md"></div>
            <span className="font-bold text-xl tracking-tight text-gray-900">MUDRRS</span>
          </div>

          <div className="hidden md:flex gap-8">
            <Link to="/dashboard" className="text-gray-500 hover:text-gray-900 font-semibold text-sm py-5 border-b-2 border-transparent transition-colors">Home</Link>
            <Link to="/book" className="text-gray-500 hover:text-gray-900 font-semibold text-sm py-5 border-b-2 border-transparent transition-colors">Book a Room</Link>
            <Link to="/reservations" className="text-[#991b1b] font-bold text-sm py-5 border-b-2 border-[#991b1b] transition-colors">My Reservations</Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 p-1 pr-4 bg-gray-50 rounded-full border border-gray-200">
              <div className="w-8 h-8 rounded-full bg-[#ffc000] text-gray-900 flex justify-center items-center font-bold text-xs">JB</div>
              <span className="text-sm font-semibold text-gray-700">Juan Dela Cruz</span>
            </div>
            <button 
              className="md:hidden text-gray-600 hover:text-gray-900 p-1"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden flex flex-col bg-white border-t border-gray-200 px-6 py-2 shadow-lg absolute w-full left-0">
            <Link to="/dashboard" className="text-gray-600 font-semibold py-4 border-b border-gray-100">Home</Link>
            <Link to="/book" className="text-gray-600 font-semibold py-4 border-b border-gray-100">Book a Room</Link>
            <Link to="/reservations" className="text-[#991b1b] font-bold py-4 border-b border-gray-100">My Reservations</Link>
          </div>
        )}
      </nav>

      {/* --- Main Content - max-w-7xl alignment --- */}
      <main className="w-full max-w-7xl mx-auto px-6 py-8 flex-grow">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">My Reservations</h1>
          <p className="text-gray-500 font-medium">View, manage, and track your library discussion room bookings.</p>
        </div>

        {/* Top Filter Bar - Search and Campus Only */}
        <div className="bg-white border border-gray-200/80 rounded-xl flex flex-col md:flex-row mb-8 shadow-sm">
          <div className="flex-1 flex flex-col p-4 md:px-6 md:py-4 border-b md:border-b-0 md:border-r border-gray-200/80 relative">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Search ID or Room</label>
            <input 
              type="text" 
              placeholder="e.g. RES-101 or Lab" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder-gray-400" 
            />
          </div>
          <div className="flex-1 flex flex-col p-4 md:px-6 md:py-4 md:border-r border-gray-200/80">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Campus Location</label>
            <select value={campusFilter} onChange={(e) => setCampusFilter(e.target.value)} className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none cursor-pointer">
              <option value="All">All Campuses</option>
              <option value="Makati">Makati</option>
              <option value="Intramuros">Intramuros</option>
            </select>
          </div>
          <button onClick={handleClearFilters} className="flex items-center justify-center gap-2 p-4 md:px-8 bg-gray-50 hover:bg-gray-100 text-[#991b1b] text-sm font-bold transition-colors rounded-b-xl md:rounded-r-xl md:rounded-bl-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            Clear Filters
          </button>
        </div>

        {/* Dashboard Grid - lg:grid-cols-[1.5fr_1fr] exact match */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 items-start">
          
          {/* Left Column: Feed List */}
          <div className="flex flex-col gap-4">
            
            {/* List Header with Homepage Style Pills */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-1">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                {currentTab === 'upcoming' ? 'Upcoming & Active' : 'Past & Cancelled'}
              </h2>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentTab('upcoming')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    currentTab === 'upcoming' 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Upcoming & Active
                </button>
                <button
                  onClick={() => setCurrentTab('history')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    currentTab === 'history' 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Past & Cancelled
                </button>
              </div>
            </div>

            {/* Render Cards */}
            {processedReservations.length === 0 ? (
              <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-xl">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"></path></svg>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Reservations Found</h3>
                <p className="text-gray-500 font-medium mb-6">Try adjusting your search or filters.</p>
                <Link to="/book" className="inline-flex bg-[#991b1b] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#7f1d1d] shadow-sm transition-colors">Book a New Room</Link>
              </div>
            ) : (
              processedReservations.map(res => {
                // Modified: Only render Cancel button if strictly 'Upcoming'
                const canCancel = res.status === 'Upcoming' && isCancelable(res.date, res.time);

                return (
                  <div key={res.id} className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm hover:border-gray-300 hover:shadow-sm transition-all">
                    
                    {/* Card Header */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-4 border-b border-gray-100 pb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1.5">{res.roomName}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
                          <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> {res.campus} Campus</span>
                          <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg> {res.groupSize} Students</span>
                          <span className="text-gray-400 font-semibold tracking-wide uppercase">ID: {res.id}</span>
                        </div>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border self-start ${getStatusBadgeStyle(res.status)}`}>
                        {res.status}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-5">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Reserved Date</span>
                        <span className="flex items-center gap-2 text-sm font-bold text-gray-900"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> {res.date}</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Time Window</span>
                        <span className="flex items-center gap-2 text-sm font-bold text-gray-900"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> {res.time}</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Activity Type</span>
                        <span className="text-sm font-semibold text-gray-700">{res.activity}</span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex justify-end items-center gap-3 border-t border-gray-100 pt-4">
                      {canCancel && (
                        <button onClick={() => setCancelModalRes(res)} className="px-4 py-2 text-[#991b1b] text-xs font-bold hover:bg-red-50 rounded-lg transition-all">
                          Cancel Booking
                        </button>
                      )}
                      <button onClick={() => setDetailsModalRes(res)} className="px-5 py-2 text-xs font-bold bg-white border border-gray-200/80 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-lg shadow-sm transition-all">
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Features Sidebar (Sticky) */}
          <aside className="space-y-6 sticky top-24">

            {/* Statistics Feature */}
            <div className="bg-white border border-gray-200/80 rounded-xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 tracking-tight mb-4">Booking Overview</h2>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#991b1b]"></div> Active Now
                  </span>
                  <span className="font-bold text-gray-900">{stats.active}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> Upcoming
                  </span>
                  <span className="font-bold text-gray-900">{stats.upcoming}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div> Completed
                  </span>
                  <span className="font-bold text-gray-900">{stats.completed}</span>
                </div>
              </div>
            </div>

            {/* Quick Rules Feature */}
            <div className="bg-red-50 border border-red-100 rounded-xl p-5 flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-[#991b1b] flex justify-center items-center shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-1">15-Minute Rule</h4>
                <p className="text-xs font-medium text-gray-600 leading-relaxed">Bookings are automatically cancelled if you do not check-in at the library desk within 15 minutes of your start time.</p>
              </div>
            </div>

            {/* Support Box */}
            <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-5">
              <h4 className="text-sm font-bold text-gray-900 mb-1">Need Help?</h4>
              <p className="text-xs font-medium text-gray-600 leading-relaxed">Visit the library desk or email <a href="#" className="text-[#991b1b] hover:underline">support@mapua.edu.ph</a>.</p>
            </div>

          </aside>
        </div>
      </main>

      {/* --- Cancel Confirmation Modal --- */}
      {cancelModalRes && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Cancel Reservation?</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 font-medium leading-relaxed mb-5">
                Are you sure you want to cancel your reservation for <strong className="text-gray-900 font-bold">{cancelModalRes.roomName}</strong> on <strong className="text-gray-900 font-bold">{cancelModalRes.date}</strong>? 
              </p>
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-[#991b1b] flex justify-center items-center shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Action Cannot Be Undone</h4>
                  <p className="text-xs font-medium text-gray-600 leading-relaxed">If you cancel this booking, the time slot will be immediately released to other Mapúa students.</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setCancelModalRes(null)} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Keep Booking</button>
              <button onClick={handleConfirmCancel} className="px-6 py-2.5 text-sm font-bold bg-[#991b1b] text-white rounded-lg shadow-sm hover:bg-[#7f1d1d] hover:shadow-md transition-all active:scale-[0.98]">Yes, Cancel It</button>
            </div>
          </div>
        </div>
      )}

      {/* --- View Details Modal --- */}
      {detailsModalRes && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Reservation Details</h2>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Status</span>
                  <strong className={`font-bold uppercase text-[10px] tracking-wider ${
                    detailsModalRes.status === 'Upcoming' ? 'text-blue-700' :
                    detailsModalRes.status === 'Active' ? 'text-[#991b1b]' :
                    detailsModalRes.status === 'Cancelled' ? 'text-red-600' : 'text-gray-600'
                  }`}>{detailsModalRes.status}</strong>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-gray-200/60 pt-3">
                  <span className="text-gray-500 font-medium">Reservation ID</span>
                  <strong className="text-gray-900 font-bold">{detailsModalRes.id}</strong>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-gray-200/60 pt-3">
                  <span className="text-gray-500 font-medium">Space</span>
                  <strong className="text-gray-900 font-bold">{detailsModalRes.roomName}</strong>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-gray-200/60 pt-3">
                  <span className="text-gray-500 font-medium">Location</span>
                  <strong className="text-gray-900 font-bold">{detailsModalRes.campus} Campus</strong>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-gray-200/60 pt-3">
                  <span className="text-gray-500 font-medium">Date</span>
                  <strong className="text-gray-900 font-bold">{detailsModalRes.date}</strong>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-gray-200/60 pt-3">
                  <span className="text-gray-500 font-medium">Time Window</span>
                  <strong className="text-[#991b1b] font-bold">{detailsModalRes.time}</strong>
                </div>
                <div className="flex justify-between items-start text-sm border-t border-gray-200/60 pt-3">
                  <span className="text-gray-500 font-medium">Activity</span>
                  <strong className="text-gray-900 font-semibold text-right max-w-[60%]">{detailsModalRes.activity}</strong>
                </div>
                <div className="flex justify-between items-start text-sm border-t border-gray-200/60 pt-3">
                  <span className="text-gray-500 font-medium">Equipment</span>
                  <strong className="text-gray-900 font-semibold text-right max-w-[60%]">
                    {detailsModalRes.equipment.length > 0 ? detailsModalRes.equipment.join(', ') : 'None Requested'}
                  </strong>
                </div>
                <div className="flex flex-col gap-2 text-sm border-t border-gray-200/60 pt-4 mt-1">
                  <span className="text-gray-500 font-bold tracking-tight">Group Members ({detailsModalRes.groupSize} Total)</span>
                  <div className="bg-white border border-gray-200/80 rounded-lg p-3">
                    {detailsModalRes.members.length > 0 ? (
                      <ul className="list-disc list-inside text-gray-900 font-bold text-xs leading-relaxed marker:text-gray-300 ml-1">
                        {detailsModalRes.members.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    ) : (
                      <span className="text-gray-500 font-medium text-xs">No additional members</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-center">
              <button onClick={() => setDetailsModalRes(null)} className="w-full px-6 py-3 text-sm font-bold bg-[#991b1b] text-white rounded-lg shadow-sm hover:bg-[#7f1d1d] hover:shadow-md transition-all active:scale-[0.98]">
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}