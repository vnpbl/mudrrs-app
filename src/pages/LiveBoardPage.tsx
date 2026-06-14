import React from 'react';
import { type BookingDatabase, type RegistryRoom, type PendingRequest } from '../types';

interface LiveBoardProps {
  bookings: BookingDatabase;
  requests: PendingRequest[];
  registry: RegistryRoom[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  campusFilter: string;
  setCampusFilter: (val: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  filteredLiveMonitorView: RegistryRoom[];
  activeBookingsCount: number;
  liveUtilizationRate: number;
  handleRequestDecision: (id: string, name: string, action: 'Approved' | 'Rejected') => void;
}

export const LiveBoardView: React.FC<LiveBoardProps> = ({
  bookings,
  requests,
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
}) => {
  return (
    <>
      <section className="welcome-banner">
        <div className="welcome-text">
          <h1>Welcome back, Operator!</h1>
          <p>The library systems are running smoothly. Here is your dashboard overview for today.</p>
          <div className="analytics-badges-row">
            <div className="analytics-mini-badge"><span className="badge-number">{activeBookingsCount}</span><span className="badge-label">Active Bookings</span></div>
            <div className="analytics-mini-badge"><span className="badge-number">{requests.length}</span><span className="badge-label">Pending Reviews</span></div>
            <div className="analytics-mini-badge"><span className="badge-number">{liveUtilizationRate}%</span><span className="badge-label">Utilization Rate</span></div>
          </div>
        </div>
        <button className="prime-action-btn" onClick={() => alert("Loading systemic logs file logs...")}>System Log</button>
      </section>

      <header className="dashboard-header-block">
        <div className="filter-bar">
          <div className="search-input-group">
            <input type="text" placeholder="Search rooms by name, designation..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="filter-dropdowns">
            <select value={campusFilter} onChange={(e) => setCampusFilter(e.target.value)}>
              <option value="all">All Campuses</option>
              <option value="Makati">Makati</option>
              <option value="Intramuros">Intramuros</option>
            </select>
          </div>
        </div>
      </header>

      <div className="admin-grid">
        <div className="left-column">
          <section className="section-card">
            <div className="card-title-area"><h2>Live Room Monitor</h2></div>
            <div className="room-schedule-grid">
              {filteredLiveMonitorView.length === 0 ? (
                <p className="empty-state-text">No active rooms synchronized from system registry node logs.</p>
              ) : (
                filteredLiveMonitorView.map((room, idx) => (
                  <div className="room-card" key={idx}>
                    <div className="room-header">
                      <div className="room-meta"><h3>{room.name}</h3><p>{room.campus} • Cap: {room.capacity}</p></div>
                      <span className={`room-status-tag ${room.status === 'Active' ? 'room-pending' : 'room-occupied'}`}>
                        {room.status}
                      </span>
                    </div>
                    <div className="room-body-timer">
                      {room.status === 'Active' ? 'Awaiting user verification logs...' : '🚨 Node locked under active maintenance overrides.'}
                    </div>
                    <button className="action-btn btn-override" onClick={() => alert(`Manual Override triggered for node tracking unit: ${room.name}`)}>Manual Override</button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="section-card">
            <div className="card-title-area"><h2>Pending Requests Queue ({requests.length})</h2></div>
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Student Details</th><th>Requested Space</th><th>Allocation Window</th><th>Actions Drop</th></tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="table-empty-row">Queue empty. No database entry requests require validation.</td>
                    </tr>
                  ) : (
                    requests.map(req => (
                      <tr key={req.id}>
                        <td><strong>{req.studentName}</strong><br/><small>{req.studentId}</small></td>
                        <td>{req.roomName}<br/><small>{req.campus} • Cap: {req.capacity}</small></td>
                        <td>{req.date}<br/><small>{req.timeWindow}</small></td>
                        <td className="table-actions-cell">
                          <button className="btn-approve" onClick={() => handleRequestDecision(req.id, req.studentName, 'Approved')}>Approve</button>
                          <button className="btn-reject" onClick={() => handleRequestDecision(req.id, req.studentName, 'Rejected')}>Reject</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="right-column">
          <section className="section-card">
            <div className="card-title-area"><h2>Schedule Calendar</h2></div>
            <div className="calendar-widget-box">
              <div className="calendar-month-title">June 2026</div>
              <div className="calendar-days-grid">
                {Array.from({ length: 30 }, (_, i) => i + 1).map(d => {
                  const dateStr = `2026-06-${d.toString().padStart(2, '0')}`;
                  const hasBooking = dateStr in bookings;
                  return (
                    <div 
                      key={d} 
                      className={`calendar-day ${hasBooking ? 'active-booking-day' : ''} ${selectedDate === dateStr ? 'current-selected' : ''}`}
                      onClick={() => setSelectedDate(dateStr)}
                    >
                      {d}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="day-summary-panel">
              <h3>Bookings for {selectedDate}</h3>
              <div className="summary-cards-stack">
                {(bookings[selectedDate] || []).length === 0 ? (
                  <p className="calendar-empty-text">No database timeline items captured for this parameter date step.</p>
                ) : (
                  (bookings[selectedDate] || []).map((b, i) => (
                    <div className="summary-inline-card" key={i}>
                      <h4>{b.room} ({b.time})</h4>
                      <p>{b.campus} Campus • Reserved by: {b.student}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};