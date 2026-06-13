import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// --- Types ---
type BookingStatus = 'active' | 'pending' | 'upcoming';
type NotificationType = 'alert' | 'info' | 'success';

interface Booking {
  id: string;
  date: string;
  displayDate: string;
  time: string;
  room: string;
  location: string;
  capacity: number;
  status: BookingStatus;
}

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
}

// --- Mock Data ---
const MOCK_BOOKINGS: Booking[] = [
  { id: '1', date: '2026-06-13', displayDate: 'Today', time: '2:00 PM - 4:00 PM', room: 'Discussion Room A', location: 'Makati Campus', capacity: 4, status: 'active' },
  { id: '2', date: '2026-06-14', displayDate: 'Tomorrow', time: '10:00 AM - 11:30 AM', room: 'Study Pod 3', location: 'Intramuros Campus', capacity: 2, status: 'pending' },
  { id: '3', date: '2026-06-18', displayDate: 'Thu, Jun 18', time: '1:00 PM - 3:00 PM', room: 'Conference Room B', location: 'Makati Campus', capacity: 8, status: 'upcoming' },
  { id: '4', date: '2026-06-19', displayDate: 'Fri, Jun 19', time: '9:00 AM - 12:00 PM', room: 'Multimedia Room', location: 'Intramuros Campus', capacity: 6, status: 'upcoming' },
  { id: '5', date: '2026-06-20', displayDate: 'Sat, Jun 20', time: '3:00 PM - 5:00 PM', room: 'Discussion Room C', location: 'Makati Campus', capacity: 4, status: 'upcoming' },
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'alert', title: 'Strict 15-Minute Rule', message: 'Reminder: The 15-minute grace period for check-ins is strictly enforced. Late arrivals will be auto-cancelled.', time: 'Just now' },
  { id: 'n2', type: 'info', title: 'Finals Week Hours Extended', message: 'Makati and Intramuros libraries will operate 24/7 starting next Monday. Bookings are limited to 3 hours max.', time: '2 hours ago' },
  { id: 'n3', type: 'success', title: 'System Update Complete', message: 'MUDRRS V1.0 is now live. All reported UI bugs on mobile devices have been resolved.', time: '1 day ago' },
];

