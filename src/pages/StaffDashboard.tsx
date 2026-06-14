import React, { useState, useMemo } from 'react';
import { type BookingDatabase, type RegistryRoom, type PendingRequest } from './types';
import './StaffDashboard.modules.css';

import { LiveBoardView } from './LiveBoard';
import { AnalyticsView } from './Analytics';
import { ConfigurationsView } from './Configurations';

export const StaffDashboard: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'board' | 'analytics' | 'config'>('board');
  
  const [selectedDate, setSelectedDate] = useState<string>("2026-06-11");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [campusFilter, setCampusFilter] = useState<string>("all");
  const [configCampusTab, setConfigCampusTab] = useState<'Makati' | 'Intramuros'>('Makati');
  
  const [bookings, setBookings] = useState<BookingDatabase>({});
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [registry, setRegistry] = useState<RegistryRoom[]>([]);
  const [newRoom, setNewRoom] = useState<{
     name: string;
     campus: 'Makati' | 'Intramuros';
     capacity: string;
   }>({ name: '', campus: 'Makati', capacity: '' });
  const activeBookingsCount = useMemo(() => {
    return Object.values(bookings).reduce((total, dayList) => total + dayList.length, 0);
  }, [bookings]);

  const liveUtilizationRate = useMemo(() => {
    if (registry.length === 0) return 0;
    const occupiedCount = registry.filter(r => r.status === 'Maintenance').length;
    return Math.round((occupiedCount / registry.length) * 100);
  }, [registry]);

  const campusMetrics = useMemo(() => {
    const calculateForCampus = (campusName: 'Makati' | 'Intramuros') => {
      const campusRooms = registry.filter(r => r.campus === campusName);
      if (campusRooms.length === 0) return { percent: 0, count: 0 };
      const activeCount = campusRooms.filter(r => r.status === 'Active').length;
      return {
        percent: Math.round((activeCount / campusRooms.length) * 100),
        count: activeCount
      };
    };
    return {
      Makati: calculateForCampus('Makati'),
      Intramuros: calculateForCampus('Intramuros')
    };
  }, [registry]);

  const handleRequestDecision = (id: string, name: string, action: 'Approved' | 'Rejected') => {
    if (window.confirm(`Confirm resolution [${action}] validation updates for: ${name}?`)) {
      setRequests(prev => prev.filter(req => req.id !== id));
    }
  };

  const handleStatusToggle = (roomName: string, nextStatus: 'Active' | 'Maintenance') => {
    setRegistry(prev => prev.map(room => room.name === roomName ? { ...room, status: nextStatus } : room));
  };

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.name || !newRoom.capacity) return;
    
    setRegistry(prev => [...prev, {
      name: newRoom.name,
      campus: newRoom.campus,
      capacity: parseInt(newRoom.capacity),
      status: 'Active'
    }]);
    setConfigCampusTab(newRoom.campus);
    setNewRoom({ name: '', campus: 'Makati', capacity: '' });
    alert(`Successfully synchronized dynamic structure [${newRoom.name}] to Database node targets!`);
  };

  const filteredRegistryView = useMemo(() => {
    return registry.filter(room => room.campus === configCampusTab);
  }, [registry, configCampusTab]);

  const filteredLiveMonitorView = useMemo(() => {
    return registry.filter(room => {
      const matchesCampus = campusFilter === 'all' || room.campus === campusFilter;
      const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCampus && matchesSearch;
    });
  }, [registry, campusFilter, searchQuery]);

  return (
    <div className="dashboard-viewport">
      <nav className="top-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <div className="brand-logo" />
            <span className="logo-text">MUDRRS</span>
            <span className="role-badge">Staff Hub</span>
          </div>
          
          <div className="nav-links">
            <button className={`nav-tab-link ${currentTab === 'board' ? 'active' : ''}`} onClick={() => setCurrentTab('board')}>Live Board</button>
            <button className={`nav-tab-link ${currentTab === 'analytics' ? 'active' : ''}`} onClick={() => setCurrentTab('analytics')}>Analytics</button>
            <button className={`nav-tab-link ${currentTab === 'config' ? 'active' : ''}`} onClick={() => setCurrentTab('config')}>Configurations</button>
          </div>
          
          <div className="nav-actions">
            <div className="user-profile">
              <div className="avatar">MS</div>
              <span className="user-name">M. Santos</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {currentTab === 'board' && (
          <LiveBoardView 
            bookings={bookings}
            requests={requests}
            registry={registry}
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
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView 
            activeBookingsCount={activeBookingsCount}
            registry={registry}
            campusMetrics={campusMetrics}
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
          />
        )}
      </main>
    </div>
  );
};