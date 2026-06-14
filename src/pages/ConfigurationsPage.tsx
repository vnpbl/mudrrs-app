import React from 'react';
import { type RegistryRoom } from './types';

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
    <div className="admin-grid">
      <div className="left-column">
        <section className="section-card">
          <div className="card-title-area"><h2>Discussion Rooms Registry Node Configuration</h2></div>
          <form className="config-embedded-form" onSubmit={handleAddRoom}>
            <div className="form-row-three">
              <div className="input-field-unit">
                <label>Designation Name</label>
                <input type="text" value={newRoom.name} onChange={(e) => setNewRoom(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Room D" />
              </div>
              <div className="input-field-unit">
                <label>Campus Node</label>
                <select value={newRoom.campus} onChange={(e) => setNewRoom(prev => ({ ...prev, campus: e.target.value as any }))}>
                  <option value="Makati">Makati</option>
                  <option value="Intramuros">Intramuros</option>
                </select>
              </div>
              <div className="input-field-unit">
                <label>Max Seats</label>
                <input type="number" value={newRoom.capacity} onChange={(e) => setNewRoom(prev => ({ ...prev, capacity: e.target.value }))} placeholder="6" />
              </div>
            </div>
            <button type="submit" className="config-submit-btn">Add New Room Registry</button>
          </form>

          <div className="campus-tabs-row">
            <button className={`campus-tab-btn ${configCampusTab === 'Makati' ? 'active' : ''}`} onClick={() => setConfigCampusTab('Makati')}>Makati Campus</button>
            <button className={`campus-tab-btn ${configCampusTab === 'Intramuros' ? 'active' : ''}`} onClick={() => setConfigCampusTab('Intramuros')}>Intramuros Campus</button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr><th>Room Target</th><th>Capacity Parameter</th><th>Status Overrides Actions</th></tr>
              </thead>
              <tbody>
                {filteredRegistryView.length === 0 ? (
                  <tr>
                    <td colSpan={3}>No target cluster modules initialized for this campus parameter yet.</td>
                  </tr>
                ) : (
                  filteredRegistryView.map((room, idx) => (
                    <tr key={idx}>
                      <td><strong>{room.name}</strong></td>
                      <td>{room.capacity} Students</td>
                      <td>
                        <select 
                          className={`inline-status-select ${room.status === 'Active' ? 'select-status-active' : 'select-status-maintenance'}`}
                          value={room.status}
                          onChange={(e) => handleStatusToggle(room.name, e.target.value as any)}
                        >
                          <option value="Active">Active</option>
                          <option value="Maintenance">Maintenance</option>
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
          <div className="card-title-area"><h2>Global Constraints Limits</h2></div>
          <div className="constraints-form-stack">
            <div className="input-field-unit">
              <label>Enforced Start Grace Window Limit</label>
              <div className="input-with-suffix"><input type="number" value="15" disabled /><span>minutes</span></div>
            </div>
            <div className="input-field-unit" style={{ marginTop: '1.25rem' }}>
              <label>Maximum Absolute Usage Window</label>
              <div className="input-with-suffix"><input type="number" value="2" disabled /><span>hours</span></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};