export default function Homepage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [isClearing, setIsClearing] = useState(false);
  
  // States for Features
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');

  // Dynamic Calendar State (Starts on June 2026 to match mock data)
  const [calendarDate, setCalendarDate] = useState(new Date('2026-06-13T00:00:00'));
  
  // Calendar Math
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...
  const monthName = calendarDate.toLocaleString('default', { month: 'long' });

  // Arrays for rendering the grid
  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // We hardcode "Today" as June 13, 2026 so the UI makes sense relative to your mock data
  const MOCK_TODAY = '2026-06-13';

  // Format date helper to match YYYY-MM-DD
  const formatDateString = (y: number, m: number, d: number) => {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const handlePrevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCalendarDate(new Date(year, month + 1, 1));

  const handleClearNotifications = () => {
    setIsClearing(true);
    setTimeout(() => {
      setNotifications([]);
      setIsClearing(false);
    }, 300);
  };

  const getStatusStyles = (status: BookingStatus) => {
    switch (status) {
      case 'active':
        return { cardBorder: 'border-l-4 border-l-[#991b1b]', badge: 'bg-red-50 text-[#991b1b] border border-red-200', dotColor: 'bg-[#991b1b]' };
      case 'pending':
        return { cardBorder: 'border-l-4 border-l-yellow-500', badge: 'bg-yellow-50 text-yellow-700 border border-yellow-200', dotColor: 'bg-yellow-500' };
      case 'upcoming':
        return { cardBorder: 'border border-gray-200', badge: 'bg-gray-50 text-gray-600 border border-gray-200', dotColor: 'bg-gray-400' };
      default:
        return { cardBorder: 'border border-gray-200', badge: 'bg-gray-50 text-gray-600 border border-gray-200', dotColor: 'bg-gray-400' };
    }
  };

  // Filter Logic
  const filteredBookings = MOCK_BOOKINGS.filter(booking => {
    const matchesDate = selectedDate ? booking.date === selectedDate : true;
    const matchesStatus = statusFilter === 'all' ? true : booking.status === statusFilter;
    return matchesDate && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-gray-900 font-sans antialiased">
      
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#991b1b] rounded-md"></div>
            <span className="font-bold text-xl tracking-tight text-gray-900">MUDRRS</span>
          </div>

          <div className="hidden md:flex gap-8">
            <Link to="/" className="text-[#991b1b] font-bold text-sm py-5 border-b-2 border-[#991b1b] transition-colors">Home</Link>
            <Link to="/book" className="text-gray-500 hover:text-gray-900 font-semibold text-sm py-5 border-b-2 border-transparent transition-colors">Book a Room</Link>
            <Link to="/reservations" className="text-gray-500 hover:text-gray-900 font-semibold text-sm py-5 border-b-2 border-transparent transition-colors">My Reservations</Link>
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
            <Link to="/" className="text-[#991b1b] font-bold py-4 border-b border-gray-100">Home</Link>
            <Link to="/book" className="text-gray-600 font-semibold py-4 border-b border-gray-100">Book a Room</Link>
            <Link to="/reservations" className="text-gray-600 font-semibold py-4 border-b border-gray-100">My Reservations</Link>
          </div>
        )}
      </nav>

      <main className="w-full max-w-7xl mx-auto px-6 py-8 flex-grow">
        
        {/* Banner Welcome Display */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#991b1b] to-[#7f1d1d] rounded-2xl p-6 md:p-10 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div className="absolute -top-1/2 -right-10 w-72 h-72 bg-[#ffc000] rounded-full opacity-10 pointer-events-none blur-3xl"></div>
          <div className="z-10">
            <h1 className="text-3xl font-bold mb-2 tracking-tight">Welcome back, Juan!</h1>
            <p className="text-red-100 text-sm md:text-base font-medium">
              You have <strong className="text-white underline decoration-[#ffc000] decoration-2">{MOCK_BOOKINGS.filter(b => b.status === 'upcoming').length}</strong> upcoming reservations this week. Need another study session?
            </p>
          </div>
          <button className="z-10 shrink-0 bg-white text-[#991b1b] px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-50 hover:shadow-lg transition-all active:scale-[0.98]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
            </svg>
            <span>Book New Room</span>
          </button>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Column (Left): Interactive Stream of Bookings */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-1">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                {selectedDate ? `Bookings for ${selectedDate}` : 'Weekly Bookings Summary'}
              </h2>
              
              {/* Feature: Status Filters */}
              <div className="flex gap-2">
                {['all', 'active', 'pending', 'upcoming'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status as any)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${
                      statusFilter === status 
                        ? 'bg-gray-800 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col gap-3.5">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => {
                  const styles = getStatusStyles(booking.status);
                  return (
                    <div 
                      key={booking.id} 
                      className={`bg-white border border-gray-200/80 rounded-xl p-5 flex flex-col md:grid md:grid-cols-[1.2fr_2fr_auto] gap-4 md:items-center hover:border-gray-300 hover:shadow-sm transition-all ${styles.cardBorder}`}
                    >
                      <div className="flex md:flex-col justify-between border-b md:border-none border-gray-100 pb-2 md:pb-0">
                        <span className="font-bold text-gray-900 text-sm">{booking.displayDate}</span>
                        <span className="text-gray-500 text-xs font-semibold">{booking.time}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm mb-0.5">{booking.room}</h3>
                        <p className="text-gray-500 text-xs font-medium">{booking.location} • Capacity: {booking.capacity}</p>
                      </div>
                      <div className="flex items-center md:justify-end gap-3">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles.badge}`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Feature: Empty State Handling */
                <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-xl">
                  <p className="text-gray-500 font-medium">No bookings found for this selection.</p>
                  <button 
                    onClick={() => { setSelectedDate(null); setStatusFilter('all'); }} 
                    className="text-[#991b1b] text-sm font-bold mt-2 hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            {/* Integrated Dynamic Booking Calendar Panel */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-gray-900 tracking-tight">{monthName} {year}</h3>
                  {/* Feature: Quick clear inline filter */}
                  {selectedDate && (
                    <button 
                      onClick={() => setSelectedDate(null)}
                      className="text-[10px] font-bold bg-red-50 text-[#991b1b] border border-red-100 px-1.5 py-0.5 rounded hover:bg-red-100 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button onClick={handlePrevMonth} className="text-gray-400 hover:text-gray-900 p-1 rounded hover:bg-gray-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg>
                  </button>
                  <button onClick={handleNextMonth} className="text-gray-400 hover:text-gray-900 p-1 rounded hover:bg-gray-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{day}</div>
                ))}
                
                {/* Blank space padding for the start of the month */}
                {paddingDays.map(pad => (
                  <div key={`pad-${pad}`} className="col-span-1"></div>
                ))}
                
                {/* Dynamically mapped days of the month */}
                {monthDays.map(day => {
                  const dayString = formatDateString(year, month, day);
                  const dayBookings = MOCK_BOOKINGS.filter(b => b.date === dayString);
                  const isToday = dayString === MOCK_TODAY;
                  const isSelected = selectedDate === dayString;

                  return (
                    <div key={day} className="flex flex-col items-center justify-center relative py-1">
                      <button 
                        onClick={() => setSelectedDate(isSelected ? null : dayString)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all relative ${
                          isSelected 
                            ? 'bg-gray-900 text-white shadow-md' 
                            : isToday 
                              ? 'bg-[#991b1b] text-white shadow-md shadow-[#991b1b]/20 font-bold' 
                              : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {day}
                      </button>

                      {dayBookings.length > 0 && (
                        <div className="flex justify-center gap-0.5 mt-1 absolute bottom-0">
                          {dayBookings.map(b => (
                            <span 
                              key={b.id} 
                              className={`w-1 h-1 rounded-full ${isToday && !isSelected ? 'bg-[#ffc000]' : getStatusStyles(b.status).dotColor}`}
                              title={`${b.room} (${b.status})`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notifications Display Section */}
            <div className="space-y-3.5">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold text-gray-900 tracking-tight">System Notifications</h2>
                {notifications.length > 0 && (
                  <button 
                    onClick={handleClearNotifications} 
                    className="text-gray-500 hover:text-[#991b1b] text-xs font-bold transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className={`flex flex-col gap-3.5 transition-opacity duration-300 ${isClearing ? 'opacity-0' : 'opacity-100'}`}>
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div key={notif.id} className="bg-white border border-gray-200 rounded-xl p-5 flex gap-4 shadow-sm hover:border-gray-300 transition-colors">
                      <div className={`w-9 h-9 rounded-xl flex justify-center items-center shrink-0 ${
                        notif.type === 'alert' ? 'bg-red-50 text-[#991b1b]' :
                        notif.type === 'info' ? 'bg-blue-50 text-blue-700' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>
                        {notif.type === 'alert' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>}
                        {notif.type === 'info' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                        {notif.type === 'success' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-1 leading-snug">{notif.title}</h4>
                        <p className="text-xs text-gray-500 mb-2 leading-relaxed">{notif.message}</p>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{notif.time}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8 text-gray-400 text-xs font-semibold bg-white border border-dashed border-gray-200 rounded-xl">
                    You're all caught up! No active notices.
                  </div>
                )}
              </div>
            </div>

          </aside>
        </div>
      </main>
    </div>
  );
}