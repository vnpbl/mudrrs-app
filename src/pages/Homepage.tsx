import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchStudentReservations } from '../supabase/reservationService';
import { subscribeToUserReservations } from '../supabase/realtimeService';

type NotificationType = 'alert' | 'info' | 'success';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
}

const SYSTEM_NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'alert', title: 'Strict 15-Minute Rule', message: 'Reminder: The 15-minute grace period for check-ins is strictly enforced. Late arrivals will be auto-cancelled.', time: 'Just now' },
  { id: 'n2', type: 'info', title: 'Finals Week Hours Extended', message: 'Makati and Intramuros libraries will operate 24/7 starting next Monday. Bookings are limited to 3 hours max.', time: '2 hours ago' },
  { id: 'n3', type: 'success', title: 'System Update Complete', message: 'MUDRRS V1.0 is now live. All reported UI bugs on mobile devices have been resolved.', time: '1 day ago' },
];

function getStatusLabel(status: string): 'active' | 'pending' | 'upcoming' {
  switch (status) {
    case 'Active': return 'active';
    case 'Pending': return 'pending';
    default: return 'upcoming';
  }
}

export default function Homepage() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>(SYSTEM_NOTIFICATIONS);
  const [isClearing, setIsClearing] = useState(false);

  const userName = profile?.profile
    ? 'first_name' in profile.profile
      ? `${profile.profile.first_name} ${profile.profile.last_name}`
      : profile.user.email
    : 'User';

  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const now = new Date();
  const [calendarDate, setCalendarDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));

  const loadBookings = useCallback(async () => {
    if (!profile) return;
    setIsLoading(true);
    const { reservations, error } = await fetchStudentReservations(profile.user.id);
    if (!error) {
      setBookings(reservations);
    }
    setIsLoading(false);
  }, [profile]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    if (!profile) return;
    const unsubscribe = subscribeToUserReservations(profile.user.id, (updatedReservation) => {
      setBookings((prev: any[]) => {
        const exists = prev.find((r: any) => r.id === updatedReservation.id);
        if (exists) {
          return prev.map((r: any) => (r.id === updatedReservation.id ? { ...r, ...updatedReservation } : r));
        }
        return [updatedReservation, ...prev];
      });
    });
    return () => unsubscribe();
  }, [profile]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const monthName = calendarDate.toLocaleString('default', { month: 'long' });

  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const formatDateString = (y: number, m: number, d: number) => {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const todayString = formatDateString(now.getFullYear(), now.getMonth(), now.getDate());

  const handlePrevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCalendarDate(new Date(year, month + 1, 1));

  const handleClearNotifications = () => {
    setIsClearing(true);
    setTimeout(() => {
      setNotifications([]);
      setIsClearing(false);
    }, 300);
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Active':
        return { cardBorder: 'border-l-4 border-l-[#991b1b]', badge: 'bg-red-50 text-[#991b1b] border border-red-200', dotColor: 'bg-[#991b1b]' };
      case 'Pending':
        return { cardBorder: 'border-l-4 border-l-yellow-500', badge: 'bg-yellow-50 text-yellow-700 border border-yellow-200', dotColor: 'bg-yellow-500' };
      default:
        return { cardBorder: 'border border-gray-200', badge: 'bg-gray-50 text-gray-600 border border-gray-200', dotColor: 'bg-gray-400' };
    }
  };

  const formatTime = (start: string, end: string) => {
    const fmt = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
    };
    return `${fmt(start)} - ${fmt(end)}`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date(todayString + 'T00:00:00');
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const filteredBookings = bookings.filter((booking: any) => {
    const matchesDate = selectedDate ? booking.date === selectedDate : true;
    const matchesStatus = statusFilter === 'all' ? true : getStatusLabel(booking.status) === statusFilter;
    return matchesDate && matchesStatus;
  });

  const upcomingCount = bookings.filter((b: any) => b.status === 'Pending' || b.status === 'Active').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-gray-900 font-sans antialiased">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#991b1b] rounded-md"></div>
            <span className="font-bold text-xl tracking-tight text-gray-900">MUDRRS</span>
          </div>
          <div className="hidden md:flex gap-8">
            <Link to="/dashboard" className="text-[#991b1b] font-bold text-sm py-5 border-b-2 border-[#991b1b] transition-colors">Home</Link>
            <Link to="/book" className="text-gray-500 hover:text-gray-900 font-semibold text-sm py-5 border-b-2 border-transparent transition-colors">Book a Room</Link>
            <Link to="/reservations" className="text-gray-500 hover:text-gray-900 font-semibold text-sm py-5 border-b-2 border-transparent transition-colors">My Reservations</Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 p-1 pr-4 bg-gray-50 rounded-full border border-gray-200">
              <div className="w-8 h-8 rounded-full bg-[#ffc000] text-gray-900 flex justify-center items-center font-bold text-xs">{initials}</div>
              <span className="text-sm font-semibold text-gray-700">{userName}</span>
            </div>
            <button onClick={handleLogout} className="hidden md:flex text-xs font-bold text-gray-500 hover:text-[#991b1b] transition-colors">Sign Out</button>
            <button className="md:hidden text-gray-600 hover:text-gray-900 p-1" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div className="md:hidden flex flex-col bg-white border-t border-gray-200 px-6 py-2 shadow-lg absolute w-full left-0">
            <Link to="/dashboard" className="text-[#991b1b] font-bold py-4 border-b border-gray-100">Home</Link>
            <Link to="/book" className="text-gray-600 font-semibold py-4 border-b border-gray-100">Book a Room</Link>
            <Link to="/reservations" className="text-gray-600 font-semibold py-4 border-b border-gray-100">My Reservations</Link>
            <button onClick={handleLogout} className="text-left text-gray-600 font-semibold py-4">Sign Out</button>
          </div>
        )}
      </nav>
      <main className="w-full max-w-7xl mx-auto px-6 py-8 flex-grow">
        <section className="relative overflow-hidden bg-gradient-to-br from-[#991b1b] to-[#7f1d1d] rounded-2xl p-6 md:p-10 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div className="absolute -top-1/2 -right-10 w-72 h-72 bg-[#ffc000] rounded-full opacity-10 pointer-events-none blur-3xl"></div>
          <div className="z-10">
            <h1 className="text-3xl font-bold mb-2 tracking-tight">Welcome back, {userName.split(' ')[0]}!</h1>
            <p className="text-red-100 text-sm md:text-base font-medium">You have <strong className="text-white underline decoration-[#ffc000] decoration-2">{upcomingCount}</strong> upcoming and active reservations. Need another study session?</p>
          </div>
          <Link to="/book" className="z-10 shrink-0 bg-white text-[#991b1b] px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-50 hover:shadow-lg transition-all active:scale-[0.98]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
            <span>Book New Room</span>
          </Link>
        </section>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-1">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">{selectedDate ? `Bookings for ${selectedDate}` : 'Your Bookings'}</h2>
              <div className="flex gap-2">
                {['all', 'active', 'pending', 'upcoming'].map((status) => (
                  <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${statusFilter === status ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{status}</button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3.5">
              {isLoading ? (
                <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-xl">
                  <div className="w-8 h-8 border-4 border-[#991b1b] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500 font-medium">Loading your bookings...</p>
                </div>
              ) : filteredBookings.length > 0 ? (
                filteredBookings.map((booking: any) => {
                  const styles = getStatusStyles(booking.status);
                  return (
                    <div key={booking.id} className={`bg-white border border-gray-200/80 rounded-xl p-5 flex flex-col md:grid md:grid-cols-[1.2fr_2fr_auto] gap-4 md:items-center hover:border-gray-300 hover:shadow-sm transition-all ${styles.cardBorder}`}>
                      <div className="flex md:flex-col justify-between border-b md:border-none border-gray-100 pb-2 md:pb-0">
                        <span className="font-bold text-gray-900 text-sm">{formatDate(booking.date)}</span>
                        <span className="text-gray-500 text-xs font-semibold">{formatTime(booking.start_time, booking.end_time)}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm mb-0.5">{booking.room?.name || 'Unknown Room'}</h3>
                        <p className="text-gray-500 text-xs font-medium">{booking.room?.campus || ''} &bull; Capacity: {booking.room?.capacity || 0}</p>
                      </div>
                      <div className="flex items-center md:justify-end gap-3">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles.badge}`}>{booking.status}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-xl">
                  <p className="text-gray-500 font-medium">No bookings found for this selection.</p>
                  <button onClick={() => { setSelectedDate(null); setStatusFilter('all'); }} className="text-[#991b1b] text-sm font-bold mt-2 hover:underline">Clear filters</button>
                </div>
              )}
            </div>
          </div>
          <aside className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-gray-900 tracking-tight">{monthName} {year}</h3>
                  {selectedDate && <button onClick={() => setSelectedDate(null)} className="text-[10px] font-bold bg-red-50 text-[#991b1b] border border-red-100 px-1.5 py-0.5 rounded hover:bg-red-100 transition-colors">Clear</button>}
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
                {paddingDays.map(pad => <div key={`pad-${pad}`} className="col-span-1"></div>)}
                {monthDays.map(day => {
                  const dayString = formatDateString(year, month, day);
                  const dayBookings = bookings.filter((b: any) => b.date === dayString);
                  const isToday = dayString === todayString;
                  const isSelected = selectedDate === dayString;
                  return (
                    <div key={day} className="flex flex-col items-center justify-center relative py-1">
                      <button onClick={() => setSelectedDate(isSelected ? null : dayString)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all relative ${isSelected ? 'bg-gray-900 text-white shadow-md' : isToday ? 'bg-[#991b1b] text-white shadow-md shadow-[#991b1b]/20 font-bold' : 'text-gray-700 hover:bg-gray-100'}`}>{day}</button>
                      {dayBookings.length > 0 && (
                        <div className="flex justify-center gap-0.5 mt-1 absolute bottom-0">
                          {dayBookings.map((b: any) => <span key={b.id} className={`w-1 h-1 rounded-full ${isToday && !isSelected ? 'bg-[#ffc000]' : getStatusStyles(b.status).dotColor}`} title={`${b.room?.name} (${b.status})`} />)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-3.5">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold text-gray-900 tracking-tight">System Notifications</h2>
                {notifications.length > 0 && <button onClick={handleClearNotifications} className="text-gray-500 hover:text-[#991b1b] text-xs font-bold transition-colors">Clear All</button>}
              </div>
              <div className={`flex flex-col gap-3.5 transition-opacity duration-300 ${isClearing ? 'opacity-0' : 'opacity-100'}`}>
                {notifications.length > 0 ? notifications.map((notif) => (
                  <div key={notif.id} className="bg-white border border-gray-200 rounded-xl p-5 flex gap-4 shadow-sm hover:border-gray-300 transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex justify-center items-center shrink-0 ${notif.type === 'alert' ? 'bg-red-50 text-[#991b1b]' : notif.type === 'info' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
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
                )) : (
                  <div className="text-center p-8 text-gray-400 text-xs font-semibold bg-white border border-dashed border-gray-200 rounded-xl">You're all caught up! No active notices.</div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}