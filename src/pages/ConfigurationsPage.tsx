import React from 'react';
import { type RegistryRoom } from '../types';

interface ConfigurationsProps {
  newRoom: { name: string; campus: 'Makati' | 'Intramuros'; capacity: string };
  setNewRoom: React.Dispatch<React.SetStateAction<{ name: string; campus: 'Makati' | 'Intramuros'; capacity: string }>>;
  configCampusTab: 'Makati' | 'Intramuros';
  setConfigCampusTab: (val: 'Makati' | 'Intramuros') => void;
  filteredRegistryView: RegistryRoom[];
  handleAddRoom: (e: React.FormEvent) => void;
  handleStatusToggle: (roomName: string, nextStatus: 'Active' | 'Maintenance') => void;
}

export const ConfigurationsView: React.FC<ConfigurationsProps> = ({
  newRoom,
  setNewRoom,
  configCampusTab,
  setConfigCampusTab,
  filteredRegistryView,
  handleAddRoom,
  handleStatusToggle,
}) => {
  return (
    <div className="configurations-workspace">
      
      <header className="system-parameter-banner">
        <h1>System Parameter Settings</h1>
        <p>Manage discussion room databases, constraints parameters, and operations logic.</p>
      </header>

      <div className="admin-grid" style={{ marginTop: '1.5rem' }}>
        <div className="left-column">
          <section className="section-card">
            <div className="card-header-flex">
              <div className="card-title-area">
                <h2>Discussion Rooms Registry</h2>
              </div>
              <span className="provisioned-badge">3 Rooms Provisioned</span>
            </div>

            <form className="config-embedded-form" onSubmit={handleAddRoom}>
              <div className="form-row-three">
                <div className="input-field-unit">
                  <label>ROOM TARGET DESIGNATION</label>
                  <input 
                    type="text" 
                    value={newRoom.name} 
                    onChange={(e) => setNewRoom(prev => ({ ...prev, name: e.target.value }))} 
                    placeholder="e.g., Room D" 
                  />
                </div>
                
                <div className="input-field-unit">
                  <label>CAMPUS NODE</label>
                  <select 
                    value={newRoom.campus} 
                    onChange={(e) => setNewRoom(prev => ({ ...prev, campus: e.target.value as any }))}
                  >
                    <option value="Makati">Makati Campus</option>
                    <option value="Intramuros">Intramuros Campus</option>
                  </select>
                </div>
                
                <div className="input-field-unit">
                  <label>MAX SEAT CAPACITY</label>
                  <input 
                    type="number" 
                    value={newRoom.capacity} 
                    onChange={(e) => setNewRoom(prev => ({ ...prev, capacity: e.target.value }))} 
                    placeholder="e.g., 6" 
                  />
                </div>
              </div>
              
              <button type="submit" className="config-submit-btn">Add New Room Registry</button>
            </form>

            <div className="campus-tabs-row" style={{ marginTop: '1.5rem' }}>
              <button 
                className={`campus-tab-btn ${configCampusTab === 'Makati' ? 'active' : ''}`} 
                onClick={() => setConfigCampusTab('Makati')}
              >
                Makati Campus
              </button>
              <button 
                className={`campus-tab-btn ${configCampusTab === 'Intramuros' ? 'active' : ''}`} 
                onClick={() => setConfigCampusTab('Intramuros')}
              >
                Intramuros Campus
              </button>
            </div>

            <div className="table-container" style={{ marginTop: '1rem' }}>
              <table>
                <thead>
                  <tr>
                    <th>Room Designation</th>
                    <th>Capacity Limit</th>
                    <th>Status Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistryView.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="empty-table-notice">
                        No target cluster modules initialized for this campus parameter yet.
                      </td>
                    </tr>
                  ) : (
                    filteredRegistryView.map((room, idx) => (
                      <tr key={idx}>
                        <td>{room.name}</td>
                        <td>{room.capacity} Students</td>
                        <td>
                          <select 
                            className={`inline-status-select status-${room.status.toLowerCase()}`}
                            value={room.status}
                            onChange={(e) => handleStatusToggle(room.name, e.target.value as any)}
                          >
                            <option value="Active">ACTIVE</option>
                            <option value="Maintenance">MAINTENANCE</option>
                          </select>
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
            <div className="card-title-area">
              <h2>Global System Constraints Rules</h2>
            </div>
            
            <div className="constraints-form-stack">
              <div className="input-field-unit">
                <label>BOOKING GRACE PERIOD TIMER</label>
                <div className="input-with-suffix">
                  <input type="number" value="15" disabled />
                  <span>minutes</span>
                </div>
                <small className="field-explanatory-text">Strictly locks down auto-cancellations.</small>
              </div>
              
              <div className="input-field-unit" style={{ marginTop: '1.5rem' }}>
                <label>MAXIMUM ALLOCATION WINDOW</label>
                <div className="input-with-suffix">
                  <input type="number" value="2" disabled />
                  <span>hours</span>
                </div>
                <small className="field-explanatory-text">Enforces maximum study room occupancy constraint caps.</small>
              </div>
            </div>

            <div className="automation-engine-card" style={{ marginTop: '2rem' }}>
              <div className="status-indicator-dot" />
              <div className="automation-text-node">
                <h3>Automation Engine Online</h3>
                <p>Supabase db connection nodes synchronized safely.</p>
              </div>
            </div>

          </section>
        </div>

      </div>
    </div>
  );
};