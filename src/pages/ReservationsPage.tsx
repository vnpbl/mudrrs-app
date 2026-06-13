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
    status: "Active",
    date: "Today, Jun 13, 2026",
    time: "07:00 PM - 09:00 PM",
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
  const [currentTab, setCurrentTab] = useState<'upcoming' | 'history'>('upcoming');

  // Modal States
  const [cancelModalRes, setCancelModalRes] = useState<Reservation | null>(null);
  const [detailsModalRes, setDetailsModalRes] = useState<Reservation | null>(null);

  // --- Derived Data ---
  const filteredReservations = useMemo(() => {
    return reservations.filter(res => {
      if (currentTab === 'upcoming') {
        return res.status === 'Upcoming' || res.status === 'Active';
      } else {
        return res.status === 'Completed' || res.status === 'Cancelled';
      }
    });
  }, [reservations, currentTab]);

  // --- Handlers ---
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
      case 'Upcoming': return 'bg-blue-50 text-blue-400 border-blue-200';
      case 'Completed': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'Cancelled': return 'bg-red-50 text-red-600 border-red-200 opacity-80';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] font-sans text-gray-900 antialiased pb-12">
      
      {/* --- Navigation Bar - Exactly matches Homepage.tsx layout --- */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#991b1b] rounded-md"></div>
            <span className="font-bold text-xl tracking-tight text-gray-900">MUDRRS</span>
          </div>

          <div className="hidden md:flex gap-8">
            <Link to="/" className="text-gray-500 hover:text-gray-900 font-semibold text-sm py-5 border-b-2 border-transparent transition-colors">Home</Link>
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
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
          </div>
        </div>
        
        {isMobileMenuOpen && (
          <div className="md:hidden flex flex-col bg-white border-t border-gray-200 px-6 py-2 shadow-lg absolute w-full left-0">
            <Link to="/" className="text-gray-600 font-semibold py-4 border-b border-gray-100">Home</Link>
            <Link to="/book" className="text-gray-600 font-semibold py-4 border-b border-gray-100">Book a Room</Link>
            <Link to="/reservations" className="text-[#991b1b] font-bold py-4 border-b border-gray-100">My Reservations</Link>
          </div>
        )}
      </nav>

      {/* --- Main Content --- */}
      <main className="w-full max-w-4xl mx-auto px-6 py-10 flex-grow">
        
        {/* Header - Centered to match image reference */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">My Reservations</h1>
          <p className="text-gray-500 font-medium text-sm">View, manage, and track your library discussion room bookings.</p>
        </div>

        {/* Segmented Tabs - Centered */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setCurrentTab('upcoming')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${currentTab === 'upcoming' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Upcoming & Active
            </button>
            <button 
              onClick={() => setCurrentTab('history')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${currentTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Past & Cancelled
            </button>
          </div>
        </div>

        {/* Feed */}
        <div className="flex flex-col gap-6">
          {filteredReservations.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-xl">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"></path></svg>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No {currentTab === 'upcoming' ? 'Upcoming' : 'Past'} Reservations</h3>
              <p className="text-gray-500 font-medium mb-6">You don't have any bookings that match this category.</p>
              <Link to="/book" className="inline-flex bg-[#991b1b] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#7f1d1d] shadow-sm transition-colors">Book a Room</Link>
            </div>
          ) : (
            filteredReservations.map(res => (
              <div key={res.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-5">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{res.roomName}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
                      <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> {res.campus} Campus</span>
                      <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg> {res.groupSize} Students</span>
                      <span className="text-gray-400 font-semibold tracking-wide uppercase">ID: {res.id}</span>
                    </div>
                  </div>
                  <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border self-start ${getStatusBadgeStyle(res.status)}`}>
                    {res.status}
                  </span>
                </div>

                {/* Card Body - Grid with internal dividers */}
                <div className="border-t border-gray-100 pt-5 pb-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Reserved Date</span>
                      <span className="flex items-center gap-2 text-sm font-bold text-gray-900"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> {res.date}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Time Window</span>
                      <span className="flex items-center gap-2 text-sm font-bold text-gray-900"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> {res.time}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Activity Type</span>
                      <span className="text-sm font-semibold text-gray-700">{res.activity}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions - Specific footer style matching image */}
                <div className="flex justify-end items-center gap-5 border-t border-gray-100 pt-5">
                  {res.status === 'Upcoming' && (
                    <button onClick={() => setCancelModalRes(res)} className="text-[#991b1b] text-sm font-bold hover:underline transition-all">
                      Cancel Booking
                    </button>
                  )}
                  <button onClick={() => setDetailsModalRes(res)} className="px-5 py-2.5 text-sm font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-lg shadow-sm transition-all">
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* --- Cancel Confirmation Modal --- */}
      {cancelModalRes && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Cancel Reservation?</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 font-medium leading-relaxed mb-6">
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
              <button onClick={handleConfirmCancel} className="px-6 py-2.5 text-sm font-bold bg-[#991b1b] text-white rounded-lg shadow-sm hover:bg-[#7f1d1d] hover:shadow-md transition-all">Yes, Cancel It</button>
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
                    detailsModalRes.status === 'Upcoming' ? 'text-blue-600' :
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
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
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